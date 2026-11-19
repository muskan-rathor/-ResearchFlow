
import { pool } from "../config/database.js";

export const savePaperAnalysis = async (paperId, analysis) => {
  const result = await pool.query(
    `INSERT INTO paper_analyses (
       paper_id,
       research_problem,
       methodology,
       dataset,
       limitations,
       future_work,
       key_findings
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (paper_id)
     DO UPDATE SET
       research_problem = EXCLUDED.research_problem,
       methodology = EXCLUDED.methodology,
       dataset = EXCLUDED.dataset,
       limitations = EXCLUDED.limitations,
       future_work = EXCLUDED.future_work,
       key_findings = EXCLUDED.key_findings
     RETURNING id`,
    [
      paperId,
      analysis.research_problem,
      analysis.methodology,
      analysis.dataset,
      JSON.stringify(analysis.limitations || []),
      JSON.stringify(analysis.future_work || []),
      analysis.key_findings
    ]
  );

  return result.rows[0];
};

export const saveResearchLimitations = async (
  analysisId,
  paperId,
  limitations
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Remove old limitations when an analysis is regenerated.
    await client.query(
      `DELETE FROM research_limitations
       WHERE analysis_id = $1`,
      [analysisId]
    );

    for (const limitation of limitations) {
      await client.query(
        `INSERT INTO research_limitations (
           analysis_id,
           paper_id,
           limitation_text
         )
         VALUES ($1, $2, $3)`,
        [analysisId, paperId, limitation]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const getLimitationsWithoutEmbeddings = async (workspaceId) => {
  const result = await pool.query(
    `SELECT
        rl.id,
        rl.paper_id,
        rl.limitation_text
     FROM research_limitations rl
     JOIN papers p ON p.id = rl.paper_id
     WHERE p.workspace_id = $1
       AND rl.embedding IS NULL
     ORDER BY rl.created_at ASC`,
    [workspaceId]
  );

  return result.rows;
};

export const updateLimitationEmbedding = async (id, embedding) => {
  const vector = `[${embedding.join(",")}]`;

  await pool.query(
    `UPDATE research_limitations
     SET embedding = $1::vector
     WHERE id = $2`,
    [vector, id]
  );
};



export const getEmbeddedLimitations = async (workspaceId) => {
  const result = await pool.query(
    `SELECT
        rl.id,
        rl.paper_id,
        rl.limitation_text,
        rl.embedding::text AS embedding
     FROM research_limitations rl
     JOIN papers p ON p.id = rl.paper_id
     WHERE p.workspace_id = $1
       AND rl.embedding IS NOT NULL
     ORDER BY rl.created_at ASC`,
    [workspaceId]
  );

  return result.rows;
};

export const updateLimitationCluster = async (limitationId, clusterId) => {
  await pool.query(
    `UPDATE research_limitations
     SET cluster_id = $1
     WHERE id = $2`,
    [clusterId, limitationId]
  );
};




export const getClusterRecurrence = async (workspaceId) => {
  const result = await pool.query(
    `WITH unique_papers AS (
       SELECT DISTINCT ON (MD5(p.extracted_text))
         p.id,
         p.workspace_id
       FROM papers p
       WHERE p.workspace_id = $1
         AND p.extracted_text IS NOT NULL
         AND TRIM(p.extracted_text) <> ''
       ORDER BY MD5(p.extracted_text), p.created_at ASC
     ),
     total_papers AS (
       SELECT COUNT(*) AS total
       FROM unique_papers
     ),
     cluster_stats AS (
       SELECT
         rl.cluster_id,
         COUNT(rl.id) AS limitation_count,
         COUNT(DISTINCT rl.paper_id) AS paper_count,
         ARRAY_AGG(rl.limitation_text) AS limitations
       FROM research_limitations rl
       JOIN unique_papers up ON up.id = rl.paper_id
       WHERE rl.cluster_id IS NOT NULL
       GROUP BY rl.cluster_id
     )
     SELECT
       cs.cluster_id,
       cs.limitation_count,
       cs.paper_count,
       tp.total AS total_unique_papers,
       cs.limitations
     FROM cluster_stats cs
     CROSS JOIN total_papers tp
     ORDER BY cs.cluster_id`,
    [workspaceId]
  );

  return result.rows;
};



export const saveResearchGapReport = async (
  workspaceId,
  focus,
  report
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Save the complete report.
    const reportResult = await client.query(
      `INSERT INTO research_gap_reports (
         workspace_id,
         focus,
         report
       )
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, workspace_id, focus, report, created_at`,
      [workspaceId, focus || null, JSON.stringify(report)]
    );

    const savedReport = reportResult.rows[0];

    // Collect external papers across all clusters.
    const uniquePapers = new Map();

    for (const cluster of report.results || []) {
      for (const paper of cluster.papers || []) {
        if (!paper.openAlexId) continue;

        uniquePapers.set(paper.openAlexId, paper);
      }
    }

    // Save external papers linked to this report.
    for (const paper of uniquePapers.values()) {
      await client.query(
        `INSERT INTO external_papers (
           report_id,
           openalex_id,
           title,
           abstract,
           publication_year,
           cited_by_count,
           work_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (report_id, openalex_id)
         DO NOTHING`,
        [
          savedReport.id,
          paper.openAlexId,
          paper.title || null,
          paper.abstract || null,
          paper.publicationYear || null,
          paper.citedByCount || 0,
          paper.paperUrl || null,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      ...savedReport,
      externalPapersSaved: uniquePapers.size,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


export const getReportsByWorkspace = async (workspaceId) => {
  const result = await pool.query(
    `SELECT
       id,
       workspace_id,
       focus,
       created_at,
       report->>'totalClusters' AS total_clusters,
       report->>'totalRelevantPapers' AS total_relevant_papers
     FROM research_gap_reports
     WHERE workspace_id = $1
     ORDER BY created_at DESC`,
    [workspaceId]
  );

  return result.rows;
};


export const getResearchGapReportById = async (
  reportId,
  workspaceId
) => {
  const reportResult = await pool.query(
    `SELECT
       id,
       workspace_id,
       focus,
       report,
       created_at
     FROM research_gap_reports
     WHERE id = $1 AND workspace_id = $2`,
    [reportId, workspaceId]
  );

  if (!reportResult.rows[0]) {
    return null;
  }

  const papersResult = await pool.query(
    `SELECT
       id,
       openalex_id,
       title,
       abstract,
       publication_year,
       cited_by_count,
       work_url
     FROM external_papers
     WHERE report_id = $1
     ORDER BY cited_by_count DESC`,
    [reportId]
  );

  return {
    ...reportResult.rows[0],
    externalPapers: papersResult.rows,
  };
};


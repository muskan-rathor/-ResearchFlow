
/**
 * @type {import('node-pg-migrate').ColumnDefinitions| undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {

  // 1. Stores AI-extracted information about each paper
  pgm.createTable("paper_analyses", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    paper_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "papers(id)",
      onDelete: "CASCADE"
    },
    research_problem: { type: "text" },
    methodology: { type: "text" },
    dataset: { type: "text" },
    limitations: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb")
    },
    future_work: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb")
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  // 2. Stores individual limitations and their embeddings
  pgm.createTable("research_limitations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    analysis_id: {
      type: "uuid",
      notNull: true,
      references: "paper_analyses(id)",
      onDelete: "CASCADE"
    },
    paper_id: {
      type: "uuid",
      notNull: true,
      references: "papers(id)",
      onDelete: "CASCADE"
    },
    limitation_text: {
      type: "text",
      notNull: true
    },
    evidence_chunk_id: {
      type: "uuid",
      references: "paper_chunks(id)",
      onDelete: "SET NULL"
    },
    embedding: {
      type: "vector(384)"
    },
    cluster_id: {
      type: "integer"
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  pgm.createIndex("research_limitations", "analysis_id");
  pgm.createIndex("research_limitations", "paper_id");
  pgm.createIndex("research_limitations", "cluster_id");

  // 3. Stores generated research-gap reports
  pgm.createTable("research_gap_reports", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    workspace_id: {
      type: "uuid",
      notNull: true,
      references: "workspaces(id)",
      onDelete: "CASCADE"
    },
    focus: {
      type: "text",
      notNull: true
    },
    report: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb")
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp")
    }
  });

  pgm.createIndex("research_gap_reports", "workspace_id");

  // 4. Stores external academic papers retrieved from OpenAlex
  pgm.createTable("external_papers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    report_id: {
      type: "uuid",
      notNull: true,
      references: "research_gap_reports(id)",
      onDelete: "CASCADE"
    },
    openalex_id: {
      type: "text",
      notNull: true
    },
    title: {
      type: "text"
    },
    abstract: {
      type: "text"
    },
    publication_year: {
      type: "integer"
    },
    cited_by_count: {
      type: "integer"
    },
    work_url: {
      type: "text"
    }
  });

  pgm.addConstraint(
    "external_papers",
    "unique_report_openalex",
    {
      unique: ["report_id", "openalex_id"]
    }
  );

  pgm.createIndex("external_papers", "report_id");
};

export const down = (pgm) => {
  // Reverse dependency order
  pgm.dropTable("external_papers");
  pgm.dropTable("research_gap_reports");
  pgm.dropTable("research_limitations");
  pgm.dropTable("paper_analyses");
};

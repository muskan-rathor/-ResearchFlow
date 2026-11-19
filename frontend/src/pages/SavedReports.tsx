
import { useEffect, useState } from "react";
import {
  FileBarChart,
  FileText,
  CalendarDays,
  FolderOpen,
  Eye,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  ExternalLink,
  Lightbulb,
  Target,
  Search,
  TrendingUp,
  Layers3,
  Users,
} from "lucide-react";

import {
  getWorkspaces,
  type Workspace,
} from "../services/workspaceService";

import {
  getResearchReports,
  getResearchReportById,
  type ResearchReport,
} from "../services/researchReportService";

// ---------- Report data types ----------

interface ExternalPaper {
  id?: string;
  title?: string;
  authors?: string[];
  abstract?: string | null;
  doi?: string | null;
  paperUrl?: string;
  work_url?: string;
  publicationYear?: number;
  publication_year?: number;
  citedByCount?: number;
  cited_by_count?: number;
  relevanceScore?: number;
}

interface ThemeResult {
  theme: string;
  papers?: ExternalPaper[];
  clusterId: number;
  searchQuery?: string;
  retrievedPapers?: number;
  relevantPapersCount?: number;
  totalMatchingPapers?: number;
}

interface ThemeInterpretation {
  theme: string;
  clusterId: number;
  description?: string;
  limitations?: string[];
  totalPapers?: number;
  papersWithTheme?: number;
  research_challenge?: string;
  potential_directions?: string[];
  recurrencePercentage?: number;
}

interface ReportPayload {
  results?: ThemeResult[];
  interpretations?: ThemeInterpretation[];
  totalClusters?: number;
  totalUniquePapers?: number;
  totalRelevantPapers?: number;
  totalRetrievedPapers?: number;
  totalClustersSearched?: number;
}

type DetailedResearchReport = ResearchReport & {
  report: ReportPayload;
  externalPapers?: ExternalPaper[];
};

// ---------- Small helpers ----------

const safeNumber = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const formatDate = (date?: string) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleString();
};

const getPaperUrl = (paper: ExternalPaper) =>
  paper.doi || paper.paperUrl || paper.work_url || "";

const getYear = (paper: ExternalPaper) =>
  paper.publicationYear ?? paper.publication_year;

const getCitationCount = (paper: ExternalPaper) =>
  paper.citedByCount ?? paper.cited_by_count ?? 0;

// ---------- Statistics card ----------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        </div>

        <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

// ---------- External paper card ----------

function PaperCard({ paper }: { paper: ExternalPaper }) {
  const url = getPaperUrl(paper);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {getYear(paper) && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
            {getYear(paper)}
          </span>
        )}

        <span className="inline-flex items-center gap-1">
          <TrendingUp size={13} />
          {getCitationCount(paper)} citations
        </span>

        {typeof paper.relevanceScore === "number" && (
          <span className="rounded-full bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
            Relevance: {paper.relevanceScore}
          </span>
        )}
      </div>

      <h4 className="mt-3 font-semibold leading-6 text-slate-900">
        {paper.title || "Untitled paper"}
      </h4>

      {paper.authors && paper.authors.length > 0 && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {paper.authors.join(", ")}
        </p>
      )}

      {paper.abstract && (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {paper.abstract}
        </p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          View publication
          <ExternalLink size={14} />
        </a>
      )}
    </article>
  );
}

// ---------- Research theme card ----------

function ThemeCard({
  result,
  interpretation,
}: {
  result: ThemeResult;
  interpretation?: ThemeInterpretation;
}) {
  const papers = result.papers ?? [];
  const directions = interpretation?.potential_directions ?? [];
  const limitations = interpretation?.limitations ?? [];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            Cluster {result.clusterId}
          </span>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {safeNumber(result.relevantPapersCount)} relevant papers
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">
          {result.theme}
        </h3>

        {interpretation?.description && (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {interpretation.description}
          </p>
        )}
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Retrieved</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {safeNumber(result.retrievedPapers)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Relevant</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {safeNumber(result.relevantPapersCount)}
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1">
            <p className="text-xs text-slate-500">Total matching</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {safeNumber(result.totalMatchingPapers).toLocaleString()}
            </p>
          </div>
        </div>

        {interpretation?.research_challenge && (
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Target size={17} className="text-violet-600" />
              Research challenge
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {interpretation.research_challenge}
            </p>
          </section>
        )}

        {limitations.length > 0 && (
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <AlertCircle size={17} className="text-amber-600" />
              Identified limitations
            </h4>

            <ul className="mt-3 space-y-2">
              {limitations.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {directions.length > 0 && (
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Lightbulb size={17} className="text-emerald-600" />
              Potential research directions
            </h4>

            <ul className="mt-3 space-y-2">
              {directions.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {typeof interpretation?.recurrencePercentage === "number" && (
          <section>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                Recurrence across uploaded papers
              </span>
              <span className="font-bold text-violet-700">
                {interpretation.recurrencePercentage}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, interpretation.recurrencePercentage)
                  )}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {interpretation.papersWithTheme ?? 0} of{" "}
              {interpretation.totalPapers ?? 0} papers in the recurrence analysis.
            </p>
          </section>
        )}

        {result.searchQuery && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Search size={14} />
              Literature search query
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {result.searchQuery}
            </p>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <BookOpen size={17} className="text-violet-600" />
              Retrieved literature
            </h4>

            <span className="text-xs text-slate-500">
              {papers.length} displayed
            </span>
          </div>

          {papers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
              <p className="text-sm font-medium text-slate-600">
                No relevant papers available for this theme.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                The search returned {safeNumber(result.retrievedPapers)} papers,
                but none passed the relevance filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper, index) => (
                <PaperCard
                  key={paper.id || paper.doi || `${result.clusterId}-${index}`}
                  paper={paper}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

// ---------- Main page ----------

export default function SavedReports() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");

  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [selectedReport, setSelectedReport] =
    useState<DetailedResearchReport | null>(null);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const data = await getWorkspaces();
        setWorkspaces(data);

        if (data.length > 0) {
          setSelectedWorkspace(data[0].id);
        }
      } catch {
        setError("Unable to load workspaces.");
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) {
      setReports([]);
      setSelectedReport(null);
      return;
    }

    const loadReports = async () => {
      setLoadingReports(true);
      setError("");
      setSelectedReport(null);

      try {
        const data = await getResearchReports(selectedWorkspace);
        setReports(data);
      } catch {
        setError("Unable to load saved research reports.");
        setReports([]);
      } finally {
        setLoadingReports(false);
      }
    };

    loadReports();
  }, [selectedWorkspace]);

  const handleOpenReport = async (reportId: string) => {
    setLoadingDetail(true);
    setError("");

    try {
      const report = await getResearchReportById(
        selectedWorkspace,
        reportId
      );

      setSelectedReport(report as DetailedResearchReport);
    } catch {
      setError("Unable to open this research report.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeReport = () => setSelectedReport(null);

  const payload = selectedReport?.report;
  const results = payload?.results ?? [];
  const interpretations = payload?.interpretations ?? [];
  const externalPapers = selectedReport?.externalPapers ?? [];

  const findInterpretation = (clusterId: number) =>
    interpretations.find((item) => item.clusterId === clusterId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10">

        {/* Header */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <FileBarChart size={15} />
            Research Library
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Saved Research Reports
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Revisit research themes, explore identified limitations, and
            discover related academic literature from your previous analyses.
          </p>
        </div>

        {/* Workspace selector */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-800">
            Select Research Workspace
          </label>

          <p className="mt-1 text-sm text-slate-500">
            Choose the workspace whose reports you want to view.
          </p>

          <div className="mt-4">
            {loadingWorkspaces ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={17} className="animate-spin" />
                Loading workspaces...
              </div>
            ) : (
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">Choose a workspace</option>

                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* Page statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Saved Reports</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {loadingReports ? "..." : reports.length}
                </h2>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <FileBarChart size={24} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Reports saved in this workspace
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Selected Workspace</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  {workspaces.find(
                    (workspace) => workspace.id === selectedWorkspace
                  )?.name || "Not selected"}
                </h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FolderOpen size={24} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Current report collection
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={19} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Reports list */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Your Reports
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Open a saved report to explore its complete findings.
            </p>
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-violet-600" />
              Loading saved reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <FileText size={27} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No saved reports yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Generate a research-gap report from Research Gap Explorer.
                Your saved reports will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                      <FileBarChart size={23} />
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Saved
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {report.focus || "Research Gap Analysis"}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={16} />
                    {formatDate(report.created_at)}
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    Research themes, limitations, and external academic
                    literature for this workspace.
                  </p>

                  <button
                    onClick={() => handleOpenReport(report.id)}
                    disabled={loadingDetail}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Eye size={17} />
                    Open Report
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Detailed report modal */}
        {(selectedReport || loadingDetail) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">

              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5 sm:px-7">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-violet-600">
                    <Sparkles size={17} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Research Report
                    </span>
                  </div>

                  <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
                    {selectedReport?.focus || "Research Gap Analysis"}
                  </h2>
                </div>

                <button
                  onClick={closeReport}
                  aria-label="Close report"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={21} />
                </button>
              </div>

              {/* Modal content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                {loadingDetail ? (
                  <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                    <Loader2 size={20} className="animate-spin text-violet-600" />
                    Opening report...
                  </div>
                ) : selectedReport && payload ? (
                  <div className="space-y-8">

                    {/* Report metadata */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Generated on
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {formatDate(selectedReport.created_at)}
                      </p>
                    </div>

                    {/* Overview statistics */}
                    <section className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Analysis Overview
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Summary of the uploaded literature analysis and
                          external paper discovery.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                          label="Research Themes"
                          value={safeNumber(payload.totalClusters)}
                          icon={Layers3}
                        />
                        <StatCard
                          label="Uploaded Papers"
                          value={safeNumber(payload.totalUniquePapers)}
                          icon={FileText}
                        />
                        <StatCard
                          label="Relevant Papers"
                          value={safeNumber(payload.totalRelevantPapers)}
                          icon={BookOpen}
                        />
                        <StatCard
                          label="Retrieved Papers"
                          value={safeNumber(payload.totalRetrievedPapers)}
                          icon={Search}
                        />
                      </div>
                    </section>

                    {/* Theme cards */}
                    <section className="space-y-5">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Research Themes & Findings
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Explore each cluster, its limitations, potential
                          research directions, and related papers.
                        </p>
                      </div>

                      {results.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                          No research themes were found in this report.
                        </p>
                      ) : (
                        <div className="space-y-5">
                          {results.map((result) => (
                            <ThemeCard
                              key={result.clusterId}
                              result={result}
                              interpretation={findInterpretation(result.clusterId)}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    {/* External literature */}
                    <section className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          External Literature Collection
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Academic works discovered and saved from external
                          literature search.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
                        <div className="rounded-lg bg-white p-2 text-violet-600">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {externalPapers.length} external papers
                          </p>
                          <p className="text-xs text-slate-600">
                            Retrieved and stored with this report
                          </p>
                        </div>
                      </div>

                      {externalPapers.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                          No external papers were saved with this report.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          {externalPapers.map((paper, index) => (
                            <PaperCard
                              key={paper.id || paper.doi || `${index}`}
                              paper={paper}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
                      Research directions and potential gaps are AI-generated
                      suggestions based on the uploaded collection and
                      retrieved literature. They should be independently
                      verified before being treated as established research
                      gaps or claims of novelty.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Modal footer */}
              <div className="border-t border-slate-200 bg-white p-4 text-right">
                <button
                  onClick={closeReport}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

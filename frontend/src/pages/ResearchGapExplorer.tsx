
import { useEffect, useState } from "react";
import type { ReactNode, ElementType } from "react";
import { useNavigate } from "react-router-dom";

import {
  BrainCircuit,
  FileText,
  FlaskConical,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Target,
  Lightbulb,
  Database,
  BookOpen,
  FileBarChart,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

import {
  getWorkspaces,
  type Workspace,
} from "../services/workspaceService";

import {
  getPapers,
  type Paper,
} from "../services/paperService";

import {
  analyzeResearchGaps,
  clusterResearchGaps,
  getResearchGapRecurrence,
  interpretResearchGaps,
  generateResearchGapReport,
} from "../services/researchGapService";

// ============================================
// TYPES
// ============================================

interface PaperAnalysis {
  research_problem: string;
  methodology: string;
  dataset: string;
  key_findings: string;
  limitations: string[];
  future_work: string[];
}

interface AnalyzedPaper {
  paperId: string;
  filename: string;
  analysis: PaperAnalysis;
}

interface AnalysisResponse {
  totalPapers: number;
  analyses: AnalyzedPaper[];
}

interface ResultSectionProps {
  title: string;
  icon: ElementType;
  children: ReactNode;
}

interface ResultListProps {
  title: string;
  icon: ElementType;
  items: string[];
}

// ============================================
// ERROR HELPER
// ============================================

const getErrorMessage = (err: unknown): string | undefined => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    return (
      err as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response?.data?.message;
  }

  return undefined;
};

// ============================================
// REUSABLE RESULT SECTION
// ============================================

function ResultSection({
  title,
  icon: Icon,
  children,
}: ResultSectionProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-violet-200">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
          <Icon size={18} />
        </div>

        <h3 className="text-sm font-bold text-slate-800">
          {title}
        </h3>
      </div>

      <div className="whitespace-pre-line break-words text-sm leading-7 text-slate-600">
        {children || (
          <span className="italic text-slate-400">
            Not specified in the analysis.
          </span>
        )}
      </div>
    </section>
  );
}

// ============================================
// REUSABLE LIST SECTION
// ============================================

function ResultList({
  title,
  icon: Icon,
  items,
}: ResultListProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-violet-200">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
          <Icon size={18} />
        </div>

        <h3 className="text-sm font-bold text-slate-800">
          {title}
        </h3>

        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {items?.length ?? 0}
        </span>
      </div>

      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm leading-6 text-slate-600"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-slate-400">
          No explicitly identified items.
        </p>
      )}
    </section>
  );
}

// ============================================
// MAIN PAGE
// ============================================

function ResearchGapExplorer() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState("");

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResponse | null>(null);

  const [reportFocus, setReportFocus] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================
  // LOAD WORKSPACES
  // ============================================

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const data = await getWorkspaces();

        setWorkspaces(data);

        if (data.length > 0) {
          setSelectedWorkspace(data[0].id);
        }
      } catch {
        setError("Unable to load workspaces. Please try again.");
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, []);

  // ============================================
  // LOAD PAPERS
  // ============================================

  useEffect(() => {
    if (!selectedWorkspace) {
      setPapers([]);
      setAnalysisResult(null);
      setReportSuccess("");
      return;
    }

    const loadPapers = async () => {
      setLoadingPapers(true);
      setError("");
      setSuccess("");
      setReportSuccess("");
      setAnalysisResult(null);

      try {
        const data = await getPapers(selectedWorkspace);
        setPapers(data);
      } catch {
        setError("Unable to load papers for this workspace.");
      } finally {
        setLoadingPapers(false);
      }
    };

    loadPapers();
  }, [selectedWorkspace]);

  // ============================================
  // ANALYZE PAPERS
  // ============================================

  const handleAnalyze = async () => {
    if (!selectedWorkspace) {
      setError("Please select a workspace.");
      return;
    }

    if (papers.length === 0) {
      setError("Upload at least one research paper before analysis.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");
    setReportSuccess("");
    setAnalysisResult(null);

    try {
      const result = await analyzeResearchGaps(selectedWorkspace);

      setAnalysisResult(result as AnalysisResponse);

      setSuccess(
        "Research paper analysis completed successfully!"
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) ||
          "Analysis failed. Please check whether the backend and Ollama are running."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ============================================
  // GENERATE AND SAVE FINAL REPORT
  // ============================================

  const handleGenerateReport = async () => {
    if (!selectedWorkspace) {
      setError("Please select a workspace.");
      return;
    }

    if (!analysisResult) {
      setError("Analyze your research papers before generating a report.");
      return;
    }

    if (generatingReport || analyzing) {
      return;
    }

    setGeneratingReport(true);
    setError("");
    setReportSuccess("");

    try {
      // Step 1: Group similar extracted limitations.
      await clusterResearchGaps(selectedWorkspace);

      // Step 2: Calculate recurrence across unique papers.
      await getResearchGapRecurrence(selectedWorkspace);

      // Step 3: Generate AI interpretations of the clusters.
      await interpretResearchGaps(selectedWorkspace);

      // Step 4: Discover external literature and save the report.
      await generateResearchGapReport(
        selectedWorkspace,
        reportFocus.trim()
      );

      setReportSuccess(
        "Research-gap report generated and saved successfully!"
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) ||
          "Report generation failed. Check the backend logs and try again."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // ============================================
  // DERIVED STATISTICS
  // ============================================

  const analyses = analysisResult?.analyses ?? [];

  const totalLimitations = analyses.reduce(
    (total, paper) =>
      total + (paper.analysis?.limitations?.length ?? 0),
    0
  );

  const totalFutureWork = analyses.reduce(
    (total, paper) =>
      total + (paper.analysis?.future_work?.length ?? 0),
    0
  );

  // ============================================
  // PAGE UI
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

        {/* PAGE HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
              <BrainCircuit size={15} />
              Research Intelligence
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Research Gap Explorer
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Understand your research literature, uncover recurring
              limitations, and discover potential research opportunities.
            </p>
          </div>

          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <FlaskConical size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Analysis Engine
              </p>

              <p className="text-sm font-semibold text-slate-800">
                Qwen 2.5 3B
              </p>
            </div>
          </div>
        </div>

        {/* WORKSPACE SELECTOR */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="font-semibold text-slate-900">
            Research Workspace
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the collection of papers you want to analyze.
          </p>

          <div className="mt-5">
            {loadingWorkspaces ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={17} className="animate-spin" />
                Loading workspaces...
              </div>
            ) : (
              <select
                value={selectedWorkspace}
                onChange={(e) =>
                  setSelectedWorkspace(e.target.value)
                }
                className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
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

        {/* STATISTICS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Uploaded Papers"
            value={loadingPapers ? "..." : papers.length}
            description="Papers in selected workspace"
            icon={FileText}
            color="blue"
          />

          <StatCard
            title="Limitations Extracted"
            value={analysisResult ? totalLimitations : "—"}
            description="From completed paper analysis"
            icon={Target}
            color="amber"
          />

          <StatCard
            title="Future Work Directions"
            value={analysisResult ? totalFutureWork : "—"}
            description="Potential research directions"
            icon={Lightbulb}
            color="emerald"
          />
        </div>

        {/* ANALYSIS ACTION */}

        <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white p-3.5 text-violet-600 shadow-sm">
                <Sparkles size={25} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Analyze Research Papers
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Extract research problems, methodologies, datasets,
                  limitations, and future research directions from your
                  uploaded papers.
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={
                analyzing ||
                generatingReport ||
                loadingPapers ||
                !selectedWorkspace ||
                papers.length === 0
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {analyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Start Analysis
                </>
              )}
            </button>
          </div>
        </section>

        {/* ANALYSIS LOADING */}

        {analyzing && (
          <div className="flex items-center gap-4 rounded-2xl border border-violet-200 bg-white p-6">
            <RefreshCw
              size={23}
              className="animate-spin text-violet-600"
            />

            <div>
              <p className="font-semibold text-slate-900">
                AI is analyzing your research papers
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Extracting research limitations and future work.
                This may take some time.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ANALYSIS RESULTS */}

        {analysisResult && (
          <section className="space-y-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-violet-600">
                  <Sparkles size={19} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    AI Findings
                  </span>
                </div>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Research Analysis Results
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Explore the findings extracted from each research paper.
                </p>
              </div>

              <span className="w-fit rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                {analyses.length} Papers Analyzed
              </span>
            </div>

            {analyses.map((paper, index) => {
              const result = paper.analysis;

              return (
                <article
                  key={paper.paperId || index}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* PAPER HEADER */}

                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                      Paper {index + 1}
                    </p>

                    <h3 className="mt-2 break-words text-base font-bold leading-7 text-slate-900 sm:text-lg">
                      {paper.filename}
                    </h3>

                    <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Analysis completed
                    </span>
                  </div>

                  {/* PAPER CONTENT */}

                  <div className="grid grid-cols-1 gap-4 p-5 sm:p-7 lg:grid-cols-2">

                    <ResultSection
                      title="Research Problem"
                      icon={Target}
                    >
                      {result.research_problem}
                    </ResultSection>

                    <ResultSection
                      title="Proposed Methodology"
                      icon={FlaskConical}
                    >
                      {result.methodology}
                    </ResultSection>

                    <ResultSection
                      title="Dataset and Input Features"
                      icon={Database}
                    >
                      {result.dataset}
                    </ResultSection>

                    <ResultSection
                      title="Key Findings"
                      icon={BookOpen}
                    >
                      {result.key_findings}
                    </ResultSection>

                    <ResultList
                      title="Research Limitations"
                      icon={AlertCircle}
                      items={result.limitations}
                    />

                    <ResultList
                      title="Future Research Directions"
                      icon={Lightbulb}
                      items={result.future_work}
                    />

                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* GENERATE AND SAVE REPORT */}

        {analysisResult && (
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-white p-3.5 text-violet-600 shadow-sm">
                    <FileBarChart size={26} />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                      Next Step
                    </span>

                    <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                      Generate Research Gap Report
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Identify recurring research limitations, interpret
                      clusters and discover relevant external academic
                      literature.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700">
                    <CheckCircle2 size={15} />
                    Paper Analysis Completed
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">

              <div>
                <label
                  htmlFor="report-focus"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Research Focus
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  id="report-focus"
                  type="text"
                  value={reportFocus}
                  onChange={(e) => setReportFocus(e.target.value)}
                  disabled={generatingReport}
                  placeholder="e.g. Physical Layer Authentication in Wireless Networks"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Specify a research topic to guide the external literature
                  discovery.
                </p>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-slate-800">
                    Ready to explore research opportunities?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This process runs clustering, recurrence analysis,
                    AI interpretation and external literature discovery.
                    It may take several minutes.
                  </p>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport || analyzing}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate & Save Report
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

              </div>

              {/* REPORT GENERATION STATUS */}

              {generatingReport && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex items-start gap-3">
                    <RefreshCw
                      size={21}
                      className="mt-0.5 animate-spin text-violet-600"
                    />

                    <div>
                      <p className="font-semibold text-violet-900">
                        Generating your research-gap report
                      </p>

                      <p className="mt-1 text-sm leading-6 text-violet-700">
                        The system is processing limitation clusters,
                        calculating recurrence and discovering related
                        literature through OpenAlex. Please keep this
                        page open until processing finishes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT SUCCESS */}

              {reportSuccess && (
                <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={21}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="font-semibold text-emerald-800">
                        Report saved successfully!
                      </p>

                      <p className="mt-1 text-sm text-emerald-700">
                        Your research report is now available in Saved Reports.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/reports")}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    View Saved Reports
                    <ExternalLink size={16} />
                  </button>
                </div>
              )}

            </div>
          </section>
        )}

        {/* EMPTY WORKSPACE */}

        {!loadingWorkspaces && workspaces.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <FileText
              size={30}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 font-semibold text-slate-900">
              No workspaces found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create a workspace and upload research papers to begin.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ============================================
// STATISTICS CARD
// ============================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
  color: "blue" | "amber" | "emerald";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={23} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default ResearchGapExplorer;

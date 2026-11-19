
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  FileText,
  Loader2,
  Sparkles,
  GitCompareArrows,
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
  comparePapers,
  type ComparisonResult,
} from "../services/compareService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PaperComparison() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");

  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperOne, setPaperOne] = useState("");
  const [paperTwo, setPaperTwo] = useState("");

  const [result, setResult] = useState<ComparisonResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  // Load workspaces when the page opens.
  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await getWorkspaces();
        setWorkspaces(data);

        if (data.length > 0) {
          setSelectedWorkspace(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load workspaces.");
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaces();
  }, []);

  // Load papers whenever the selected workspace changes.
  useEffect(() => {
    if (!selectedWorkspace) {
      setPapers([]);
      setPaperOne("");
      setPaperTwo("");
      setResult(null);
      return;
    }

    async function loadPapers() {
      try {
        setError("");
        setResult(null);

        const data = await getPapers(selectedWorkspace);
        setPapers(data);

        setPaperOne(data[0]?.id || "");
        setPaperTwo(data[1]?.id || "");
      } catch (err) {
        console.error(err);
        setError("Unable to load papers for this workspace.");
      }
    }

    void loadPapers();
  }, [selectedWorkspace]);

  async function handleCompare() {
    if (!selectedWorkspace || !paperOne || !paperTwo) {
      setError("Please select two papers.");
      return;
    }

    if (paperOne === paperTwo) {
      setError("Please select two different papers.");
      return;
    }

    try {
      setComparing(true);
      setError("");
      setResult(null);

      const comparison = await comparePapers(
        selectedWorkspace,
        [paperOne, paperTwo]
      );

      setResult(comparison);
    } catch (err: unknown) {
      console.error("Paper comparison failed:", err);

      const responseMessage =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(
        responseMessage ||
          (err instanceof Error
            ? err.message
            : "Comparison failed. Please try again.")
      );
    } finally {
      setComparing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-slate-500">
        <Loader2 className="mr-2 inline animate-spin" size={18} />
        Loading workspaces...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">
          RESEARCH ANALYSIS
        </p>

        <h1 className="text-3xl font-bold text-slate-800">
          Paper Comparison
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Compare research methodologies, datasets, findings, and limitations
          using AI.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-3 text-slate-400" size={36} />
          <h2 className="font-semibold">No workspaces available</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a workspace and upload research papers first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 max-w-xl">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select workspace
            </label>

            <select
              value={selectedWorkspace}
              onChange={(event) => setSelectedWorkspace(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          {papers.length < 2 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FileText className="mx-auto mb-3 text-slate-400" size={36} />
              <h2 className="font-semibold">
                You need at least two papers
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Upload two or more research papers to compare them.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Select papers to compare
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose two different papers from your selected workspace.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Paper 1
                  </label>

                  <select
                    value={paperOne}
                    onChange={(event) => setPaperOne(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="">Select first paper</option>
                    {papers.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Paper 2
                  </label>

                  <select
                    value={paperTwo}
                    onChange={(event) => setPaperTwo(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="">Select second paper</option>
                    {papers.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {paperOne && paperOne === paperTwo && (
                <p className="mt-4 text-sm text-red-600">
                  Select two different papers.
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={handleCompare}
                disabled={
                  comparing ||
                  !paperOne ||
                  !paperTwo ||
                  paperOne === paperTwo
                }
                className="mt-6 flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comparing ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    Comparing papers...
                  </>
                ) : (
                  <>
                    <GitCompareArrows size={17} />
                    Compare papers
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="text-violet-600" size={21} />
                <h2 className="text-xl font-bold text-slate-800">
                  AI Comparison Results
                </h2>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                {result.papers.map((paper, index) => (
                  <div
                    key={paper.paperId}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <p className="mb-2 text-xs font-bold uppercase text-violet-600">
                      Paper {index + 1}
                    </p>
                    <h3 className="font-semibold text-slate-800">
                      {paper.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {paper.sources.length} source chunks used
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <ArrowLeftRight className="text-violet-600" size={20} />
                  <h3 className="font-semibold text-slate-800">
                    Research Comparison
                  </h3>
                </div>

                <div className="prose prose-slate max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {result.comparison}
  </ReactMarkdown>
</div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

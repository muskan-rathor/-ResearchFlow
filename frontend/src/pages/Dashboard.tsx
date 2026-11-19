
import { useEffect, useState } from "react";
import {
  FolderOpen,
  FileText,
  Sparkles,
  Network,
  ArrowUpRight,
  Plus,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";
import { getWorkspaces, type Workspace } from "../services/workspaceService";
import { getPapers } from "../services/paperService";
import {
  getResearchReports,
  getResearchReportById,
} from "../services/researchReportService";

interface DashboardStats {
  workspaces: number;
  papers: number;
  reports: number;
  themes: number;
}

const tools = [
  {
    title: "Manage Papers",
    description: "Upload and organize research PDFs.",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    path: "/papers",
  },
  {
    title: "AI Research Assistant",
    description: "Ask questions across your research papers.",
    icon: Sparkles,
    color: "bg-violet-50 text-violet-600",
    path: "/assistant",
  },
  {
    title: "Paper Comparison",
    description: "Compare methodologies and findings.",
    icon: ArrowUpRight,
    color: "bg-orange-50 text-orange-600",
    path: "/compare",
  },
  {
    title: "Research Gap Engine",
    description: "Discover recurring limitations and directions.",
    icon: Network,
    color: "bg-emerald-50 text-emerald-600",
    path: "/research-gaps",
  },
];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    workspaces: 0,
    papers: 0,
    reports: 0,
    themes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const workspaceData = await getWorkspaces();

        if (!active) return;

        setWorkspaces(workspaceData);

        const [paperResults, reportResults] = await Promise.all([
          Promise.all(
            workspaceData.map((workspace) => getPapers(workspace.id))
          ),
          Promise.all(
            workspaceData.map((workspace) =>
              getResearchReports(workspace.id)
            )
          ),
        ]);

        const totalPapers = paperResults.reduce(
          (total, papers) => total + papers.length,
          0
        );

        const allReports = reportResults.flat();

        // Read each saved report to count its research themes.
        const reportDetails = await Promise.all(
          allReports.map((report) =>
            getResearchReportById(report.workspace_id, report.id)
          )
        );

        const totalThemes = reportDetails.reduce((total, detail) => {
          const reportData = detail as {
            report?: {
              results?: unknown[];
            };
          };

          return total + (reportData.report?.results?.length ?? 0);
        }, 0);

        if (!active) return;

        setStats({
          workspaces: workspaceData.length,
          papers: totalPapers,
          reports: allReports.length,
          themes: totalThemes,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);

        if (active) {
          setError("Unable to load complete dashboard information.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      title: "Workspaces",
      value: stats.workspaces,
      icon: FolderOpen,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "Research Papers",
      value: stats.papers,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Saved Reports",
      value: stats.reports,
      icon: BookOpen,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Research Themes",
      value: stats.themes,
      icon: Network,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-5 md:p-10">

      {/* Welcome section */}
      <section className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">
            YOUR RESEARCH WORKSPACE
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Good to see you, {user?.name?.split(" ")[0] || "Researcher"}.
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organize your papers, explore ideas, and discover research gaps.
          </p>
        </div>

        <button
          onClick={() => navigate("/workspaces")}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <Plus size={17} />
          New workspace
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${stat.color}`}>
                <stat.icon size={21} />
              </div>

              {loading && (
                <Loader2 size={16} className="animate-spin text-slate-400" />
              )}
            </div>

            <p className="text-sm font-medium text-slate-500">
              {stat.title}
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : stat.value.toLocaleString()}
            </h2>
          </div>
        ))}
      </section>

      {/* Recent workspaces */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Workspaces
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Continue where you left off.
            </p>
          </div>

          <button
            onClick={() => navigate("/workspaces")}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            View all <ArrowUpRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
            <Loader2 size={19} className="animate-spin text-violet-600" />
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <FolderOpen className="mx-auto mb-3 text-slate-400" size={34} />

            <h3 className="font-semibold text-slate-900">
              Your research starts here
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first workspace to organize your papers.
            </p>

            <button
              onClick={() => navigate("/workspaces")}
              className="mt-5 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Create workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {workspaces.slice(0, 4).map((workspace) => (
              <article
                key={workspace.id}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-sm"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700">
                  <FolderOpen size={21} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  {workspace.name}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {workspace.description || "No description provided."}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  Created{" "}
                  {new Date(workspace.created_at).toLocaleDateString()}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Research tools */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Research Tools
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Everything you need for your literature review.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.path)}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-sm"
            >
              <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${tool.color}`}>
                <tool.icon size={20} />
              </div>

              <h3 className="text-sm font-semibold text-slate-900">
                {tool.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {tool.description}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet-600">
                Open tool <ArrowUpRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

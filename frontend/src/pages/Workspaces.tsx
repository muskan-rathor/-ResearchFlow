
import { useEffect, useState } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  X,
  FileText,
  CalendarDays,
  Search,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaces,
  type Workspace,
} from "../services/workspaceService";

import { getPapers } from "../services/paperService";

interface WorkspacePaperCount {
  [workspaceId: string]: number;
}

export default function Workspaces() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [paperCounts, setPaperCounts] = useState<WorkspacePaperCount>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<Workspace | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadWorkspaces() {
    try {
      setLoading(true);
      setError("");

      const data = await getWorkspaces();
      setWorkspaces(data);

      const countResults = await Promise.all(
        data.map(async (workspace) => {
          try {
            const papers = await getPapers(workspace.id);
            return [workspace.id, papers.length] as const;
          } catch {
            return [workspace.id, 0] as const;
          }
        })
      );

      setPaperCounts(Object.fromEntries(countResults));
    } catch (err) {
      console.error(err);
      setError("Could not load workspaces. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  function openCreateForm() {
    setEditingWorkspace(null);
    setName("");
    setDescription("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(workspace: Workspace) {
    setEditingWorkspace(workspace);
    setName(workspace.name);
    setDescription(workspace.description || "");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingWorkspace(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingWorkspace) {
        const updated = await updateWorkspace(editingWorkspace.id, {
          name: name.trim(),
          description: description.trim(),
        });

        setWorkspaces((current) =>
          current.map((workspace) =>
            workspace.id === updated.id ? updated : workspace
          )
        );

        setSuccess("Workspace updated successfully.");
      } else {
        const created = await createWorkspace({
          name: name.trim(),
          description: description.trim(),
        });

        setWorkspaces((current) => [created, ...current]);
        setPaperCounts((current) => ({
          ...current,
          [created.id]: 0,
        }));

        setSuccess("Workspace created successfully.");
      }

      closeForm();
    } catch (err) {
      console.error(err);
      setError(
        editingWorkspace
          ? "Could not update workspace. Please try again."
          : "Could not create workspace. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(workspace: Workspace) {
    const confirmed = window.confirm(
      `Delete "${workspace.name}"? Its associated data may also be deleted.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(workspace.id);
      setError("");
      setSuccess("");

      await deleteWorkspace(workspace.id);

      setWorkspaces((current) =>
        current.filter((item) => item.id !== workspace.id)
      );

      setPaperCounts((current) => {
        const updated = { ...current };
        delete updated[workspace.id];
        return updated;
      });

      setSuccess("Workspace deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Could not delete workspace. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const query = search.toLowerCase();

    return (
      workspace.name.toLowerCase().includes(query) ||
      (workspace.description || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <section className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">
              RESEARCH ORGANIZATION
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              My Workspaces
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your research projects, papers and literature reviews.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus size={18} />
            New Workspace
          </button>
        </section>

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Overview */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <FolderOpen size={20} />
            </div>
            <p className="text-sm text-slate-500">Total Workspaces</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : workspaces.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
            <p className="text-sm text-slate-500">Total Research Papers</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : Object.values(paperCounts).reduce(
                    (sum, count) => sum + count,
                    0
                  )}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FolderOpen size={20} />
            </div>
            <p className="text-sm text-slate-500">Active Collections</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : workspaces.filter(
                    (workspace) => (paperCounts[workspace.id] ?? 0) > 0
                  ).length}
            </h2>
          </div>
        </section>

        {/* Create / Edit form */}
        {showForm && (
          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingWorkspace ? "Edit Workspace" : "Create Workspace"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingWorkspace
                    ? "Update your research workspace details."
                    : "Create a dedicated space for your research project."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Workspace Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Authentication Research"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the goal of this research workspace..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingWorkspace
                      ? "Save Changes"
                      : "Create Workspace"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Search and workspace list */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Research Collections
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {workspaces.length} workspace(s) available.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-violet-600" />
              Loading workspaces...
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <FolderOpen
                className="mx-auto mb-3 text-slate-400"
                size={36}
              />

              <h3 className="font-semibold text-slate-900">
                {search ? "No matching workspaces" : "No workspaces yet"}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? "Try another search term."
                  : "Create your first workspace to organize your research."}
              </p>

              {!search && (
                <button
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Create Workspace
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredWorkspaces.map((workspace) => (
                <article
                  key={workspace.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600">
                      <FolderOpen size={22} />
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditForm(workspace)}
                        aria-label={`Edit ${workspace.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => void handleDelete(workspace)}
                        disabled={deletingId === workspace.id}
                        aria-label={`Delete ${workspace.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === workspace.id ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {workspace.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                    {workspace.description || "No description provided."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileText size={15} />
                      {paperCounts[workspace.id] ?? 0} papers
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays size={14} />
                      {new Date(workspace.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/papers?workspace=${workspace.id}`)}
                    className="mt-5 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    View Papers
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

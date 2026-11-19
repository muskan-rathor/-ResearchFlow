
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  FolderOpen,
  Loader2,
  FileUp,
} from "lucide-react";

import { getWorkspaces, type Workspace } from "../services/workspaceService";
import {
  getPapers,
  uploadPaper,
  type Paper,
} from "../services/paperService";

export default function Papers() {
    const [searchParams, setSearchParams] = useSearchParams();
  const requestedWorkspaceId = searchParams.get("workspace");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await getWorkspaces();
        setWorkspaces(data);

        if (data.length > 0) {
          const matchingWorkspace = data.find(
            (workspace) => workspace.id === requestedWorkspaceId
          );

          const workspaceToSelect =
            matchingWorkspace ?? data[0];

          setSelectedWorkspace(workspaceToSelect.id);

          // Keep the URL synchronized with the selected workspace.
          if (requestedWorkspaceId !== workspaceToSelect.id) {
            setSearchParams(
              { workspace: workspaceToSelect.id },
              { replace: true }
            );
          }
        } else {
          setSelectedWorkspace("");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load workspaces.");
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaces();
  }, [requestedWorkspaceId, setSearchParams]);

  useEffect(() => {
    if (!selectedWorkspace) {
      setPapers([]);
      return;
    }

    async function loadPapers() {
      try {
        setError("");
        const data = await getPapers(selectedWorkspace);
        setPapers(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load papers.");
      }
    }

    void loadPapers();
  }, [selectedWorkspace]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      setFile(null);
      setTitle("");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("PDF must be smaller than 20 MB.");
      setFile(null);
      setTitle("");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);

    // Use the filename as the default title.
    setTitle(selectedFile.name.replace(/\.pdf$/i, ""));
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspace || !file || !title.trim()) {
      setError("Select a workspace, PDF, and paper title.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const uploadedPaper = await uploadPaper(
        selectedWorkspace,
        file,
        title.trim()
      );

      setPapers((current) => [uploadedPaper, ...current]);

      setFile(null);
      setTitle("");

      const fileInput = document.getElementById(
        "paper-file"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      setMessage(
        `Paper uploaded successfully. ${uploadedPaper.chunkCount ?? 0} text chunks created.`
      );
    } catch (err: unknown) {
      console.error("Paper upload failed:", err);

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
            : "Paper upload failed. Please try again.")
      );
    } finally {
      setUploading(false);
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
          RESEARCH LIBRARY
        </p>

        <h1 className="text-3xl font-bold text-slate-800">
          Research Papers
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Upload, organize, and prepare your papers for AI-powered research.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderOpen className="mx-auto mb-3 text-slate-400" size={36} />
          <h2 className="font-semibold">Create a workspace first</h2>
          <p className="mt-2 text-sm text-slate-500">
            Papers must belong to a research workspace.
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
              onChange={(event) => {
  const workspaceId = event.target.value;

  setSelectedWorkspace(workspaceId);
  setSearchParams(
    { workspace: workspaceId },
    { replace: true }
  );
}}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={handleUpload}
            className="mb-10 rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Upload a research paper
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a PDF to extract its content and generate embeddings.
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium">
              Paper title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter research paper title"
              className="mb-5 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              required
            />

            <label
              htmlFor="paper-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-6 py-10 text-center transition hover:border-violet-400 hover:bg-violet-50"
            >
              <UploadCloud className="mb-3 text-violet-600" size={36} />

              <span className="font-semibold text-slate-800">
                {file ? file.name : "Choose a PDF to upload"}
              </span>

              <span className="mt-2 text-xs text-slate-500">
                PDF only · Maximum size 20 MB
              </span>

              <input
                id="paper-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <p className="mt-3 text-xs text-slate-500">
                Selected file: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="mt-5 flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Processing paper...
                </>
              ) : (
                <>
                  <FileUp size={17} />
                  Upload paper
                </>
              )}
            </button>
          </form>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Uploaded papers</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {papers.length} papers in this workspace
                </p>
              </div>
            </div>

            {papers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <FileText className="mx-auto mb-3 text-slate-400" size={34} />
                <h3 className="font-semibold">No papers uploaded yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Upload your first research paper to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <article
                    key={paper.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-800">
                        {paper.title}
                      </h3>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {paper.original_filename}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Uploaded{" "}
                        {new Date(paper.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

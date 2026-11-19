
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  Send,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  getWorkspaces,
  type Workspace,
} from "../services/workspaceService";

import {
  askResearchQuestion,
  type ResearchSource,
} from "../services/ragService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ResearchSource[];
}

export default function Assistant() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        setError("Unable to load your workspaces.");
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaces();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  // A different workspace means a different research context.
  function handleWorkspaceChange(workspaceId: string) {
    setSelectedWorkspace(workspaceId);
    setMessages([]);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !selectedWorkspace || sending) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setSending(true);
    setError("");

    try {
      const result = await askResearchQuestion(
        selectedWorkspace,
        trimmedQuestion
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err: unknown) {
      console.error("Research question failed:", err);

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
            : "Unable to generate an answer.")
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-slate-500">
        <Loader2 className="mr-2 inline animate-spin" size={18} />
        Loading your research workspaces...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-7xl flex-col p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">
            AI-POWERED RESEARCH
          </p>

          <h1 className="text-2xl font-bold text-slate-800">
            AI Research Assistant
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Ask questions and explore your uploaded research papers.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            RESEARCH WORKSPACE
          </label>

          <select
            value={selectedWorkspace}
            onChange={(event) =>
              handleWorkspaceChange(event.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <BookOpen className="mb-3 text-slate-400" size={38} />
          <h2 className="font-semibold">No research workspace found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a workspace and upload papers before asking questions.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                ResearchFlow AI
              </h2>
              <p className="text-xs text-slate-500">
                Answers grounded in your selected workspace
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 md:p-6">
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-600">
                  <Bot size={32} />
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  What would you like to research?
                </h2>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ask about methodologies, findings, datasets, limitations,
                  or concepts from papers in this workspace.
                </p>

                <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                  {[
                    "What are the main limitations?",
                    "Explain the methodology.",
                    "What datasets are used?",
                    "How many papers are uploaded?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                    <Bot size={19} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    message.role === "user"
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <BookOpen size={14} />
                        Sources ({message.sources.length})
                      </p>

                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <div
                            key={`${source.paperId}-${source.chunkId ?? index}`}
                            className="rounded-lg bg-slate-50 p-3"
                          >
                            <p className="text-xs font-semibold text-slate-700">
                              {index + 1}. {source.paperTitle}
                            </p>

                            {source.chunkIndex !== undefined && (
                              <p className="mt-1 text-xs text-slate-500">
                                Text chunk {source.chunkIndex + 1}
                              </p>
                            )}

                            {source.similarity !== undefined && (
                              <p className="mt-1 text-xs text-slate-500">
                                Similarity:{" "}
                                {(source.similarity * 100).toFixed(1)}%
                              </p>
                            )}

                            {source.content && (
                              <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-500">
                                {source.content}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-700">
                    <User size={19} />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-700">
                  <Bot size={19} />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  Searching papers and generating an answer...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 border-t border-slate-100 bg-white p-4"
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !sending
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask a question about your research papers..."
              rows={2}
              className="max-h-36 min-h-12 flex-1 resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />

            <button
              type="submit"
              disabled={!question.trim() || sending || !selectedWorkspace}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send question"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={19} />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

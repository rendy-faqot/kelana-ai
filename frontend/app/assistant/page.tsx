"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface AssistantAnswer {
  answer: string;
  sources: string[];
}

const EXAMPLE_QUESTION = "Ask anything about your travel plans...";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SourceItem {
  metadata?: {
    _document_title?: string;
    document_title?: string;
  };
}

interface AskResponse {
  answer?: string;
  source?: string | string[] | SourceItem[];
  sources?: string | string[] | SourceItem[];
}

function getSourceTitles(source: AskResponse["source"]): string[] {
  if (!source) return ["No source returned."];

  if (typeof source === "string") return [source];

  return source.map((item) => {
    if (typeof item === "string") return item;
    return (
      item.metadata?._document_title ??
      item.metadata?.document_title ??
      "Untitled document"
    );
  });
}

export default function AssistantPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);

  const canAsk = useMemo(() => question.trim().length > 0 && !isAsking, [
    question,
    isAsking,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    setAnswer(null);
    setError(null);
    setIsAsking(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/v1/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: cleanQuestion }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Ask failed (${res.status})`);
      }

      const data: AskResponse = await res.json();
      setAnswer({
        answer: data.answer ?? "No answer returned.",
        sources: getSourceTitles(data.source ?? data.sources),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask KelanaAI.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <main className="flex-1 bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Ask KelanaAI
          </h1>
          <p className="text-sm text-gray-400">
            Powered by your trusted travel documents
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#f0f4f8] border border-[#d7e5f1] p-2 shadow-sm flex items-center gap-2"
        >
          <label htmlFor="question" className="sr-only">
            Travel question
          </label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={EXAMPLE_QUESTION}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base italic text-[var(--foreground)] placeholder:text-gray-500 outline-none"
          />
          <button
            type="submit"
            disabled={!canAsk}
            className="h-10 shrink-0 rounded-xl bg-[#2196F3] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#1976D2] active:bg-[#1565C0] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isAsking ? "..." : "Ask"}
          </button>
        </form>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {answer && (
          <section className="rounded-2xl bg-[#2f9d8c] px-5 py-6 text-white shadow-sm">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">
                  AI Answer
                </p>
                <div className="mt-2 text-base leading-7">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 list-disc pl-5 last:mb-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 list-decimal pl-5 last:mb-0">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1 last:mb-0">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                    }}
                  >
                    {answer.answer}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="border-t border-white/30 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest">
                  Source
                </p>
                <ul className="mt-2 flex flex-col gap-1 font-mono text-sm">
                  {answer.sources.map((sourceTitle) => (
                    <li key={sourceTitle} className="flex items-start gap-2">
                      <span aria-hidden="true">▤</span>
                      <span className="break-all">{sourceTitle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

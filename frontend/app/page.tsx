"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

const TRAVEL_STYLES = ["Solo", "Couple", "Family", "Group", "Business"];

type TripResult = {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string;
  created_at: string;
};

type DaySection = {
  title: string;
  body: string;
};

/**
 * Split markdown into per-day sections.
 *
 * Handles common patterns the model produces:
 *   ## Day 1 – Tokyo Arrival
 *   **Day 1: Arrival**
 *   ### Day 1
 *
 * Returns null when no day headings are found so the caller can
 * fall back to rendering the whole text in one block.
 */
function parseDaySections(text: string): DaySection[] | null {
  // Match lines that start a new day: heading (#/##/###) OR bold (**Day N**)
  const dayLineRe = /^(?:#{1,3}\s+|(?:\*\*))?(Day\s+\d+[^\n]*?)(?:\*\*)?$/im;

  // Split on lines that match a day heading, keeping the delimiter
  const parts = text.split(
    /^((?:#{1,3}\s+)?(?:\*\*)?Day\s+\d+[^\n]*?(?:\*\*)?)$/gim
  );

  const sections: DaySection[] = [];
  let i = 0;

  // Skip any preamble before the first day
  while (i < parts.length && !dayLineRe.test(parts[i])) i++;

  while (i < parts.length - 1) {
    const rawTitle = parts[i].trim();
    const rawBody = (parts[i + 1] ?? "").trim();

    if (dayLineRe.test(rawTitle)) {
      // Strip markdown syntax from title so we can render it cleanly
      const cleanTitle = rawTitle
        .replace(/^#{1,3}\s+/, "")   // remove leading hashes
        .replace(/^\*\*|\*\*$/g, ""); // remove surrounding bold markers
      sections.push({ title: cleanTitle, body: rawBody });
      i += 2;
    } else {
      i++;
    }
  }

  return sections.length > 0 ? sections : null;
}

type View = "form" | "loading" | "result";

export default function Home() {
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    days: "",
    travelStyle: "",
  });
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("form");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setView("loading");

    try {
      const res = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          budget: Number(form.budget),
          days: Number(form.days),
          travel_style: form.travelStyle,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with status ${res.status}`);
      }

      const data: TripResult = await res.json();
      setResult(data);
      setView("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setView("form");
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setView("form");
  }

  /* ── Loading screen ─────────────────────────────────────── */
  if (view === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--background)]">
        <h1 className="text-4xl font-bold text-[#2196F3] tracking-tight mb-10">
          KelanaAI
        </h1>
        <div className="flex flex-col items-center gap-5">
          {/* Spinner */}
          <div className="w-12 h-12 rounded-full border-4 border-[#e3f0fd] border-t-[#2196F3] animate-spin" />
          <p className="text-sm text-gray-400 tracking-wide">
            Generating your itinerary…
          </p>
        </div>
      </main>
    );
  }

  /* ── Result screen ──────────────────────────────────────── */
  if (view === "result" && result) {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-16 bg-[var(--background)]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#2196F3] tracking-tight">
            KelanaAI
          </h1>
        </div>

        <div className="w-full max-w-lg flex flex-col gap-4">
          {/* Summary pill */}
          <div className="rounded-full bg-[#f0f4f8] px-6 py-3 flex items-center justify-between shadow-sm gap-4">
            <span className="font-bold text-[var(--foreground)] whitespace-nowrap">
              Destination: {result.destination}
            </span>
            <span className="text-gray-300 select-none">|</span>
            <span className="font-bold text-[#2196F3] whitespace-nowrap">
              {form.travelStyle}
            </span>
            <span className="text-gray-300 select-none">|</span>
            <span className="font-bold text-[var(--foreground)] whitespace-nowrap">
              Budget: USD {result.budget.toLocaleString()}
            </span>
          </div>

          {/* AI Recommendation */}
          {result.ai_recommendation && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
                  AI Recommendation
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <DayCards text={result.ai_recommendation} />
            </div>
          )}

          {/* Plan another trip */}
          <button
            onClick={handleReset}
            className="mt-2 w-full rounded-2xl border border-[#2196F3] text-[#2196F3] hover:bg-[#e3f0fd] active:bg-[#bbdefb] font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm cursor-pointer"
          >
            Plan another trip
          </button>
        </div>
      </main>
    );
  }

  /* ── Form screen (default) ──────────────────────────────── */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[var(--background)]">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-[#2196F3] tracking-tight">
          KelanaAI
        </h1>
        <p className="mt-2 text-sm text-gray-400 tracking-wide">
          Plan your next adventure
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-3"
      >
        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="destination"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="e.g. Japan"
            value={form.destination}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="budget"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Budget (USD)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            placeholder="e.g. 2000"
            min={0}
            value={form.budget}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="days"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Days
          </label>
          <input
            id="days"
            name="days"
            type="number"
            placeholder="e.g. 5"
            min={1}
            value={form.days}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="travelStyle"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Travel Style
          </label>
          <select
            id="travelStyle"
            name="travelStyle"
            value={form.travelStyle}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] outline-none cursor-pointer"
          >
            <option value="" disabled>
              Select a style
            </option>
            {TRAVEL_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#1565C0] text-white font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm cursor-pointer"
        >
          Generate AI Trip
        </button>
      </form>

      {/* Inline error (only shown if API fails and we return to form) */}
      {error && (
        <div className="mt-6 w-full max-w-lg rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Day cards                                                                  */
/* -------------------------------------------------------------------------- */

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  // Suppress any heading tags inside a day body — the card title handles that
  h1: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[var(--foreground)] leading-relaxed mb-1 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-[var(--foreground)] space-y-1 mb-1 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-[var(--foreground)] space-y-1 mb-1 last:mb-0 list-decimal list-inside">
      {children}
    </ol>
  ),
  // Custom bullet — replaces the browser default with a blue dot
  li: ({ children }) => (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#2196F3]" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-500">{children}</em>
  ),
  hr: () => <hr className="border-gray-200 my-2" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#2196F3] pl-3 italic text-gray-500 text-sm my-1">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-white/70 rounded px-1 py-0.5 text-xs font-mono text-[#1565C0]">
      {children}
    </code>
  ),
};

function DayCards({ text }: { text: string }) {
  const sections = parseDaySections(text);

  if (sections) {
    return (
      <>
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-2"
          >
            <p className="font-bold text-[#2196F3] text-sm">{section.title}</p>
            {section.body && (
              <ReactMarkdown components={mdComponents}>
                {section.body}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </>
    );
  }

  // Fallback: single card with full markdown
  return (
    <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm">
      <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LogoutButton } from "@/components/LogoutButton";
import { getTrip, type Trip } from "@/services/tripService";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `IDR ${value.toLocaleString()}` : "Pending";

const formatDate = (value?: string) => {
  if (!value) {
    return "Recently created";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      if (!Number.isInteger(tripId) || tripId <= 0) {
        setIsLoading(false);
        return;
      }

      const data = await getTrip(tripId);
      setTrip(data);
      setIsLoading(false);
    }

    loadTrip();
  }, [tripId]);

  const destination = trip?.destination || "Untitled trip";
  const stats = [
    {
      label: "Duration",
      value: typeof trip?.days === "number" ? `${trip.days} days` : "Pending",
    },
    {
      label: "Budget",
      value: formatCurrency(trip?.budget),
    },
    {
      label: "Daily Budget",
      value: formatCurrency(trip?.daily_budget),
    },
    {
      label: "Category",
      value: trip?.category || "Pending",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/trips"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <span aria-hidden="true">←</span>
            Back to trips
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="inline-flex w-fit items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>

        {isLoading ? (
          <section className="rounded-[2rem] border border-sky-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading trip...
          </section>
        ) : !trip ? (
          <section className="rounded-[2rem] border border-sky-100 bg-white p-6 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Trip not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              Login again or choose another saved trip.
            </p>
          </section>
        ) : (
          <>
            <header className="rounded-[2rem] border border-sky-100 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 shadow-sm">
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 12.25L21 4.5l-2.25 6.25L21 17l-3.75-1.25-3.5 1.5-2.75 2.75-2.5-3-4.5 1.5 2.5-5.5-2.25-1.75z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                      KelanaAI Trip
                    </p>
                    <h1 className="mt-2 truncate text-3xl font-semibold text-slate-900 sm:text-4xl">
                      {destination}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                      <span>{formatDate(trip.created_at)}</span>
                      {trip.travel_style ? (
                        <>
                          <span className="text-slate-400">·</span>
                          <span>{trip.travel_style}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {trip.category ? (
                  <span className="w-fit rounded-full bg-sky-100 px-5 py-2 text-sm font-semibold text-sky-700">
                    {trip.category}
                  </span>
                ) : null}
              </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-slate-900">
                  AI Recommendation
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your generated itinerary, rendered as markdown.
                </p>
              </div>

              {trip.ai_recommendation ? (
                <div className="rounded-[1.5rem] border border-sky-100 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-4 mt-6 text-3xl font-semibold leading-tight text-slate-950 first:mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-5 text-2xl font-semibold leading-tight text-slate-950 first:mt-0">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 text-xl font-semibold leading-snug text-slate-950 first:mt-0">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 leading-7 text-slate-700 last:mb-0">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-900">
                          {children}
                        </strong>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="mb-3 border-l-4 border-sky-200 pl-3 italic text-slate-600 last:mb-0">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="rounded bg-white px-1.5 py-0.5 text-[0.85em] text-slate-900">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-slate-100 last:mb-0">
                          {children}
                        </pre>
                      ),
                      table: ({ children }) => (
                        <div className="mb-3 overflow-x-auto last:mb-0">
                          <table className="min-w-full border-collapse text-left">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-200 px-3 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {trip.ai_recommendation}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-sky-50 px-6 py-10 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Recommendation unavailable
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    This trip does not have an AI recommendation saved yet.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

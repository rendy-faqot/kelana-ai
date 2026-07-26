import Link from "next/link";

import type { Trip } from "@/services/tripService";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `IDR ${value.toLocaleString()}` : "Budget pending";

export function TripCard({ trip }: { trip: Trip }) {
  const destination = trip.destination || "Untitled trip";
  const meta = [
    typeof trip.days === "number" ? `${trip.days} days` : null,
    formatCurrency(trip.budget),
    trip.travel_style,
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-4 rounded-[1.4rem] border border-sky-100 bg-slate-50 px-5 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 shadow-sm">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 12.25L21 4.5l-2.25 6.25L21 17l-3.75-1.25-3.5 1.5-2.75 2.75-2.5-3-4.5 1.5 2.5-5.5-2.25-1.75z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate text-lg font-semibold text-slate-900">
              {destination}
            </h3>
            {trip.category ? (
              <span className="rounded-full bg-sky-100/70 px-4 py-1 text-sm font-medium text-sky-700">
                {trip.category}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-slate-600">
            {meta.map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span className="text-slate-400">·</span> : null}
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Link
        href={`/trips/${trip.id}`}
        className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-sky-600 px-6 py-3 text-base font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        View Details
        <span aria-hidden="true" className="text-xl leading-none">
          →
        </span>
      </Link>
    </article>
  );
}

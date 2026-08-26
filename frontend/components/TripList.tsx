"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Trip } from "@/services/tripService";
import TripCard from "@/components/TripCard";

type SortKey = "latest" | "oldest" | "highest_budget";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest_budget", label: "Highest Budget" },
];

interface TripListProps {
  trips: Trip[];
}

export default function TripList({ trips }: TripListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("latest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = q
      ? trips.filter(
          (t) =>
            t.destination.toLowerCase().includes(q) ||
            (t.travel_style ?? "").toLowerCase().includes(q)
        )
      : [...trips];

    result.sort((a, b) => {
      if (sort === "latest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "highest_budget") return b.budget - a.budget;
      return 0;
    });

    return result;
  }, [trips, query, sort]);

  if (trips.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f0f4f8] px-5 py-10 flex flex-col items-center gap-3 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#2196F3] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </div>
        <p className="font-semibold text-[var(--foreground)]">No trips yet</p>
        <p className="text-sm text-gray-400">
          Generate your first trip on the home page.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#1565C0] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-150"
        >
          Plan a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Sort toolbar */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trips..."
            aria-label="Search trips by destination or travel style"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#f0f4f8] text-sm text-[var(--foreground)] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2196F3]/30 transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort trips"
            className="appearance-none pl-4 pr-8 py-2.5 rounded-2xl bg-[#f0f4f8] text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[#2196F3]/30 cursor-pointer transition"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* chevron icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Results count when filtering */}
      {query && (
        <p className="text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* No results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-8 flex flex-col items-center gap-2 text-center shadow-sm">
          <p className="font-semibold text-[var(--foreground)]">No matches found</p>
          <p className="text-sm text-gray-400">Try a different destination or travel style.</p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 text-sm text-[#2196F3] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

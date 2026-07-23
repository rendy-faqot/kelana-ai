"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TripCard } from "@/components/TripCard";
import type { Trip } from "@/services/tripService";

type SortOption = "latest" | "oldest" | "highest-budget";

const tripTime = (trip: Trip) => {
  if (trip.created_at) {
    const time = new Date(trip.created_at).getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return trip.id;
};

const searchText = (trip: Trip) =>
  [
    trip.destination,
    trip.category,
    trip.travel_style,
    trip.days,
    trip.budget,
    trip.daily_budget,
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(" ")
    .toLowerCase();

export function TripsBrowser({ trips }: { trips: Trip[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const visibleTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredTrips = normalizedQuery
      ? trips.filter((trip) => searchText(trip).includes(normalizedQuery))
      : trips;

    return [...filteredTrips].sort((a, b) => {
      if (sortBy === "oldest") {
        return tripTime(a) - tripTime(b);
      }

      if (sortBy === "highest-budget") {
        return (b.budget || 0) - (a.budget || 0);
      }

      return tripTime(b) - tripTime(a);
    });
  }, [query, sortBy, trips]);

  return (
    <section className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">My Trips</h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse destination, budget, category, and recommendation details.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          Generate a Trip
        </Link>
      </div>

      {trips.length > 0 ? (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <label
                htmlFor="trip-search"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Search trips
              </label>
              <input
                id="trip-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search destination, category, style, budget..."
                className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="trip-sort"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Sort trips
              </label>
              <select
                id="trip-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="highest-budget">Highest budget</option>
              </select>
            </div>
          </div>

          {visibleTrips.length > 0 ? (
            <div className="space-y-4">
              {visibleTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-sky-50 px-6 py-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No matching trips
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Try a different destination, category, travel style, or budget.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-sky-50 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No trips yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Once you generate a trip, it will appear here with a quick link to the
            full AI recommendation.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            Generate a Trip
          </Link>
        </div>
      )}
    </section>
  );
}

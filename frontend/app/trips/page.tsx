"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { TripsBrowser } from "@/components/TripsBrowser";
import { getTrips, type Trip } from "@/services/tripService";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      const data = await getTrips();
      setTrips(data);
      setIsLoading(false);
    }

    loadTrips();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-sky-100 bg-white/80 px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              KelanaAI
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Trip History
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your saved itineraries and open the AI-generated plan for each trip.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm">
              {isLoading ? "Loading..." : `${trips.length} saved ${trips.length === 1 ? "trip" : "trips"}`}
            </div>
            <Link
              href="/profile"
              className="inline-flex w-fit items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              Profile
            </Link>
            <Link
              href="/chat"
              className="inline-flex w-fit items-center justify-center rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              Chat
            </Link>
            <LogoutButton />
          </div>
        </header>

        {isLoading ? (
          <section className="rounded-[2rem] border border-sky-100 bg-white p-6 text-sm text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            Loading trips...
          </section>
        ) : (
          <TripsBrowser trips={trips} />
        )}
      </div>
    </main>
  );
}

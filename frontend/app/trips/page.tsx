"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Trip } from "@/services/tripService";
import TripList from "@/components/TripList";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/api/v1/trips`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail ?? `Failed to fetch trips (${res.status})`);
        }
        return res.json() as Promise<Trip[]>;
      })
      .then(setTrips)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load trips."))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-4 border-[#e3f0fd] border-t-[#2196F3] animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Trip History
          </h1>
          {!error && (
            <p className="mt-0.5 text-sm text-gray-400">
              {trips.length} saved {trips.length === 1 ? "itinerary" : "itineraries"}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && <TripList trips={trips} />}

      </div>
    </main>
  );
}

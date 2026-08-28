"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getTrip, type Trip } from "@/services/tripService";
import DayCards from "@/components/DayCards";

const CATEGORY_BADGE: Record<string, string> = {
  backpacker: "bg-orange-100 text-orange-600",
  luxury:     "bg-green-100 text-green-600",
  standard:   "bg-blue-100 text-blue-600",
};

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = Number(params.id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (isNaN(tripId)) {
      setError("Invalid trip ID.");
      return;
    }

    getTrip(tripId, token)
      .then(setTrip)
      .catch((err) => setError(err instanceof Error ? err.message : "Trip not found."));
  }, [tripId, router]);

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center px-4 py-10 bg-[var(--background)]">
        <div className="w-full max-w-lg flex flex-col gap-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
          <Link
            href="/trips"
            className="w-full rounded-2xl border border-[#2196F3] text-[#2196F3] hover:bg-[#e3f0fd] font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm text-center"
          >
            ← Back to Trip History
          </Link>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-4 border-[#e3f0fd] border-t-[#2196F3] animate-spin" />
      </main>
    );
  }

  const badgeClass =
    CATEGORY_BADGE[trip.category.toLowerCase()] ?? "bg-gray-100 text-gray-600";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">

        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {trip.destination}
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">Destination</span>
            <span className="text-base text-[var(--foreground)]">{trip.destination}</span>
          </div>

          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">Budget</span>
            <span className="text-base text-[var(--foreground)]">USD {trip.budget.toLocaleString()}</span>
          </div>

          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">Category</span>
            <div className="flex items-center gap-2">
              <span className="text-base text-[var(--foreground)]">
                {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">Days</span>
            <span className="text-base text-[var(--foreground)]">
              {trip.days} {trip.days === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        {trip.ai_recommendation && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
                AI Recommendation
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <DayCards text={trip.ai_recommendation} />
          </div>
        )}

        <Link
          href="/trips"
          className="mt-2 w-full rounded-2xl border border-[#2196F3] text-[#2196F3] hover:bg-[#e3f0fd] active:bg-[#bbdefb] font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm text-center"
        >
          ← Back to Trip History
        </Link>

      </div>
    </main>
  );
}

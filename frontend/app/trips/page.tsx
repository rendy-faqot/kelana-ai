import { TripsBrowser } from "@/components/TripsBrowser";
import { getTrips } from "@/services/tripService";

export default async function TripsPage() {
  const trips = await getTrips();

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
          <div className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {trips.length} saved {trips.length === 1 ? "trip" : "trips"}
          </div>
        </header>

        <TripsBrowser trips={trips} />
      </div>
    </main>
  );
}

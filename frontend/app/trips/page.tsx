import { getTrips } from "@/services/tripService";
import TripList from "@/components/TripList";

export default async function TripsPage() {
  let trips: Awaited<ReturnType<typeof getTrips>> = [];
  let error: string | null = null;

  try {
    trips = await getTrips();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load trips.";
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">

        {/* Page header */}
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

        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Trip list with search + sort */}
        {!error && <TripList trips={trips} />}

      </div>
    </main>
  );
}

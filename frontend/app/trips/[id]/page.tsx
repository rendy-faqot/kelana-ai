import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/services/tripService";
import DayCards from "@/components/DayCards";

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const tripId = Number(id);

  if (isNaN(tripId)) notFound();

  let trip: Awaited<ReturnType<typeof getTrip>>;
  try {
    trip = await getTrip(tripId);
  } catch {
    notFound();
  }

  const CATEGORY_BADGE: Record<string, string> = {
    backpacker: "bg-orange-100 text-orange-600",
    luxury: "bg-green-100 text-green-600",
    standard: "bg-blue-100 text-blue-600",
  };
  const badgeClass =
    CATEGORY_BADGE[trip.category.toLowerCase()] ?? "bg-gray-100 text-gray-600";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">

        {/* Page title */}
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {trip.destination}
        </h1>

        {/* Info grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Destination */}
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
              Destination
            </span>
            <span className="text-base text-[var(--foreground)]">
              {trip.destination}
            </span>
          </div>

          {/* Budget */}
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
              Budget
            </span>
            <span className="text-base text-[var(--foreground)]">
              USD {trip.budget.toLocaleString()}
            </span>
          </div>

          {/* Category */}
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
              Category
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base text-[var(--foreground)]">
                {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}
              >
                {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
              </span>
            </div>
          </div>

          {/* Days */}
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
              Days
            </span>
            <span className="text-base text-[var(--foreground)]">
              {trip.days} {trip.days === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        {/* AI Recommendation */}
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

        {/* Back button */}
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

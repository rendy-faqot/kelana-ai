import Link from "next/link";
import { Trip } from "@/services/tripService";

const CATEGORY_STYLES: Record<string, { badge: string; icon: string }> = {
  backpacker: {
    badge: "bg-orange-100 text-orange-600",
    icon: "bg-green-100 text-green-500",
  },
  luxury: {
    badge: "bg-green-100 text-green-600",
    icon: "bg-blue-100 text-blue-400",
  },
  standard: {
    badge: "bg-blue-100 text-blue-600",
    icon: "bg-blue-100 text-blue-400",
  },
};

function getCategoryStyle(category: string) {
  return (
    CATEGORY_STYLES[category.toLowerCase()] ?? {
      badge: "bg-gray-100 text-gray-600",
      icon: "bg-gray-100 text-gray-400",
    }
  );
}

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const style = getCategoryStyle(trip.category);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
      {/* Left: icon + info */}
      <div className="flex items-center gap-4">
        {/* Airplane icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[var(--foreground)] text-base">
              {trip.destination}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.badge}`}
            >
              {trip.category.charAt(0).toUpperCase() + trip.category.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {trip.days} {trip.days === 1 ? "day" : "days"} · USD{" "}
            {trip.budget.toLocaleString()} · {trip.travel_style ?? "—"}
          </p>
        </div>
      </div>

      {/* Right: View Details button */}
      <Link
        href={`/trips/${trip.id}`}
        className="shrink-0 inline-flex items-center gap-2 bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#1565C0] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-150 whitespace-nowrap"
      >
        View Details
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </Link>
    </div>
  );
}

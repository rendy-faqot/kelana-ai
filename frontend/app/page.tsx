"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Trip } from "@/services/tripService";

const TRAVEL_STYLES = ["Solo", "Couple", "Family", "Group", "Business"];

type View = "form" | "loading";

export default function Home() {
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    days: "",
    travelStyle: "",
  });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("form");

  // Guard: redirect to /login if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setView("loading");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          destination: form.destination,
          budget: Number(form.budget),
          days: Number(form.days),
          travel_style: form.travelStyle,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with status ${res.status}`);
      }

      const data: Trip = await res.json();
      router.push(`/trips`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setView("form");
    }
  }

  /* ── Loading screen ─────────────────────────────────────── */
  if (view === "loading") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 bg-[var(--background)]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-full border-4 border-[#e3f0fd] border-t-[#2196F3] animate-spin" />
          <p className="text-sm text-gray-400 tracking-wide">
            Generating your itinerary…
          </p>
        </div>
      </main>
    );
  }

  /* ── Form screen (default) ──────────────────────────────── */
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 bg-[var(--background)]">
      {/* Subtitle */}
      <div className="mb-10 text-center flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-snug">
          Where will you go{" "}
          <span className="text-[#2196F3]">next?</span>
        </h2>
        <p className="text-sm text-gray-400 italic">
          "The world is a book, and those who do not travel read only one page."
        </p>
        <p className="text-xs text-gray-300">— Saint Augustine</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-3"
      >
        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="destination"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="e.g. Japan"
            value={form.destination}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="budget"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Budget (USD)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            placeholder="e.g. 2000"
            min={0}
            value={form.budget}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="days"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Days
          </label>
          <input
            id="days"
            name="days"
            type="number"
            placeholder="e.g. 5"
            min={1}
            value={form.days}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
          <label
            htmlFor="travelStyle"
            className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
          >
            Travel Style
          </label>
          <select
            id="travelStyle"
            name="travelStyle"
            value={form.travelStyle}
            onChange={handleChange}
            required
            className="bg-transparent text-base text-[var(--foreground)] outline-none cursor-pointer"
          >
            <option value="" disabled>
              Select a style
            </option>
            {TRAVEL_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#1565C0] text-white font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm cursor-pointer"
        >
          Plan a Trip
        </button>
      </form>

      {/* Inline error (only shown if API fails and we return to form) */}
      {error && (
        <div className="mt-6 w-full max-w-lg rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </main>
  );
}



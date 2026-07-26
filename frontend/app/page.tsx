"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { generateTrip } from "@/services/tripService";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    days: "",
    travel_style: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.destination.trim()) {
      nextErrors.destination = "Destination is required.";
    }
    if (!form.budget) {
      nextErrors.budget = "Budget is required.";
    } else if (Number(form.budget) <= 0) {
      nextErrors.budget = "Budget must be greater than 0.";
    }
    if (!form.days) {
      nextErrors.days = "Days is required.";
    } else if (Number(form.days) <= 0) {
      nextErrors.days = "Days must be greater than 0.";
    }
    if (!form.travel_style.trim()) {
      nextErrors.travel_style = "Travel style is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Please fix the highlighted fields and try again.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const data = await generateTrip({
        destination: form.destination,
        budget: Number(form.budget),
        days: Number(form.days),
        travel_style: form.travel_style,
      });

      setStatus("success");
      setMessage(`Trip created successfully for ${data.destination || form.destination}.`);
      router.push("/trips");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while connecting to the server. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-sky-100 bg-white/80 px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              KelanaAI
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Plan your trip with AI
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Fill in your travel details and generate a markdown itinerary.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex w-fit items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              Login
            </Link>
            <Link
              href="/trips"
              className="inline-flex w-fit items-center justify-center rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              Trip History
            </Link>
          </div>
        </header>

        <section className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Trip Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                The API will generate and save your AI recommendation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Destination
                </label>
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.destination
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.destination ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.destination}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Budget
                </label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.budget
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.budget ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.budget}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Days
                </label>
                <input
                  type="number"
                  name="days"
                  value={form.days}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.days
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.days ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.days}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Travel Style
                </label>
                <input
                  name="travel_style"
                  value={form.travel_style}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.travel_style
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.travel_style ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.travel_style}</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Generating..." : "Generate AI Trip"}
            </button>

            {message ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  status === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {message}
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}

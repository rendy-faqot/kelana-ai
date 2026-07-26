"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { getProfile, type Profile } from "@/services/authService";

type Status = "loading" | "success" | "error";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Unable to load profile."
        );

        if (error instanceof Error && error.message.includes("validate credentials")) {
          localStorage.removeItem("kelana_token");
          localStorage.removeItem("kelana_token_type");
          router.push("/login");
        }
      }
    }

    loadProfile();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/trips"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <span aria-hidden="true">←</span>
            Back to trips
          </Link>
          <LogoutButton />
        </div>

        <header className="rounded-[2rem] border border-sky-100 bg-white/80 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            KelanaAI
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Profile
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account details and saved trip activity.
          </p>
        </header>

        {status === "loading" ? (
          <section className="rounded-[2rem] border border-sky-100 bg-white p-6 text-sm text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            Loading profile...
          </section>
        ) : status === "error" ? (
          <section className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold text-slate-900">
              Profile unavailable
            </h2>
            <p className="mt-2 text-sm text-rose-600">{message}</p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-fit items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              Login
            </Link>
          </section>
        ) : profile ? (
          <section className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h2 className="text-2xl font-semibold text-slate-900">
                {profile.name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{profile.email}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-medium text-slate-500">User ID</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {profile.id}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="mt-2 truncate text-base font-semibold text-slate-900">
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-sky-100 bg-sky-600 p-6 text-white shadow-[0_18px_50px_rgba(2,132,199,0.18)]">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-100">
                Trips
              </p>
              <p className="mt-4 text-5xl font-semibold">{profile.total_trips}</p>
              <p className="mt-3 text-sm text-sky-100">
                Total generated trip{profile.total_trips === 1 ? "" : "s"}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

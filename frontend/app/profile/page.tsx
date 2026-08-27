"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type MeResponse } from "@/services/authService";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    getMe(token)
      .then(setUser)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      });
  }, [router]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 bg-[var(--background)]">
        <div className="w-full max-w-lg rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-4 border-[#e3f0fd] border-t-[#2196F3] animate-spin" />
      </main>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 bg-[var(--background)]">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-16 h-16 rounded-full bg-[#2196F3] flex items-center justify-center text-white text-xl font-bold select-none">
            {initials}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {user.name}
            </h1>
            <p className="text-sm text-gray-400">Member since {joinedDate}</p>
          </div>
        </div>

        {/* Info cards */}
        <div className="rounded-2xl bg-[#f0f4f8] divide-y divide-gray-200 shadow-sm overflow-hidden">
          <Row label="Email" value={user.email} />
          <Row label="Trips generated" value={String(user.total_trips)} />
        </div>

      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-xs font-bold uppercase tracking-widest text-[#2196F3]">
        {label}
      </span>
      <span className="text-sm text-[var(--foreground)]">{value}</span>
    </div>
  );
}

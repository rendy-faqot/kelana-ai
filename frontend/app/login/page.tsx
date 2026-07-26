"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { login } from "@/services/authService";

type Status = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    }
    if (!form.password) {
      nextErrors.password = "Password is required.";
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
      setMessage("Please enter your email and password.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const data = await login({
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("kelana_token", data.access_token);
      localStorage.setItem("kelana_token_type", data.token_type);
      setStatus("success");
      setMessage("Login successful.");
      router.push("/trips");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            KelanaAI
          </p>
          <div>
            <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">
              Welcome back
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Sign in to continue planning trips and reviewing your saved AI itineraries.
            </p>
          </div>
          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            {["Plan", "Save", "Review"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
              <p className="mt-1 text-sm text-slate-500">
                Use the account you registered with KelanaAI.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.email
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.email ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:bg-white ${
                    errors.password
                      ? "border-rose-300 bg-rose-50"
                      : "border-sky-200 bg-sky-50 focus:border-sky-500"
                  }`}
                />
                {errors.password ? (
                  <p className="mt-1 text-sm text-rose-600">{errors.password}</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Signing in..." : "Sign in"}
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

            <div className="mt-5 text-center text-sm text-slate-500">
              New here?{" "}
              <Link className="font-semibold text-sky-700 hover:text-sky-800" href="/">
                Start planning
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

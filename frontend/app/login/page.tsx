"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/services/authService";

type Mode = "login" | "register";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(form: FormState, mode: Mode): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === "register") {
    if (!form.name.trim()) {
      errors.name = "Name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (mode === "register") {
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear the field error as the user types
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validate(form, mode);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      if (mode === "login") {
        const { access_token } = await login(form.email, form.password);
        localStorage.setItem("access_token", access_token);
        router.push("/trips");
      } else {
        await register(form.name, form.email, form.password);
        const { access_token } = await login(form.email, form.password);
        localStorage.setItem("access_token", access_token);
        router.push("/trips");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 bg-[var(--background)]">
      {/* Header */}
      <div className="mb-8 text-center flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          {mode === "login" ? (
            <>Welcome <span className="text-[#2196F3]">back</span></>
          ) : (
            <>Create an <span className="text-[#2196F3]">account</span></>
          )}
        </h2>
        <p className="text-sm text-gray-400">
          {mode === "login"
            ? "Sign in to access your trips."
            : "Start planning your next adventure."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-lg flex flex-col gap-3"
      >
        {/* Name — register only */}
        {mode === "register" && (
          <div className="flex flex-col gap-1">
            <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
              <label
                htmlFor="name"
                className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Jane Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-red-500 px-1">{fieldErrors.name}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1">
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-500 px-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-500 px-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password — register only */}
        {mode === "register" && (
          <div className="flex flex-col gap-1">
            <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 flex flex-col gap-1 shadow-sm">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold uppercase tracking-widest text-[#2196F3]"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-500 px-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-2xl bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#1565C0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide py-4 transition-colors duration-150 shadow-sm cursor-pointer"
        >
          {pending
            ? mode === "login"
              ? "Signing in…"
              : "Creating account…"
            : mode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>

        {/* Toggle mode */}
        <p className="text-center text-sm text-gray-400 mt-1">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-[#2196F3] font-medium hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-[#2196F3] font-medium hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </form>
    </main>
  );
}

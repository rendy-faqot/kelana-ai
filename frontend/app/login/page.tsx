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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setShowPassword(false);
    setShowConfirm(false);
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
            <>Your next adventure <span className="text-[#2196F3]">awaits.</span></>
          ) : (
            <>The world is yours to <span className="text-[#2196F3]">explore.</span></>
          )}
        </h2>
        <p className="text-sm text-gray-400">
          {mode === "login"
            ? "Sign in and pick up where you left off."
            : "Create an account to start planning."}
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
            <div className="flex items-center gap-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="flex-1 bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-gray-400 hover:text-[#2196F3] transition-colors duration-150 cursor-pointer"
              >
                {showPassword ? (
                  // Eye-off
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path d="M2.22 2.22a.75.75 0 0 0 0 1.06l1.56 1.56C2.27 6.18 1 8.32 1 12c0 5 4.48 9 10 9a11.1 11.1 0 0 0 6.16-1.84l1.62 1.62a.75.75 0 1 0 1.06-1.06l-18-18a.75.75 0 0 0-1.06 0ZM12 19c-4.41 0-8-3.36-8-7 0-2.48.97-4.35 2.54-5.69L8.3 8.07A5 5 0 0 0 12 17a4.98 4.98 0 0 0 3.47-1.41l1.28 1.28A9.58 9.58 0 0 1 12 19Zm7.46-3.27-1.43-1.43A7.8 7.8 0 0 0 20 12c0-3.64-3.59-7-8-7a9.5 9.5 0 0 0-2.85.44L7.62 3.91A10.9 10.9 0 0 1 12 3c5.52 0 10 4 10 9a9.84 9.84 0 0 1-2.54 6.73ZM12 7a5 5 0 0 1 4.47 7.24l-6.7-6.7A4.97 4.97 0 0 1 12 7Z"/>
                  </svg>
                ) : (
                  // Eye
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
                  </svg>
                )}
              </button>
            </div>
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
              <div className="flex items-center gap-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent text-base text-[var(--foreground)] placeholder-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="text-gray-400 hover:text-[#2196F3] transition-colors duration-150 cursor-pointer"
                >
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path d="M2.22 2.22a.75.75 0 0 0 0 1.06l1.56 1.56C2.27 6.18 1 8.32 1 12c0 5 4.48 9 10 9a11.1 11.1 0 0 0 6.16-1.84l1.62 1.62a.75.75 0 1 0 1.06-1.06l-18-18a.75.75 0 0 0-1.06 0ZM12 19c-4.41 0-8-3.36-8-7 0-2.48.97-4.35 2.54-5.69L8.3 8.07A5 5 0 0 0 12 17a4.98 4.98 0 0 0 3.47-1.41l1.28 1.28A9.58 9.58 0 0 1 12 19Zm7.46-3.27-1.43-1.43A7.8 7.8 0 0 0 20 12c0-3.64-3.59-7-8-7a9.5 9.5 0 0 0-2.85.44L7.62 3.91A10.9 10.9 0 0 1 12 3c5.52 0 10 4 10 9a9.84 9.84 0 0 1-2.54 6.73ZM12 7a5 5 0 0 1 4.47 7.24l-6.7-6.7A4.97 4.97 0 0 1 12 7Z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
                    </svg>
                  )}
                </button>
              </div>
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

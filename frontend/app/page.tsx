'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Status = 'idle' | 'loading' | 'success' | 'error';

type TripResponse = {
  id?: number;
  destination?: string;
  days?: number;
  budget?: number;
  category?: string;
  daily_budget?: number;
  ai_recommendation?: string | null;
};

export default function Home() {
  const [form, setForm] = useState({
    destination: '',
    budget: '',
    days: '',
    travel_style: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.destination.trim()) {
      nextErrors.destination = 'Destination is required.';
    }
    if (!form.budget) {
      nextErrors.budget = 'Budget is required.';
    } else if (Number(form.budget) <= 0) {
      nextErrors.budget = 'Budget must be greater than 0.';
    }
    if (!form.days) {
      nextErrors.days = 'Days is required.';
    } else if (Number(form.days) <= 0) {
      nextErrors.days = 'Days must be greater than 0.';
    }
    if (!form.travel_style.trim()) {
      nextErrors.travel_style = 'Travel style is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setStatus('error');
      setMessage('Please fix the highlighted fields and try again.');
      return;
    }

    setStatus('loading');
    setMessage('');
    setTrip(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/trips`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination: form.destination,
            budget: Number(form.budget),
            days: Number(form.days),
            travel_style: form.travel_style,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Unable to generate your trip right now. Please try again.'
        );
      }

      setStatus('success');
      setTrip(data as TripResponse);
      setMessage(`Trip created successfully for ${data.destination || form.destination}.`);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while connecting to the server. Please try again.'
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-8 font-sans text-slate-800">
      <div className="w-full max-w-2xl rounded-3xl border border-sky-100 bg-white p-8 shadow-[0_12px_40px_rgba(2,132,199,0.12)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Kelana AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Plan your trip with AI
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Fill in your travel details and let us generate a trip idea for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-sky-200 bg-sky-50 focus:border-sky-500'
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
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-sky-200 bg-sky-50 focus:border-sky-500'
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
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-sky-200 bg-sky-50 focus:border-sky-500'
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
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-sky-200 bg-sky-50 focus:border-sky-500'
              }`}
            />
            {errors.travel_style ? (
              <p className="mt-1 text-sm text-rose-600">{errors.travel_style}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-full transform items-center justify-center rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'loading' ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    fill="currentColor"
                  />
                </svg>
                Generating...
              </>
            ) : (
              'Generate AI Trip'
            )}
          </button>
        </form>

        {message ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              status === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {message}
          </div>
        ) : null}

        {trip ? (
          <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Trip Details</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <span className="font-medium">Destination:</span> {trip.destination}
              </li>
              <li>
                <span className="font-medium">Days:</span> {trip.days}
              </li>
              <li>
                <span className="font-medium">Budget:</span> {trip.budget}
              </li>
              <li>
                <span className="font-medium">Category:</span> {trip.category}
              </li>
              <li>
                <span className="font-medium">Daily Budget:</span> {trip.daily_budget}
              </li>
            </ul>
            {trip.ai_recommendation ? (
              <section className="mt-5 rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">
                  AI Recommendation
                </h3>
                <div className="mt-3 text-sm leading-6 text-slate-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h4 className="mb-3 mt-4 text-lg font-semibold text-slate-950 first:mt-0">
                          {children}
                        </h4>
                      ),
                      h2: ({ children }) => (
                        <h4 className="mb-3 mt-4 text-base font-semibold text-slate-950 first:mt-0">
                          {children}
                        </h4>
                      ),
                      h3: ({ children }) => (
                        <h4 className="mb-2 mt-3 text-sm font-semibold text-slate-950 first:mt-0">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-900">{children}</strong>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="mb-3 border-l-4 border-sky-200 pl-3 italic text-slate-600 last:mb-0">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-slate-900">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-slate-100 last:mb-0">
                          {children}
                        </pre>
                      ),
                      table: ({ children }) => (
                        <div className="mb-3 overflow-x-auto last:mb-0">
                          <table className="min-w-full border-collapse text-left">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-200 px-3 py-2">{children}</td>
                      ),
                    }}
                  >
                    {trip.ai_recommendation}
                  </ReactMarkdown>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

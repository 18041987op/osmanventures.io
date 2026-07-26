"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/hq/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(payload.error || "Unable to sign in.");
        return;
      }

      window.location.assign(payload.redirectTo || "/hq");
    } catch {
      setError("Unable to reach the secure login service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="hq-email" className="text-sm font-medium text-slate-200">
          Authorized email
        </label>
        <input
          id="hq-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="hq-password" className="text-sm font-medium text-slate-200">
          Password
        </label>
        <input
          id="hq-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
          placeholder="••••••••••••"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!configured ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
          Secure access has been added to the code, but the required Vercel and
          Supabase environment variables have not been configured yet.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!configured || submitting}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {submitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <LockKeyhole className="h-4 w-4" />
        )}
        Enter command HQ
        {!submitting ? (
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        ) : null}
      </button>

      <p className="text-center text-xs leading-5 text-slate-500">
        No public registration. Access is created and revoked by the owner.
      </p>
    </form>
  );
}

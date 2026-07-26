"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

export default function OwnerSetupForm({ configured }: { configured: boolean }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/hq/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, activationCode }),
      });
      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(payload.error || "Unable to activate the owner account.");
        return;
      }

      window.location.assign(payload.redirectTo || "/hq");
    } catch {
      setError("Unable to reach the secure activation service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="owner-name" className="text-sm font-medium text-slate-200">
          Full name
        </label>
        <input
          id="owner-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
          placeholder="Osman Perez"
        />
      </div>

      <div>
        <label htmlFor="owner-email" className="text-sm font-medium text-slate-200">
          Owner email
        </label>
        <input
          id="owner-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
          placeholder="osman@osmanventures.io"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="owner-password" className="text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="owner-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
            placeholder="12+ characters"
          />
        </div>
        <div>
          <label htmlFor="owner-confirm" className="text-sm font-medium text-slate-200">
            Confirm password
          </label>
          <input
            id="owner-confirm"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
            placeholder="Repeat password"
          />
        </div>
      </div>

      <div>
        <label htmlFor="activation-code" className="text-sm font-medium text-slate-200">
          One-time activation key
        </label>
        <input
          id="activation-code"
          type="password"
          value={activationCode}
          onChange={(event) => setActivationCode(event.target.value)}
          autoComplete="off"
          required
          className="mt-2 w-full rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10"
          placeholder="Installation key"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          This is used only to prevent someone else from claiming the first owner
          account. It is not your future login password.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-xs leading-5 text-emerald-100/80 sm:grid-cols-2">
        <span className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Owner role created
        </span>
        <span className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> All companies assigned
        </span>
        <span className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Activation closes permanently
        </span>
        <span className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Audit entry recorded
        </span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!configured ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
          The UI is ready, but the secure Supabase and Vercel variables still need
          to be connected before activation can run.
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
          <ShieldCheck className="h-4 w-4" />
        )}
        Activate owner account
        {!submitting ? (
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        ) : null}
      </button>

      <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
        <KeyRound className="h-3.5 w-3.5" /> This screen disappears after the first
        owner is created.
      </p>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AcceptInvitationForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/hq/access/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(data.error || "Unable to accept invitation.");
      window.location.assign(data.redirectTo || "/hq/my-work");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to accept invitation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-200">Create password</span>
        <input type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400/50" placeholder="12+ characters" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-200">Confirm password</span>
        <input type="password" required minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-400/50" placeholder="Repeat password" />
      </label>
      <div className="flex gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-xs leading-5 text-emerald-100/80"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>The invitation can be used only once. Your password is sent directly to the secure server and is never shown to the inviter.</span></div>
      {error ? <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      <button disabled={saving} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Activate HQ access {!saving ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /> : null}
      </button>
    </form>
  );
}

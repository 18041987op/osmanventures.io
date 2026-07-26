"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, Smartphone } from "lucide-react";
import type { MfaSecurityStatus } from "@/lib/hq/mfa-server";

type EnrollmentData = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

async function mfaAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/security/mfa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as EnrollmentData & { error?: string; ok?: boolean };
  if (!response.ok) throw new Error(data.error || "Unable to configure MFA.");
  return data;
}

export default function MfaEnrollment({ status }: { status: MfaSecurityStatus }) {
  const verified = status.factors.some((factor) => factor.status === "verified");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  async function start(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await mfaAction({ action: "start", password });
      setEnrollment(data);
      setPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start MFA enrollment.");
    } finally {
      setSaving(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await mfaAction({ action: "verify", code });
      setCompleted(true);
      setEnrollment(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to verify MFA.");
    } finally {
      setSaving(false);
    }
  }

  if (verified || completed) {
    return (
      <section className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/[0.045] p-6 sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"><CheckCircle2 className="h-7 w-7" /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Authenticator active</p>
        <h2 className="mt-2 text-2xl font-semibold">Multi-factor authentication is enabled</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Future password logins require a current six-digit code from your authenticator app before the HQ session is issued.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(status.factors.filter((factor) => factor.status === "verified")).map((factor) => <div key={factor.id} className="rounded-2xl border border-white/8 bg-black/10 p-4"><p className="text-sm font-medium">{factor.friendlyName || "TOTP authenticator"}</p><p className="mt-1 text-xs text-slate-600">Verified factor · created {new Date(factor.createdAt).toLocaleString()}</p></div>)}
          {completed && !verified ? <div className="rounded-2xl border border-white/8 bg-black/10 p-4"><p className="text-sm font-medium">Osman Ventures HQ</p><p className="mt-1 text-xs text-slate-600">Verified moments ago. Refresh to display factor metadata.</p></div> : null}
        </div>
      </section>
    );
  }

  if (enrollment) {
    return (
      <section className="rounded-[1.75rem] border border-indigo-300/20 bg-[#0c111b] p-6 sm:p-8">
        <div className="flex items-center gap-3"><Smartphone className="h-6 w-6 text-indigo-200" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Step 2 of 2</p><h2 className="mt-1 text-2xl font-semibold">Scan and verify</h2></div></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <div className="rounded-2xl bg-white p-4"><img src={enrollment.qrCode} alt="Authenticator QR code for Osman Ventures HQ" className="mx-auto h-auto w-full" /></div>
          <div>
            <ol className="space-y-3 text-sm leading-6 text-slate-400">
              <li><span className="font-semibold text-slate-200">1.</span> Open Google Authenticator, Microsoft Authenticator, 1Password, Authy, or another TOTP app.</li>
              <li><span className="font-semibold text-slate-200">2.</span> Scan the QR code.</li>
              <li><span className="font-semibold text-slate-200">3.</span> Enter the current six-digit code below.</li>
            </ol>
            <details className="mt-5 rounded-xl border border-white/8 bg-black/10 p-4"><summary className="cursor-pointer text-xs font-medium text-slate-400">Cannot scan? Show manual key</summary><code className="mt-3 block break-all rounded-lg bg-black/20 p-3 text-xs text-amber-200">{enrollment.secret}</code></details>
            <form onSubmit={verify} className="mt-5 space-y-4">
              <label className="block"><span className="text-sm font-medium text-slate-200">Six-digit code</span><input autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" required className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-center text-xl tracking-[0.35em] text-white outline-none focus:border-indigo-400/50" placeholder="000000" /></label>
              {error ? <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
              <button disabled={saving || code.length !== 6} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify and require MFA</button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-300/20 bg-[#0c111b] p-6 sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><KeyRound className="h-7 w-7" /></div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Security action required</p>
      <h2 className="mt-2 text-2xl font-semibold">Protect this account with an authenticator</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Re-enter your current HQ password to create a time-based authenticator factor. MFA is not activated until the QR code is scanned and a valid code is verified.</p>
      <form onSubmit={start} className="mt-6 max-w-lg space-y-4">
        <label className="block"><span className="text-sm font-medium text-slate-200">Current HQ password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none focus:border-amber-300/50" /></label>
        {error ? <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-[#171006] disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />} Create authenticator QR</button>
      </form>
    </section>
  );
}

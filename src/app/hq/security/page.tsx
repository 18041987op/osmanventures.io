import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getMfaSecurityStatus } from "@/lib/hq/mfa-server";
import MfaEnrollment from "./MfaEnrollment";

export default async function SecurityPage() {
  const session = await requireHqSession();
  const status = await getMfaSecurityStatus(session.userId);
  const backPath = await hqAppPath(session.role === "owner" ? "" : "my-work");

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:px-10">
        <header className="border-b border-white/8 pb-6">
          <Link href={backPath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"><ArrowLeft className="h-4 w-4" /> Return to HQ</Link>
          <div className="mt-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-300/10 text-indigo-200"><LockKeyhole className="h-6 w-6" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Account security</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Multi-Factor Authentication</h1></div></div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">MFA combines your password with a rotating code generated on a device you control. Enrollment becomes mandatory for this account only after the factor is successfully verified.</p>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-[#0c111b] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Identity</p><p className="mt-2 text-sm font-medium">{status.fullName}</p><p className="mt-1 text-xs text-slate-600">{status.email}</p></div>
          <div className="rounded-2xl border border-white/8 bg-[#0c111b] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">HQ role</p><p className="mt-2 text-sm font-medium capitalize">{status.role.replaceAll("_", " ")}</p></div>
          <div className="rounded-2xl border border-white/8 bg-[#0c111b] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Security state</p><p className={`mt-2 flex items-center gap-2 text-sm font-medium ${status.mfaRequired ? "text-emerald-200" : "text-amber-200"}`}><ShieldCheck className="h-4 w-4" /> {status.mfaRequired ? "MFA required" : "Password only"}</p></div>
        </section>

        <div className="mt-5"><MfaEnrollment status={status} /></div>
      </div>
    </main>
  );
}

import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getAccessAuditCenter } from "@/lib/hq/access-server";
import AccessManagement from "./AccessManagement";

export default async function AccessAuditPage() {
  const session = await requireHqSession();
  if (session.role !== "owner") {
    return <main className="min-h-screen bg-[#070a11] p-8 text-slate-100">Owner access required.</main>;
  }

  const data = await getAccessAuditCenter(session.userId);
  const executivePath = await hqAppPath();
  const cards = [
    { label: "Active users", value: data.summary.activeUsers, detail: `${data.summary.inactiveUsers} inactive users`, icon: Users, tone: "text-emerald-200 border-emerald-300/15 bg-emerald-300/10" },
    { label: "Pending invitations", value: data.summary.pendingInvitations, detail: "One-time links not yet accepted", icon: KeyRound, tone: "text-indigo-200 border-indigo-300/15 bg-indigo-300/10" },
    { label: "MFA enrolled", value: data.summary.mfaEnrolled, detail: `${data.summary.mfaRequiredNotEnrolled} required but not enrolled`, icon: ShieldCheck, tone: "text-cyan-200 border-cyan-300/15 bg-cyan-300/10" },
    { label: "Audit events", value: data.summary.auditEvents, detail: "Recorded governance changes", icon: ClipboardList, tone: "text-amber-200 border-amber-300/15 bg-amber-300/10" },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="border-b border-white/8 pb-6">
          <Link href={executivePath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"><ArrowLeft className="h-4 w-4" /> Executive command center</Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Identity, permission, and evidence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Access & Audit Center</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">Invite people without sharing passwords, scope them to specific companies, suspend access immediately, review MFA readiness, and preserve a readable history of critical governance actions.</p>
        </header>

        <section className="mt-5 flex gap-3 rounded-[1.75rem] border border-rose-300/15 bg-rose-300/[0.035] p-5 sm:p-6"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" /><div><h2 className="font-semibold">Access rule</h2><p className="mt-1 text-sm leading-6 text-slate-400">No shared accounts. Every person receives an individual identity, the smallest company scope necessary, a reviewable role, and immediate revocation when access is no longer justified.</p></div></section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5"><div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{label}</p><div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></article>)}</div>

        <div className="mt-5"><AccessManagement data={data} /></div>
      </div>
    </main>
  );
}

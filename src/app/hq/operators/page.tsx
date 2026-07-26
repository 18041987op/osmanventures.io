import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Database,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getOperatorCenter } from "@/lib/hq/operator-server";
import OperatorGovernanceBoard from "./OperatorGovernanceBoard";

export default async function OperatorsPage() {
  const session = await requireHqSession();
  const data = await getOperatorCenter(session.userId);
  const executivePath = await hqAppPath();

  const cards = [
    { label: "Company seats", value: data.summary.totalSeats, detail: "One accountable operator seat per company", icon: Building2, tone: "text-indigo-200 border-indigo-300/15 bg-indigo-300/10" },
    { label: "Operators installed", value: data.summary.installed, detail: "Probation or active appointments", icon: UserRoundCheck, tone: "text-emerald-200 border-emerald-300/15 bg-emerald-300/10" },
    { label: "Vacant seats", value: data.summary.vacant, detail: "Osman remains the accountable fallback", icon: Users, tone: "text-amber-200 border-amber-300/15 bg-amber-300/10" },
    { label: "Replacement required", value: data.summary.replacementRequired, detail: `${data.summary.reviewsDue} owner reviews currently due`, icon: AlertTriangle, tone: "text-rose-200 border-rose-300/15 bg-rose-300/10" },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={executivePath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"><ArrowLeft className="h-4 w-4" /> Executive command center</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Portfolio leadership system</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Operator Governance</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">Define the result, mandate, authority, appointment, risk, review cadence, and owner decision for every company operator. RunTech Hiring stores candidate workflows; HQ stores only governance references and the final owner judgment.</p>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/60">Governance source</p><p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-100"><Database className="h-4 w-4" /> Supabase B · audited</p></div>
        </header>

        <section className="mt-5 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><h2 className="font-semibold">Operator rule</h2><p className="mt-1 text-sm leading-6 text-slate-400">Operators receive enough authority to run their company, but they do not receive the right to weaken AutoRx, change banking authority, create debt, transfer capital, appoint executives, or conceal material risk.</p></div></div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5"><div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{label}</p><div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></article>
          ))}
        </div>

        <div className="mt-5"><OperatorGovernanceBoard seats={data.seats} /></div>
      </div>
    </main>
  );
}

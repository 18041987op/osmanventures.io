import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CircleDollarSign,
  Database,
  ShieldCheck,
  Target,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getGovernanceCenter } from "@/lib/hq/governance-server";
import ReservePolicyEditor from "./ReservePolicyEditor";
import CapitalRequestsPanel from "./CapitalRequestsPanel";
import DecisionRegister from "./DecisionRegister";
import RiskRegister from "./RiskRegister";
import ControlRegister from "./ControlRegister";

export default async function GovernanceCenterPage() {
  const session = await requireHqSession();
  const data = await getGovernanceCenter(session.userId);
  const executivePath = await hqAppPath();

  const cards = [
    {
      label: "Pending capital",
      value: String(data.summary.pendingCapitalRequests),
      detail: "Requests awaiting a final owner disposition",
      icon: CircleDollarSign,
      tone: "text-indigo-200 border-indigo-300/15 bg-indigo-300/10",
    },
    {
      label: "Open decisions",
      value: String(data.summary.openDecisions),
      detail: "Proposals not yet approved or rejected",
      icon: Target,
      tone: "text-cyan-200 border-cyan-300/15 bg-cyan-300/10",
    },
    {
      label: "High risks",
      value: String(data.summary.highRisks),
      detail: "Open exposures scoring 15 or more out of 25",
      icon: AlertTriangle,
      tone: "text-rose-200 border-rose-300/15 bg-rose-300/10",
    },
    {
      label: "Control gaps",
      value: String(data.summary.controlGaps),
      detail: "Controls that do not yet have verified execution",
      icon: ShieldCheck,
      tone: "text-amber-200 border-amber-300/15 bg-amber-300/10",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={executivePath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300">
              <ArrowLeft className="h-4 w-4" /> Executive command center
            </Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Portfolio governance</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Capital, Decisions, Risks & Controls</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
              Protect the cash engine, allocate capital by milestone, preserve the reason behind major decisions, expose risks before they become losses, and require evidence that critical controls actually operate.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/60">Data source</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-100"><Database className="h-4 w-4" /> Supabase B · hq schema</p>
          </div>
        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/8 bg-[#0c111b] p-2">
          {[
            ["#reserve", "Reserve policy"],
            ["#capital", "Capital requests"],
            ["#decisions", "Decisions"],
            ["#risks", "Risks"],
            ["#controls", "Controls"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-100">{label}</a>
          ))}
        </nav>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{label}</p>
                <div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 space-y-5">
          <ReservePolicyEditor policy={data.reservePolicy} />
          <CapitalRequestsPanel requests={data.capitalRequests} companies={data.companies} reservePolicy={data.reservePolicy} />
          <DecisionRegister decisions={data.decisions} companies={data.companies} />
          <RiskRegister risks={data.risks} companies={data.companies} />
          <ControlRegister controls={data.controls} companies={data.companies} />
        </div>
      </div>
    </main>
  );
}

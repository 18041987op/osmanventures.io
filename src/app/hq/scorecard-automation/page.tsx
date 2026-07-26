import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getScorecardAutomation } from "@/lib/hq/scorecard-automation-server";
import ScorecardActions from "./ScorecardActions";

const sourceStyles = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  partial: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  not_ready: "border-slate-300/10 bg-white/[0.03] text-slate-500",
  stale: "border-rose-300/20 bg-rose-300/10 text-rose-200",
};

function formatValue(value: number | null, unit: string) {
  if (value === null) return "Not reported";
  if (unit === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "count") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}

export default async function ScorecardAutomationPage() {
  const session = await requireHqSession();
  const data = await getScorecardAutomation(session.userId);
  const executivePath = await hqAppPath();
  const reviewPath = await hqAppPath("companies/autorx/review");

  const cards = [
    { label: "Ready sources", value: data.summary.readySources, detail: "Verified sources with acceptable freshness", icon: CheckCircle2, tone: "text-emerald-200 border-emerald-300/15 bg-emerald-300/10" },
    { label: "Partial sources", value: data.summary.partialSources, detail: "Useful signals with insufficient history or coverage", icon: Clock3, tone: "text-amber-200 border-amber-300/15 bg-amber-300/10" },
    { label: "Not ready", value: data.summary.notReadySources, detail: "Sources that must not be interpreted as zero", icon: CircleDashed, tone: "text-slate-400 border-white/10 bg-white/[0.03]" },
    { label: "Verified results", value: data.summary.verifiedResults, detail: `${data.summary.automatedMetrics} metric rules ready or partial`, icon: Database, tone: "text-indigo-200 border-indigo-300/15 bg-indigo-300/10" },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href={executivePath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"><ArrowLeft className="h-4 w-4" /> Executive command center</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Verified data layer</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Scorecard Automation</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">Synchronize only data whose source, shop, period, cadence, and freshness are understood. Missing coverage appears as not ready—not zero—and partial sources remain visibly labeled.</p>
          </div>
          <ScorecardActions />
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><h2 className="font-semibold">No invented judgments</h2><p className="mt-1 text-sm leading-6 text-slate-400">Automation supplies actual values and source evidence. A metric remains not reported until an approved target exists; the system does not decide that a result is on track merely because a number was imported.</p></div></div>
          </div>
          <Link href={reviewPath} className="group rounded-[1.75rem] border border-indigo-300/15 bg-indigo-300/[0.035] p-5 transition hover:bg-indigo-300/[0.06] sm:p-6"><div className="flex items-center gap-3 text-indigo-200"><Gauge className="h-5 w-5" /><h2 className="font-semibold">Weekly Business Review</h2></div><p className="mt-2 text-sm leading-6 text-slate-400">Targets, explanations, corrective actions, and commitments continue in the operator review workflow.</p><p className="mt-4 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">Open weekly review →</p></Link>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5"><div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{label}</p><div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></article>)}
        </div>

        <section className="mt-5 rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Source audit</p><h2 className="mt-1 text-2xl font-semibold">Coverage and freshness</h2></div><Database className="h-5 w-5 text-indigo-300" /></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.sources.map((source) => (
              <article key={source.id} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-medium">{source.label}</h3><span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${sourceStyles[source.status]}`}>{source.status.replaceAll("_", " ")}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{source.notes}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-slate-600">Rows</p><p className="mt-1 font-medium">{source.rowCount}</p></div><div className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-slate-600">Freshness</p><p className="mt-1 font-medium">{source.freshnessDays === null ? "Unknown" : `${source.freshnessDays} days`}</p></div></div>
                <p className="mt-3 break-all text-[10px] text-slate-700">{source.sourceTable || "Source mapping pending"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Latest synchronized results</p><h2 className="mt-1 text-2xl font-semibold">Actuals with source evidence</h2></div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
            <div className="hidden grid-cols-[1.2fr_.75fr_.7fr_.7fr] gap-4 bg-white/[0.025] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 md:grid"><span>Metric</span><span>Period</span><span>Actual</span><span>Quality</span></div>
            {data.latestResults.map((result) => (
              <div key={result.id} className="grid gap-3 border-t border-white/8 px-4 py-4 first:border-t-0 md:grid-cols-[1.2fr_.75fr_.7fr_.7fr] md:items-center">
                <div><h3 className="text-sm font-medium">{result.metricName}</h3><p className="mt-1 break-all text-[10px] text-slate-700">{result.sourceReference}</p></div>
                <p className="text-xs text-slate-400">{result.periodStart}<br />{result.periodEnd}</p>
                <p className="text-sm font-semibold">{formatValue(result.actual, result.unit)}</p>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${result.dataQuality === "verified" ? sourceStyles.ready : sourceStyles.partial}`}>{result.dataQuality}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Automation map</p><h2 className="mt-1 text-2xl font-semibold">Metric rules</h2></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.rules.map((rule) => <article key={rule.id} className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-medium">{rule.metricName}</h3><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${rule.status === "ready" ? sourceStyles.ready : rule.status === "partial" ? sourceStyles.partial : sourceStyles.not_ready}`}>{rule.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{rule.notes}</p><div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.1em] text-slate-600"><span className="rounded-full border border-white/8 px-2 py-1">{rule.sourceCadence}</span><span className="rounded-full border border-white/8 px-2 py-1">{rule.lastSyncCount} rows</span></div></article>)}
          </div>
        </section>

        {data.sources.some((source) => source.status === "not_ready" || source.status === "stale") ? <section className="mt-5 flex gap-3 rounded-[1.75rem] border border-rose-300/15 bg-rose-300/[0.035] p-5 sm:p-6"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" /><div><h2 className="font-semibold">Remaining integration gaps</h2><p className="mt-1 text-sm leading-6 text-slate-400">Tekmetric operating results, service-advisor performance, stopped vehicles, comeback cost, and parts leakage remain outside automation until their AutoRx feeds are verified.</p></div></section> : null}
      </div>
    </main>
  );
}

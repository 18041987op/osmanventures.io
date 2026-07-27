import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getOwnerActionCenter } from "@/lib/hq/actions-server";
import ActionCenter from "./ActionCenter";

export default async function OwnerActionsPage() {
  const session = await requireHqSession();
  if (session.role !== "owner") {
    return <main className="min-h-screen bg-[#070a11] p-8 text-slate-100">Owner access required.</main>;
  }

  const data = await getOwnerActionCenter(session.userId);
  const executivePath = await hqAppPath();
  const appRoot = await hqAppPath();
  const cards = [
    {
      label: "Open actions",
      value: data.summary.open,
      detail: `${data.summary.systemOpen} generated from live HQ gaps`,
      icon: ListChecks,
      tone: "border-indigo-300/15 bg-indigo-300/10 text-indigo-200",
    },
    {
      label: "Critical",
      value: data.summary.critical,
      detail: "Highest-priority owner decisions or operating gaps",
      icon: ShieldAlert,
      tone: "border-rose-300/15 bg-rose-300/10 text-rose-200",
    },
    {
      label: "Blocked",
      value: data.summary.blocked,
      detail: "Cannot advance until the stated dependency is resolved",
      icon: AlertTriangle,
      tone: "border-amber-300/15 bg-amber-300/10 text-amber-200",
    },
    {
      label: "Time pressure",
      value: data.summary.overdue + data.summary.dueSoon,
      detail: `${data.summary.overdue} overdue · ${data.summary.dueSoon} due within seven days`,
      icon: CalendarClock,
      tone: "border-cyan-300/15 bg-cyan-300/10 text-cyan-200",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1550px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="border-b border-white/8 pb-6">
          <Link href={executivePath} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300">
            <ArrowLeft className="h-4 w-4" /> Executive command center
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-300/10 text-indigo-200">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Owner execution system</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Action Center</h1>
            </div>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">
            One prioritized queue for the decisions, assignments, dates, evidence, controls, and integrations that still prevent the portfolio from operating with disciplined independence.
          </p>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">{label}</p>
                <div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
              </div>
              <p className="mt-4 text-3xl font-semibold">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 flex gap-3 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/[0.035] p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
          <div>
            <h2 className="font-semibold">Evidence closes the work</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              A system-generated action is not completed by changing its status. It closes only when the linked policy, seat, milestone, control, absence test, or data source actually satisfies its condition.
            </p>
          </div>
        </section>

        <div className="mt-5"><ActionCenter data={data} appRoot={appRoot} /></div>

        <footer className="mt-8 flex items-center gap-2 border-t border-white/8 pt-5 text-xs text-slate-600">
          <CircleDot className="h-3.5 w-3.5" /> {data.summary.systemResolved} system actions resolved · {data.summary.completed} total completed
        </footer>
      </div>
    </main>
  );
}

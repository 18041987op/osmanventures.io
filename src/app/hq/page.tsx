import Link from "next/link";
import Logo from "@/components/Logo";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getExecutiveDashboard } from "@/lib/hq/data-server";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  Database,
  Gauge,
  Landmark,
  LogOut,
  Radar,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navigation: Array<{ icon: LucideIcon; label: string; active?: boolean }> = [
  { icon: Gauge, label: "Executive", active: true },
  { icon: Building2, label: "Companies" },
  { icon: Users, label: "Operators" },
  { icon: CircleDollarSign, label: "Capital" },
  { icon: Target, label: "Decisions" },
  { icon: Radar, label: "Risks" },
  { icon: ShieldCheck, label: "Controls" },
];

const ownerControls = [
  "Bank balances, unusual transactions, and payment authority",
  "Payroll changes, labor-cost trend, and final release",
  "Warranty, refund, comeback, and reputation exposure",
  "Capital transferred from AutoRx to outside ventures",
  "Executive hiring, termination, compensation, and legal exposure",
];

const weeklyPriorities = [
  "Complete the AutoRx GM seat, authority matrix, and scorecard definition.",
  "Assign a next action and due date to every critical Osman dependency.",
  "Define the minimum AutoRx cash reserve before outside capital transfers.",
];

const stageLabels: Record<string, string> = {
  project: "Project",
  operating_unit: "Operating unit",
  managed_company: "Managed company",
  scalable_company: "Scalable company",
  paused: "Paused",
  closed: "Closed",
};

const cashRoleLabels = {
  cash_engine: "Cash engine",
  investment: "Investment",
  asset: "Asset",
};

const cashRoleStyles = {
  cash_engine: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  investment: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
  asset: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
};

export default async function HqPage() {
  const session = await requireHqSession();
  const dashboard = await getExecutiveDashboard(session.userId);
  const transitionPath = await hqAppPath("companies/autorx/transition");
  const absencePath = await hqAppPath("companies/autorx/transition/absence-tests");
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const commandCards = [
    {
      label: "Cash engines",
      value: String(dashboard.summary.cashEngines),
      detail: "AutoRx is currently the protected portfolio cash source",
      icon: Landmark,
      accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/15",
    },
    {
      label: "Operators installed",
      value: String(dashboard.summary.operatorsInstalled),
      detail: "A company operator counts only after an incumbent is assigned",
      icon: Users,
      accent: "text-amber-200 bg-amber-300/10 border-amber-300/15",
    },
    {
      label: "Companies governed",
      value: String(dashboard.summary.companiesGoverned),
      detail: "Active companies registered in the HQ governance layer",
      icon: Building2,
      accent: "text-indigo-200 bg-indigo-400/10 border-indigo-400/15",
    },
    {
      label: "Critical dependencies",
      value: String(dashboard.summary.openCriticalDependencies),
      detail: "Critical AutoRx dependencies not yet tested without Osman",
      icon: AlertTriangle,
      accent: "text-rose-200 bg-rose-400/10 border-rose-400/15",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_75%_0%,rgba(99,102,241,0.10),transparent_28%)]">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/8 bg-[#0a0e17]/95 px-5 py-6 backdrop-blur-xl lg:flex">
            <div className="flex items-center gap-3 px-2">
              <Logo className="h-10 w-10" />
              <div>
                <p className="font-semibold tracking-tight">Osman Ventures</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
                  Command HQ
                </p>
              </div>
            </div>

            <nav className="mt-10 space-y-1.5">
              {navigation.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm ${
                    active
                      ? "border border-indigo-400/15 bg-indigo-500/12 text-indigo-100"
                      : "border border-transparent text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  {!active ? (
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Soon
                    </span>
                  ) : null}
                </div>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4">
                <div className="flex items-center gap-2 text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                    Owner rule
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  No outside project receives capital without a budget, accountable
                  owner, milestone, stop condition, and review date.
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-white/8 px-2 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 text-sm font-semibold text-indigo-200">
                  {session.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.fullName}</p>
                  <p className="truncate text-xs text-slate-600">{session.role}</p>
                </div>
                <form action="/api/hq/auth/logout" method="post">
                  <button
                    type="submit"
                    aria-label="Sign out"
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-white/5 hover:text-slate-300"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <section className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-9 xl:px-12">
            <header className="flex flex-col gap-5 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 lg:hidden">
                  <Logo className="h-8 w-8" />
                  <span className="text-sm font-semibold">Osman Ventures HQ</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                  Executive command center
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Good day, {session.fullName.split(" ")[0]}.
                </h1>
                <p className="mt-1 text-sm text-slate-500">{today}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/70">
                    System status
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-emerald-200">
                    <Database className="h-3.5 w-3.5" /> Live data from B
                  </div>
                </div>
                <form action="/api/hq/auth/logout" method="post" className="lg:hidden">
                  <button
                    type="submit"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </header>

            <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320]">
              <div className="grid lg:grid-cols-[1.4fr_.6fr]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                      Mission 01
                    </span>
                    <span className="text-xs text-slate-600">AutoRx GM transition</span>
                  </div>
                  <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    Replace Osman in AutoRx without weakening the company that
                    finances everything else.
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                    The transition module now stores real gates, management seats,
                    dependencies, actions, due dates, audit history, and controlled
                    owner-absence evidence in Supabase B.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={transitionPath}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Open transition plan <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={absencePath}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]"
                    >
                      Owner absence tests <ShieldCheck className="h-4 w-4" />
                    </Link>
                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300">
                      {dashboard.autorx.metricsDefined} metrics defined
                      <BarChart3 className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center border-t border-white/8 bg-black/10 p-7 lg:border-l lg:border-t-0">
                  <div className="w-full max-w-xs">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                          Transition readiness
                        </p>
                        <p className="mt-2 text-5xl font-semibold tracking-tight">
                          {dashboard.autorx.readiness}%
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-indigo-300" />
                    </div>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${dashboard.autorx.readiness}%` }}
                      />
                    </div>
                    <div className="mt-5 grid gap-3 text-xs">
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="text-slate-600">Transition gates</p>
                        <p className="mt-1 font-medium text-amber-200">
                          {dashboard.autorx.gatesComplete}/{dashboard.autorx.gatesTotal} complete
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="text-slate-600">Dependencies</p>
                        <p className="mt-1 font-medium text-indigo-200">
                          {dashboard.autorx.dependenciesStarted}/{dashboard.autorx.dependenciesTotal} started
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="text-slate-600">Owner absence tests</p>
                        <p className="mt-1 font-medium text-emerald-200">
                          {dashboard.autorx.absenceTestsPassed}/{dashboard.autorx.absenceTestsTotal} passed
                          {dashboard.autorx.absenceTestsActive > 0 ? " · active now" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {commandCards.map(({ label, value, detail, icon: Icon, accent }) => (
                <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {label}
                    </p>
                    <div className={`rounded-xl border p-2 ${accent}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
              <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Portfolio
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Companies under governance</h2>
                  </div>
                  <Building2 className="h-5 w-5 text-indigo-300" />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {dashboard.companies.map((company) => (
                    <article key={company.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">{company.name}</h3>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${cashRoleStyles[company.cashRole]}`}
                        >
                          {cashRoleLabels[company.cashRole]}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        {stageLabels[company.stage] || company.stage}
                      </p>
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        {company.ownerPriority || company.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  This week
                </p>
                <h2 className="mt-1 text-xl font-semibold">Owner priorities</h2>
                <div className="mt-5 space-y-3">
                  {weeklyPriorities.map((priority, index) => (
                    <div key={priority} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-[10px] font-semibold text-indigo-200">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-5 text-slate-400">{priority}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-5 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-200" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/70">
                    Owner-retained controls
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Delegation without loss of control</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ownerControls.map((control) => (
                  <div key={control} className="flex gap-3 rounded-xl border border-amber-300/10 bg-black/10 p-4">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <p className="text-xs leading-5 text-slate-400">{control}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

import {
  companies,
  firstMetrics,
  ownerControls,
  transitionSteps,
} from "@/lib/hq/initial-data";
import { requireHqSession } from "@/lib/hq/auth-server";
import Logo from "@/components/Logo";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Gauge,
  Landmark,
  LogOut,
  Radar,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const healthStyles = {
  protected: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  transition: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  investment: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
  watch: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

const healthLabels = {
  protected: "Protected",
  transition: "Transition",
  investment: "Investment",
  watch: "Watch",
};

const navigation: Array<{ icon: LucideIcon; label: string; active?: boolean }> = [
  { icon: Gauge, label: "Executive", active: true },
  { icon: Building2, label: "Companies" },
  { icon: Users, label: "Operators" },
  { icon: CircleDollarSign, label: "Capital" },
  { icon: Target, label: "Decisions" },
  { icon: Radar, label: "Risks" },
  { icon: ShieldCheck, label: "Controls" },
];

const commandCards = [
  {
    label: "Cash engines",
    value: "1",
    detail: "AutoRx currently funds the portfolio",
    icon: Landmark,
    accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/15",
  },
  {
    label: "Operators installed",
    value: "0",
    detail: "Osman remains the operating bottleneck",
    icon: Users,
    accent: "text-amber-200 bg-amber-300/10 border-amber-300/15",
  },
  {
    label: "Companies governed",
    value: String(companies.length),
    detail: "One accountability system across the group",
    icon: Building2,
    accent: "text-indigo-200 bg-indigo-400/10 border-indigo-400/15",
  },
  {
    label: "Current mission",
    value: "GM",
    detail: "Build and transfer the AutoRx operator seat",
    icon: Target,
    accent: "text-cyan-200 bg-cyan-400/10 border-cyan-400/15",
  },
];

const weeklyPriorities = [
  "Define the AutoRx general manager scorecard and authority limits.",
  "Inventory every recurring decision and approval that still depends on Osman.",
  "Protect a minimum AutoRx cash reserve before funding outside projects.",
];

export default async function HqPage() {
  const session = await requireHqSession();
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

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
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm transition ${
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
                  No outside project receives capital without a budget, owner,
                  milestone, stop condition, and review date.
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-white/8 px-2 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 text-sm font-semibold text-indigo-200">
                  {session.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.fullName}</p>
                  <p className="truncate text-xs text-slate-600">Owner</p>
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
                  Good morning, {session.fullName.split(" ")[0]}.
                </h1>
                <p className="mt-1 text-sm text-slate-500">{today}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/70">
                    System status
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Private session active
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
                    The HQ exists first to protect AutoRx cash flow, install an
                    accountable operator, and preserve direct owner visibility over
                    money, people, quality, and risk.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white">
                      Open transition plan <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300">
                      Review owner controls <ShieldCheck className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center border-t border-white/8 bg-black/10 p-7 lg:border-l lg:border-t-0">
                  <div className="w-full max-w-xs">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                          Transition readiness
                        </p>
                        <p className="mt-2 text-5xl font-semibold tracking-tight">12%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-indigo-300" />
                    </div>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-[12%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="text-slate-600">Seat defined</p>
                        <p className="mt-1 font-medium text-amber-200">In progress</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="text-slate-600">Operator installed</p>
                        <p className="mt-1 font-medium text-slate-400">Not started</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {commandCards.map(({ label, value, detail, icon: Icon, accent }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-white/8 bg-[#0c111b] p-5"
                >
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
                      Portfolio command
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Companies under governance</h2>
                  </div>
                  <button className="hidden items-center gap-2 text-xs font-medium text-indigo-300 sm:inline-flex">
                    Portfolio view <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
                  <div className="hidden grid-cols-[1.15fr_.8fr_.55fr] gap-4 bg-white/[0.025] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 md:grid">
                    <span>Company and operator</span>
                    <span>Owner priority</span>
                    <span>Status</span>
                  </div>
                  {companies.map((company) => (
                    <article
                      key={company.name}
                      className="grid gap-4 border-t border-white/8 px-4 py-4 first:border-t-0 md:grid-cols-[1.15fr_.8fr_.55fr] md:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{company.name}</h3>
                          <span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-slate-500">
                            {company.cashRole}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {company.category} · {company.operator}
                        </p>
                      </div>
                      <p className="text-xs leading-5 text-slate-400">{company.priority}</p>
                      <div className="flex items-center justify-between gap-3 md:justify-start">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${healthStyles[company.health]}`}
                        >
                          {healthLabels[company.health]}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-700" />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-indigo-300/15 bg-indigo-400/10 p-2.5 text-indigo-200">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      This week
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold">Owner priorities</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {weeklyPriorities.map((priority, index) => (
                    <div
                      key={priority}
                      className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-[10px] font-semibold text-indigo-200">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-5 text-slate-400">{priority}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Execution path
                </p>
                <h2 className="mt-1 text-xl font-semibold">AutoRx GM transition</h2>
                <div className="mt-5 space-y-1">
                  {transitionSteps.map((step, index) => (
                    <div key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                      {index < transitionSteps.length - 1 ? (
                        <div className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-white/8" />
                      ) : null}
                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          step.status === "now"
                            ? "border-indigo-300/30 bg-indigo-400/15 text-indigo-200"
                            : "border-white/10 bg-[#0c111b] text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium">{step.title}</h3>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {step.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Owner scorecard
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Metrics awaiting verified data</h2>
                  </div>
                  <span className="rounded-full border border-slate-400/10 bg-white/[0.025] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Not connected
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Definitions and sources must be approved before figures appear here.
                  The HQ will not manufacture performance numbers.
                </p>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {firstMetrics.map((metric) => (
                    <div
                      key={metric}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3 text-xs text-slate-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                      {metric}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-5 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
              <div className="grid gap-6 xl:grid-cols-[.45fr_1fr]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/60">
                    Non-negotiable
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Delegation is not blindness.</h2>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    Osman must stop operating normal transactions while retaining
                    direct visibility over the controls capable of damaging the
                    company.
                  </p>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {ownerControls.map((control) => (
                    <div
                      key={control}
                      className="flex gap-3 rounded-xl border border-amber-300/10 bg-black/10 p-3.5 text-xs leading-5 text-slate-400"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                      <span>{control}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

import {
  companies,
  firstMetrics,
  ownerControls,
  transitionSteps,
} from "@/lib/hq/initial-data";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  KeyRound,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

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

export default function HqPage() {
  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0c111b] px-6 py-8 lg:block">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Osman Ventures
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Command HQ</h1>
            <p className="mt-2 text-sm text-slate-400">
              Govern companies. Protect cash. Build operators.
            </p>
          </div>

          <nav className="space-y-2 text-sm">
            {[
              [Gauge, "Executive"],
              [Building2, "Companies"],
              [Users, "Operators"],
              [CircleDollarSign, "Capital"],
              [Target, "Decisions"],
              [ShieldCheck, "Controls"],
            ].map(([Icon, label], index) => (
              <div
                key={label as string}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  index === 0
                    ? "bg-indigo-500/15 text-indigo-200"
                    : "text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label as string}</span>
              </div>
            ))}
          </nav>

          <div className="mt-12 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Owner rule</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              AutoRx is the cash engine. No outside project receives capital
              without a budget, owner, milestone, and review date.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                Executive command center
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Replace Osman in AutoRx without losing control.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                The first mission of this HQ is not to manage every company. It
                is to protect AutoRx cash flow, install a general manager, and
                create the operating system Osman will use to govern every
                future operator.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              <KeyRound className="h-4 w-4 text-indigo-300" />
              Private access foundation
            </div>
          </header>

          <div className="grid gap-4 py-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Cash engines", "1", "AutoRx currently funds the portfolio"],
              ["Operators installed", "0", "Osman remains the operating bottleneck"],
              ["Companies tracked", String(companies.length), "One governance model across the group"],
              ["Current mission", "GM", "Build and transfer the AutoRx seat"],
            ].map(([label, value, description]) => (
              <article
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
                <p className="mt-2 text-sm leading-5 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-3xl border border-white/10 bg-[#0d131f] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Portfolio
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">Company command</h3>
                </div>
                <span className="text-xs text-slate-500">Foundation view</span>
              </div>

              <div className="mt-5 space-y-3">
                {companies.map((company) => (
                  <article
                    key={company.name}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-indigo-400/20"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{company.name}</h4>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${healthStyles[company.health]}`}
                          >
                            {healthLabels[company.health]}
                          </span>
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
                            {company.cashRole}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {company.category} · {company.operator}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {company.priority}
                        </p>
                      </div>
                      <button className="inline-flex items-center gap-2 self-start text-sm font-medium text-indigo-300">
                        Open company <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                Non-negotiable
              </p>
              <h3 className="mt-1 text-xl font-semibold">Owner visibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Delegation is not blindness. Osman stops operating transactions,
                but keeps direct visibility over the controls that can destroy a
                company.
              </p>
              <div className="mt-5 space-y-3">
                {ownerControls.map((control) => (
                  <div key={control} className="flex gap-3 text-sm text-slate-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <span>{control}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[#0d131f] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                AutoRx GM transition
              </p>
              <h3 className="mt-1 text-xl font-semibold">Initial execution path</h3>
              <div className="mt-5 space-y-4">
                {transitionSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        step.status === "now"
                          ? "border-indigo-300/40 bg-indigo-400/15 text-indigo-200"
                          : "border-white/10 bg-white/[0.03] text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{step.title}</h4>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {step.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0d131f] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                AutoRx scorecard
              </p>
              <h3 className="mt-1 text-xl font-semibold">First metrics to control</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                These are placeholders for the scorecard structure. Real values
                will be connected only after the data source and definitions are
                verified.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {firstMetrics.map((metric) => (
                  <div
                    key={metric}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-300" />
                    {metric}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

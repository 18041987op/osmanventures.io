import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  KeyRound,
  Landmark,
  Network,
  ShieldCheck,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { requireHqSession } from "@/lib/hq/auth-server";
import {
  departmentSeats,
  gmSeat,
  ownerDependencies,
  statusLabels,
  transitionGates,
} from "@/lib/hq/autorx-transition";

const statusStyles = {
  not_started: "border-slate-400/10 bg-white/[0.025] text-slate-500",
  mapping: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  documented: "border-indigo-300/20 bg-indigo-400/10 text-indigo-200",
  delegated: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  tested: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
};

const riskStyles = {
  Critical: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  High: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  Medium: "border-slate-300/15 bg-white/[0.03] text-slate-400",
};

export default async function AutoRxTransitionPage() {
  await requireHqSession();

  const completedGates = transitionGates.filter((gate) => gate.status === "Complete").length;
  const mappedDependencies = ownerDependencies.filter(
    (item) => item.status !== "not_started",
  ).length;

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/hq"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"
            >
              <ArrowLeft className="h-4 w-4" /> Executive command center
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                  AutoRx Center
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  General Manager Transition
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">
                Current operator
              </p>
              <p className="mt-1 text-sm font-medium">Osman</p>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">
                Transition state
              </p>
              <p className="mt-1 text-sm font-medium text-amber-100">Seat definition</p>
            </div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320]">
          <div className="grid xl:grid-cols-[1.4fr_.6fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Primary result of the seat
              </p>
              <h2 className="mt-3 max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {gmSeat.primaryResult}
              </h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {gmSeat.accountableFor.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5 text-sm leading-6 text-slate-300"
                  >
                    <Target className="mt-1 h-4 w-4 shrink-0 text-indigo-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/8 bg-black/10 p-6 sm:p-8 xl:border-l xl:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Owner-retained authority
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                These decisions do not transfer to the GM without a written change
                to the authority matrix.
              </p>
              <div className="mt-5 space-y-3">
                {gmSeat.ownerRetains.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <KeyRound className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Transition gates",
              value: `${completedGates}/${transitionGates.length}`,
              detail: "No gate is complete until evidence is verified",
              icon: UserRoundCheck,
            },
            {
              label: "Owner dependencies",
              value: String(ownerDependencies.length),
              detail: `${mappedDependencies} have begun mapping or documentation`,
              icon: Network,
            },
            {
              label: "Department seats",
              value: String(departmentSeats.length),
              detail: "Each requires one accountable leader",
              icon: Building2,
            },
            {
              label: "Protected cash source",
              value: "AutoRx",
              detail: "Capital leaves only through owner approval",
              icon: Landmark,
            },
          ].map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  {label}
                </p>
                <Icon className="h-4 w-4 text-indigo-300" />
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
          <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-indigo-300/15 bg-indigo-400/10 p-2.5 text-indigo-200">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Five gates
                </p>
                <h2 className="mt-0.5 text-xl font-semibold">Transfer standard</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {transitionGates.map((gate, index) => (
                <div key={gate.gate} className="relative flex gap-4">
                  {index < transitionGates.length - 1 ? (
                    <div className="absolute left-[15px] top-8 h-[calc(100%+0.25rem)] w-px bg-white/8" />
                  ) : null}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0c111b] text-xs font-semibold text-slate-500">
                    {index + 1}
                  </div>
                  <div className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">{gate.gate}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                          gate.status === "In progress"
                            ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            : "border-white/8 bg-white/[0.025] text-slate-600"
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{gate.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Organizational ownership
                </p>
                <h2 className="mt-1 text-xl font-semibold">Department seats</h2>
              </div>
              <span className="text-xs text-slate-600">Assignments are not yet approved</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
              <div className="hidden grid-cols-[.85fr_1.2fr_.7fr] gap-4 bg-white/[0.025] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 md:grid">
                <span>Seat</span>
                <span>Primary result</span>
                <span>Transition</span>
              </div>
              {departmentSeats.map((seat) => (
                <div
                  key={seat.name}
                  className="grid gap-4 border-t border-white/8 px-4 py-4 first:border-t-0 md:grid-cols-[.85fr_1.2fr_.7fr] md:items-center"
                >
                  <div>
                    <h3 className="text-sm font-medium">{seat.name}</h3>
                    <p className="mt-1 text-xs text-slate-600">Current: {seat.currentOwner}</p>
                    <p className="mt-1 text-xs text-indigo-300/70">Target: {seat.targetLeader}</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-400">{seat.primaryResult}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyles[seat.status]}`}
                    >
                      {statusLabels[seat.status]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Owner dependency inventory
              </p>
              <h2 className="mt-1 text-xl font-semibold">What currently stops without Osman</h2>
            </div>
            <button className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-slate-300">
              Add dependency <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {ownerDependencies.map((dependency) => (
              <article
                key={dependency.title}
                className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {dependency.category}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${riskStyles[dependency.risk]}`}
                  >
                    {dependency.risk}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusStyles[dependency.status]}`}
                  >
                    {statusLabels[dependency.status]}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-medium">{dependency.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Target ownership: {dependency.targetSeat}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <div className="flex items-center gap-2 text-amber-200">
                <CircleAlert className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Financial protection
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold">AutoRx remains the protected cash engine.</h2>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Manager delegation cannot include undocumented transfers, hidden
                commitments, uncontrolled payroll changes, or capital allocations to
                other companies.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [BadgeDollarSign, "Cash reserve", "Define the minimum operating reserve before outside funding."],
                [ShieldCheck, "Dual control", "Separate preparation, approval, payment, and reconciliation."],
                [Landmark, "Owner authority", "Debt, banking, and portfolio transfers remain owner decisions."],
              ].map(([Icon, title, text]) => {
                const CardIcon = Icon as typeof BadgeDollarSign;
                return (
                  <div key={title as string} className="rounded-xl border border-amber-300/10 bg-black/10 p-4">
                    <CardIcon className="h-5 w-5 text-amber-200" />
                    <h3 className="mt-3 text-sm font-medium">{title as string}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

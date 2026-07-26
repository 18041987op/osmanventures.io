import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Database,
  KeyRound,
  Landmark,
  Network,
  ShieldCheck,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getAutoRxTransition } from "@/lib/hq/data-server";
import DependencyManager from "./DependencyManager";

const seatStatusStyles = {
  not_started: "border-slate-400/10 bg-white/[0.025] text-slate-500",
  mapping: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  documented: "border-indigo-300/20 bg-indigo-400/10 text-indigo-200",
  delegated: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  tested: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
};

const seatStatusLabels = {
  not_started: "Not started",
  mapping: "Mapping",
  documented: "Documented",
  delegated: "Delegated",
  tested: "Tested",
};

const gateStatusStyles = {
  not_started: "border-white/8 bg-white/[0.025] text-slate-600",
  in_progress: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  complete: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
};

const gateStatusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

const gmAccountabilities = [
  "Sales, gross profit, and operating cash flow",
  "Service-advisor conversion and customer communication",
  "Technician production, quality, and on-time completion",
  "Payroll discipline, staffing, and employee accountability",
  "Warranty, comeback, refund, and reputation exposure",
  "Execution of the approved operating plan and budget",
];

const ownerAuthorityLabels: Record<string, string> = {
  banking: "Bank accounts and banking authority",
  capital_transfers: "Transfers from AutoRx to other ventures",
  debt: "Debt and financing commitments",
  executive_hiring: "Executive hiring and termination",
  routine_operations: "Routine operating decisions",
};

export default async function AutoRxTransitionPage() {
  const session = await requireHqSession();
  const data = await getAutoRxTransition(session.userId);
  const backPath = await hqAppPath();

  const completedGates = data.gates.filter((gate) => gate.status === "complete").length;
  const startedDependencies = data.dependencies.filter(
    (dependency) =>
      dependency.documentationStatus !== "missing" ||
      dependency.delegationStatus !== "not_started",
  ).length;
  const testedDependencies = data.dependencies.filter(
    (dependency) => dependency.delegationStatus === "tested",
  ).length;
  const criticalOpen = data.dependencies.filter(
    (dependency) =>
      dependency.riskLevel === "critical" && dependency.delegationStatus !== "tested",
  ).length;
  const readiness = data.gates.reduce((score, gate) => {
    if (gate.status === "complete") return score + 20;
    if (gate.status === "in_progress") return score + 10;
    return score;
  }, 0);

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={backPath}
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
                  {data.company.name}
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
              <p className="mt-1 text-sm font-medium">
                {data.gmSeat.currentOwner || "Not assigned"}
              </p>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/60">
                Readiness
              </p>
              <p className="mt-1 text-sm font-medium text-amber-100">{readiness}%</p>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/60">
                Data source
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-100">
                <Database className="h-3.5 w-3.5" /> Supabase B
              </p>
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
                {data.gmSeat.primaryResult}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                {data.gmSeat.authoritySummary}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {gmAccountabilities.map((item) => (
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
                Authority matrix
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                These limits are stored with the GM seat and cannot be changed by the
                future operator without owner approval.
              </p>
              <div className="mt-5 space-y-3">
                {Object.entries(data.gmSeat.approvalLimits).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <KeyRound className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    <span>
                      {ownerAuthorityLabels[key] || key}: {value.replaceAll("_", " ")}
                    </span>
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
              value: `${completedGates}/${data.gates.length}`,
              detail: "A gate closes only after evidence is verified",
              icon: UserRoundCheck,
            },
            {
              label: "Owner dependencies",
              value: String(data.dependencies.length),
              detail: `${startedDependencies} started · ${testedDependencies} tested`,
              icon: Network,
            },
            {
              label: "Critical exposure",
              value: String(criticalOpen),
              detail: "Critical dependencies not yet tested",
              icon: AlertTriangle,
            },
            {
              label: "Metrics defined",
              value: String(data.metrics.length),
              detail: "Targets and actual results are the next layer",
              icon: BarChart3,
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
              {data.gates.map((gate, index) => (
                <div key={gate.id} className="relative flex gap-4">
                  {index < data.gates.length - 1 ? (
                    <div className="absolute left-[15px] top-8 h-[calc(100%+0.25rem)] w-px bg-white/8" />
                  ) : null}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      gate.status === "complete"
                        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                        : "border-white/10 bg-[#0c111b] text-slate-500"
                    }`}
                  >
                    {gate.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      gate.position
                    )}
                  </div>
                  <div className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">
                        {gate.position}. {gate.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${gateStatusStyles[gate.status]}`}
                      >
                        {gateStatusLabels[gate.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{gate.outcome}</p>
                    {gate.evidence ? (
                      <p className="mt-2 text-xs leading-5 text-emerald-200/70">
                        Evidence: {gate.evidence}
                      </p>
                    ) : null}
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
                <h2 className="mt-1 text-xl font-semibold">Company and department seats</h2>
              </div>
              <span className="text-xs text-slate-600">
                {data.departmentSeats.filter((seat) => seat.incumbentUserId).length} incumbents installed
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
              <div className="hidden grid-cols-[.85fr_1.2fr_.7fr] gap-4 bg-white/[0.025] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 md:grid">
                <span>Seat</span>
                <span>Primary result</span>
                <span>Transition</span>
              </div>
              {data.departmentSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="grid gap-4 border-t border-white/8 px-4 py-4 first:border-t-0 md:grid-cols-[.85fr_1.2fr_.7fr] md:items-center"
                >
                  <div>
                    <h3 className="text-sm font-medium">{seat.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Current: {seat.currentOwner || "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-indigo-300/70">
                      Seat type: {seat.seatType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-slate-400">{seat.primaryResult}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${seatStatusStyles[seat.transitionStatus]}`}
                    >
                      {seatStatusLabels[seat.transitionStatus]}
                    </span>
                    <span className="text-[10px] text-slate-700">
                      {seat.incumbentUserId ? "Installed" : "Vacant"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5">
          <DependencyManager dependencies={data.dependencies} />
        </div>

        <section className="mt-5 rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Manager scorecard foundation
              </p>
              <h2 className="mt-1 text-xl font-semibold">Verified metric definitions</h2>
            </div>
            <span className="text-xs text-slate-600">
              Targets and weekly results are not yet connected
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.metrics.map((metric) => (
              <article key={metric.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium">{metric.name}</h3>
                  {metric.isOwnerControl ? (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-200" />
                  ) : (
                    <Target className="h-4 w-4 shrink-0 text-indigo-300" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{metric.definition}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                  <span className="rounded-full border border-white/8 px-2 py-1">{metric.unit}</span>
                  <span className="rounded-full border border-white/8 px-2 py-1">{metric.cadence}</span>
                  <span className="rounded-full border border-white/8 px-2 py-1">
                    {metric.sourceSystem || "Source pending"}
                  </span>
                </div>
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
              <h2 className="mt-3 text-xl font-semibold">
                AutoRx remains the protected cash engine.
              </h2>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Manager delegation cannot include undocumented transfers, hidden
                commitments, uncontrolled payroll changes, or capital allocations to
                other companies.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  BadgeDollarSign,
                  "Cash reserve",
                  "Define the minimum operating reserve before outside funding.",
                ],
                [
                  ShieldCheck,
                  "Dual control",
                  "Separate preparation, approval, payment, and reconciliation.",
                ],
                [
                  Landmark,
                  "Owner authority",
                  "Debt, banking, and portfolio transfers remain owner decisions.",
                ],
              ].map(([Icon, title, text]) => {
                const CardIcon = Icon as typeof BadgeDollarSign;
                return (
                  <div
                    key={title as string}
                    className="rounded-xl border border-amber-300/10 bg-black/10 p-4"
                  >
                    <CardIcon className="h-5 w-5 text-amber-200" />
                    <h3 className="mt-3 text-sm font-medium">{title as string}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {text as string}
                    </p>
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

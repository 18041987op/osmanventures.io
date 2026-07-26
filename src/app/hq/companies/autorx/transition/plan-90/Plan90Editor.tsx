"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  LoaderCircle,
  Save,
  ShieldAlert,
  Target,
} from "lucide-react";
import type {
  AutoRxNinetyDayPlan,
  NinetyDayMilestone,
} from "@/lib/hq/data-server";

const planStatusLabels = {
  draft: "Draft template",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

const milestoneStatusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  complete: "Complete",
};

const milestoneStatusStyles = {
  not_started: "border-white/10 bg-white/[0.025] text-slate-500",
  in_progress: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  blocked: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  complete: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
};

const categoryLabels: Record<NinetyDayMilestone["category"], string> = {
  leadership: "Leadership",
  financial: "Financial",
  operations: "Operations",
  people: "People",
  customer: "Customer",
  controls: "Controls",
  owner_independence: "Owner independence",
};

function MilestoneCard({ milestone }: { milestone: NinetyDayMilestone }) {
  const router = useRouter();
  const [status, setStatus] = useState(milestone.status);
  const [dueDate, setDueDate] = useState(milestone.dueDate ?? "");
  const [evidence, setEvidence] = useState(milestone.evidence ?? "");
  const [notes, setNotes] = useState(milestone.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveMilestone() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/hq/autorx/plan-90/milestones/${milestone.id}`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, dueDate: dueDate || null, evidence, notes }),
        },
      );
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Unable to save this milestone.");
        return;
      }

      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Unable to reach the secure plan service.");
    } finally {
      setSaving(false);
    }
  }

  const StatusIcon =
    status === "complete"
      ? CheckCircle2
      : status === "blocked"
        ? ShieldAlert
        : status === "in_progress"
          ? CircleDot
          : Target;

  return (
    <article className="rounded-[1.5rem] border border-white/8 bg-[#0c111b] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-300/15 bg-indigo-400/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
              {categoryLabels[milestone.category]}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${milestoneStatusStyles[status]}`}
            >
              <StatusIcon className="h-3 w-3" />
              {milestoneStatusLabels[status]}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">
            {milestone.objective}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            <span className="font-medium text-slate-300">Success standard:</span>{" "}
            {milestone.successMeasure}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
          Owner: {milestone.ownerRole}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[.7fr_.8fr_1.25fr]">
        <label className="text-xs font-medium text-slate-400">
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as NinetyDayMilestone["status"])
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
          >
            {Object.entries(milestoneStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-400">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
          />
        </label>

        <label className="text-xs font-medium text-slate-400">
          Evidence
          <textarea
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            rows={3}
            placeholder="Report, scorecard, documented process, absence-test result..."
            className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-700 focus:border-indigo-400/40"
          />
        </label>
      </div>

      <label className="mt-4 block text-xs font-medium text-slate-400">
        Owner notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          placeholder="Coaching notes, concerns, decisions, or conditions for approval."
          className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-700 focus:border-indigo-400/40"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-xs ${
            message === "Saved" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={saveMilestone}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save milestone
        </button>
      </div>
    </article>
  );
}

export default function Plan90Editor({ data }: { data: AutoRxNinetyDayPlan }) {
  const router = useRouter();
  const [phase, setPhase] = useState<30 | 60 | 90>(30);
  const [startDate, setStartDate] = useState(data.plan.startDate ?? "");
  const [planStatus, setPlanStatus] = useState(data.plan.status);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState("");

  const phaseMilestones = useMemo(
    () => data.milestones.filter((milestone) => milestone.phase === phase),
    [data.milestones, phase],
  );

  async function savePlan() {
    setSavingPlan(true);
    setPlanMessage("");

    try {
      const response = await fetch("/api/hq/autorx/plan-90", {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, status: planStatus }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPlanMessage(payload.error || "Unable to save the plan settings.");
        return;
      }

      setPlanMessage("Plan settings saved and milestone dates recalculated.");
      router.refresh();
    } catch {
      setPlanMessage("Unable to reach the secure plan service.");
    } finally {
      setSavingPlan(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320] p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Plan control
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Activate the plan when the GM start date is known.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Until then, this remains the approved success template for recruiting,
              selection, compensation, onboarding, and the final transfer of operating
              authority.
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-400">
                GM start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
                />
              </label>
              <label className="text-xs font-medium text-slate-400">
                Plan status
                <select
                  value={planStatus}
                  onChange={(event) =>
                    setPlanStatus(
                      event.target.value as AutoRxNinetyDayPlan["plan"]["status"],
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
                >
                  {Object.entries(planStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={savePlan}
              disabled={savingPlan || !startDate}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {savingPlan ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              Save start date and status
            </button>
            {planMessage ? (
              <p className="mt-3 text-xs leading-5 text-slate-400">{planMessage}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Plan status", planStatusLabels[data.plan.status]],
          ["Completed", `${data.summary.complete}/${data.summary.total}`],
          ["In progress", String(data.summary.inProgress)],
          ["Blocked", String(data.summary.blocked)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          </article>
        ))}
      </div>

      {data.summary.blocked > 0 ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm leading-6 text-rose-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          One or more milestones are blocked. The owner review should identify the
          decision, resource, authority, or personnel issue preventing progress.
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-white/8 bg-[#090e17] p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {([30, 60, 90] as const).map((item) => {
            const completed = data.milestones.filter(
              (milestone) => milestone.phase === item && milestone.status === "complete",
            ).length;
            const total = data.milestones.filter(
              (milestone) => milestone.phase === item,
            ).length;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setPhase(item)}
                className={`rounded-2xl border px-3 py-4 text-left transition ${
                  phase === item
                    ? "border-indigo-300/25 bg-indigo-500/12 text-indigo-100"
                    : "border-white/8 bg-white/[0.02] text-slate-500 hover:bg-white/[0.04]"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Phase
                </p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-xl font-semibold">Day {item}</p>
                  <p className="text-xs">{completed}/{total}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              First {phase} days
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Results that must be demonstrated
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Evidence matters more than activity or intent.
          </p>
        </div>

        <div className="grid gap-4">
          {phaseMilestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </section>
    </div>
  );
}

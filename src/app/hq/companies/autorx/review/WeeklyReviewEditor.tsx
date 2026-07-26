"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import type {
  AutoRxWeeklyReviewData,
  WeeklyMetricResult,
} from "@/lib/hq/data-server";

const statusStyles = {
  on_track: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  watch: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  off_track: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  not_reported: "border-white/8 bg-white/[0.025] text-slate-500",
};

const statusLabels = {
  on_track: "On track",
  watch: "Watch",
  off_track: "Off track",
  not_reported: "Not reported",
};

function MetricEditor({
  metric,
  weekStart,
}: {
  metric: WeeklyMetricResult;
  weekStart: string;
}) {
  const router = useRouter();
  const [target, setTarget] = useState(metric.target?.toString() ?? "");
  const [actual, setActual] = useState(metric.actual?.toString() ?? "");
  const [varianceExplanation, setVarianceExplanation] = useState(
    metric.varianceExplanation ?? "",
  );
  const [correctiveAction, setCorrectiveAction] = useState(
    metric.correctiveAction ?? "",
  );
  const [actionDueDate, setActionDueDate] = useState(
    metric.actionDueDate ?? "",
  );
  const [expanded, setExpanded] = useState(
    metric.status === "off_track" || metric.status === "watch",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveMetric() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/hq/autorx/weekly-review/metrics/${metric.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekStart,
            target,
            actual,
            varianceExplanation,
            correctiveAction,
            actionDueDate: actionDueDate || null,
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Unable to save metric.");
        return;
      }

      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Unable to reach the secure HQ service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{metric.name}</h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusStyles[metric.status]}`}
            >
              {statusLabels[metric.status]}
            </span>
            {metric.isOwnerControl ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-amber-200">
                <ShieldCheck className="h-3 w-3" /> Owner control
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {metric.definition}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-700">
            {metric.unit} · {metric.sourceSystem || "Source pending"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400"
        >
          {expanded ? "Close" : "Enter result"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500">
          Target
          <input
            type="number"
            step="any"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#090e17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
            placeholder="—"
          />
        </label>
        <label className="text-xs text-slate-500">
          Actual
          <input
            type="number"
            step="any"
            value={actual}
            onChange={(event) => setActual(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#090e17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
            placeholder="—"
          />
        </label>
      </div>

      {expanded ? (
        <div className="mt-4 border-t border-white/8 pt-4">
          <label className="block text-xs text-slate-500">
            Variance explanation
            <textarea
              rows={2}
              value={varianceExplanation}
              onChange={(event) => setVarianceExplanation(event.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#090e17] px-3 py-3 text-sm leading-6 text-slate-200 outline-none focus:border-indigo-400/40"
              placeholder="Why did the result differ from target?"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
            <label className="text-xs text-slate-500">
              Corrective action
              <input
                value={correctiveAction}
                onChange={(event) => setCorrectiveAction(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#090e17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
                placeholder="Specific action and owner"
              />
            </label>
            <label className="text-xs text-slate-500">
              Action due
              <input
                type="date"
                value={actionDueDate}
                onChange={(event) => setActionDueDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#090e17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-xs ${message === "Saved" ? "text-emerald-300" : "text-rose-300"}`}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={saveMetric}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:bg-slate-700"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save metric
        </button>
      </div>
    </article>
  );
}

function linesToText(lines: string[] | undefined): string {
  return (lines ?? []).join("\n");
}

function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function WeeklyReviewEditor({
  data,
}: {
  data: AutoRxWeeklyReviewData;
}) {
  const router = useRouter();
  const [wins, setWins] = useState(linesToText(data.review?.wins));
  const [misses, setMisses] = useState(linesToText(data.review?.misses));
  const [criticalIssues, setCriticalIssues] = useState(
    linesToText(data.review?.criticalIssues),
  );
  const [decisionsTaken, setDecisionsTaken] = useState(
    linesToText(data.review?.decisionsTaken),
  );
  const [decisionsRequired, setDecisionsRequired] = useState(
    linesToText(data.review?.decisionsRequired),
  );
  const [nextCommitments, setNextCommitments] = useState(
    linesToText(data.review?.nextCommitments),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveReview(status: "draft" | "submitted") {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/hq/autorx/weekly-review", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: data.weekStart,
          status,
          wins: textToLines(wins),
          misses: textToLines(misses),
          criticalIssues: textToLines(criticalIssues),
          decisionsTaken: textToLines(decisionsTaken),
          decisionsRequired: textToLines(decisionsRequired),
          nextCommitments: textToLines(nextCommitments),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Unable to save the weekly review.");
        return;
      }

      setMessage(status === "submitted" ? "Review submitted" : "Draft saved");
      router.refresh();
    } catch {
      setMessage("Unable to reach the secure HQ service.");
    } finally {
      setSaving(false);
    }
  }

  const reported = data.metrics.filter(
    (metric) => metric.status !== "not_reported",
  ).length;
  const offTrack = data.metrics.filter(
    (metric) => metric.status === "off_track",
  ).length;

  const narrativeFields = [
    ["Wins", wins, setWins, "What worked and should be repeated?"],
    ["Misses", misses, setMisses, "What commitment or target was missed?"],
    [
      "Critical issues",
      criticalIssues,
      setCriticalIssues,
      "What can materially damage cash, people, quality, or customers?",
    ],
    [
      "Decisions taken",
      decisionsTaken,
      setDecisionsTaken,
      "What operating decisions were made this week?",
    ],
    [
      "Owner decisions required",
      decisionsRequired,
      setDecisionsRequired,
      "Which decisions exceed the GM authority matrix?",
    ],
    [
      "Next commitments",
      nextCommitments,
      setNextCommitments,
      "One commitment per line, with a clear expected result.",
    ],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Weekly scorecard
            </p>
            <h2 className="mt-1 text-xl font-semibold">Targets and actual results</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Status is calculated automatically from the metric direction and the
              target-to-actual variance.
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="rounded-xl border border-indigo-300/15 bg-indigo-300/[0.05] px-3 py-2 text-indigo-200">
              {reported}/{data.metrics.length} reported
            </div>
            <div className="rounded-xl border border-rose-300/15 bg-rose-300/[0.05] px-3 py-2 text-rose-200">
              {offTrack} off track
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {data.metrics.map((metric) => (
            <MetricEditor
              key={`${metric.id}-${metric.updatedAt ?? "new"}`}
              metric={metric}
              weekStart={data.weekStart}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Operator review
            </p>
            <h2 className="mt-1 text-xl font-semibold">Outcome narrative</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use one item per line. Report outcomes, causes, actions, and decisions—not
              a list of activities.
            </p>
          </div>
          <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            {data.review?.status || "Not started"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {narrativeFields.map(([label, value, setter, placeholder]) => (
            <label key={label} className="text-xs text-slate-500">
              {label}
              <textarea
                rows={5}
                value={value}
                onChange={(event) => setter(event.target.value)}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#090e17] px-4 py-3 text-sm leading-6 text-slate-200 outline-none focus:border-indigo-400/40"
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>

        {offTrack > 0 ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-xs leading-5 text-rose-100/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            The review has off-track metrics. Each should include a variance explanation
            and a corrective action before submission.
          </div>
        ) : reported === data.metrics.length && data.metrics.length > 0 ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-xs leading-5 text-emerald-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            All defined metrics have been reported for this week.
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
          <p
            className={`text-xs ${message.includes("saved") || message.includes("submitted") ? "text-emerald-300" : "text-rose-300"}`}
          >
            {message}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => saveReview("draft")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 disabled:text-slate-600"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => saveReview("submitted")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:bg-slate-700"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit weekly review
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

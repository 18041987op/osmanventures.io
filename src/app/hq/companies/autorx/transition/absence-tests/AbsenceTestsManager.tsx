"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleX,
  FileCheck2,
  LoaderCircle,
  MessageSquareWarning,
  Play,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type {
  AbsenceTestEvent,
  AbsenceTestTemplate,
  AutoRxAbsenceTestsData,
} from "@/lib/hq/data-server";

const statusLabels = {
  scheduled: "Scheduled",
  active: "Active",
  passed: "Passed",
  failed: "Failed",
  cancelled: "Cancelled",
} as const;

const statusStyles = {
  scheduled: "border-indigo-300/20 bg-indigo-400/10 text-indigo-200",
  active: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  passed: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  failed: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  cancelled: "border-white/10 bg-white/[0.03] text-slate-500",
} as const;

const eventKindLabels: Record<AbsenceTestEvent["eventKind"], string> = {
  owner_contact: "Owner contact",
  owner_intervention: "Owner intervention",
  emergency_intervention: "Emergency intervention",
  critical_incident: "Critical incident",
  operating_exception: "Operating exception",
  evidence: "Evidence",
};

function localToday(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

async function readPayload(response: Response): Promise<{ error?: string }> {
  try {
    return (await response.json()) as { error?: string };
  } catch {
    return {};
  }
}

function CriteriaBlock({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "success" | "danger" | "evidence";
}) {
  const styles = {
    neutral: "border-white/8 bg-white/[0.02] text-slate-400",
    success: "border-emerald-300/10 bg-emerald-300/[0.035] text-emerald-100/70",
    danger: "border-rose-300/10 bg-rose-300/[0.035] text-rose-100/70",
    evidence: "border-indigo-300/10 bg-indigo-300/[0.035] text-indigo-100/70",
  };

  return (
    <details className={`rounded-2xl border p-4 ${styles[tone]}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em]">
        {title}
        <ChevronDown className="h-4 w-4" />
      </summary>
      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item} className="flex gap-2.5 text-xs leading-5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function EventTimeline({ events }: { events: AbsenceTestEvent[] }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-slate-600">
        No contacts, interventions, incidents, or evidence have been logged.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-white/8 bg-black/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              {eventKindLabels[event.eventKind]}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {event.severity}
            </span>
            {event.causedFailure ? (
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-rose-200">
                Failure condition
              </span>
            ) : null}
          </div>
          <h4 className="mt-3 text-sm font-medium">{event.title}</h4>
          {event.details ? <p className="mt-2 text-xs leading-5 text-slate-500">{event.details}</p> : null}
          {event.businessImpact ? (
            <p className="mt-2 text-xs leading-5 text-amber-100/65">
              Impact: {event.businessImpact}
            </p>
          ) : null}
          {event.resolution ? (
            <p className="mt-2 text-xs leading-5 text-emerald-100/65">
              Resolution: {event.resolution}
            </p>
          ) : null}
          <p className="mt-3 text-[10px] text-slate-700">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(event.occurredAt))}
          </p>
        </article>
      ))}
    </div>
  );
}

function TestCard({ test }: { test: AbsenceTestTemplate }) {
  const router = useRouter();
  const run = test.latestRun;
  const [startDate, setStartDate] = useState("");
  const [summary, setSummary] = useState(run?.summary ?? "");
  const [decision, setDecision] = useState(run?.decision ?? "");
  const [eventKind, setEventKind] = useState<AbsenceTestEvent["eventKind"]>("operating_exception");
  const [severity, setSeverity] = useState<AbsenceTestEvent["severity"]>("medium");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [businessImpact, setBusinessImpact] = useState("");
  const [resolution, setResolution] = useState("");
  const [causedFailure, setCausedFailure] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canSchedule = !run || ["passed", "failed", "cancelled"].includes(run.status);

  async function scheduleTest(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy("schedule");
    try {
      const response = await fetch("/api/hq/autorx/absence-tests/runs", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: test.id, startDate }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || "Unable to schedule the test.");
      setStartDate("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to schedule the test.");
    } finally {
      setBusy("");
    }
  }

  async function updateRun(status: "active" | "passed" | "failed" | "cancelled") {
    if (!run) return;
    setError("");
    setBusy(status);
    try {
      const response = await fetch(`/api/hq/autorx/absence-tests/runs/${run.id}`, {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, summary, decision }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || "Unable to update the test.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the test.");
    } finally {
      setBusy("");
    }
  }

  async function logEvent(event: FormEvent) {
    event.preventDefault();
    if (!run) return;
    setError("");
    setBusy("event");
    try {
      const response = await fetch(`/api/hq/autorx/absence-tests/runs/${run.id}/events`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventKind,
          severity,
          title: eventTitle,
          details: eventDetails,
          businessImpact,
          resolution,
          causedFailure,
        }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || "Unable to log the event.");
      setEventTitle("");
      setEventDetails("");
      setBusinessImpact("");
      setResolution("");
      setCausedFailure(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to log the event.");
    } finally {
      setBusy("");
    }
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#0c111b]">
      <div className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-indigo-300/15 bg-indigo-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
                {test.durationDays} {test.durationDays === 1 ? "day" : "days"}
              </span>
              {run ? (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusStyles[run.status]}`}>
                  {statusLabels[run.status]}
                </span>
              ) : (
                <span className="rounded-full border border-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Not scheduled
                </span>
              )}
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{test.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">{test.objective}</p>
          </div>

          {run ? (
            <div className="grid min-w-[260px] grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-slate-600">Planned start</p>
                <p className="mt-1 font-medium text-slate-300">{formatDate(run.plannedStart)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-slate-600">Planned end</p>
                <p className="mt-1 font-medium text-slate-300">{formatDate(run.plannedEnd)}</p>
              </div>
              <div className="rounded-xl border border-rose-300/10 bg-rose-300/[0.025] p-3">
                <p className="text-slate-600">Owner interventions</p>
                <p className="mt-1 font-medium text-rose-200">{run.ownerInterventions}</p>
              </div>
              <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.025] p-3">
                <p className="text-slate-600">Emergencies</p>
                <p className="mt-1 font-medium text-amber-200">{run.emergencyInterventions}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        <CriteriaBlock title="Owner rules" items={test.ownerRules} />
        <CriteriaBlock title="Pass criteria" items={test.passCriteria} tone="success" />
        <CriteriaBlock title="Failure conditions" items={test.failConditions} tone="danger" />
        <CriteriaBlock title="Required evidence" items={test.requiredEvidence} tone="evidence" />
      </div>

      <div className="border-t border-white/8 p-5 sm:p-6">
        {canSchedule ? (
          <form onSubmit={scheduleTest} className="flex flex-col gap-3 rounded-2xl border border-indigo-300/10 bg-indigo-300/[0.035] p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300" htmlFor={`start-${test.id}`}>
                {run ? "Schedule a new attempt" : "Schedule this test"}
              </label>
              <input
                id={`start-${test.id}`}
                type="date"
                min={localToday()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none focus:border-indigo-300/40"
              />
            </div>
            <button
              type="submit"
              disabled={busy !== ""}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {busy === "schedule" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : run ? <RotateCcw className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
              {run ? "Schedule retry" : "Schedule test"}
            </button>
          </form>
        ) : null}

        {run?.status === "scheduled" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/12 bg-amber-300/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-100">Ready to begin</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Starting the test activates incident logging and the no-intervention rules.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateRun("cancelled")}
                disabled={busy !== ""}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRun("active")}
                disabled={busy !== ""}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                {busy === "active" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start test
              </button>
            </div>
          </div>
        ) : null}

        {run?.status === "active" ? (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <form onSubmit={logEvent} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4 text-amber-200" />
                <h3 className="text-sm font-medium">Log what happened</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select value={eventKind} onChange={(event) => setEventKind(event.target.value as AbsenceTestEvent["eventKind"])} className="rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-300 outline-none">
                  {Object.entries(eventKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={severity} onChange={(event) => setSeverity(event.target.value as AbsenceTestEvent["severity"])} className="rounded-xl border border-white/10 bg-[#090d15] px-3 py-3 text-sm text-slate-300 outline-none">
                  <option value="low">Low severity</option>
                  <option value="medium">Medium severity</option>
                  <option value="high">High severity</option>
                  <option value="critical">Critical severity</option>
                </select>
              </div>
              <input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} required placeholder="Event or decision title" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <textarea value={eventDetails} onChange={(event) => setEventDetails(event.target.value)} placeholder="What happened?" rows={3} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <textarea value={businessImpact} onChange={(event) => setBusinessImpact(event.target.value)} placeholder="Business impact" rows={2} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <textarea value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Resolution or evidence" rows={2} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <label className="mt-3 flex items-start gap-3 rounded-xl border border-rose-300/10 bg-rose-300/[0.025] p-3 text-xs leading-5 text-slate-400">
                <input type="checkbox" checked={causedFailure} onChange={(event) => setCausedFailure(event.target.checked)} className="mt-1" />
                This event triggered a defined failure condition.
              </label>
              <button type="submit" disabled={busy !== ""} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-slate-200 disabled:opacity-50">
                {busy === "event" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Add event
              </button>
            </form>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-indigo-200" />
                <h3 className="text-sm font-medium">Owner conclusion</h3>
              </div>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summarize operating performance, deterioration, controls, and lessons." rows={5} className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <textarea value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="Written decision: pass, retry, corrective plan, or leadership action." rows={4} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={() => updateRun("failed")} disabled={busy !== ""} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs font-semibold text-rose-200 disabled:opacity-50">
                  {busy === "failed" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleX className="h-4 w-4" />}
                  Mark failed
                </button>
                <button onClick={() => updateRun("passed")} disabled={busy !== ""} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-semibold text-emerald-200 disabled:opacity-50">
                  {busy === "passed" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark passed
                </button>
              </div>
              <button onClick={() => updateRun("cancelled")} disabled={busy !== ""} className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2.5 text-xs text-slate-500 disabled:opacity-50">
                Cancel without result
              </button>
            </div>
          </div>
        ) : null}

        {run && ["passed", "failed", "cancelled"].includes(run.status) ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              {run.status === "passed" ? <ShieldCheck className="h-5 w-5 text-emerald-200" /> : <AlertTriangle className="h-5 w-5 text-rose-200" />}
              <h3 className="text-sm font-medium">Latest owner decision</h3>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-400">{run.decision || "No written decision was recorded."}</p>
            {run.summary ? <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-6 text-slate-500">{run.summary}</p> : null}
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {run ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Event and evidence log</h3>
              <span className="text-[10px] text-slate-700">{run.events.length} entries</span>
            </div>
            <EventTimeline events={run.events} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function AbsenceTestsManager({ data }: { data: AutoRxAbsenceTestsData }) {
  const interventionCount = useMemo(
    () => data.tests.reduce((total, test) => total + (test.latestRun?.ownerInterventions ?? 0), 0),
    [data.tests],
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Tests passed", `${data.summary.passed}/${data.summary.total}`, "Verified independence"],
          ["Readiness", `${data.summary.readiness}%`, "Five tests carry equal weight"],
          ["Active", String(data.summary.active), "Only one test should run at a time"],
          ["Scheduled", String(data.summary.scheduled), "Future controlled trials"],
          ["Owner interventions", String(interventionCount), "Avoidable interventions weaken evidence"],
        ].map(([label, value, detail]) => (
          <article key={label} className="rounded-2xl border border-white/8 bg-[#0c111b] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {data.tests.map((test) => <TestCard key={test.id} test={test} />)}
      </div>
    </div>
  );
}

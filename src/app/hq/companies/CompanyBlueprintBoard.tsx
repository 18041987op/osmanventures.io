"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Save,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import type {
  CompanyBlueprint,
  CompanyMilestone,
  DepartmentSeat,
} from "@/lib/hq/company-blueprints-server";

async function saveAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/company-blueprints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save company blueprint.");
}

const statusStyles = {
  not_started: "border-slate-300/10 bg-white/[0.03] text-slate-500",
  in_progress: "border-indigo-300/20 bg-indigo-300/10 text-indigo-200",
  blocked: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  complete: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
};

function MilestoneEditor({ milestone }: { milestone: CompanyMilestone }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: milestone.status,
    ownerLabel: milestone.ownerLabel ?? "",
    targetDate: milestone.targetDate ?? "",
    evidence: milestone.evidence ?? "",
    blocker: milestone.blocker ?? "",
    nextAction: milestone.nextAction ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await saveAction({ action: "update_milestone", milestoneId: milestone.id, ...form });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save milestone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-indigo-300">{milestone.code}</p>
          <h4 className="mt-1 text-lg font-semibold">{milestone.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-400">{milestone.outcome}</p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusStyles[form.status]}`}>{form.status.replaceAll("_", " ")}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label><span className="text-xs text-slate-500">Status</span><select value={form.status} onChange={(event) => field("status", event.target.value as CompanyMilestone["status"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="complete">Complete</option></select></label>
        <label><span className="text-xs text-slate-500">Accountable owner</span><input value={form.ownerLabel} onChange={(event) => field("ownerLabel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Target date</span><input type="date" value={form.targetDate} onChange={(event) => field("targetDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2 xl:col-span-3"><span className="text-xs text-slate-500">Next action</span><input value={form.nextAction} onChange={(event) => field("nextAction", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Evidence</span><textarea rows={3} value={form.evidence} onChange={(event) => field("evidence", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="Required before completion" /></label>
        <label><span className="text-xs text-slate-500">Blocker</span><textarea rows={3} value={form.blocker} onChange={(event) => field("blocker", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="Required when blocked" /></label>
      </div>
      <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-300/10 px-4 py-2.5 text-sm font-medium text-indigo-100 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save milestone</button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

function DepartmentSeatEditor({ seat }: { seat: DepartmentSeat }) {
  const router = useRouter();
  const [form, setForm] = useState({
    currentOwner: seat.currentOwner ?? "",
    appointmentStatus: seat.appointmentStatus,
    ownerConfidence: seat.ownerConfidence?.toString() ?? "",
    nextReviewDate: seat.nextReviewDate ?? "",
    mandate: seat.mandate ?? "",
    riskLevel: seat.riskLevel,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await saveAction({ action: "update_department_seat", seatId: seat.id, ...form });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save department seat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">{seat.title}</h4><p className="mt-2 text-xs leading-5 text-slate-400">{seat.primaryResult}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-slate-400">{seat.appointmentStatus.replaceAll("_", " ")}</span></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label><span className="text-xs text-slate-500">Current owner</span><input value={form.currentOwner} onChange={(event) => field("currentOwner", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Appointment</span><select value={form.appointmentStatus} onChange={(event) => field("appointmentStatus", event.target.value as DepartmentSeat["appointmentStatus"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"><option value="vacant">Vacant</option><option value="interim">Interim</option><option value="probation">Probation</option><option value="active">Active</option><option value="replacement_required">Replacement required</option></select></label>
        <label><span className="text-xs text-slate-500">Confidence 1–5</span><input type="number" min="1" max="5" value={form.ownerConfidence} onChange={(event) => field("ownerConfidence", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Next review</span><input type="date" value={form.nextReviewDate} onChange={(event) => field("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Mandate</span><textarea rows={3} value={form.mandate} onChange={(event) => field("mandate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Risk level</span><select value={form.riskLevel} onChange={(event) => field("riskLevel", event.target.value as DepartmentSeat["riskLevel"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      </div>
      <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save seat</button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

function CompanyEditor({ company }: { company: CompanyBlueprint }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(company.slug !== "autorx");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    status: company.plan.status,
    strategicThesis: company.plan.strategicThesis,
    twelveMonthOutcome: company.plan.twelveMonthOutcome,
    currentConstraint: company.plan.currentConstraint ?? "",
    operatingModel: company.plan.operatingModel ?? "",
    reviewCadence: company.plan.reviewCadence,
    nextReviewDate: company.plan.nextReviewDate ?? "",
    capitalRule: company.plan.capitalRule ?? "",
    stopCondition: company.plan.stopCondition ?? "",
    ownerNotes: company.plan.ownerNotes ?? "",
  });

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveAction({ action: "update_plan", planId: company.plan.id, ...form });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save company plan.");
    } finally {
      setSaving(false);
    }
  }

  const completed = company.milestones.filter((item) => item.status === "complete").length;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#0c111b]">
      <button onClick={() => setExpanded((value) => !value)} className="flex w-full flex-col gap-4 p-5 text-left sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">{company.cashRole.replaceAll("_", " ")} · {company.stage.replaceAll("_", " ")}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-slate-400">{company.plan.status}</span></div><h2 className="mt-2 text-2xl font-semibold">{company.name}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{company.plan.twelveMonthOutcome}</p></div>
        <div className="flex items-center gap-4"><div className="text-right"><p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Milestones</p><p className="mt-1 text-lg font-semibold">{completed}/{company.milestones.length}</p></div><ChevronDown className={`h-5 w-5 text-slate-500 transition ${expanded ? "rotate-180" : ""}`} /></div>
      </button>
      {expanded ? <div className="border-t border-white/8 p-5 sm:p-6">
        <form onSubmit={savePlan} className="rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.035] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-indigo-200"><ShieldCheck className="h-5 w-5" /><h3 className="font-semibold">Operating plan</h3></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label><span className="text-xs text-slate-500">Status</span><select value={form.status} onChange={(event) => field("status", event.target.value as typeof form.status)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
            <label><span className="text-xs text-slate-500">Review cadence</span><select value={form.reviewCadence} onChange={(event) => field("reviewCadence", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>
            <label><span className="text-xs text-slate-500">Next review</span><input type="date" value={form.nextReviewDate} onChange={(event) => field("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2 xl:col-span-4"><span className="text-xs text-slate-500">Strategic thesis</span><textarea rows={3} value={form.strategicThesis} onChange={(event) => field("strategicThesis", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">12-month outcome</span><textarea rows={4} value={form.twelveMonthOutcome} onChange={(event) => field("twelveMonthOutcome", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Current constraint</span><textarea rows={4} value={form.currentConstraint} onChange={(event) => field("currentConstraint", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Operating model</span><textarea rows={4} value={form.operatingModel} onChange={(event) => field("operatingModel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Capital rule</span><textarea rows={4} value={form.capitalRule} onChange={(event) => field("capitalRule", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Stop condition</span><textarea rows={4} value={form.stopCondition} onChange={(event) => field("stopCondition", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Owner notes</span><textarea rows={4} value={form.ownerNotes} onChange={(event) => field("ownerNotes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
          </div>
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save operating plan</button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </form>

        {company.milestones.length ? <section className="mt-4"><div className="flex items-center gap-2 text-indigo-200"><Target className="h-5 w-5" /><h3 className="font-semibold">Milestone gates</h3></div><div className="mt-4 space-y-3">{company.milestones.map((milestone) => <MilestoneEditor key={milestone.id} milestone={milestone} />)}</div></section> : null}
        <section className="mt-5"><div className="flex items-center gap-2 text-emerald-200"><Users className="h-5 w-5" /><h3 className="font-semibold">Department ownership</h3></div><div className="mt-4 grid gap-3 xl:grid-cols-2">{company.departmentSeats.map((seat) => <DepartmentSeatEditor key={seat.id} seat={seat} />)}</div></section>
      </div> : null}
    </article>
  );
}

export default function CompanyBlueprintBoard({ companies }: { companies: CompanyBlueprint[] }) {
  return <div className="space-y-4">{companies.map((company) => <CompanyEditor key={company.id} company={company} />)}</div>;
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Plus, Save, ShieldCheck } from "lucide-react";
import type { GovernanceCompany, GovernanceControl } from "@/lib/hq/governance-server";

async function action(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/governance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save the control.");
}

function ControlCard({ control }: { control: GovernanceControl }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: control.status,
    ownerLabel: control.ownerLabel ?? "",
    evidenceRequired: control.evidenceRequired ?? "",
    nextDueDate: control.nextDueDate ?? "",
    notes: control.notes ?? "",
    markCompleted: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await action({ action: "update_control", id: control.id, ...form });
      router.refresh();
      field("markCompleted", false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update control.");
    } finally {
      setSaving(false);
    }
  }

  const style = control.status === "gap"
    ? "border-amber-300/20 bg-amber-300/[0.035]"
    : control.status === "active"
      ? "border-emerald-300/15 bg-emerald-300/[0.03]"
      : "border-white/8 bg-black/10";

  return (
    <article className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-200/70">{control.companyName || "Portfolio"} · {control.category} · {control.frequency}</p>
            {control.isOwnerRetained ? <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-200">Owner retained</span> : null}
          </div>
          <h3 className="mt-1 text-lg font-semibold">{control.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{control.objective}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">{control.status}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label><span className="text-xs text-slate-500">Status</span><select value={form.status} onChange={(event) => field("status", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"><option value="gap">Gap</option><option value="active">Active</option><option value="paused">Paused</option><option value="retired">Retired</option></select></label>
        <label><span className="text-xs text-slate-500">Control owner</span><input value={form.ownerLabel} onChange={(event) => field("ownerLabel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Next due date</span><input type="date" value={form.nextDueDate} onChange={(event) => field("nextDueDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="flex items-end"><span className="flex h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-300"><input type="checkbox" checked={form.markCompleted} onChange={(event) => field("markCompleted", event.target.checked)} /> Mark completed now</span></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Evidence required</span><textarea rows={3} value={form.evidenceRequired} onChange={(event) => field("evidenceRequired", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Notes and exceptions</span><textarea rows={3} value={form.notes} onChange={(event) => field("notes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">Last completed: {control.lastCompletedAt ? new Date(control.lastCompletedAt).toLocaleString() : "Never recorded"}</p>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm font-medium text-amber-100 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save control</button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

export default function ControlRegister({ controls, companies }: { controls: GovernanceControl[]; companies: GovernanceCompany[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyId: companies[0]?.id ?? "",
    title: "",
    category: "operating",
    objective: "",
    frequency: "monthly",
    ownerLabel: "",
    evidenceRequired: "",
    isOwnerRetained: false,
    nextDueDate: "",
  });

  function field(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await action({ action: "create_control", ...form });
      setShowForm(false);
      setForm((current) => ({ ...current, title: "", objective: "", ownerLabel: "", evidenceRequired: "", nextDueDate: "", isOwnerRetained: false }));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create control.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="controls" className="rounded-[1.75rem] border border-amber-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2 text-amber-200"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Control evidence</span></div><h2 className="mt-3 text-2xl font-semibold">Control Register</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A control becomes active only when it has an owner, frequency, evidence requirement, and proof of completion. Owner-retained controls cannot be delegated away by a company operator.</p></div>
        <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#171006] hover:bg-amber-300"><Plus className="h-4 w-4" /> New control</button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="xl:col-span-2"><span className="text-xs text-slate-500">Control title</span><input required value={form.title} onChange={(event) => field("title", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Company</span><select value={form.companyId} onChange={(event) => field("companyId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="">Portfolio</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Category</span><input value={form.category} onChange={(event) => field("category", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Control objective</span><textarea required rows={3} value={form.objective} onChange={(event) => field("objective", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Frequency</span><select value={form.frequency} onChange={(event) => field("frequency", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="per_event">Per event</option></select></label>
            <label><span className="text-xs text-slate-500">Owner</span><input value={form.ownerLabel} onChange={(event) => field("ownerLabel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Evidence required</span><textarea rows={3} value={form.evidenceRequired} onChange={(event) => field("evidenceRequired", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Next due</span><input type="date" value={form.nextDueDate} onChange={(event) => field("nextDueDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="flex items-end"><span className="flex h-12 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-300"><input type="checkbox" checked={form.isOwnerRetained} onChange={(event) => field("isOwnerRetained", event.target.checked)} /> Owner-retained authority</span></label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#171006] disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Add control</button>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">{controls.map((control) => <ControlCard key={control.id} control={control} />)}</div>
    </section>
  );
}

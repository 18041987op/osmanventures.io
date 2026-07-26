"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Plus, Save } from "lucide-react";
import type { GovernanceCompany, GovernanceRisk } from "@/lib/hq/governance-server";

async function action(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/governance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save the risk.");
}

function RiskCard({ risk }: { risk: GovernanceRisk }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: risk.status,
    probability: String(risk.probability),
    impact: String(risk.impact),
    ownerLabel: risk.ownerLabel ?? "",
    mitigationPlan: risk.mitigationPlan ?? "",
    triggerCondition: risk.triggerCondition ?? "",
    nextReviewDate: risk.nextReviewDate ?? "",
    residualProbability: risk.residualProbability?.toString() ?? "",
    residualImpact: risk.residualImpact?.toString() ?? "",
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
      await action({ action: "update_risk", id: risk.id, ...form });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update risk.");
    } finally {
      setSaving(false);
    }
  }

  const exposure = Number(form.probability) * Number(form.impact);
  const tone = exposure >= 15 ? "border-rose-300/20 bg-rose-300/[0.035]" : exposure >= 8 ? "border-amber-300/20 bg-amber-300/[0.035]" : "border-white/8 bg-black/10";

  return (
    <article className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-rose-200/70">{risk.companyName || "Portfolio"} · {risk.category}</p>
          <h3 className="mt-1 text-lg font-semibold">{risk.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{risk.description || "No description recorded."}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Exposure</p>
          <p className="mt-1 text-2xl font-semibold">{exposure}/25</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label><span className="text-xs text-slate-500">Status</span><select value={form.status} onChange={(event) => field("status", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"><option value="open">Open</option><option value="mitigating">Mitigating</option><option value="accepted">Accepted</option><option value="closed">Closed</option></select></label>
        <label><span className="text-xs text-slate-500">Probability 1–5</span><input type="number" min="1" max="5" value={form.probability} onChange={(event) => field("probability", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Impact 1–5</span><input type="number" min="1" max="5" value={form.impact} onChange={(event) => field("impact", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Risk owner</span><input value={form.ownerLabel} onChange={(event) => field("ownerLabel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Mitigation plan</span><textarea rows={3} value={form.mitigationPlan} onChange={(event) => field("mitigationPlan", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label className="md:col-span-2"><span className="text-xs text-slate-500">Trigger condition</span><textarea rows={3} value={form.triggerCondition} onChange={(event) => field("triggerCondition", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="What observable event tells us the risk is occurring?" /></label>
        <label><span className="text-xs text-slate-500">Next review</span><input type="date" value={form.nextReviewDate} onChange={(event) => field("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Residual probability</span><input type="number" min="1" max="5" value={form.residualProbability} onChange={(event) => field("residualProbability", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <label><span className="text-xs text-slate-500">Residual impact</span><input type="number" min="1" max="5" value={form.residualImpact} onChange={(event) => field("residualImpact", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
        <button onClick={save} disabled={saving} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 text-sm font-medium text-rose-100 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save risk</button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

export default function RiskRegister({ risks, companies }: { risks: GovernanceRisk[]; companies: GovernanceCompany[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyId: companies[0]?.id ?? "",
    title: "",
    category: "operating",
    description: "",
    probability: "3",
    impact: "3",
    ownerLabel: "",
    mitigationPlan: "",
    triggerCondition: "",
    nextReviewDate: "",
  });

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await action({ action: "create_risk", ...form });
      setShowForm(false);
      setForm((current) => ({ ...current, title: "", description: "", ownerLabel: "", mitigationPlan: "", triggerCondition: "", nextReviewDate: "" }));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create risk.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="risks" className="rounded-[1.75rem] border border-rose-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2 text-rose-200"><AlertTriangle className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Exposure management</span></div><h2 className="mt-3 text-2xl font-semibold">Risk Register</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Identify the event, probability, impact, owner, trigger, mitigation, and residual exposure. A risk is not controlled merely because it has been discussed.</p></div>
        <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-400"><Plus className="h-4 w-4" /> New risk</button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="xl:col-span-2"><span className="text-xs text-slate-500">Risk title</span><input required value={form.title} onChange={(event) => field("title", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Company</span><select value={form.companyId} onChange={(event) => field("companyId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="">Portfolio</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Category</span><input value={form.category} onChange={(event) => field("category", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Description</span><textarea rows={3} value={form.description} onChange={(event) => field("description", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Probability 1–5</span><input type="number" min="1" max="5" value={form.probability} onChange={(event) => field("probability", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Impact 1–5</span><input type="number" min="1" max="5" value={form.impact} onChange={(event) => field("impact", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Owner</span><input value={form.ownerLabel} onChange={(event) => field("ownerLabel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Next review</span><input type="date" value={form.nextReviewDate} onChange={(event) => field("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Mitigation plan</span><textarea rows={3} value={form.mitigationPlan} onChange={(event) => field("mitigationPlan", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Trigger condition</span><textarea rows={3} value={form.triggerCondition} onChange={(event) => field("triggerCondition", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add risk</button>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">{risks.map((risk) => <RiskCard key={risk.id} risk={risk} />)}</div>
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Plus, Save, Target } from "lucide-react";
import type { GovernanceCompany, GovernanceDecision } from "@/lib/hq/governance-server";

async function action(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/governance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save the decision.");
}

function DecisionCard({ decision }: { decision: GovernanceDecision }) {
  const router = useRouter();
  const [status, setStatus] = useState(decision.status);
  const [decisionText, setDecisionText] = useState(decision.decision ?? "");
  const [actualResult, setActualResult] = useState(decision.actualResult ?? "");
  const [lessons, setLessons] = useState(decision.lessons ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await action({ action: "update_decision", id: decision.id, status, decision: decisionText, actualResult, lessons });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update decision.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-300">
            {decision.companyName || "Portfolio"} · {decision.decisionType} · {decision.priority}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{decision.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{decision.context}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">{decision.status}</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Options considered</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
            {decision.options.length ? decision.options.map((option) => <li key={option}>• {option}</li>) : <li>No options recorded.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Expected result</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{decision.expectedResult || "Not defined"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_1fr_1fr_auto] lg:items-end">
        <label>
          <span className="text-xs text-slate-500">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as GovernanceDecision["status"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white">
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
        <label>
          <span className="text-xs text-slate-500">Decision</span>
          <input value={decisionText} onChange={(event) => setDecisionText(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="What was decided and why" />
        </label>
        <label>
          <span className="text-xs text-slate-500">Actual result</span>
          <input value={actualResult} onChange={(event) => setActualResult(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="What happened" />
        </label>
        <label>
          <span className="text-xs text-slate-500">Lessons</span>
          <input value={lessons} onChange={(event) => setLessons(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="What changes next time" />
        </label>
        <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-100 disabled:opacity-60">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

export default function DecisionRegister({ decisions, companies }: { decisions: GovernanceDecision[]; companies: GovernanceCompany[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyId: companies[0]?.id ?? "",
    title: "",
    context: "",
    options: "",
    assumptions: "",
    decisionType: "operating",
    priority: "normal",
    expectedResult: "",
    dueDate: "",
    reviewDate: "",
    linkedEntityType: "",
    linkedEntityId: "",
  });

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await action({ action: "create_decision", ...form });
      setShowForm(false);
      setForm((current) => ({ ...current, title: "", context: "", options: "", assumptions: "", expectedResult: "", dueDate: "", reviewDate: "", linkedEntityType: "", linkedEntityId: "" }));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create decision.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="decisions" className="rounded-[1.75rem] border border-cyan-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-200"><Target className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Decision discipline</span></div>
          <h2 className="mt-3 text-2xl font-semibold">Decision Register</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Record the context, alternatives, assumptions, expected result, final decision, and later outcome so the portfolio learns instead of repeating the same debates.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-[#061216] hover:bg-cyan-400"><Plus className="h-4 w-4" /> New decision</button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="xl:col-span-2"><span className="text-xs text-slate-500">Decision title</span><input required value={form.title} onChange={(event) => field("title", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Company</span><select value={form.companyId} onChange={(event) => field("companyId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="">Portfolio</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Priority</span><select value={form.priority} onChange={(event) => field("priority", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Context and problem</span><textarea required rows={4} value={form.context} onChange={(event) => field("context", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Options, one per line</span><textarea rows={4} value={form.options} onChange={(event) => field("options", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Assumptions, one per line</span><textarea rows={4} value={form.assumptions} onChange={(event) => field("assumptions", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Expected result</span><textarea rows={3} value={form.expectedResult} onChange={(event) => field("expectedResult", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Decision due</span><input type="date" value={form.dueDate} onChange={(event) => field("dueDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Outcome review</span><input type="date" value={form.reviewDate} onChange={(event) => field("reviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-[#061216] disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Create proposed decision</button>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">
        {decisions.length ? decisions.map((decision) => <DecisionCard key={decision.id} decision={decision} />) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">No decisions have been recorded.</div>}
      </div>
    </section>
  );
}

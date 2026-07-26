"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, LoaderCircle, Plus, Save, ShieldAlert } from "lucide-react";
import type { CapitalRequest, GovernanceCompany, ReservePolicy } from "@/lib/hq/governance-server";

async function action(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/governance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save the capital request.");
}

function money(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function RequestCard({ request }: { request: CapitalRequest }) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [approvedAmount, setApprovedAmount] = useState(
    request.approvedAmount?.toString() ?? request.amount.toString(),
  );
  const [ownerNotes, setOwnerNotes] = useState(request.ownerNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await action({
        action: "update_capital_request",
        id: request.id,
        status,
        approvedAmount,
        ownerNotes,
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-indigo-300">
            {request.companyName} · {request.requestType}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{request.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{request.purpose}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold">{money(request.amount)}</p>
          <p className="mt-1 text-xs text-slate-600">Requested from {request.fundingCompanyName || "Unassigned"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Expected result</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{request.expectedResult}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Release milestone</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{request.milestone}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Stop condition</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{request.stopCondition}</p>
        </div>
      </div>

      {request.status === "approved" || request.status === "funded" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-emerald-200/60">Approved</p>
            <p className="mt-1 text-sm font-medium text-emerald-100">{money(request.approvedAmount)}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Reserve protected</p>
            <p className="mt-1 text-sm font-medium">{money(request.reserveRequiredAtDecision)}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Cash after approval</p>
            <p className="mt-1 text-sm font-medium">{money(request.cashAfter)}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_1fr_auto] lg:items-end">
        <label>
          <span className="text-xs text-slate-500">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as CapitalRequest["status"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white">
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="funded">Funded</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label>
          <span className="text-xs text-slate-500">Approved amount</span>
          <input type="number" min="0" step="0.01" value={approvedAmount} onChange={(event) => setApprovedAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" />
        </label>
        <label>
          <span className="text-xs text-slate-500">Owner notes</span>
          <input value={ownerNotes} onChange={(event) => setOwnerNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" placeholder="Approval conditions, rejection reason, or next review" />
        </label>
        <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-4 py-2.5 text-sm font-medium text-indigo-200 hover:bg-indigo-400/20 disabled:opacity-60">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}

export default function CapitalRequestsPanel({
  requests,
  companies,
  reservePolicy,
}: {
  requests: CapitalRequest[];
  companies: GovernanceCompany[];
  reservePolicy: ReservePolicy;
}) {
  const router = useRouter();
  const autoRx = companies.find((company) => company.slug === "autorx");
  const recipient = companies.find((company) => company.slug !== "autorx") ?? companies[0];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyId: recipient?.id ?? "",
    fundingCompanyId: autoRx?.id ?? "",
    title: "",
    amount: "",
    purpose: "",
    expectedResult: "",
    milestone: "",
    reviewDate: "",
    stopCondition: "",
    requestType: "investment",
    priority: "normal",
  });

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await action({ action: "create_capital_request", ...form });
      setShowForm(false);
      setForm((current) => ({ ...current, title: "", amount: "", purpose: "", expectedResult: "", milestone: "", reviewDate: "", stopCondition: "" }));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="capital" className="rounded-[1.75rem] border border-indigo-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-200">
            <CircleDollarSign className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Milestone funding</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Capital Requests</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Every request requires a measurable result, release milestone, review date, and stop condition. Approval does not move money; it creates the governance authorization.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
          <Plus className="h-4 w-4" /> New request
        </button>
      </div>

      {reservePolicy.status !== "approved" ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/80">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          Requests may be drafted, but approval is blocked until the AutoRx reserve policy is approved.
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="xl:col-span-2">
              <span className="text-xs text-slate-500">Request title</span>
              <input required value={form.title} onChange={(event) => field("title", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" placeholder="RunTech development milestone" />
            </label>
            <label>
              <span className="text-xs text-slate-500">Receiving company</span>
              <select value={form.companyId} onChange={(event) => field("companyId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs text-slate-500">Amount</span>
              <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => field("amount", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs text-slate-500">Purpose</span>
              <textarea required rows={3} value={form.purpose} onChange={(event) => field("purpose", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs text-slate-500">Expected measurable result</span>
              <textarea required rows={3} value={form.expectedResult} onChange={(event) => field("expectedResult", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs text-slate-500">Milestone required before release</span>
              <textarea required rows={3} value={form.milestone} onChange={(event) => field("milestone", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs text-slate-500">Stop condition</span>
              <textarea required rows={3} value={form.stopCondition} onChange={(event) => field("stopCondition", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label>
              <span className="text-xs text-slate-500">Review date</span>
              <input required type="date" value={form.reviewDate} onChange={(event) => field("reviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
            </label>
            <label>
              <span className="text-xs text-slate-500">Priority</span>
              <select value={form.priority} onChange={(event) => field("priority", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create request
          </button>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">
        {requests.length ? requests.map((request) => <RequestCard key={request.id} request={request} />) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">No capital requests have been created.</div>
        )}
      </div>
    </section>
  );
}

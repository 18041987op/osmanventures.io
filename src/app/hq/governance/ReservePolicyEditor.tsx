"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, LoaderCircle, RefreshCw, Save, ShieldCheck } from "lucide-react";
import type { ReservePolicy } from "@/lib/hq/governance-server";

async function governanceAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/governance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save the reserve policy.");
}

function money(value: number | null) {
  if (value === null) return "Not verified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReservePolicyEditor({ policy }: { policy: ReservePolicy }) {
  const router = useRouter();
  const [form, setForm] = useState({
    payrollBuffer: policy.payrollBuffer.toString(),
    vendorBuffer: policy.vendorBuffer.toString(),
    taxBuffer: policy.taxBuffer.toString(),
    debtAndRentBuffer: policy.debtAndRentBuffer.toString(),
    emergencyBuffer: policy.emergencyBuffer.toString(),
    otherBuffer: policy.otherBuffer.toString(),
    notes: policy.notes ?? "",
    status: policy.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requiredReserve = useMemo(
    () =>
      [
        form.payrollBuffer,
        form.vendorBuffer,
        form.taxBuffer,
        form.debtAndRentBuffer,
        form.emergencyBuffer,
        form.otherBuffer,
      ].reduce((sum, value) => sum + (Number(value) || 0), 0),
    [form],
  );
  const currentCash = policy.currentCash;
  const available = currentCash === null ? null : Math.max(currentCash - requiredReserve, 0);
  const gap = currentCash === null ? null : Math.max(requiredReserve - currentCash, 0);

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await governanceAction({ action: "save_reserve_policy", ...form });
      setMessage(
        form.status === "approved"
          ? "Reserve policy approved and snapshot recorded."
          : "Reserve policy saved as a working policy.",
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save policy.");
    } finally {
      setSaving(false);
    }
  }

  const moneyFields: Array<[keyof typeof form, string, string]> = [
    ["payrollBuffer", "Payroll buffer", "Payroll, taxes, and near-term labor commitments"],
    ["vendorBuffer", "Vendor and parts buffer", "Parts, vendors, refunds, and committed payables"],
    ["taxBuffer", "Tax buffer", "Known sales, payroll, income, and other tax obligations"],
    ["debtAndRentBuffer", "Debt and facility buffer", "Rent, debt service, utilities, and fixed obligations"],
    ["emergencyBuffer", "Emergency operating buffer", "Unexpected repairs, claims, downturns, and disruptions"],
    ["otherBuffer", "Other protected cash", "Any additional amount that cannot fund outside ventures"],
  ];

  return (
    <section id="reserve" className="rounded-[1.75rem] border border-emerald-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Cash-engine protection</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold">AutoRx Reserve Policy</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            No outside project becomes eligible for AutoRx capital until this policy is approved and the post-transfer cash remains above the protected reserve.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${policy.status === "approved" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
          {policy.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Verified current cash", money(currentCash)],
          ["Required reserve", money(requiredReserve)],
          ["Available capital", money(available)],
          ["Reserve gap", money(gap)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-3">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
        <p className="text-xs leading-5 text-slate-400">
          Verified current cash is synchronized from RunTech and QuickBooks. Editing this policy changes the protected reserve components, not the live bank balance.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moneyFields.map(([name, label, help]) => (
            <label key={name} className="rounded-2xl border border-white/8 bg-black/10 p-4">
              <span className="text-sm font-medium text-slate-200">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{help}</span>
              <div className="relative mt-3">
                <Banknote className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[name]}
                  onChange={(event) => field(name, event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-300/40"
                  placeholder="0.00"
                />
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <label>
            <span className="text-sm font-medium text-slate-200">Policy notes and source</span>
            <textarea
              value={form.notes}
              onChange={(event) => field("notes", event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/40"
              placeholder="Explain the reserve components and operating rules."
            />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-200">Policy status</span>
            <select
              value={form.status}
              onChange={(event) => field("status", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paused">Paused</option>
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Approval requires synchronized cash and a positive reserve.
            </p>
          </label>
        </div>

        {error ? <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        {message ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

        <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-400 disabled:opacity-60">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save reserve policy
        </button>
      </form>
    </section>
  );
}

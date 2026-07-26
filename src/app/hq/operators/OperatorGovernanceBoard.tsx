"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import type { CompanyOperatorSeat } from "@/lib/hq/operator-server";

async function operatorAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/operators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to save operator data.");
}

const appointmentLabels = {
  vacant: "Vacant",
  interim: "Interim",
  probation: "Probation",
  active: "Active",
  replacement_required: "Replacement required",
};

const authorityStyles = {
  operator: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  owner_approval: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  owner_retained: "border-rose-300/20 bg-rose-300/10 text-rose-200",
};

function OperatorSeatCard({ seat }: { seat: CompanyOperatorSeat }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(seat.companySlug === "autorx");
  const [savingSeat, setSavingSeat] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [seatForm, setSeatForm] = useState({
    currentOwner: seat.currentOwner ?? "",
    appointmentStatus: seat.appointmentStatus,
    appointedAt: seat.appointedAt ?? "",
    nextReviewDate: seat.nextReviewDate ?? "",
    ownerConfidence: seat.ownerConfidence?.toString() ?? "",
    hiringJobReference: seat.hiringJobReference ?? "",
    hiringCandidateReference: seat.hiringCandidateReference ?? "",
    mandate: seat.mandate ?? "",
    riskLevel: seat.riskLevel,
  });
  const [review, setReview] = useState({
    periodStart: "",
    periodEnd: "",
    status: "draft",
    performanceScore: "",
    ownerConfidence: seat.ownerConfidence?.toString() ?? "",
    resultSummary: "",
    wins: "",
    misses: "",
    correctiveActions: "",
    commitments: "",
    ownerDecision: "pending",
    nextReviewDate: seat.nextReviewDate ?? "",
  });

  function seatField(name: keyof typeof seatForm, value: string) {
    setSeatForm((current) => ({ ...current, [name]: value }));
  }
  function reviewField(name: keyof typeof review, value: string) {
    setReview((current) => ({ ...current, [name]: value }));
  }

  async function saveSeat(event: FormEvent) {
    event.preventDefault();
    setSavingSeat(true);
    setError("");
    setMessage("");
    try {
      await operatorAction({ action: "update_seat", seatId: seat.id, ...seatForm });
      setMessage("Operator seat updated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update seat.");
    } finally {
      setSavingSeat(false);
    }
  }

  async function saveReview(event: FormEvent) {
    event.preventDefault();
    setSavingReview(true);
    setError("");
    setMessage("");
    try {
      await operatorAction({ action: "save_review", seatId: seat.id, ...review });
      setMessage("Operator review saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save review.");
    } finally {
      setSavingReview(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#0c111b]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full flex-col gap-4 p-5 text-left sm:p-6 lg:flex-row lg:items-start lg:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">
              {seat.companyName} · {seat.cashRole.replaceAll("_", " ")}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${seat.appointmentStatus === "active" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : seat.appointmentStatus === "replacement_required" ? "border-rose-300/20 bg-rose-300/10 text-rose-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
              {appointmentLabels[seat.appointmentStatus]}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold">{seat.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{seat.primaryResult}</p>
          <p className="mt-3 text-xs text-slate-600">Current accountable person: {seat.currentOwner || "Unassigned"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Owner confidence</p>
            <p className="mt-1 text-lg font-semibold">{seat.ownerConfidence ? `${seat.ownerConfidence}/5` : "Not rated"}</p>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-500 transition ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-white/8 p-5 sm:p-6">
          <section className="rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.035] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-indigo-200">
              <UserRoundCog className="h-5 w-5" />
              <h3 className="font-semibold">Seat appointment and mandate</h3>
            </div>
            <form onSubmit={saveSeat} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label>
                  <span className="text-xs text-slate-500">Current accountable person</span>
                  <input value={seatForm.currentOwner} onChange={(event) => seatField("currentOwner", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" placeholder="Osman or appointed operator" />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Appointment status</span>
                  <select value={seatForm.appointmentStatus} onChange={(event) => seatField("appointmentStatus", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">
                    {Object.entries(appointmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs text-slate-500">Appointment date</span>
                  <input type="date" value={seatForm.appointedAt} onChange={(event) => seatField("appointedAt", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Next owner review</span>
                  <input type="date" value={seatForm.nextReviewDate} onChange={(event) => seatField("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Owner confidence 1–5</span>
                  <input type="number" min="1" max="5" value={seatForm.ownerConfidence} onChange={(event) => seatField("ownerConfidence", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Operator risk level</span>
                  <select value={seatForm.riskLevel} onChange={(event) => seatField("riskLevel", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">
                    <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                </label>
                <label>
                  <span className="text-xs text-slate-500">RunTech Hiring job reference</span>
                  <input value={seatForm.hiringJobReference} onChange={(event) => seatField("hiringJobReference", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" placeholder="Job or requisition ID/URL" />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Selected candidate reference</span>
                  <input value={seatForm.hiringCandidateReference} onChange={(event) => seatField("hiringCandidateReference", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" placeholder="Reference only, not candidate data" />
                </label>
                <label className="md:col-span-2 xl:col-span-4">
                  <span className="text-xs text-slate-500">Operator mandate</span>
                  <textarea rows={3} value={seatForm.mandate} onChange={(event) => seatField("mandate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" />
                </label>
              </div>
              <button disabled={savingSeat} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {savingSeat ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save operator seat
              </button>
            </form>
          </section>

          <section className="mt-4 rounded-2xl border border-white/8 bg-black/10 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-200"><ShieldCheck className="h-5 w-5" /><h3 className="font-semibold">Authority matrix</h3></div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {seat.authorityRules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-medium capitalize">{rule.category.replaceAll("_", " ")}</h4>
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${authorityStyles[rule.authorityLevel]}`}>{rule.authorityLevel.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{rule.limitText}</p>
                  {rule.conditions ? <p className="mt-2 text-xs leading-5 text-slate-600">Condition: {rule.conditions}</p> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-200"><ClipboardCheck className="h-5 w-5" /><h3 className="font-semibold">Owner performance review</h3></div>
            <form onSubmit={saveReview} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label><span className="text-xs text-slate-500">Period start</span><input required type="date" value={review.periodStart} onChange={(event) => reviewField("periodStart", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                <label><span className="text-xs text-slate-500">Period end</span><input required type="date" value={review.periodEnd} onChange={(event) => reviewField("periodEnd", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                <label><span className="text-xs text-slate-500">Performance score</span><input type="number" min="1" max="5" value={review.performanceScore} onChange={(event) => reviewField("performanceScore", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                <label><span className="text-xs text-slate-500">Owner confidence</span><input type="number" min="1" max="5" value={review.ownerConfidence} onChange={(event) => reviewField("ownerConfidence", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                <label className="md:col-span-2 xl:col-span-4"><span className="text-xs text-slate-500">Result summary</span><textarea rows={3} value={review.resultSummary} onChange={(event) => reviewField("resultSummary", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                {(["wins", "misses", "correctiveActions", "commitments"] as const).map((name) => (
                  <label key={name}><span className="text-xs capitalize text-slate-500">{name.replace(/([A-Z])/g, " $1")}, one per line</span><textarea rows={5} value={review[name]} onChange={(event) => reviewField(name, event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
                ))}
                <label><span className="text-xs text-slate-500">Review status</span><select value={review.status} onChange={(event) => reviewField("status", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="reviewed">Reviewed</option><option value="closed">Closed</option></select></label>
                <label><span className="text-xs text-slate-500">Owner decision</span><select value={review.ownerDecision} onChange={(event) => reviewField("ownerDecision", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="pending">Pending</option><option value="continue">Continue</option><option value="correct">Correct</option><option value="replace">Replace</option></select></label>
                <label><span className="text-xs text-slate-500">Next review</span><input type="date" value={review.nextReviewDate} onChange={(event) => reviewField("nextReviewDate", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
              </div>
              <button disabled={savingReview} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#06110c] disabled:opacity-60">
                {savingReview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save operator review
              </button>
            </form>

            {seat.reviews.length ? (
              <div className="mt-5 border-t border-white/8 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Review history</p>
                <div className="mt-3 space-y-3">
                  {seat.reviews.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/8 bg-black/10 p-3 text-xs text-slate-400">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span>{item.periodStart} → {item.periodEnd}</span><span className="font-medium text-slate-200">{item.ownerDecision}</span></div>
                      <p className="mt-2">{item.resultSummary || "No result summary"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {error ? <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        </div>
      ) : null}
    </article>
  );
}

export default function OperatorGovernanceBoard({ seats }: { seats: CompanyOperatorSeat[] }) {
  return <div className="space-y-4">{seats.map((seat) => <OperatorSeatCard key={seat.id} seat={seat} />)}</div>;
}

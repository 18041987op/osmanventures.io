import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { requireHqSession } from "@/lib/hq/auth-server";
import { getUserWorkspace } from "@/lib/hq/access-server";

const statusStyles: Record<string, string> = {
  complete: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  in_progress: "border-indigo-300/20 bg-indigo-300/10 text-indigo-200",
  blocked: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  not_started: "border-white/10 bg-white/[0.03] text-slate-500",
  active: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  gap: "border-amber-300/20 bg-amber-300/10 text-amber-200",
};

export default async function MyWorkPage() {
  const session = await requireHqSession();
  const data = await getUserWorkspace(session.userId);

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-7 lg:px-10">
        <header className="border-b border-white/8 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Company-scoped workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome, {data.profile.fullName.split(" ")[0]}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">Your HQ role is <span className="font-medium text-slate-200">{data.profile.role.replaceAll("_", " ")}</span>. This workspace shows only companies explicitly assigned to your account.</p>
        </header>

        {data.companies.length === 0 ? (
          <section className="mt-6 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.035] p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-amber-200" /><h2 className="mt-4 text-xl font-semibold">No company scope assigned</h2><p className="mt-2 text-sm text-slate-500">Your identity is active, but the HQ owner has not assigned company access.</p></section>
        ) : null}

        <div className="mt-6 space-y-5">
          {data.companies.map((company) => {
            const complete = company.milestones.filter((milestone) => milestone.status === "complete").length;
            return (
              <section key={company.id} className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">{company.cashRole.replaceAll("_", " ")} · {company.accessRole.replaceAll("_", " ")}</span>{company.plan ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-slate-400">Plan {company.plan.status}</span> : null}</div><h2 className="mt-2 text-2xl font-semibold">{company.name}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{company.plan?.twelveMonthOutcome || "No operating plan has been published for this company."}</p></div>
                  <div className="grid grid-cols-2 gap-2 text-center"><div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"><p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Milestones</p><p className="mt-1 font-semibold">{complete}/{company.milestones.length}</p></div><div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"><p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">Seats</p><p className="mt-1 font-semibold">{company.seats.length}</p></div></div>
                </div>

                {company.plan ? <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2 text-indigo-200"><Target className="h-4 w-4" /><p className="text-xs font-semibold uppercase tracking-[0.12em]">Strategic thesis</p></div><p className="mt-2 text-xs leading-5 text-slate-400">{company.plan.strategicThesis}</p></div><div className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2 text-amber-200"><CalendarClock className="h-4 w-4" /><p className="text-xs font-semibold uppercase tracking-[0.12em]">Current constraint</p></div><p className="mt-2 text-xs leading-5 text-slate-400">{company.plan.currentConstraint || "Not documented"}</p></div><div className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2 text-emerald-200"><Building2 className="h-4 w-4" /><p className="text-xs font-semibold uppercase tracking-[0.12em]">Next review</p></div><p className="mt-2 text-xs leading-5 text-slate-400">{company.plan.nextReviewDate || `${company.plan.reviewCadence} cadence; date pending`}</p></div></div> : null}

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                  <div><div className="flex items-center gap-2 text-indigo-200"><CheckCircle2 className="h-4 w-4" /><h3 className="font-semibold">Milestones</h3></div><div className="mt-3 space-y-3">{company.milestones.map((milestone) => <article key={milestone.id} className="rounded-xl border border-white/8 bg-black/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[9px] uppercase tracking-[0.12em] text-indigo-300">{milestone.code}</p><h4 className="mt-1 text-sm font-medium">{milestone.title}</h4></div><span className={`rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${statusStyles[milestone.status] || statusStyles.not_started}`}>{milestone.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{milestone.outcome}</p><p className="mt-2 text-xs text-slate-400">Next: {milestone.nextAction || "Not assigned"}</p></article>)}</div></div>
                  <div><div className="flex items-center gap-2 text-emerald-200"><Users className="h-4 w-4" /><h3 className="font-semibold">Seats & controls</h3></div><div className="mt-3 space-y-3">{company.seats.map((seat) => <article key={seat.id} className="rounded-xl border border-white/8 bg-black/10 p-4"><h4 className="text-sm font-medium">{seat.title}</h4><p className="mt-2 text-xs leading-5 text-slate-500">{seat.primaryResult}</p><p className="mt-2 text-xs text-slate-400">Owner: {seat.currentOwner || "Vacant"} · {seat.appointmentStatus.replaceAll("_", " ")}</p></article>)}{company.controls.map((control) => <article key={control.id} className="rounded-xl border border-white/8 bg-black/10 p-4"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-medium">{control.title}</h4><span className={`rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${statusStyles[control.status] || statusStyles.not_started}`}>{control.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{control.objective}</p></article>)}</div></div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

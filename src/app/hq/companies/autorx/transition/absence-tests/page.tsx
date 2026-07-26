import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarCheck2,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getAutoRxAbsenceTests } from "@/lib/hq/data-server";
import AbsenceTestsManager from "./AbsenceTestsManager";

export default async function AutoRxAbsenceTestsPage() {
  const session = await requireHqSession();
  const data = await getAutoRxAbsenceTests(session.userId);
  const transitionPath = await hqAppPath("companies/autorx/transition");

  return (
    <main className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={transitionPath}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-indigo-300"
            >
              <ArrowLeft className="h-4 w-4" /> General Manager Transition
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                  AutoRx Center
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Owner Absence Tests
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Test ladder</p>
              <p className="mt-1 text-sm font-medium">1 → 3 → 7 → 14 → 30 days</p>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/60">Current readiness</p>
              <p className="mt-1 text-sm font-medium text-emerald-100">{data.summary.readiness}%</p>
            </div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320]">
          <div className="grid xl:grid-cols-[1.25fr_.75fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Proof, not assumption
              </p>
              <h2 className="mt-3 max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                AutoRx is independent only when it performs without normal owner intervention.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                These are controlled operating trials, not vacations. Each test defines what Osman must stop doing,
                what the manager must control, what evidence must be produced, and what conditions automatically
                invalidate the result.
              </p>
            </div>
            <div className="border-t border-white/8 bg-black/10 p-6 sm:p-8 xl:border-l xl:border-t-0">
              <div className="space-y-4">
                {[
                  [ShieldCheck, "Owner boundary", "Routine decisions remain with the GM; owner-retained authority stays protected."],
                  [CalendarCheck2, "Evidence standard", "Every contact, intervention, incident, decision, and result is recorded."],
                  [Building2, "Business standard", "Passing requires stable cash, quality, people, customer, and control performance."],
                ].map(([Icon, title, text]) => {
                  const CardIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={title as string} className="flex gap-3">
                      <CardIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-200" />
                      <div>
                        <h3 className="text-sm font-medium">{title as string}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{text as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <AbsenceTestsManager data={data} />
        </div>
      </div>
    </main>
  );
}

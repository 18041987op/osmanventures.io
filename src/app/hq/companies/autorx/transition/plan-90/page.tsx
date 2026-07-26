import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Target,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getAutoRxNinetyDayPlan } from "@/lib/hq/data-server";
import Plan90Editor from "./Plan90Editor";

export default async function AutoRxNinetyDayPlanPage() {
  const session = await requireHqSession();
  const data = await getAutoRxNinetyDayPlan(session.userId);
  const transitionPath = await hqAppPath("companies/autorx/transition");
  const reviewPath = await hqAppPath("companies/autorx/review");

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
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                  AutoRx Center
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  General Manager 30/60/90 Plan
                </h1>
              </div>
            </div>
          </div>

          <Link
            href={reviewPath}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]"
          >
            Weekly Business Review <ClipboardCheck className="h-4 w-4" />
          </Link>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320]">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Transfer standard
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight">
                The GM is not considered installed because 90 days passed. The GM is
                installed when these results are proven.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                This plan begins as the success profile used during hiring. Once the
                operator starts, it becomes the onboarding contract and the evidence
                trail for deciding whether to expand authority, coach, pause, or replace.
              </p>
            </div>

            <div className="border-t border-white/8 bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="space-y-4">
                {[
                  [Target, "Outcome based", "Every milestone defines a measurable result."],
                  [ShieldCheck, "Authority controlled", "Owner-reserved decisions remain protected."],
                  [CheckCircle2, "Evidence required", "Completion requires proof, not activity reports."],
                ].map(([Icon, title, text]) => {
                  const ItemIcon = Icon as typeof Target;
                  return (
                    <div key={title as string} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">{title as string}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {text as string}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <Plan90Editor data={data} />
        </div>
      </div>
    </main>
  );
}

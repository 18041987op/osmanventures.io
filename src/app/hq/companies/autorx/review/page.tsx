import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { hqAppPath, requireHqSession } from "@/lib/hq/auth-server";
import { getAutoRxWeeklyReview } from "@/lib/hq/data-server";
import WeeklyReviewEditor from "./WeeklyReviewEditor";

function easternDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function startOfWeek(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return startOfWeek(easternDateString());
  const day = date.getDay();
  const difference = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + difference);
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function displayDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T12:00:00Z`));
}

export default async function AutoRxWeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireHqSession();
  const requestedWeek = (await searchParams).week;
  const weekStart = startOfWeek(requestedWeek || easternDateString());
  const data = await getAutoRxWeeklyReview(session.userId, weekStart);

  const homePath = await hqAppPath();
  const transitionPath = await hqAppPath("companies/autorx/transition");
  const reviewPath = await hqAppPath("companies/autorx/review");
  const previousWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const currentWeek = startOfWeek(easternDateString());

  const reported = data.metrics.filter(
    (metric) => metric.status !== "not_reported",
  ).length;
  const onTrack = data.metrics.filter((metric) => metric.status === "on_track").length;
  const watch = data.metrics.filter((metric) => metric.status === "watch").length;
  const offTrack = data.metrics.filter((metric) => metric.status === "off_track").length;

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
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                  AutoRx Center
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Weekly Business Review
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`${reviewPath}?week=${previousWeek}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-indigo-200"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-[220px] rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-center">
              <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" /> Reporting period
              </p>
              <p className="mt-1 text-sm font-medium">
                {displayDate(data.weekStart)} – {displayDate(data.weekEnd)}
              </p>
            </div>
            <Link
              href={`${reviewPath}?week=${nextWeek}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-indigo-200"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            {weekStart !== currentWeek ? (
              <Link
                href={`${reviewPath}?week=${currentWeek}`}
                className="rounded-xl border border-indigo-300/15 bg-indigo-400/[0.05] px-4 py-3 text-xs font-medium text-indigo-200"
              >
                Current week
              </Link>
            ) : null}
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-indigo-300/15 bg-[#0d1320]">
          <div className="grid lg:grid-cols-[1.25fr_.75fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Management operating rhythm
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                The operator reports outcomes, explains misses, commits corrective
                actions, and escalates only decisions outside the authority matrix.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                This review becomes the weekly contract between the AutoRx operator
                and Osman as owner. It is not a meeting-minutes form or an activity
                report.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={transitionPath}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-slate-300"
                >
                  Review transition dependencies <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={homePath}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-slate-300"
                >
                  Executive dashboard <Building2 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="border-t border-white/8 bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Reporting completeness
                  </p>
                  <p className="mt-2 text-4xl font-semibold">
                    {reported}/{data.metrics.length}
                  </p>
                </div>
                <BarChart3 className="h-7 w-7 text-indigo-300" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3">
                  <p className="text-emerald-200">{onTrack}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-slate-600">
                    On track
                  </p>
                </div>
                <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3">
                  <p className="text-amber-200">{watch}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-slate-600">
                    Watch
                  </p>
                </div>
                <div className="rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-3">
                  <p className="text-rose-200">{offTrack}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-slate-600">
                    Off track
                  </p>
                </div>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Review status: {data.review?.status || "not started"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <WeeklyReviewEditor data={data} />
        </div>
      </div>
    </main>
  );
}

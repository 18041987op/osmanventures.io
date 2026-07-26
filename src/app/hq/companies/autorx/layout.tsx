import Link from "next/link";
import { BarChart3, Building2, Gauge } from "lucide-react";
import { hqAppPath } from "@/lib/hq/auth-server";

export default async function AutoRxHqLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const executivePath = await hqAppPath();
  const transitionPath = await hqAppPath("companies/autorx/transition");
  const reviewPath = await hqAppPath("companies/autorx/review");

  return (
    <div className="pb-24">
      {children}
      <nav className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-[#0a0f18]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <Link
          href={executivePath}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <Gauge className="h-4 w-4" />
          <span className="hidden sm:inline">Executive</span>
        </Link>
        <Link
          href={transitionPath}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">GM Transition</span>
        </Link>
        <Link
          href={reviewPath}
          className="flex items-center gap-2 rounded-xl bg-indigo-500/15 px-3 py-2.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/25"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Weekly Review</span>
        </Link>
      </nav>
    </div>
  );
}

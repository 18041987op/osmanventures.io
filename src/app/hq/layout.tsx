import Link from "next/link";
import { Gauge, Landmark } from "lucide-react";
import { currentHqSession, hqAppPath } from "@/lib/hq/auth-server";

export default async function HqLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await currentHqSession();

  if (!session) return children;

  const executivePath = await hqAppPath();
  const governancePath = await hqAppPath("governance");

  return (
    <>
      {children}
      <nav className="fixed right-2 top-2 z-[70] flex items-center gap-1 rounded-2xl border border-white/10 bg-[#090e17]/90 p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl sm:right-4 sm:top-4">
        <Link href={executivePath} aria-label="Executive dashboard" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white sm:px-3">
          <Gauge className="h-4 w-4" /> <span className="hidden sm:inline">Executive</span>
        </Link>
        <Link href={governancePath} aria-label="Governance center" className="flex items-center gap-2 rounded-xl bg-emerald-400/10 px-2.5 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20 sm:px-3">
          <Landmark className="h-4 w-4" /> <span className="hidden sm:inline">Governance</span>
        </Link>
      </nav>
    </>
  );
}

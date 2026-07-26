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
      <nav className="fixed right-4 top-4 z-[70] hidden items-center gap-1 rounded-2xl border border-white/10 bg-[#090e17]/90 p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl md:flex">
        <Link href={executivePath} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
          <Gauge className="h-4 w-4" /> Executive
        </Link>
        <Link href={governancePath} className="flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20">
          <Landmark className="h-4 w-4" /> Governance
        </Link>
      </nav>
    </>
  );
}

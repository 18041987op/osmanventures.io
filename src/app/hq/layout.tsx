import Link from "next/link";
import { Building2, DatabaseZap, Gauge, Landmark, ListChecks, Users } from "lucide-react";
import { currentHqSession, hqAppPath } from "@/lib/hq/auth-server";

export default async function HqLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await currentHqSession();

  if (!session) return children;

  const links = [
    { href: await hqAppPath(), label: "Executive", icon: Gauge, tone: "text-slate-400 hover:text-white" },
    ...(session.role === "owner" ? [{ href: await hqAppPath("actions"), label: "Actions", icon: ListChecks, tone: "text-amber-200 bg-amber-400/10" }] : []),
    { href: await hqAppPath("companies"), label: "Companies", icon: Building2, tone: "text-violet-200 bg-violet-400/10" },
    { href: await hqAppPath("operators"), label: "Operators", icon: Users, tone: "text-indigo-200 bg-indigo-400/10" },
    { href: await hqAppPath("governance"), label: "Governance", icon: Landmark, tone: "text-emerald-200 bg-emerald-400/10" },
    { href: await hqAppPath("scorecard-automation"), label: "Data", icon: DatabaseZap, tone: "text-cyan-200 bg-cyan-400/10" },
  ];

  return (
    <>
      {children}
      <nav className="fixed right-2 top-2 z-[70] flex max-w-[calc(100vw-1rem)] items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#090e17]/90 p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl sm:right-4 sm:top-4">
        {links.map(({ href, label, icon: Icon, tone }) => (
          <Link key={label} href={href} aria-label={label} className={`flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition hover:bg-white/5 sm:px-3 ${tone}`}>
            <Icon className="h-4 w-4" /> <span className="hidden xl:inline">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

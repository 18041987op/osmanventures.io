"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CalendarRange, Gauge } from "lucide-react";

const items = [
  { key: "executive", label: "Executive", icon: Gauge },
  { key: "transition", label: "GM Transition", icon: Building2 },
  { key: "plan", label: "30/60/90", icon: CalendarRange },
  { key: "review", label: "Weekly Review", icon: BarChart3 },
] as const;

export default function AutoRxNavigation({
  paths,
}: {
  paths: Record<(typeof items)[number]["key"], string>;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0f18]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
      {items.map(({ key, label, icon: Icon }) => {
        const href = paths[key];
        const active = pathname === href;

        return (
          <Link
            key={key}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
              active
                ? "bg-indigo-500/15 text-indigo-200"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

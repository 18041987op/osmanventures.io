import { redirect } from "next/navigation";
import { Building2, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import {
  currentHqSession,
  hqAppPath,
  isHqBootstrapConfigured,
} from "@/lib/hq/auth-server";
import { getHqBootstrapStatus } from "@/lib/hq/supabase-admin";
import OwnerSetupForm from "./OwnerSetupForm";

const protections = [
  {
    icon: KeyRound,
    title: "One-time activation",
    text: "The first-owner setup is automatically disabled after successful activation.",
  },
  {
    icon: LockKeyhole,
    title: "Server-side account creation",
    text: "Supabase administrative credentials never reach the browser.",
  },
  {
    icon: Building2,
    title: "Portfolio authority",
    text: "The owner receives access to all current companies and future governance controls.",
  },
];

export default async function HqOwnerSetupPage() {
  const session = await currentHqSession();
  if (session) redirect(await hqAppPath());

  const status = await getHqBootstrapStatus();
  if (status && !status.available) redirect(await hqAppPath("login"));

  const configured = isHqBootstrapConfigured() && Boolean(status?.available);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a11] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(245,158,11,0.08),transparent_30%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden border-r border-white/10 px-12 py-12 lg:flex lg:flex-col xl:px-20 xl:py-16">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">Osman Ventures</p>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                Command HQ
              </p>
            </div>
          </div>

          <div className="my-auto max-w-xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Initial secure activation
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.06] tracking-tight xl:text-6xl">
              Create the owner account from your own headquarters.
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-400 xl:text-lg">
              This replaces manual user creation in Supabase. The activation is
              completed through the HQ interface, records the owner role, assigns
              the portfolio, and then permanently closes this setup path.
            </p>

            <div className="mt-12 grid gap-4">
              {protections.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-medium text-slate-100">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Logo className="h-10 w-10" />
              <div>
                <p className="text-sm font-semibold">Osman Ventures</p>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  Command HQ
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0d121d]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                First owner only
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Activate Osman Ventures HQ
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Choose the credentials you will use for the HQ. No account needs to
                be created manually in Supabase.
              </p>

              <OwnerSetupForm configured={configured} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

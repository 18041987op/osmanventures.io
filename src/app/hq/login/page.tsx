import { redirect } from "next/navigation";
import { Building2, CircleDollarSign, ShieldCheck, Users } from "lucide-react";
import Logo from "@/components/Logo";
import {
  currentHqSession,
  hqAppPath,
  isHqAuthConfigured,
} from "@/lib/hq/auth-server";
import { getHqBootstrapStatus } from "@/lib/hq/supabase-admin";
import LoginForm from "./LoginForm";

const principles = [
  {
    icon: CircleDollarSign,
    title: "Protect the cash engine",
    text: "AutoRx funds the portfolio and receives first priority in capital decisions.",
  },
  {
    icon: Users,
    title: "Build accountable operators",
    text: "Every company and department receives one responsible owner and a scorecard.",
  },
  {
    icon: Building2,
    title: "Govern the portfolio",
    text: "Separate daily operations from owner-level capital, risk, and leadership decisions.",
  },
];

export default async function HqLoginPage() {
  const session = await currentHqSession();
  if (session) redirect(await hqAppPath());

  const bootstrapStatus = await getHqBootstrapStatus();
  if (bootstrapStatus?.available) redirect(await hqAppPath("setup"));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a11] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(6,182,212,0.10),transparent_30%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.15fr_.85fr]">
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

          <div className="my-auto max-w-2xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Private operating system
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.06] tracking-tight xl:text-6xl">
              Govern companies without becoming their daily operator.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 xl:text-lg">
              One secure headquarters for company performance, managers, capital,
              decisions, risks, and the transition of AutoRx away from owner
              dependence.
            </p>

            <div className="mt-12 grid gap-4">
              {principles.map(({ icon: Icon, title, text }) => (
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

          <p className="text-xs text-slate-600">
            Private company information must never be stored in the public website
            layer or exposed through client-side credentials.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Authorized access only
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Enter the command center
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use an owner-approved account. Public registration is disabled and
                access can be revoked at any time.
              </p>

              <LoginForm configured={isHqAuthConfigured()} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { Building2, Clock3, KeyRound, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { currentHqSession, hqAppPath } from "@/lib/hq/auth-server";
import { getInvitationPreview } from "@/lib/hq/access-server";
import AcceptInvitationForm from "./AcceptInvitationForm";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await currentHqSession();
  if (session) redirect(await hqAppPath(session.role === "owner" ? "" : "my-work"));

  const token = (await searchParams).token?.trim() ?? "";
  const invitation = await getInvitationPreview(token);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a11] px-5 py-10 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_80%_85%,rgba(16,185,129,0.09),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center">
        <div className="w-full">
          <div className="mb-8 flex items-center justify-center gap-3"><Logo className="h-11 w-11" /><div><p className="font-semibold">Osman Ventures</p><p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Command HQ</p></div></div>
          <section className="rounded-[2rem] border border-white/10 bg-[#0d121d]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            {!invitation ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 text-rose-200"><KeyRound className="h-6 w-6" /></div>
                <h1 className="mt-5 text-2xl font-semibold">Invitation unavailable</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">This invitation is invalid, expired, revoked, or has already been used. Ask the HQ owner to create a new secure invitation.</p>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-300/10 text-indigo-200"><ShieldCheck className="h-6 w-6" /></div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Private invitation</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {invitation.fullName}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">Create the password for <span className="font-medium text-slate-200">{invitation.email}</span>. Your HQ role will be <span className="font-medium text-slate-200">{invitation.role.replaceAll("_", " ")}</span>.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-slate-300"><Building2 className="h-4 w-4 text-indigo-300" /><span className="text-xs font-semibold uppercase tracking-[0.12em]">Company access</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{invitation.companies.map((company) => company.name).join(", ")}</p></div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-slate-300"><Clock3 className="h-4 w-4 text-amber-200" /><span className="text-xs font-semibold uppercase tracking-[0.12em]">Expires</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{new Date(invitation.expiresAt).toLocaleString()}</p></div>
                </div>
                <AcceptInvitationForm token={token} />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

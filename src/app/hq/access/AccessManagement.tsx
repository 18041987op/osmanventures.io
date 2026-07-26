"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clipboard,
  KeyRound,
  LoaderCircle,
  Plus,
  Save,
  ShieldOff,
  UserRoundCheck,
} from "lucide-react";
import type {
  AccessAuditData,
  AccessCompany,
  AccessInvitation,
  AccessUser,
} from "@/lib/hq/access-server";

async function accessAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as {
    error?: string;
    invitationUrl?: string;
  };
  if (!response.ok) throw new Error(data.error || "Unable to manage access.");
  return data;
}

const roleLabels = {
  owner: "Owner",
  group_executive: "Group executive",
  company_operator: "Company operator",
  department_manager: "Department manager",
  finance_reviewer: "Finance reviewer",
  auditor: "Auditor",
} satisfies Record<AccessUser["role"], string>;

function CompanyPicker({
  companies,
  selected,
  onChange,
  disabled,
}: {
  companies: AccessCompany[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {companies.map((company) => (
        <label
          key={company.id}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
            selected.includes(company.id)
              ? "border-indigo-300/25 bg-indigo-300/10 text-indigo-100"
              : "border-white/8 bg-white/[0.02] text-slate-400"
          }`}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={selected.includes(company.id)}
            onChange={() => toggle(company.id)}
          />
          {company.name}
        </label>
      ))}
    </div>
  );
}

function UserCard({
  user,
  companies,
}: {
  user: AccessUser;
  companies: AccessCompany[];
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [companyIds, setCompanyIds] = useState(
    user.companies.map((company) => company.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await accessAction({
        action: "update_user",
        userId: user.id,
        role,
        isActive,
        companyIds,
      });
      setMessage("Access updated. Existing sessions revalidate immediately.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update user.",
      );
    } finally {
      setSaving(false);
    }
  }

  const owner = role === "owner";

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{user.fullName}</h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                user.isActive
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-200"
              }`}
            >
              {user.isActive ? "active" : "inactive"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
            <span className="rounded-full border border-white/8 px-2.5 py-1">
              Last sign-in: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}
            </span>
            <span className="rounded-full border border-white/8 px-2.5 py-1">
              Login: password only
            </span>
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-300/10 text-indigo-200">
          <UserRoundCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-slate-500">Role</span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AccessUser["role"])
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white"
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active access
          </label>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.045] px-3 py-2.5 text-xs leading-5 text-amber-100/80">
            MFA is intentionally deferred until the complete login and recovery
            flow is rebuilt and tested.
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-500">Company access</p>
          <CompanyPicker
            companies={companies}
            selected={
              owner ? companies.map((company) => company.id) : companyIds
            }
            onChange={setCompanyIds}
            disabled={owner}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-300/10 px-4 py-2.5 text-sm font-medium text-indigo-100 disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save access
        </button>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
    </article>
  );
}

function InvitationCard({ invitation }: { invitation: AccessInvitation }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function revoke() {
    setSaving(true);
    setError("");
    try {
      await accessAction({
        action: "revoke_invitation",
        invitationId: invitation.id,
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to revoke invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">{invitation.fullName}</h3>
          <p className="mt-1 text-sm text-slate-500">{invitation.email}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {roleLabels[invitation.role]} · {invitation.companies.map((company) => company.name).join(", ")}
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {invitation.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-600">
        Expires: {new Date(invitation.expiresAt).toLocaleString()}
      </p>
      {invitation.status === "pending" ? (
        <button
          onClick={revoke}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-medium text-rose-200 disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldOff className="h-3.5 w-3.5" />
          )}
          Revoke invitation
        </button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </article>
  );
}

export default function AccessManagement({ data }: { data: AccessAuditData }) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "company_operator",
    companyIds: data.companies.length ? [data.companies[0].id] : [],
    expirationDays: "7",
  });

  const pending = useMemo(
    () => data.invitations.filter((invitation) => invitation.status === "pending"),
    [data.invitations],
  );

  async function submitInvite(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInvitationUrl("");
    try {
      const result = await accessAction({
        action: "create_invitation",
        ...form,
      });
      setInvitationUrl(result.invitationUrl || "");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-indigo-300/15 bg-[#0c111b] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-200">
              <KeyRound className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                Invite only
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Secure Invitations</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Create a one-time link, assign a role and company scope, then
              share it securely. The invitee creates their own password; the
              link expires and cannot be reused.
            </p>
          </div>
          <button
            onClick={() => setShowInvite((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" /> New invitation
          </button>
        </div>

        {showInvite ? (
          <form
            onSubmit={submitInvite}
            className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="text-xs text-slate-500">Full name</span>
                <input
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white"
                />
              </label>
              <label>
                <span className="text-xs text-slate-500">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white"
                />
              </label>
              <label>
                <span className="text-xs text-slate-500">Role</span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"
                >
                  {Object.entries(roleLabels)
                    .filter(([value]) => value !== "owner")
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span className="text-xs text-slate-500">Expires in days</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.expirationDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expirationDays: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white"
                />
              </label>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs text-slate-500">Company access</p>
              <CompanyPicker
                companies={data.companies}
                selected={form.companyIds}
                onChange={(companyIds) =>
                  setForm((current) => ({ ...current, companyIds }))
                }
              />
            </div>
            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            <button
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Create invitation
            </button>
          </form>
        ) : null}

        {invitationUrl ? (
          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
            <p className="text-sm font-medium text-emerald-100">
              Invitation created. This raw link is shown only now.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={invitationUrl}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-slate-300"
              />
              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#06110c]"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        ) : null}

        {pending.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {pending.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Identity and scope
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Users & Access</h2>
        </div>
        <div className="mt-5 space-y-4">
          {data.users.map((user) => (
            <UserCard key={user.id} user={user} companies={data.companies} />
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Traceability
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Recent Audit Events</h2>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
          {data.auditEvents.map((event) => (
            <div
              key={event.id}
              className="grid gap-2 border-t border-white/8 px-4 py-4 first:border-t-0 md:grid-cols-[170px_1fr_1fr]"
            >
              <p className="text-xs text-slate-600">
                {new Date(event.createdAt).toLocaleString()}
              </p>
              <div>
                <p className="text-sm font-medium capitalize">
                  {event.action.replaceAll("_", " ")} · {event.entityType.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {event.companyName || "Portfolio"} · {event.actorName || event.actorEmail || "System"}
                </p>
              </div>
              <p className="break-all text-xs leading-5 text-slate-500">
                {event.entityId || "No entity ID"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

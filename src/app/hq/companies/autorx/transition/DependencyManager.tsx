"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import type { OwnerDependency } from "@/lib/hq/data-server";

const riskStyles = {
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  high: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  medium: "border-slate-300/15 bg-white/[0.03] text-slate-400",
};

const documentationLabels = {
  missing: "Missing",
  draft: "Draft",
  verified: "Verified",
};

const delegationLabels = {
  not_started: "Not started",
  training: "Training",
  delegated: "Delegated",
  tested: "Tested",
};

const typeLabels = {
  decision: "Decision",
  approval: "Approval",
  relationship: "Relationship",
  knowledge: "Knowledge",
  system_access: "System access",
  execution: "Execution",
};

function DependencyCard({ dependency }: { dependency: OwnerDependency }) {
  const router = useRouter();
  const [documentationStatus, setDocumentationStatus] = useState(
    dependency.documentationStatus,
  );
  const [delegationStatus, setDelegationStatus] = useState(
    dependency.delegationStatus,
  );
  const [nextAction, setNextAction] = useState(dependency.nextAction ?? "");
  const [dueDate, setDueDate] = useState(dependency.dueDate ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/hq/autorx/dependencies/${dependency.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentationStatus,
            delegationStatus,
            nextAction,
            dueDate: dueDate || null,
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Unable to save changes.");
        return;
      }

      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Unable to reach the secure HQ service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {typeLabels[dependency.type]}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${riskStyles[dependency.riskLevel]}`}
            >
              {dependency.riskLevel}
            </span>
            <span className="rounded-full border border-indigo-300/15 bg-indigo-400/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-indigo-200">
              {documentationLabels[documentationStatus]}
            </span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-cyan-200">
              {delegationLabels[delegationStatus]}
            </span>
          </div>
          <h3 className="mt-3 text-sm font-medium leading-6">{dependency.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Target ownership: {dependency.targetOwner || "Not assigned"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-slate-400 transition hover:text-slate-200"
          aria-label={expanded ? "Close dependency editor" : "Edit dependency"}
        >
          <ChevronDown
            className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {dependency.riskIfAbsent ? (
        <div className="mt-4 flex gap-2 rounded-xl border border-rose-400/10 bg-rose-400/[0.035] p-3 text-xs leading-5 text-rose-100/70">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          {dependency.riskIfAbsent}
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-5 border-t border-white/8 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-500">
              Documentation
              <select
                value={documentationStatus}
                onChange={(event) =>
                  setDocumentationStatus(
                    event.target.value as OwnerDependency["documentationStatus"],
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
              >
                <option value="missing">Missing</option>
                <option value="draft">Draft</option>
                <option value="verified">Verified</option>
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Delegation
              <select
                value={delegationStatus}
                onChange={(event) =>
                  setDelegationStatus(
                    event.target.value as OwnerDependency["delegationStatus"],
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
              >
                <option value="not_started">Not started</option>
                <option value="training">Training</option>
                <option value="delegated">Delegated</option>
                <option value="tested">Tested</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-xs text-slate-500">
            Next action
            <textarea
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm leading-6 text-slate-200 outline-none focus:border-indigo-400/40"
              placeholder="What must happen next?"
            />
          </label>

          <label className="mt-4 block text-xs text-slate-500">
            Due date
            <div className="relative mt-2">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0a0f18] py-3 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-indigo-400/40"
              />
            </div>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-xs ${message === "Saved" ? "text-emerald-300" : "text-rose-300"}`}
            >
              {message}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save dependency
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function DependencyManager({
  dependencies,
}: {
  dependencies: OwnerDependency[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function createDependency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      type: form.get("type"),
      title: form.get("title"),
      riskLevel: form.get("riskLevel"),
      targetOwner: form.get("targetOwner"),
      riskIfAbsent: form.get("riskIfAbsent"),
      nextAction: form.get("nextAction"),
      dueDate: form.get("dueDate") || null,
    };

    try {
      const response = await fetch("/api/hq/autorx/dependencies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Unable to add the dependency.");
        return;
      }

      event.currentTarget.reset();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Unable to reach the secure HQ service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            Owner dependency inventory
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            What currently stops without Osman
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Every item needs documentation, a target owner, a transfer stage, and a
            test before it can be considered removed from Osman.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:border-indigo-300/30 hover:text-indigo-200"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close" : "Add dependency"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={createDependency}
          className="mt-5 rounded-2xl border border-indigo-300/15 bg-indigo-400/[0.035] p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-slate-500">
              Type
              <select
                name="type"
                required
                defaultValue="decision"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Risk
              <select
                name="riskLevel"
                required
                defaultValue="high"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Due date
              <input
                name="dueDate"
                type="date"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-xs text-slate-500">
            Dependency title
            <input
              name="title"
              required
              minLength={4}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
              placeholder="Example: Final approval of technician compensation changes"
            />
          </label>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-xs text-slate-500">
              Target ownership
              <input
                name="targetOwner"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
                placeholder="GM, finance control, owner retained..."
              />
            </label>
            <label className="text-xs text-slate-500">
              Risk if Osman is absent
              <input
                name="riskIfAbsent"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm text-slate-200 outline-none"
                placeholder="What breaks or becomes exposed?"
              />
            </label>
          </div>

          <label className="mt-4 block text-xs text-slate-500">
            First next action
            <textarea
              name="nextAction"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0f18] px-3 py-3 text-sm leading-6 text-slate-200 outline-none"
              placeholder="The first concrete action required to remove this dependency"
            />
          </label>

          {error ? <p className="mt-4 text-xs text-rose-300">{error}</p> : null}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:bg-slate-700"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add to transition inventory
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {dependencies.map((dependency) => (
          <DependencyCard key={dependency.id} dependency={dependency} />
        ))}
      </div>
    </section>
  );
}

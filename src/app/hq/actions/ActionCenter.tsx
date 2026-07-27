"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Filter,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Search,
  UserRound,
} from "lucide-react";
import type {
  ActionCategory,
  ActionPriority,
  ActionStatus,
  OwnerActionCenterData,
  OwnerActionItem,
} from "@/lib/hq/actions-server";

const statusLabels: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

const priorityLabels: Record<ActionPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const categoryLabels: Record<ActionCategory, string> = {
  transition: "Transition",
  operator: "Operator",
  capital: "Capital",
  governance: "Governance",
  data: "Data",
  company_plan: "Company plan",
  operating: "Operating",
  other: "Other",
};

const priorityStyles: Record<ActionPriority, string> = {
  critical: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  high: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  medium: "border-indigo-300/20 bg-indigo-300/10 text-indigo-200",
  low: "border-white/10 bg-white/[0.03] text-slate-400",
};

const statusStyles: Record<ActionStatus, string> = {
  open: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  in_progress: "border-indigo-300/20 bg-indigo-300/10 text-indigo-200",
  blocked: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  done: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  cancelled: "border-white/10 bg-white/[0.03] text-slate-500",
};

async function actionRequest(payload: Record<string, unknown>) {
  const response = await fetch("/api/hq/actions", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string; ok?: boolean };
  if (!response.ok) throw new Error(data.error || "Unable to update the action center.");
  return data;
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function sourceHref(appRoot: string, sourcePath: string) {
  if (!sourcePath.startsWith("/")) return sourcePath;
  return appRoot === "/" ? sourcePath : `${appRoot}${sourcePath}`;
}

function ActionCard({ item, appRoot }: { item: OwnerActionItem; appRoot: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionStatus>(item.status);
  const [priority, setPriority] = useState<ActionPriority>(item.priority);
  const [ownerLabel, setOwnerLabel] = useState(item.ownerLabel || "");
  const [dueDate, setDueDate] = useState(item.dueDate || "");
  const [evidenceNotes, setEvidenceNotes] = useState(item.evidenceNotes || "");
  const [blocker, setBlocker] = useState(item.blocker || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const systemGenerated = Boolean(item.systemKey);
  const active = !["done", "cancelled"].includes(item.status);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await actionRequest({
        action: "update",
        actionId: item.id,
        status,
        priority,
        ownerLabel,
        dueDate,
        evidenceNotes,
        blocker,
      });
      setMessage("Saved");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this action.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`rounded-[1.5rem] border p-5 ${active ? "border-white/9 bg-[#0c111b]" : "border-white/6 bg-white/[0.015] opacity-75"}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${priorityStyles[item.priority]}`}>
              {priorityLabels[item.priority]}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusStyles[item.status]}`}>
              {statusLabels[item.status]}
            </span>
            <span className="rounded-full border border-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {categoryLabels[item.category]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {systemGenerated ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
              {systemGenerated ? "System" : "Manual"}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h2>
          {item.description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{item.description}</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <span>{item.companyName || "Portfolio"}</span>
            <span>Owner: {item.ownerLabel || "Unassigned"}</span>
            <span>Due: {formatDate(item.dueDate)}</span>
            <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
          </div>
        </div>
        {item.sourcePath ? (
          <Link href={sourceHref(appRoot, item.sourcePath)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]">
            Open source <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      {item.evidenceRequired ? (
        <div className="mt-4 rounded-xl border border-indigo-300/10 bg-indigo-300/[0.035] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">Completion evidence</p>
          <p className="mt-2 text-xs leading-5 text-indigo-100/65">{item.evidenceRequired}</p>
        </div>
      ) : null}

      {item.blocker ? (
        <div className="mt-3 flex gap-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.045] p-4">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-rose-200" />
          <div><p className="text-xs font-semibold text-rose-100">Current blocker</p><p className="mt-1 text-xs leading-5 text-rose-100/65">{item.blocker}</p></div>
        </div>
      ) : null}

      {active ? (
        <details className="mt-4 rounded-xl border border-white/8 bg-black/10 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Update action <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block"><span className="text-xs text-slate-500">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ActionStatus)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white">
              <option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option>
              {!systemGenerated ? <option value="done">Done</option> : null}{!systemGenerated ? <option value="cancelled">Cancelled</option> : null}
            </select></label>
            <label className="block"><span className="text-xs text-slate-500">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as ActionPriority)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white">
              <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select></label>
            <label className="block"><span className="text-xs text-slate-500">Responsible owner</span><input value={ownerLabel} onChange={(event) => setOwnerLabel(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
            <label className="block"><span className="text-xs text-slate-500">Due date</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white" /></label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="block"><span className="text-xs text-slate-500">Evidence and progress notes</span><textarea rows={4} value={evidenceNotes} onChange={(event) => setEvidenceNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-white" /></label>
            <label className="block"><span className="text-xs text-slate-500">Blocker {status === "blocked" ? "(required)" : ""}</span><textarea rows={4} value={blocker} onChange={(event) => setBlocker(event.target.value)} disabled={status !== "blocked"} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-white disabled:opacity-40" /></label>
          </div>
          {systemGenerated ? <p className="mt-3 text-xs leading-5 text-slate-600">System actions close automatically when the linked seat, policy, control, milestone, or data source is actually resolved.</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save action</button>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

export default function ActionCenter({ data, appRoot }: { data: OwnerActionCenterData; appRoot: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [priority, setPriority] = useState("all");
  const [showClosed, setShowClosed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    companyId: "",
    category: "operating" as ActionCategory,
    priority: "medium" as ActionPriority,
    ownerLabel: "Osman",
    dueDate: "",
    evidenceRequired: "",
  });

  const visibleActions = useMemo(() => data.actions.filter((item) => {
    if (!showClosed && ["done", "cancelled"].includes(item.status)) return false;
    if (company !== "all" && (company === "portfolio" ? item.companyId !== null : item.companyId !== company)) return false;
    if (priority !== "all" && item.priority !== priority) return false;
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [item.title, item.description, item.companyName, item.ownerLabel, item.category].some((value) => value?.toLowerCase().includes(needle));
  }), [company, data.actions, priority, search, showClosed]);

  async function sync() {
    setSyncing(true); setError("");
    try { await actionRequest({ action: "sync" }); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to refresh actions."); }
    finally { setSyncing(false); }
  }

  async function create(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await actionRequest({ action: "create", ...form, companyId: form.companyId || null });
      setForm({ title: "", description: "", companyId: "", category: "operating", priority: "medium", ownerLabel: "Osman", dueDate: "", evidenceRequired: "" });
      setShowCreate(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create the action."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-indigo-300/15 bg-[#0c111b] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">One accountable queue</p><h2 className="mt-1 text-2xl font-semibold">Owner action queue</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">System actions are generated from live HQ gaps. Manual actions capture decisions or work that does not yet exist in another module.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={sync} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 disabled:opacity-60">{syncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh from HQ data</button>
            <button onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> New owner action</button>
          </div>
        </div>

        {showCreate ? <form onSubmit={create} className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="md:col-span-2"><span className="text-xs text-slate-500">Action title</span><input required minLength={3} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Company</span><select value={form.companyId} onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white"><option value="">Portfolio</option>{data.companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Due date</span><input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
            <label><span className="text-xs text-slate-500">Category</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ActionCategory }))} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">{Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Priority</span><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ActionPriority }))} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white">{Object.entries(priorityLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="text-xs text-slate-500">Responsible owner</span><input value={form.ownerLabel} onChange={(event) => setForm((current) => ({ ...current, ownerLabel: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white" /></label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2"><label><span className="text-xs text-slate-500">Description</span><textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white" /></label><label><span className="text-xs text-slate-500">Evidence required</span><textarea rows={4} value={form.evidenceRequired} onChange={(event) => setForm((current) => ({ ...current, evidenceRequired: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white" /></label></div>
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create action</button>
        </form> : null}
        {error ? <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      </section>

      <section className="rounded-[1.5rem] border border-white/8 bg-[#0c111b] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actions, companies, owners..." className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white" /></div>
          <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 px-2 text-xs text-slate-600"><Filter className="h-3.5 w-3.5" /> Filters</span><select value={company} onChange={(event) => setCompany(event.target.value)} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-xs text-white"><option value="all">All companies</option><option value="portfolio">Portfolio only</option>{data.companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-xs text-white"><option value="all">All priorities</option>{Object.entries(priorityLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-400"><input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} /> Show closed</label></div>
        </div>
      </section>

      <div className="space-y-4">{visibleActions.map((item) => <ActionCard key={item.id} item={item} appRoot={appRoot} />)}</div>
      {!visibleActions.length ? <div className="rounded-[1.5rem] border border-dashed border-white/10 p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" /><p className="mt-3 text-sm text-slate-400">No actions match the current filters.</p></div> : null}
    </div>
  );
}

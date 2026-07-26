"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, LoaderCircle, RefreshCw } from "lucide-react";

async function runAction(action: "refresh_sources" | "sync_metrics") {
  const response = await fetch("/api/hq/scorecard-automation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to update scorecard automation.");
}

export default function ScorecardActions() {
  const router = useRouter();
  const [running, setRunning] = useState<"refresh_sources" | "sync_metrics" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function execute(action: "refresh_sources" | "sync_metrics") {
    setRunning(action);
    setMessage("");
    setError("");
    try {
      await runAction(action);
      setMessage(action === "refresh_sources" ? "Source health refreshed." : "Verified metric results synchronized.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to run action.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => execute("refresh_sources")} disabled={running !== null} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-60">
          {running === "refresh_sources" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh source health
        </button>
        <button onClick={() => execute("sync_metrics")} disabled={running !== null} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">
          {running === "sync_metrics" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />} Sync verified metrics
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type ScorecardSource = {
  id: string;
  sourceKey: string;
  label: string;
  sourceTable: string | null;
  status: "ready" | "partial" | "not_ready" | "stale";
  rowCount: number;
  firstObservedAt: string | null;
  lastObservedAt: string | null;
  freshnessDays: number | null;
  notes: string | null;
  lastCheckedAt: string | null;
};

export type AutomationRule = {
  id: string;
  metricId: string;
  metricName: string;
  unit: string;
  sourceKey: string;
  calculationKey: string;
  sourceCadence: string;
  status: "ready" | "partial" | "not_ready" | "paused";
  notes: string | null;
  lastSyncedAt: string | null;
  lastSyncCount: number;
};

export type AutomatedMetricResult = {
  id: string;
  metricId: string;
  metricName: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  actual: number | null;
  target: number | null;
  status: "on_track" | "watch" | "off_track" | "not_reported";
  dataQuality: "verified" | "partial" | "stale" | "manual";
  sourceReference: string | null;
  sourceUpdatedAt: string | null;
};

export type ScorecardAutomationData = {
  summary: {
    readySources: number;
    partialSources: number;
    notReadySources: number;
    automatedMetrics: number;
    verifiedResults: number;
  };
  sources: ScorecardSource[];
  rules: AutomationRule[];
  latestResults: AutomatedMetricResult[];
};

export async function getScorecardAutomation(
  userId: string,
): Promise<ScorecardAutomationData> {
  const { data, error } = await hqSupabaseAdmin().rpc(
    "hq_get_scorecard_automation",
    { p_user_id: userId },
  );

  if (error) {
    console.error("Unable to load scorecard automation", error);
    throw new Error("Unable to load verified scorecard automation");
  }

  return data as ScorecardAutomationData;
}

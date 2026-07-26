import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type HqCompany = {
  id: string;
  name: string;
  slug: string;
  stage: string;
  cashRole: "cash_engine" | "investment" | "asset";
  description: string | null;
  ownerPriority: string | null;
  isActive: boolean;
};

export type ExecutiveDashboard = {
  companies: HqCompany[];
  summary: {
    cashEngines: number;
    operatorsInstalled: number;
    companiesGoverned: number;
    openCriticalDependencies: number;
  };
  autorx: {
    readiness: number;
    gatesComplete: number;
    gatesTotal: number;
    dependenciesTotal: number;
    dependenciesStarted: number;
    metricsDefined: number;
  };
};

export type TransitionGate = {
  id: string;
  code: string;
  title: string;
  outcome: string;
  position: number;
  status: "not_started" | "in_progress" | "complete";
  evidence: string | null;
  dueDate: string | null;
  completedAt: string | null;
};

export type TransitionSeat = {
  id: string;
  title: string;
  seatType: "company_operator" | "department_manager" | "finance" | "other";
  primaryResult: string;
  authoritySummary: string | null;
  currentOwner: string | null;
  transitionStatus: "not_started" | "mapping" | "documented" | "delegated" | "tested";
  incumbentUserId: string | null;
};

export type OwnerDependency = {
  id: string;
  type: "decision" | "approval" | "relationship" | "knowledge" | "system_access" | "execution";
  title: string;
  documentationStatus: "missing" | "draft" | "verified";
  delegationStatus: "not_started" | "training" | "delegated" | "tested";
  riskLevel: "critical" | "high" | "medium";
  targetOwner: string | null;
  riskIfAbsent: string | null;
  nextAction: string | null;
  dueDate: string | null;
  updatedAt: string;
};

export type HqMetricDefinition = {
  id: string;
  name: string;
  definition: string;
  unit: string;
  sourceSystem: string | null;
  cadence: string;
  direction: string;
  isOwnerControl: boolean;
};

export type AutoRxTransitionData = {
  company: {
    id: string;
    name: string;
    slug: string;
    owner_priority: string | null;
  };
  gmSeat: {
    id: string;
    title: string;
    primaryResult: string;
    authoritySummary: string | null;
    approvalLimits: Record<string, string>;
    currentOwner: string | null;
    transitionStatus: TransitionSeat["transitionStatus"];
    incumbentUserId: string | null;
  };
  departmentSeats: TransitionSeat[];
  gates: TransitionGate[];
  dependencies: OwnerDependency[];
  metrics: HqMetricDefinition[];
};

async function callHqRpc<T>(
  functionName: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await hqSupabaseAdmin().rpc(functionName, parameters);

  if (error) {
    console.error(`HQ RPC ${functionName} failed`, error);
    throw new Error("Unable to load HQ operating data");
  }

  return data as T;
}

export function getExecutiveDashboard(userId: string): Promise<ExecutiveDashboard> {
  return callHqRpc<ExecutiveDashboard>("hq_get_executive_dashboard", {
    p_user_id: userId,
  });
}

export function getAutoRxTransition(userId: string): Promise<AutoRxTransitionData> {
  return callHqRpc<AutoRxTransitionData>("hq_get_autorx_transition", {
    p_user_id: userId,
  });
}

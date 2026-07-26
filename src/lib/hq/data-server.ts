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

export type WeeklyMetricResult = {
  id: string;
  name: string;
  definition: string;
  unit: string;
  sourceSystem: string | null;
  direction: "higher_is_better" | "lower_is_better" | "range";
  isOwnerControl: boolean;
  target: number | null;
  actual: number | null;
  status: "on_track" | "watch" | "off_track" | "not_reported";
  varianceExplanation: string | null;
  correctiveAction: string | null;
  actionDueDate: string | null;
  updatedAt: string | null;
};

export type WeeklyReviewRecord = {
  id: string;
  status: "draft" | "submitted" | "reviewed" | "closed";
  wins: string[];
  misses: string[];
  criticalIssues: string[];
  decisionsTaken: string[];
  decisionsRequired: string[];
  nextCommitments: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

export type AutoRxWeeklyReviewData = {
  weekStart: string;
  weekEnd: string;
  metrics: WeeklyMetricResult[];
  review: WeeklyReviewRecord | null;
};

export type NinetyDayMilestone = {
  id: string;
  phase: 30 | 60 | 90;
  category:
    | "leadership"
    | "financial"
    | "operations"
    | "people"
    | "customer"
    | "controls"
    | "owner_independence";
  objective: string;
  successMeasure: string;
  ownerRole: string;
  dueDate: string | null;
  status: "not_started" | "in_progress" | "blocked" | "complete";
  evidence: string | null;
  notes: string | null;
  position: number;
  updatedAt: string;
};

export type AutoRxNinetyDayPlan = {
  plan: {
    id: string;
    title: string;
    status: "draft" | "active" | "paused" | "completed";
    startDate: string | null;
    operatorUserId: string | null;
    approvedAt: string | null;
    updatedAt: string;
  };
  summary: {
    total: number;
    complete: number;
    inProgress: number;
    blocked: number;
    readiness: number;
  };
  milestones: NinetyDayMilestone[];
};

export type AbsenceTestEvent = {
  id: string;
  eventKind:
    | "owner_contact"
    | "owner_intervention"
    | "emergency_intervention"
    | "critical_incident"
    | "operating_exception"
    | "evidence";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  details: string | null;
  businessImpact: string | null;
  resolution: string | null;
  causedFailure: boolean;
  occurredAt: string;
};

export type AbsenceTestRun = {
  id: string;
  status: "scheduled" | "active" | "passed" | "failed" | "cancelled";
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  operatorUserId: string | null;
  ownerInterventions: number;
  emergencyInterventions: number;
  baselineMetrics: Record<string, unknown>;
  outcomeMetrics: Record<string, unknown>;
  summary: string | null;
  decision: string | null;
  createdAt: string;
  updatedAt: string;
  events: AbsenceTestEvent[];
};

export type AbsenceTestTemplate = {
  id: string;
  durationDays: 1 | 3 | 7 | 14 | 30;
  title: string;
  objective: string;
  ownerRules: string[];
  passCriteria: string[];
  failConditions: string[];
  requiredEvidence: string[];
  position: number;
  latestRun: AbsenceTestRun | null;
};

export type AutoRxAbsenceTestsData = {
  summary: {
    total: number;
    passed: number;
    active: number;
    scheduled: number;
    failed: number;
    readiness: number;
  };
  tests: AbsenceTestTemplate[];
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

export function getAutoRxWeeklyReview(
  userId: string,
  weekStart: string,
): Promise<AutoRxWeeklyReviewData> {
  return callHqRpc<AutoRxWeeklyReviewData>("hq_get_autorx_weekly_review", {
    p_user_id: userId,
    p_week_start: weekStart,
  });
}

export function getAutoRxNinetyDayPlan(
  userId: string,
): Promise<AutoRxNinetyDayPlan> {
  return callHqRpc<AutoRxNinetyDayPlan>("hq_get_autorx_90_day_plan", {
    p_user_id: userId,
  });
}

export function getAutoRxAbsenceTests(
  userId: string,
): Promise<AutoRxAbsenceTestsData> {
  return callHqRpc<AutoRxAbsenceTestsData>("hq_get_autorx_absence_tests", {
    p_user_id: userId,
  });
}

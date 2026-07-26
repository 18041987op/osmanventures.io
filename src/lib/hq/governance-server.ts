import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type GovernanceCompany = {
  id: string;
  name: string;
  slug: string;
  cashRole: "cash_engine" | "investment" | "asset";
};

export type ReservePolicy = {
  id: string;
  companyId: string;
  status: "draft" | "approved" | "paused";
  currency: string;
  currentCash: number | null;
  payrollBuffer: number;
  vendorBuffer: number;
  taxBuffer: number;
  debtAndRentBuffer: number;
  emergencyBuffer: number;
  otherBuffer: number;
  requiredReserve: number;
  availableCapital: number | null;
  reserveGap: number | null;
  notes: string | null;
  approvedAt: string | null;
  updatedAt: string;
};

export type CapitalRequest = {
  id: string;
  companyId: string;
  companyName: string;
  fundingCompanyId: string | null;
  fundingCompanyName: string | null;
  title: string;
  amount: number;
  purpose: string;
  expectedResult: string;
  milestone: string;
  reviewDate: string;
  stopCondition: string;
  status: "draft" | "requested" | "approved" | "rejected" | "funded" | "paused" | "closed";
  requestType: string;
  priority: string;
  eligibilityStatus: string;
  approvedAmount: number | null;
  reserveRequiredAtDecision: number | null;
  cashAfter: number | null;
  ownerNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceDecision = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  title: string;
  context: string;
  options: string[];
  assumptions: string[];
  decision: string | null;
  status: "proposed" | "approved" | "rejected" | "implemented" | "reviewed";
  decisionType: string;
  priority: string;
  expectedResult: string | null;
  dueDate: string | null;
  reviewDate: string | null;
  actualResult: string | null;
  lessons: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceRisk = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  title: string;
  category: string;
  description: string | null;
  probability: number;
  impact: number;
  exposure: number;
  ownerLabel: string | null;
  mitigationPlan: string | null;
  triggerCondition: string | null;
  nextReviewDate: string | null;
  status: "open" | "mitigating" | "accepted" | "closed";
  residualProbability: number | null;
  residualImpact: number | null;
  updatedAt: string;
};

export type GovernanceControl = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  title: string;
  category: string;
  objective: string;
  frequency: string;
  ownerLabel: string | null;
  evidenceRequired: string | null;
  status: "active" | "gap" | "paused" | "retired";
  isOwnerRetained: boolean;
  lastCompletedAt: string | null;
  nextDueDate: string | null;
  notes: string | null;
  updatedAt: string;
};

export type GovernanceCenterData = {
  companies: GovernanceCompany[];
  reservePolicy: ReservePolicy;
  capitalRequests: CapitalRequest[];
  decisions: GovernanceDecision[];
  risks: GovernanceRisk[];
  controls: GovernanceControl[];
  summary: {
    pendingCapitalRequests: number;
    openDecisions: number;
    highRisks: number;
    controlGaps: number;
  };
};

export async function getGovernanceCenter(userId: string): Promise<GovernanceCenterData> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_governance_center", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Unable to load HQ governance center", error);
    throw new Error("Unable to load HQ governance data");
  }

  return data as GovernanceCenterData;
}

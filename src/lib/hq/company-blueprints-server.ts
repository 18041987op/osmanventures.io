import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type CompanyPlan = {
  id: string;
  status: "draft" | "active" | "paused" | "completed";
  strategicThesis: string;
  twelveMonthOutcome: string;
  currentConstraint: string | null;
  operatingModel: string | null;
  reviewCadence: string;
  nextReviewDate: string | null;
  capitalRule: string | null;
  stopCondition: string | null;
  ownerNotes: string | null;
  approvedAt: string | null;
  updatedAt: string;
};

export type CompanyMilestone = {
  id: string;
  code: string;
  title: string;
  outcome: string;
  position: number;
  status: "not_started" | "in_progress" | "blocked" | "complete";
  ownerLabel: string | null;
  targetDate: string | null;
  evidence: string | null;
  blocker: string | null;
  nextAction: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type DepartmentSeat = {
  id: string;
  title: string;
  primaryResult: string;
  mandate: string | null;
  currentOwner: string | null;
  appointmentStatus: "vacant" | "interim" | "probation" | "active" | "replacement_required";
  ownerConfidence: number | null;
  nextReviewDate: string | null;
  riskLevel: "critical" | "high" | "medium" | "low";
};

export type CompanyBlueprint = {
  id: string;
  name: string;
  slug: string;
  stage: string;
  cashRole: "cash_engine" | "investment" | "asset";
  description: string | null;
  ownerPriority: string | null;
  plan: CompanyPlan;
  milestones: CompanyMilestone[];
  departmentSeats: DepartmentSeat[];
};

export type CompanyBlueprintData = {
  summary: {
    companies: number;
    activePlans: number;
    milestonesComplete: number;
    milestonesBlocked: number;
    departmentSeats: number;
    departmentSeatsInstalled: number;
  };
  companies: CompanyBlueprint[];
};

export async function getCompanyBlueprints(userId: string): Promise<CompanyBlueprintData> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_company_blueprints", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Unable to load company blueprints", error);
    throw new Error("Unable to load company operating blueprints");
  }

  return data as CompanyBlueprintData;
}

import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type AuthorityRule = {
  id: string;
  category: string;
  authorityLevel: "operator" | "owner_approval" | "owner_retained";
  limitText: string;
  conditions: string | null;
  position: number;
};

export type OperatorReview = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "submitted" | "reviewed" | "closed";
  performanceScore: number | null;
  ownerConfidence: number | null;
  resultSummary: string | null;
  wins: string[];
  misses: string[];
  correctiveActions: string[];
  commitments: string[];
  ownerDecision: "pending" | "continue" | "correct" | "replace";
  nextReviewDate: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

export type CompanyOperatorSeat = {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  cashRole: "cash_engine" | "investment" | "asset";
  title: string;
  primaryResult: string;
  mandate: string | null;
  authoritySummary: string | null;
  currentOwner: string | null;
  appointmentStatus: "vacant" | "interim" | "probation" | "active" | "replacement_required";
  appointedAt: string | null;
  reviewCadence: string;
  nextReviewDate: string | null;
  ownerConfidence: number | null;
  hiringJobReference: string | null;
  hiringCandidateReference: string | null;
  riskLevel: "critical" | "high" | "medium" | "low";
  transitionStatus: string;
  incumbentUserId: string | null;
  authorityRules: AuthorityRule[];
  reviews: OperatorReview[];
};

export type OperatorCenterData = {
  summary: {
    totalSeats: number;
    installed: number;
    vacant: number;
    replacementRequired: number;
    reviewsDue: number;
  };
  seats: CompanyOperatorSeat[];
};

export async function getOperatorCenter(userId: string): Promise<OperatorCenterData> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_operator_center", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Unable to load operator center", error);
    throw new Error("Unable to load operator governance data");
  }

  return data as OperatorCenterData;
}

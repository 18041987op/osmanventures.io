import "server-only";

import { hqSupabaseAdmin } from "./supabase-admin";

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus = "open" | "in_progress" | "blocked" | "done" | "cancelled";
export type ActionCategory =
  | "transition"
  | "operator"
  | "capital"
  | "governance"
  | "data"
  | "company_plan"
  | "operating"
  | "other";

export type ActionCompany = {
  id: string;
  name: string;
  slug: string;
};

export type OwnerActionItem = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  systemKey: string | null;
  title: string;
  description: string | null;
  category: ActionCategory;
  priority: ActionPriority;
  status: ActionStatus;
  ownerLabel: string | null;
  dueDate: string | null;
  sourceType: string | null;
  sourceId: string | null;
  sourcePath: string | null;
  evidenceRequired: string | null;
  evidenceNotes: string | null;
  blocker: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerActionCenterData = {
  summary: {
    open: number;
    critical: number;
    blocked: number;
    overdue: number;
    dueSoon: number;
    completed: number;
    systemOpen: number;
    systemResolved: number;
  };
  companies: ActionCompany[];
  actions: OwnerActionItem[];
};

export async function getOwnerActionCenter(userId: string): Promise<OwnerActionCenterData> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_action_center", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Unable to load HQ owner action center", error);
    throw new Error("Unable to load the owner action center");
  }

  return data as OwnerActionCenterData;
}

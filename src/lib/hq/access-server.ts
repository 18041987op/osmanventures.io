import "server-only";

import crypto from "node:crypto";
import { hqSupabaseAdmin } from "./supabase-admin";
import type { HqRole } from "./auth-server";

export type AccessCompany = { id: string; name: string; slug: string; role?: HqRole };

export type AccessUser = {
  id: string;
  fullName: string;
  email: string;
  role: HqRole;
  isActive: boolean;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  mfaEnrolledAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessReviewAt: string | null;
  companies: AccessCompany[];
};

export type AccessInvitation = {
  id: string;
  email: string;
  fullName: string;
  role: HqRole;
  status: "pending" | "accepted" | "revoked" | "expired" | "error";
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  companies: AccessCompany[];
};

export type AuditEvent = {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  companyId: string | null;
  companyName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
};

export type AccessAuditData = {
  summary: {
    activeUsers: number;
    inactiveUsers: number;
    pendingInvitations: number;
    mfaEnrolled: number;
    mfaRequiredNotEnrolled: number;
    auditEvents: number;
  };
  companies: AccessCompany[];
  users: AccessUser[];
  invitations: AccessInvitation[];
  auditEvents: AuditEvent[];
};

export type WorkspaceSeat = {
  id: string;
  title: string;
  seatType: string;
  primaryResult: string;
  mandate: string | null;
  currentOwner: string | null;
  appointmentStatus: string;
  nextReviewDate: string | null;
};

export type WorkspaceMilestone = {
  id: string;
  code: string;
  title: string;
  outcome: string;
  status: string;
  ownerLabel: string | null;
  targetDate: string | null;
  nextAction: string | null;
};

export type WorkspaceCompany = {
  id: string;
  name: string;
  slug: string;
  cashRole: string;
  stage: string;
  accessRole: HqRole;
  plan: null | {
    status: string;
    strategicThesis: string;
    twelveMonthOutcome: string;
    currentConstraint: string | null;
    reviewCadence: string;
    nextReviewDate: string | null;
  };
  milestones: WorkspaceMilestone[];
  seats: WorkspaceSeat[];
  controls: Array<{
    id: string;
    title: string;
    category: string;
    objective: string;
    frequency: string;
    ownerLabel: string | null;
    status: string;
    nextDueDate: string | null;
    evidenceRequired: string | null;
  }>;
};

export type UserWorkspace = {
  profile: {
    id: string;
    fullName: string;
    email: string;
    role: HqRole;
    mfaRequired: boolean;
  };
  companies: WorkspaceCompany[];
};

export type InvitationPreview = {
  id: string;
  email: string;
  fullName: string;
  role: HqRole;
  expiresAt: string;
  companies: AccessCompany[];
};

async function rpc<T>(name: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await hqSupabaseAdmin().rpc(name, parameters);
  if (error) throw new Error(error.message);
  return data as T;
}

export function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getAccessAuditCenter(userId: string): Promise<AccessAuditData> {
  return rpc("hq_get_access_audit_center", { p_user_id: userId });
}

export function getUserWorkspace(userId: string): Promise<UserWorkspace> {
  return rpc("hq_get_user_workspace", { p_user_id: userId });
}

export function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  if (!token || token.length < 20) return Promise.resolve(null);
  return rpc("hq_get_invitation_preview", { p_token_hash: hashInvitationToken(token) });
}

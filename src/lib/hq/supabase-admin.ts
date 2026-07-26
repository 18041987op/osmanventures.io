import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { HqRole } from "./auth-server";

let adminClient: SupabaseClient | null = null;

export function isHqSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.HQ_SUPABASE_URL?.trim() &&
      process.env.HQ_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function hqSupabaseAdmin(): SupabaseClient {
  const url = process.env.HQ_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.HQ_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("HQ Supabase admin access is not configured");
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}

export type HqBootstrapStatus = {
  available: boolean;
  profileCount: number;
};

export async function getHqBootstrapStatus(): Promise<HqBootstrapStatus | null> {
  if (!isHqSupabaseAdminConfigured()) return null;

  const { data, error } = await hqSupabaseAdmin().rpc("hq_bootstrap_status");
  if (error) {
    console.error("Unable to read HQ bootstrap status", error);
    return null;
  }

  const payload = data as { available?: boolean; profile_count?: number } | null;
  return {
    available: Boolean(payload?.available),
    profileCount: Number(payload?.profile_count ?? 0),
  };
}

export type ActiveHqProfile = {
  userId: string;
  fullName: string;
  email: string;
  role: HqRole;
  isActive: boolean;
};

export async function getActiveHqProfile(
  userId: string,
): Promise<ActiveHqProfile | null> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_active_profile", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Unable to read HQ profile", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;

  return {
    userId: String(row.user_id),
    fullName: String(row.full_name),
    email: String(row.email).toLowerCase(),
    role: row.role as HqRole,
    isActive: Boolean(row.is_active),
  };
}

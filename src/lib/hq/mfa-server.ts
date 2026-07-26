import "server-only";

import crypto from "node:crypto";
import { hqSupabaseAdmin } from "./supabase-admin";

export const HQ_MFA_PENDING_COOKIE = "ov_hq_mfa_pending";
const MFA_SESSION_MINUTES = 10;

export type MfaSecurityStatus = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  mfaRequired: boolean;
  mfaEnrolledAt: string | null;
  factors: Array<{
    id: string;
    factorType: string;
    status: string;
    friendlyName: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type PendingMfaSession = {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  factorId: string;
  purpose: "login" | "enroll";
  expiresAt: number;
};

function encryptionKey(): Buffer {
  const secret = process.env.HQ_SESSION_SECRET?.trim();
  if (!secret) throw new Error("HQ_SESSION_SECRET is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptMfaSession(
  value: Omit<PendingMfaSession, "expiresAt">,
): string {
  const payload: PendingMfaSession = {
    ...value,
    expiresAt: Date.now() + MFA_SESSION_MINUTES * 60 * 1000,
  };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptMfaSession(token: string | null | undefined): PendingMfaSession | null {
  if (!token) return null;
  try {
    const [ivPart, tagPart, cipherPart] = token.split(".");
    if (!ivPart || !tagPart || !cipherPart) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(cipherPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(plaintext) as PendingMfaSession;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function mfaPendingCookieOptions(request: Request) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const domain =
    hostname === "osmanventures.io" || hostname.endsWith(".osmanventures.io")
      ? ".osmanventures.io"
      : undefined;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: MFA_SESSION_MINUTES * 60,
    priority: "high" as const,
    ...(domain ? { domain } : {}),
  };
}

export async function getLoginSecurity(userId: string): Promise<{
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  factorId: string | null;
}> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_login_security", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return data as { mfaRequired: boolean; mfaEnrolled: boolean; factorId: string | null };
}

export async function getMfaSecurityStatus(userId: string): Promise<MfaSecurityStatus> {
  const { data, error } = await hqSupabaseAdmin().rpc("hq_get_mfa_status", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return data as MfaSecurityStatus;
}

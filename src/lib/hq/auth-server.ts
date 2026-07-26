import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const HQ_SESSION_COOKIE = "ov_hq_session";
const SESSION_HOURS = 12;

export type HqRole =
  | "owner"
  | "group_executive"
  | "company_operator"
  | "department_manager"
  | "finance_reviewer"
  | "auditor";

export type HqSession = {
  userId: string;
  email: string;
  fullName: string;
  role: HqRole;
  expiresAt: number;
};

function getSessionSecret(): string | null {
  return process.env.HQ_SESSION_SECRET?.trim() || null;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createHqSession(session: Omit<HqSession, "expiresAt">): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("HQ_SESSION_SECRET is not configured");

  const payload: HqSession = {
    ...session,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function readHqSession(token: string | null | undefined): HqSession | null {
  const secret = getSessionSecret();
  if (!token || !secret || !token.includes(".")) return null;

  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) return null;

  const expectedSignature = sign(encoded, secret);
  const provided = Buffer.from(providedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as HqSession;

    if (!session.userId || !session.email || session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function currentHqSession(): Promise<HqSession | null> {
  const cookieStore = await cookies();
  const signedSession = readHqSession(cookieStore.get(HQ_SESSION_COOKIE)?.value);
  if (!signedSession) return null;

  try {
    const { getActiveHqProfile } = await import("./supabase-admin");
    const profile = await getActiveHqProfile(signedSession.userId);

    if (
      !profile ||
      !profile.isActive ||
      profile.email.toLowerCase() !== signedSession.email.toLowerCase()
    ) {
      return null;
    }

    return {
      ...signedSession,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    };
  } catch (error) {
    console.error("Unable to validate HQ session access", error);
    return null;
  }
}

export async function hqAppPath(pathname = ""): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  const normalized = pathname ? `/${pathname.replace(/^\/+/, "")}` : "";
  return host === "hq.osmanventures.io" || host === "hq.localhost"
    ? normalized || "/"
    : `/hq${normalized}`;
}

export async function requireHqSession(): Promise<HqSession> {
  const session = await currentHqSession();
  if (!session) redirect(await hqAppPath("login"));
  return session;
}

export function hqSessionCookieOptions(request: Request) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const sharedDomain =
    hostname === "osmanventures.io" || hostname.endsWith(".osmanventures.io")
      ? ".osmanventures.io"
      : undefined;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: hqSessionMaxAge,
    priority: "high" as const,
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  };
}

export function isHqAuthConfigured(): boolean {
  return Boolean(
    process.env.HQ_SUPABASE_URL?.trim() &&
      process.env.HQ_SUPABASE_ANON_KEY?.trim() &&
      process.env.HQ_SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.HQ_SESSION_SECRET?.trim(),
  );
}

export function isHqBootstrapConfigured(): boolean {
  return Boolean(isHqAuthConfigured() && process.env.HQ_BOOTSTRAP_CODE?.trim());
}

export function isValidHqBootstrapCode(candidate: string): boolean {
  const configured = process.env.HQ_BOOTSTRAP_CODE?.trim();
  if (!configured || !candidate) return false;

  const actualHash = crypto.createHash("sha256").update(candidate).digest();
  const expectedHash = crypto.createHash("sha256").update(configured).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

export const hqSessionMaxAge = SESSION_HOURS * 60 * 60;

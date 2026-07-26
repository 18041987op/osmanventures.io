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
  const expectedSignature = sign(encoded, secret);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);

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
  return readHqSession(cookieStore.get(HQ_SESSION_COOKIE)?.value);
}

async function hqLoginPath(): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  return host === "hq.osmanventures.io" || host === "hq.localhost"
    ? "/login"
    : "/hq/login";
}

export async function requireHqSession(): Promise<HqSession> {
  const session = await currentHqSession();
  if (!session) redirect(await hqLoginPath());
  return session;
}

export function allowedHqEmails(): Set<string> {
  return new Set(
    (process.env.HQ_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isHqAuthConfigured(): boolean {
  return Boolean(
    process.env.HQ_SUPABASE_URL &&
      process.env.HQ_SUPABASE_ANON_KEY &&
      process.env.HQ_SESSION_SECRET &&
      allowedHqEmails().size,
  );
}

export const hqSessionMaxAge = SESSION_HOURS * 60 * 60;

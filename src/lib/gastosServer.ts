// ════════════════════════════════════════════════════════════════
// SERVIDOR — acceso a Supabase con service role (NUNCA llega al navegador)
// + sesión firmada (cookie httpOnly). Solo se importa desde rutas API.
// ════════════════════════════════════════════════════════════════
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ozfmydiutupboupttkmz.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SESSION_SECRET = process.env.GX_SESSION_SECRET || SERVICE_KEY || "dev-secret";
export const SESSION_COOKIE = "gx_session";

let _client: SupabaseClient | null = null;
export function svc(): SupabaseClient {
  if (!SERVICE_KEY) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor");
  if (!_client) _client = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
  return _client;
}

// ── Sesión firmada (HMAC) ───────────────────────────────────────
export interface Session { person: string; slug: string; exp: number; }

function b64url(s: string) { return Buffer.from(s).toString("base64url"); }
function sign(data: string) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
}
export function makeSession(person: string, slug: string, hours = 12): string {
  const payload: Session = { person, slug, exp: Date.now() + hours * 3600_000 };
  const body = b64url(JSON.stringify(payload));
  return body + "." + sign(body);
}
export function readSession(token: string | undefined | null): Session | null {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  if (sign(body) !== mac) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (!s.exp || s.exp < Date.now()) return null;
    return s;
  } catch { return null; }
}

export function sha256hex(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

import { cookies } from "next/headers";
export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}

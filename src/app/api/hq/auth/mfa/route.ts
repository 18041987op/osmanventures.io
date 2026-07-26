import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHqSession,
  HQ_SESSION_COOKIE,
  hqSessionCookieOptions,
  type HqRole,
} from "@/lib/hq/auth-server";
import {
  decryptMfaSession,
  HQ_MFA_PENDING_COOKIE,
  mfaPendingCookieOptions,
} from "@/lib/hq/mfa-server";
import { getActiveHqProfile } from "@/lib/hq/supabase-admin";

function destinationFor(request: Request, role: HqRole): string {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const root = host === "hq.osmanventures.io" || host === "hq.localhost" ? "" : "/hq";
  return role === "owner" ? root || "/" : `${root}/my-work`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim() ?? "";
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the six-digit authenticator code." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pending = decryptMfaSession(cookieStore.get(HQ_MFA_PENDING_COOKIE)?.value);
    if (!pending || pending.purpose !== "login") {
      return NextResponse.json({ error: "The MFA login session expired. Sign in again." }, { status: 401 });
    }

    const supabase = createClient(process.env.HQ_SUPABASE_URL!, process.env.HQ_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: pending.accessToken,
      refresh_token: pending.refreshToken,
    });
    if (sessionError) throw new Error("Unable to restore the MFA login session.");

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pending.factorId,
      code,
    });
    if (verifyError) {
      return NextResponse.json({ error: "The authenticator code is incorrect or expired." }, { status: 401 });
    }

    const profile = await getActiveHqProfile(pending.userId);
    if (!profile || !profile.isActive || profile.email !== pending.email) {
      return NextResponse.json({ error: "This account no longer has active HQ access." }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true, redirectTo: destinationFor(request, profile.role) });
    response.cookies.set(
      HQ_SESSION_COOKIE,
      createHqSession({ userId: profile.userId, email: profile.email, fullName: profile.fullName, role: profile.role }),
      hqSessionCookieOptions(request),
    );
    response.cookies.set(HQ_MFA_PENDING_COOKIE, "", {
      ...mfaPendingCookieOptions(request),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("HQ MFA login verification failed", error);
    return NextResponse.json({ error: "Unable to verify MFA right now." }, { status: 500 });
  }
}

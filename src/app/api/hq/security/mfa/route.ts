import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHqSession,
  currentHqSession,
  HQ_SESSION_COOKIE,
  hqSessionCookieOptions,
} from "@/lib/hq/auth-server";
import {
  decryptMfaSession,
  encryptMfaSession,
  HQ_MFA_PENDING_COOKIE,
  mfaPendingCookieOptions,
} from "@/lib/hq/mfa-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function browserAuthClient() {
  return createClient(process.env.HQ_SUPABASE_URL!, process.env.HQ_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(request: Request) {
  const hqSession = await currentHqSession();
  if (!hqSession) {
    return NextResponse.json({ error: "Active HQ access required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: string; password?: string; code?: string };

    if (body.action === "start") {
      const password = body.password ?? "";
      if (password.length < 8) {
        return NextResponse.json({ error: "Enter your current HQ password." }, { status: 400 });
      }

      const supabase = browserAuthClient();
      const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
        email: hqSession.email,
        password,
      });
      if (signInError || !signedIn.session || signedIn.user.id !== hqSession.userId) {
        return NextResponse.json({ error: "The current password is incorrect." }, { status: 401 });
      }

      const { data: listed } = await supabase.auth.mfa.listFactors();
      for (const factor of listed?.totp ?? []) {
        if (factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Osman Ventures HQ",
      });
      if (enrollError || !enrolled?.id || !enrolled.totp) {
        throw new Error(enrollError?.message || "Unable to create the authenticator factor.");
      }

      const response = NextResponse.json({
        ok: true,
        factorId: enrolled.id,
        qrCode: enrolled.totp.qr_code,
        secret: enrolled.totp.secret,
        uri: enrolled.totp.uri,
      });
      response.cookies.set(
        HQ_MFA_PENDING_COOKIE,
        encryptMfaSession({
          userId: hqSession.userId,
          email: hqSession.email,
          accessToken: signedIn.session.access_token,
          refreshToken: signedIn.session.refresh_token,
          factorId: enrolled.id,
          purpose: "enroll",
        }),
        mfaPendingCookieOptions(request),
      );
      return response;
    }

    if (body.action === "verify") {
      const code = body.code?.trim() ?? "";
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Enter the six-digit authenticator code." }, { status: 400 });
      }

      const cookieStore = await cookies();
      const pending = decryptMfaSession(cookieStore.get(HQ_MFA_PENDING_COOKIE)?.value);
      if (!pending || pending.purpose !== "enroll" || pending.userId !== hqSession.userId) {
        return NextResponse.json({ error: "The enrollment session expired. Start again." }, { status: 401 });
      }

      const supabase = browserAuthClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: pending.accessToken,
        refresh_token: pending.refreshToken,
      });
      if (sessionError) throw new Error("Unable to restore the enrollment session.");

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: pending.factorId,
        code,
      });
      if (verifyError) {
        return NextResponse.json({ error: "The authenticator code is incorrect or expired." }, { status: 401 });
      }

      const { error: markError } = await hqSupabaseAdmin().rpc("hq_mark_mfa_enrolled", {
        p_user_id: hqSession.userId,
        p_factor_id: pending.factorId,
      });
      if (markError) throw new Error(markError.message);

      const response = NextResponse.json({ ok: true });
      response.cookies.set(
        HQ_SESSION_COOKIE,
        createHqSession({
          userId: hqSession.userId,
          email: hqSession.email,
          fullName: hqSession.fullName,
          role: hqSession.role,
        }),
        hqSessionCookieOptions(request),
      );
      response.cookies.set(HQ_MFA_PENDING_COOKIE, "", {
        ...mfaPendingCookieOptions(request),
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ error: "Unknown MFA enrollment action." }, { status: 400 });
  } catch (error) {
    console.error("HQ MFA enrollment failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to enroll MFA." },
      { status: 400 },
    );
  }
}

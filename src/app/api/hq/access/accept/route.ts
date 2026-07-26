import { NextResponse } from "next/server";
import {
  createHqSession,
  HQ_SESSION_COOKIE,
  hqSessionCookieOptions,
} from "@/lib/hq/auth-server";
import { getInvitationPreview, hashInvitationToken } from "@/lib/hq/access-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function validPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function destinationFor(role: string, request: Request): string {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const root = host === "hq.osmanventures.io" || host === "hq.localhost" ? "" : "/hq";
  return role === "owner" || role === "group_executive" ? root || "/" : `${root}/my-work`;
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";
    const preview = await getInvitationPreview(token);

    if (!preview) {
      return NextResponse.json({ error: "This invitation is invalid or expired." }, { status: 410 });
    }
    if (!validPassword(password)) {
      return NextResponse.json(
        { error: "Use at least 12 characters with uppercase, lowercase, and a number." },
        { status: 400 },
      );
    }

    const admin = hqSupabaseAdmin();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: preview.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: preview.fullName, hq_role: preview.role },
    });

    if (createError || !created.user) {
      console.error("Unable to create invited HQ auth user", createError);
      return NextResponse.json(
        { error: createError?.message || "Unable to create this HQ account." },
        { status: 400 },
      );
    }

    createdUserId = created.user.id;
    const { data: profile, error: profileError } = await admin.rpc(
      "hq_accept_access_invitation",
      {
        p_token_hash: hashInvitationToken(token),
        p_auth_user_id: created.user.id,
      },
    );

    if (profileError || !profile) {
      await admin.auth.admin.deleteUser(created.user.id);
      createdUserId = null;
      throw new Error(profileError?.message || "Unable to activate HQ access.");
    }

    const accepted = profile as {
      userId: string;
      email: string;
      fullName: string;
      role: "owner" | "group_executive" | "company_operator" | "department_manager" | "finance_reviewer" | "auditor";
    };
    const response = NextResponse.json({
      ok: true,
      redirectTo: destinationFor(accepted.role, request),
    });
    response.cookies.set(
      HQ_SESSION_COOKIE,
      createHqSession({
        userId: accepted.userId,
        email: accepted.email,
        fullName: accepted.fullName,
        role: accepted.role,
      }),
      hqSessionCookieOptions(request),
    );
    return response;
  } catch (error) {
    console.error("HQ invitation acceptance failed", error);
    if (createdUserId) {
      try {
        await hqSupabaseAdmin().auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error("Unable to clean up failed invited user", cleanupError);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept this invitation." },
      { status: 400 },
    );
  }
}

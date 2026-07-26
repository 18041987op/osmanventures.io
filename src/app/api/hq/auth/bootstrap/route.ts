import { NextResponse } from "next/server";
import {
  createHqSession,
  HQ_SESSION_COOKIE,
  hqSessionMaxAge,
  isHqBootstrapConfigured,
  isValidHqBootstrapCode,
} from "@/lib/hq/auth-server";
import {
  getHqBootstrapStatus,
  hqSupabaseAdmin,
} from "@/lib/hq/supabase-admin";

function destinationFor(request: Request): string {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  return host === "hq.osmanventures.io" || host === "hq.localhost" ? "/" : "/hq";
}

function validPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    if (!isHqBootstrapConfigured()) {
      return NextResponse.json(
        { error: "Owner activation is not configured yet." },
        { status: 503 },
      );
    }

    const status = await getHqBootstrapStatus();
    if (!status?.available) {
      return NextResponse.json(
        { error: "The owner account has already been activated." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      activationCode?: string;
    };

    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const activationCode = body.activationCode ?? "";

    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter your full name and a valid email address." },
        { status: 400 },
      );
    }

    if (!validPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Use at least 12 characters with uppercase, lowercase, and a number.",
        },
        { status: 400 },
      );
    }

    if (!isValidHqBootstrapCode(activationCode)) {
      return NextResponse.json(
        { error: "The one-time activation key is incorrect." },
        { status: 403 },
      );
    }

    const admin = hqSupabaseAdmin();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError || !created.user) {
      console.error("Unable to create HQ owner auth user", createError);
      return NextResponse.json(
        { error: "Unable to create the owner account." },
        { status: 400 },
      );
    }

    createdUserId = created.user.id;

    const { data: profile, error: profileError } = await admin.rpc(
      "hq_bootstrap_owner",
      {
        p_user_id: created.user.id,
        p_full_name: fullName,
        p_email: email,
      },
    );

    if (profileError || !profile) {
      console.error("Unable to bootstrap HQ owner profile", profileError);
      await admin.auth.admin.deleteUser(created.user.id);
      createdUserId = null;
      return NextResponse.json(
        { error: "Unable to activate the owner profile." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: destinationFor(request),
    });

    response.cookies.set(
      HQ_SESSION_COOKIE,
      createHqSession({
        userId: created.user.id,
        email,
        fullName,
        role: "owner",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: hqSessionMaxAge,
      },
    );

    return response;
  } catch (error) {
    console.error("HQ owner activation failed", error);

    if (createdUserId) {
      try {
        await hqSupabaseAdmin().auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error("Unable to clean up failed HQ auth user", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Unable to complete owner activation." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  HQ_SESSION_COOKIE,
  allowedHqEmails,
  createHqSession,
  hqSessionMaxAge,
  isHqAuthConfigured,
} from "@/lib/hq/auth-server";

function destinationFor(request: Request): string {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  return host === "hq.osmanventures.io" || host === "hq.localhost" ? "/" : "/hq";
}

export async function POST(request: Request) {
  try {
    if (!isHqAuthConfigured()) {
      return NextResponse.json(
        { error: "HQ access is not configured yet." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "Enter a valid email and password." },
        { status: 400 },
      );
    }

    if (!allowedHqEmails().has(email)) {
      return NextResponse.json(
        { error: "This account is not authorized for Osman Ventures HQ." },
        { status: 403 },
      );
    }

    const supabase = createClient(
      process.env.HQ_SUPABASE_URL!,
      process.env.HQ_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || data.user.email?.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    const fullName =
      (data.user.user_metadata?.full_name as string | undefined)?.trim() ||
      email.split("@")[0];

    const response = NextResponse.json({
      ok: true,
      redirectTo: destinationFor(request),
    });

    response.cookies.set(
      HQ_SESSION_COOKIE,
      createHqSession({
        userId: data.user.id,
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
    console.error("HQ login failed", error);
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}

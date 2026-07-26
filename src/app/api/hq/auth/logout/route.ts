import { NextResponse } from "next/server";
import { HQ_SESSION_COOKIE } from "@/lib/hq/auth-server";

export async function POST(request: Request) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const loginPath =
    host === "hq.osmanventures.io" || host === "hq.localhost"
      ? "/login"
      : "/hq/login";
  const response = NextResponse.redirect(new URL(loginPath, request.url), 303);

  response.cookies.set(HQ_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

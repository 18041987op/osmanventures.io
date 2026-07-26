import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";

export async function GET() {
  const session = await currentHqSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

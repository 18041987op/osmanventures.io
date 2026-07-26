import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { action?: string };
    const functionName =
      body.action === "refresh_sources"
        ? "hq_refresh_autorx_source_health"
        : body.action === "sync_metrics"
          ? "hq_sync_autorx_verified_metrics"
          : null;

    if (!functionName) {
      return NextResponse.json({ error: "Unknown scorecard action." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(functionName, {
      p_user_id: session.userId,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    console.error("Scorecard automation action failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to refresh scorecard data." },
      { status: 400 },
    );
  }
}

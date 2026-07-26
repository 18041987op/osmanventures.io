import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function cleanLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 25);
}

export async function PUT(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      weekStart?: string;
      status?: string;
      wins?: unknown[];
      misses?: unknown[];
      criticalIssues?: unknown[];
      decisionsTaken?: unknown[];
      decisionsRequired?: unknown[];
      nextCommitments?: unknown[];
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart ?? "")) {
      return NextResponse.json({ error: "A valid week is required." }, { status: 400 });
    }
    if (body.status !== "draft" && body.status !== "submitted") {
      return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_save_autorx_weekly_review",
      {
        p_actor_user_id: session.userId,
        p_week_start: body.weekStart,
        p_status: body.status,
        p_wins: cleanLines(body.wins),
        p_misses: cleanLines(body.misses),
        p_critical_issues: cleanLines(body.criticalIssues),
        p_decisions_taken: cleanLines(body.decisionsTaken),
        p_decisions_required: cleanLines(body.decisionsRequired),
        p_next_commitments: cleanLines(body.nextCommitments),
      },
    );

    if (error) {
      console.error("Unable to save AutoRx weekly review", error);
      return NextResponse.json(
        { error: "Unable to save the weekly review." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, review: data });
  } catch (error) {
    console.error("AutoRx weekly review update failed", error);
    return NextResponse.json(
      { error: "Unable to save the weekly review." },
      { status: 500 },
    );
  }
}

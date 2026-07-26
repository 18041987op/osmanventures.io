import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const statuses = new Set(["active", "passed", "failed", "cancelled"]);

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      summary?: string;
      decision?: string;
      baselineMetrics?: Record<string, unknown>;
      outcomeMetrics?: Record<string, unknown>;
    };
    const status = body.status?.trim() ?? "";

    if (!statuses.has(status)) {
      return NextResponse.json({ error: "Select a valid test status." }, { status: 400 });
    }
    if ((status === "passed" || status === "failed") && (body.decision?.trim().length ?? 0) < 3) {
      return NextResponse.json(
        { error: "A written owner decision is required to complete the test." },
        { status: 400 },
      );
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_update_autorx_absence_test_run",
      {
        p_actor_user_id: session.userId,
        p_run_id: id,
        p_status: status,
        p_summary: body.summary?.trim() || null,
        p_decision: body.decision?.trim() || null,
        p_baseline_metrics: body.baselineMetrics ?? null,
        p_outcome_metrics: body.outcomeMetrics ?? null,
      },
    );

    if (error) {
      console.error("Unable to update AutoRx absence test", error);
      return NextResponse.json(
        { error: error.message || "Unable to update the test." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, run: data });
  } catch (error) {
    console.error("AutoRx absence test update failed", error);
    return NextResponse.json(
      { error: "Unable to update the test." },
      { status: 500 },
    );
  }
}

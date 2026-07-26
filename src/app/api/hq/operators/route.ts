import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function text(value: unknown, max = 5000): string {
  return String(value ?? "").trim().slice(0, max);
}

function nullableDate(value: unknown): string | null {
  const cleaned = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function nullableScore(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function lines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item, 1000)).filter(Boolean).slice(0, 25);
  }
  return text(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 25);
}

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 60);
    let rpcName: string;
    let parameters: Record<string, unknown>;

    if (action === "update_seat") {
      rpcName = "hq_update_operator_seat";
      parameters = {
        p_actor_user_id: session.userId,
        p_seat_id: text(body.seatId, 36),
        p_current_owner_label: text(body.currentOwner, 250),
        p_appointment_status: text(body.appointmentStatus, 40),
        p_appointed_at: nullableDate(body.appointedAt),
        p_next_review_date: nullableDate(body.nextReviewDate),
        p_owner_confidence: nullableScore(body.ownerConfidence),
        p_hiring_job_reference: text(body.hiringJobReference, 500),
        p_hiring_candidate_reference: text(body.hiringCandidateReference, 500),
        p_mandate: text(body.mandate),
        p_operator_risk_level: text(body.riskLevel, 20),
      };
    } else if (action === "save_review") {
      rpcName = "hq_save_operator_review";
      parameters = {
        p_actor_user_id: session.userId,
        p_seat_id: text(body.seatId, 36),
        p_period_start: nullableDate(body.periodStart),
        p_period_end: nullableDate(body.periodEnd),
        p_status: text(body.status, 20),
        p_performance_score: nullableScore(body.performanceScore),
        p_owner_confidence: nullableScore(body.ownerConfidence),
        p_result_summary: text(body.resultSummary),
        p_wins: lines(body.wins),
        p_misses: lines(body.misses),
        p_corrective_actions: lines(body.correctiveActions),
        p_commitments: lines(body.commitments),
        p_owner_decision: text(body.ownerDecision, 20),
        p_next_review_date: nullableDate(body.nextReviewDate),
      };
    } else {
      return NextResponse.json({ error: "Unknown operator action." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(rpcName, parameters);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    console.error("Operator governance action failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save operator data." },
      { status: 400 },
    );
  }
}

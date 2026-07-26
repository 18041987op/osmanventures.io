import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function text(value: unknown, max = 8000) {
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

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 60);
    let rpcName = "";
    let parameters: Record<string, unknown> = {};

    if (action === "update_plan") {
      rpcName = "hq_update_company_plan";
      parameters = {
        p_actor_user_id: session.userId,
        p_plan_id: text(body.planId, 36),
        p_status: text(body.status, 20),
        p_strategic_thesis: text(body.strategicThesis),
        p_twelve_month_outcome: text(body.twelveMonthOutcome),
        p_current_constraint: text(body.currentConstraint),
        p_operating_model: text(body.operatingModel),
        p_review_cadence: text(body.reviewCadence, 50),
        p_next_review_date: nullableDate(body.nextReviewDate),
        p_capital_rule: text(body.capitalRule),
        p_stop_condition: text(body.stopCondition),
        p_owner_notes: text(body.ownerNotes),
      };
    } else if (action === "update_milestone") {
      rpcName = "hq_update_company_milestone";
      parameters = {
        p_actor_user_id: session.userId,
        p_milestone_id: text(body.milestoneId, 36),
        p_status: text(body.status, 30),
        p_owner_label: text(body.ownerLabel, 250),
        p_target_date: nullableDate(body.targetDate),
        p_evidence: text(body.evidence),
        p_blocker: text(body.blocker),
        p_next_action: text(body.nextAction),
      };
    } else if (action === "update_department_seat") {
      rpcName = "hq_update_department_seat";
      parameters = {
        p_actor_user_id: session.userId,
        p_seat_id: text(body.seatId, 36),
        p_current_owner_label: text(body.currentOwner, 250),
        p_appointment_status: text(body.appointmentStatus, 40),
        p_owner_confidence: nullableScore(body.ownerConfidence),
        p_next_review_date: nullableDate(body.nextReviewDate),
        p_mandate: text(body.mandate),
        p_operator_risk_level: text(body.riskLevel, 20),
      };
    } else {
      return NextResponse.json({ error: "Unknown company blueprint action." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(rpcName, parameters);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    console.error("Company blueprint action failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save company blueprint data." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function text(value: unknown, max = 5000): string {
  return String(value ?? "").trim().slice(0, max);
}

function nullableText(value: unknown, max = 5000): string | null {
  const cleaned = text(value, max);
  return cleaned || null;
}

function nullableDate(value: unknown): string | null {
  const cleaned = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item, 1000)).filter(Boolean).slice(0, 20);
  }
  return text(value, 5000)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function call(functionName: string, parameters: Record<string, unknown>) {
  const { data, error } = await hqSupabaseAdmin().rpc(functionName, parameters);
  if (error) throw new Error(error.message);
  return data;
}

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 80);
    let result: unknown;

    switch (action) {
      case "save_reserve_policy":
        result = await call("hq_save_reserve_policy", {
          p_actor_user_id: session.userId,
          p_current_cash: nullableNumber(body.currentCash),
          p_payroll_buffer: numberValue(body.payrollBuffer),
          p_vendor_buffer: numberValue(body.vendorBuffer),
          p_tax_buffer: numberValue(body.taxBuffer),
          p_debt_and_rent_buffer: numberValue(body.debtAndRentBuffer),
          p_emergency_buffer: numberValue(body.emergencyBuffer),
          p_other_buffer: numberValue(body.otherBuffer),
          p_notes: text(body.notes),
          p_status: text(body.status, 20),
        });
        break;

      case "create_capital_request":
        result = await call("hq_create_capital_request", {
          p_actor_user_id: session.userId,
          p_company_id: text(body.companyId, 36),
          p_funding_company_id: text(body.fundingCompanyId, 36),
          p_title: text(body.title, 250),
          p_amount: numberValue(body.amount),
          p_purpose: text(body.purpose),
          p_expected_result: text(body.expectedResult),
          p_milestone: text(body.milestone),
          p_review_date: nullableDate(body.reviewDate),
          p_stop_condition: text(body.stopCondition),
          p_request_type: text(body.requestType, 60),
          p_priority: text(body.priority, 30),
        });
        break;

      case "update_capital_request":
        result = await call("hq_update_capital_request", {
          p_actor_user_id: session.userId,
          p_request_id: text(body.id, 36),
          p_status: text(body.status, 20),
          p_approved_amount: nullableNumber(body.approvedAmount),
          p_owner_notes: text(body.ownerNotes),
        });
        break;

      case "create_decision":
        result = await call("hq_create_decision", {
          p_actor_user_id: session.userId,
          p_company_id: text(body.companyId, 36) || null,
          p_title: text(body.title, 250),
          p_context: text(body.context),
          p_options: stringList(body.options),
          p_assumptions: stringList(body.assumptions),
          p_decision_type: text(body.decisionType, 60),
          p_priority: text(body.priority, 30),
          p_expected_result: text(body.expectedResult),
          p_due_date: nullableDate(body.dueDate),
          p_review_date: nullableDate(body.reviewDate),
          p_linked_entity_type: nullableText(body.linkedEntityType, 80),
          p_linked_entity_id: nullableText(body.linkedEntityId, 120),
        });
        break;

      case "update_decision":
        result = await call("hq_update_decision", {
          p_actor_user_id: session.userId,
          p_decision_id: text(body.id, 36),
          p_status: text(body.status, 20),
          p_decision: text(body.decision),
          p_actual_result: text(body.actualResult),
          p_lessons: text(body.lessons),
        });
        break;

      case "create_risk":
        result = await call("hq_create_risk", {
          p_actor_user_id: session.userId,
          p_company_id: text(body.companyId, 36) || null,
          p_title: text(body.title, 250),
          p_category: text(body.category, 80),
          p_description: text(body.description),
          p_probability: numberValue(body.probability, 1),
          p_impact: numberValue(body.impact, 1),
          p_owner_label: text(body.ownerLabel, 250),
          p_mitigation_plan: text(body.mitigationPlan),
          p_trigger_condition: text(body.triggerCondition),
          p_next_review_date: nullableDate(body.nextReviewDate),
        });
        break;

      case "update_risk":
        result = await call("hq_update_risk", {
          p_actor_user_id: session.userId,
          p_risk_id: text(body.id, 36),
          p_status: text(body.status, 20),
          p_probability: numberValue(body.probability, 1),
          p_impact: numberValue(body.impact, 1),
          p_owner_label: text(body.ownerLabel, 250),
          p_mitigation_plan: text(body.mitigationPlan),
          p_trigger_condition: text(body.triggerCondition),
          p_next_review_date: nullableDate(body.nextReviewDate),
          p_residual_probability: nullableNumber(body.residualProbability),
          p_residual_impact: nullableNumber(body.residualImpact),
        });
        break;

      case "create_control":
        result = await call("hq_create_control", {
          p_actor_user_id: session.userId,
          p_company_id: text(body.companyId, 36) || null,
          p_title: text(body.title, 250),
          p_category: text(body.category, 80),
          p_objective: text(body.objective),
          p_frequency: text(body.frequency, 60),
          p_owner_label: text(body.ownerLabel, 250),
          p_evidence_required: text(body.evidenceRequired),
          p_is_owner_retained: Boolean(body.isOwnerRetained),
          p_next_due_date: nullableDate(body.nextDueDate),
        });
        break;

      case "update_control":
        result = await call("hq_update_control", {
          p_actor_user_id: session.userId,
          p_control_id: text(body.id, 36),
          p_status: text(body.status, 20),
          p_owner_label: text(body.ownerLabel, 250),
          p_evidence_required: text(body.evidenceRequired),
          p_next_due_date: nullableDate(body.nextDueDate),
          p_notes: text(body.notes),
          p_mark_completed: Boolean(body.markCompleted),
        });
        break;

      default:
        return NextResponse.json({ error: "Unknown governance action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("HQ governance action failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save governance data." },
      { status: 400 },
    );
  }
}

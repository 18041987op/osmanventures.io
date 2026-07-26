import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(
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
      weekStart?: string;
      target?: number | string | null;
      actual?: number | string | null;
      varianceExplanation?: string;
      correctiveAction?: string;
      actionDueDate?: string | null;
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart ?? "")) {
      return NextResponse.json({ error: "A valid week is required." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_upsert_autorx_metric_result",
      {
        p_actor_user_id: session.userId,
        p_metric_id: id,
        p_week_start: body.weekStart,
        p_target: toNullableNumber(body.target),
        p_actual: toNullableNumber(body.actual),
        p_variance_explanation: body.varianceExplanation?.trim() ?? "",
        p_corrective_action: body.correctiveAction?.trim() ?? "",
        p_action_due_date: body.actionDueDate || null,
      },
    );

    if (error) {
      console.error("Unable to save AutoRx metric result", error);
      return NextResponse.json(
        { error: "Unable to save the metric result." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    console.error("AutoRx metric result update failed", error);
    return NextResponse.json(
      { error: "Unable to save the metric result." },
      { status: 500 },
    );
  }
}

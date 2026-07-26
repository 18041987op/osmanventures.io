import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const allowedStatuses = new Set([
  "not_started",
  "in_progress",
  "blocked",
  "complete",
]);

function cleanText(value: unknown, maxLength: number): string | null {
  const cleaned = String(value ?? "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
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
      status?: string;
      evidence?: string;
      notes?: string;
      dueDate?: string | null;
    };

    if (!body.status || !allowedStatuses.has(body.status)) {
      return NextResponse.json(
        { error: "Invalid milestone status." },
        { status: 400 },
      );
    }

    if (body.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_update_autorx_90_day_milestone",
      {
        p_user_id: session.userId,
        p_milestone_id: id,
        p_status: body.status,
        p_evidence: cleanText(body.evidence, 3000),
        p_notes: cleanText(body.notes, 3000),
        p_due_date: body.dueDate || null,
      },
    );

    if (error) {
      console.error("Unable to update AutoRx 90 day milestone", error);
      return NextResponse.json(
        { error: "Unable to update the milestone." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, plan: data });
  } catch (error) {
    console.error("AutoRx 90 day milestone update failed", error);
    return NextResponse.json(
      { error: "Unable to update the milestone." },
      { status: 500 },
    );
  }
}

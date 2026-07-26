import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const eventKinds = new Set([
  "owner_contact",
  "owner_intervention",
  "emergency_intervention",
  "critical_incident",
  "operating_exception",
  "evidence",
]);
const severities = new Set(["low", "medium", "high", "critical"]);

export async function POST(
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
      eventKind?: string;
      severity?: string;
      title?: string;
      details?: string;
      businessImpact?: string;
      resolution?: string;
      causedFailure?: boolean;
    };
    const eventKind = body.eventKind?.trim() ?? "";
    const severity = body.severity?.trim() ?? "";
    const title = body.title?.trim() ?? "";

    if (!eventKinds.has(eventKind) || !severities.has(severity)) {
      return NextResponse.json(
        { error: "Select a valid event type and severity." },
        { status: 400 },
      );
    }
    if (title.length < 3) {
      return NextResponse.json({ error: "An event title is required." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_add_autorx_absence_test_event",
      {
        p_actor_user_id: session.userId,
        p_run_id: id,
        p_event_kind: eventKind,
        p_severity: severity,
        p_title: title,
        p_details: body.details?.trim() || null,
        p_business_impact: body.businessImpact?.trim() || null,
        p_resolution: body.resolution?.trim() || null,
        p_caused_failure: Boolean(body.causedFailure),
      },
    );

    if (error) {
      console.error("Unable to log AutoRx absence test event", error);
      return NextResponse.json(
        { error: error.message || "Unable to log the event." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, event: data });
  } catch (error) {
    console.error("AutoRx absence test event failed", error);
    return NextResponse.json(
      { error: "Unable to log the event." },
      { status: 500 },
    );
  }
}

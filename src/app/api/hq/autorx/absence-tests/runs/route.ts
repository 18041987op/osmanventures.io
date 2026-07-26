import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      templateId?: string;
      startDate?: string;
    };
    const templateId = body.templateId?.trim() ?? "";
    const startDate = body.startDate?.trim() ?? "";

    if (!/^[0-9a-f-]{36}$/i.test(templateId)) {
      return NextResponse.json({ error: "A valid test is required." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json({ error: "Select a valid start date." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_schedule_autorx_absence_test",
      {
        p_actor_user_id: session.userId,
        p_template_id: templateId,
        p_start_date: startDate,
        p_operator_user_id: null,
      },
    );

    if (error) {
      console.error("Unable to schedule AutoRx absence test", error);
      return NextResponse.json(
        { error: error.message || "Unable to schedule the test." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, run: data });
  } catch (error) {
    console.error("AutoRx absence test scheduling failed", error);
    return NextResponse.json(
      { error: "Unable to schedule the test." },
      { status: 500 },
    );
  }
}

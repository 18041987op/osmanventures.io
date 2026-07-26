import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const allowedStatuses = new Set(["draft", "active", "paused", "completed"]);

export async function PUT(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      startDate?: string;
      status?: string;
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate ?? "")) {
      return NextResponse.json(
        { error: "A valid GM start date is required." },
        { status: 400 },
      );
    }

    if (!body.status || !allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: "Invalid plan status." }, { status: 400 });
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_activate_autorx_90_day_plan",
      {
        p_user_id: session.userId,
        p_start_date: body.startDate,
        p_status: body.status,
      },
    );

    if (error) {
      console.error("Unable to update AutoRx 90 day plan", error);
      return NextResponse.json(
        { error: "Unable to update the 30/60/90 plan." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, plan: data });
  } catch (error) {
    console.error("AutoRx 90 day plan update failed", error);
    return NextResponse.json(
      { error: "Unable to update the 30/60/90 plan." },
      { status: 500 },
    );
  }
}

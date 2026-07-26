import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const dependencyTypes = new Set([
  "decision",
  "approval",
  "relationship",
  "knowledge",
  "system_access",
  "execution",
]);
const riskLevels = new Set(["critical", "high", "medium"]);

export async function POST(request: Request) {
  const session = await currentHqSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      type?: string;
      title?: string;
      riskLevel?: string;
      targetOwner?: string;
      riskIfAbsent?: string;
      nextAction?: string;
      dueDate?: string | null;
    };

    const type = body.type?.trim() ?? "";
    const title = body.title?.trim() ?? "";
    const riskLevel = body.riskLevel?.trim() ?? "";

    if (!dependencyTypes.has(type) || !riskLevels.has(riskLevel) || title.length < 4) {
      return NextResponse.json(
        { error: "Complete the dependency type, title, and risk level." },
        { status: 400 },
      );
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_create_autorx_dependency",
      {
        p_actor_user_id: session.userId,
        p_dependency_type: type,
        p_title: title,
        p_risk_level: riskLevel,
        p_target_owner_label: body.targetOwner?.trim() ?? "",
        p_risk_if_absent: body.riskIfAbsent?.trim() ?? "",
        p_next_action: body.nextAction?.trim() ?? "",
        p_due_date: body.dueDate || null,
      },
    );

    if (error) {
      console.error("Unable to create AutoRx dependency", error);
      return NextResponse.json(
        { error: "Unable to create the dependency." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, dependency: data }, { status: 201 });
  } catch (error) {
    console.error("AutoRx dependency creation failed", error);
    return NextResponse.json(
      { error: "Unable to save the dependency." },
      { status: 500 },
    );
  }
}

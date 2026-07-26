import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const documentationStatuses = new Set(["missing", "draft", "verified"]);
const delegationStatuses = new Set(["not_started", "training", "delegated", "tested"]);

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
      documentationStatus?: string;
      delegationStatus?: string;
      nextAction?: string;
      dueDate?: string | null;
    };

    const documentationStatus = body.documentationStatus?.trim() ?? "";
    const delegationStatus = body.delegationStatus?.trim() ?? "";

    if (
      !documentationStatuses.has(documentationStatus) ||
      !delegationStatuses.has(delegationStatus)
    ) {
      return NextResponse.json(
        { error: "Select valid documentation and delegation statuses." },
        { status: 400 },
      );
    }

    const { data, error } = await hqSupabaseAdmin().rpc(
      "hq_update_autorx_dependency",
      {
        p_actor_user_id: session.userId,
        p_dependency_id: id,
        p_documentation_status: documentationStatus,
        p_delegation_status: delegationStatus,
        p_next_action: body.nextAction?.trim() ?? "",
        p_due_date: body.dueDate || null,
      },
    );

    if (error) {
      console.error("Unable to update AutoRx dependency", error);
      return NextResponse.json(
        { error: "Unable to update the dependency." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, dependency: data });
  } catch (error) {
    console.error("AutoRx dependency update failed", error);
    return NextResponse.json(
      { error: "Unable to save the dependency." },
      { status: 500 },
    );
  }
}

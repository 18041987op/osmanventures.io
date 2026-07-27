import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const statuses = new Set(["open", "in_progress", "blocked", "done", "cancelled"]);
const priorities = new Set(["critical", "high", "medium", "low"]);
const categories = new Set([
  "transition",
  "operator",
  "capital",
  "governance",
  "data",
  "company_plan",
  "operating",
  "other",
]);

function text(value: unknown, max = 2000): string {
  return String(value ?? "").trim().slice(0, max);
}

function nullableUuid(value: unknown): string | null {
  const candidate = text(value, 36);
  return /^[0-9a-f-]{36}$/i.test(candidate) ? candidate : null;
}

function nullableDate(value: unknown): string | null {
  const candidate = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

async function rpc(name: string, parameters: Record<string, unknown>) {
  const { data, error } = await hqSupabaseAdmin().rpc(name, parameters);
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
    const action = text(body.action, 40);

    if (action === "sync") {
      const result = await rpc("hq_sync_action_items", {
        p_actor_user_id: session.userId,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (action === "create") {
      const category = text(body.category, 40);
      const priority = text(body.priority, 20);
      if (!categories.has(category) || !priorities.has(priority)) {
        return NextResponse.json({ error: "Select a valid category and priority." }, { status: 400 });
      }

      const result = await rpc("hq_create_action_item", {
        p_actor_user_id: session.userId,
        p_company_id: nullableUuid(body.companyId),
        p_title: text(body.title, 250),
        p_description: text(body.description, 3000) || null,
        p_category: category,
        p_priority: priority,
        p_owner_label: text(body.ownerLabel, 250) || null,
        p_due_date: nullableDate(body.dueDate),
        p_evidence_required: text(body.evidenceRequired, 3000) || null,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (action === "update") {
      const actionId = nullableUuid(body.actionId);
      const status = text(body.status, 30);
      const priority = text(body.priority, 20);
      if (!actionId || !statuses.has(status) || !priorities.has(priority)) {
        return NextResponse.json({ error: "Select a valid action, status, and priority." }, { status: 400 });
      }

      const result = await rpc("hq_update_action_item", {
        p_actor_user_id: session.userId,
        p_action_id: actionId,
        p_status: status,
        p_priority: priority,
        p_owner_label: text(body.ownerLabel, 250) || null,
        p_due_date: nullableDate(body.dueDate),
        p_evidence_notes: text(body.evidenceNotes, 4000) || null,
        p_blocker: text(body.blocker, 3000) || null,
      });
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: "Unknown action request." }, { status: 400 });
  } catch (error) {
    console.error("HQ owner action center request failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update owner actions." },
      { status: 400 },
    );
  }
}

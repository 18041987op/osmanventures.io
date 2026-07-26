import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { currentHqSession } from "@/lib/hq/auth-server";
import { hashInvitationToken } from "@/lib/hq/access-server";
import { hqSupabaseAdmin } from "@/lib/hq/supabase-admin";

const allowedInviteRoles = new Set([
  "group_executive",
  "company_operator",
  "department_manager",
  "finance_reviewer",
  "auditor",
]);

function text(value: unknown, max = 1000): string {
  return String(value ?? "").trim().slice(0, max);
}

function companyIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => text(item, 36)).filter(Boolean).slice(0, 20)
    : [];
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
    const action = text(body.action, 60);

    if (action === "create_invitation") {
      const email = text(body.email, 320).toLowerCase();
      const fullName = text(body.fullName, 250);
      const role = text(body.role, 40);
      const companies = companyIds(body.companyIds);
      const expirationDays = Math.min(
        Math.max(Number(body.expirationDays) || 7, 1),
        30,
      );

      if (!allowedInviteRoles.has(role)) {
        return NextResponse.json(
          { error: "Select a valid invitation role." },
          { status: 400 },
        );
      }

      const token = crypto.randomBytes(32).toString("base64url");
      const expiresAt = new Date(
        Date.now() + expirationDays * 86_400_000,
      ).toISOString();
      const result = await rpc("hq_create_access_invitation", {
        p_actor_user_id: session.userId,
        p_token_hash: hashInvitationToken(token),
        p_email: email,
        p_full_name: fullName,
        p_role: role,
        p_company_ids: companies,
        p_expires_at: expiresAt,
      });
      const siteUrl = (
        process.env.HQ_SITE_URL?.trim() || "https://hq.osmanventures.io"
      ).replace(/\/$/, "");

      return NextResponse.json({
        ok: true,
        result,
        invitationUrl: `${siteUrl}/invite/accept?token=${encodeURIComponent(token)}`,
      });
    }

    if (action === "revoke_invitation") {
      const result = await rpc("hq_revoke_access_invitation", {
        p_actor_user_id: session.userId,
        p_invitation_id: text(body.invitationId, 36),
      });
      return NextResponse.json({ ok: true, result });
    }

    if (action === "update_user") {
      if (body.mfaRequired === true) {
        return NextResponse.json(
          {
            error:
              "MFA enforcement is intentionally deferred until the complete login and recovery flow is tested.",
          },
          { status: 400 },
        );
      }

      const result = await rpc("hq_update_user_access", {
        p_actor_user_id: session.userId,
        p_target_user_id: text(body.userId, 36),
        p_role: text(body.role, 40),
        p_is_active: Boolean(body.isActive),
        p_company_ids: companyIds(body.companyIds),
        p_mfa_required: false,
      });
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json(
      { error: "Unknown access action." },
      { status: 400 },
    );
  } catch (error) {
    console.error("HQ access action failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to manage HQ access.",
      },
      { status: 400 },
    );
  }
}

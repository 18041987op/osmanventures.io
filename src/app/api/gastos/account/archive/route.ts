import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const { error } = await svc().from("accounts").update({ archived: true }).eq("id", id).eq("owner", s.person);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

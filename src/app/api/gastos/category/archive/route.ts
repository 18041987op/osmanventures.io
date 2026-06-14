import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const { key } = (await req.json()) as { key?: string };
    if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 });
    const { error } = await svc().from("categories").update({ archived: true }).eq("owner", s.person).eq("key", key);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

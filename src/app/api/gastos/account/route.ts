import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { id?: string; name?: string; bank?: string; kind?: string; color?: string; person?: string };
    const owner = s.person === "admin" ? b.person : s.person;
    if (!owner) return NextResponse.json({ error: "Falta usuario destino" }, { status: 400 });
    if (!b.name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const row = { owner, name: b.name.trim(), bank: b.bank?.trim() || null, kind: b.kind || "bank", color: b.color || "#5C6BC0" };
    const sb = svc();
    const { error } = b.id
      ? await sb.from("accounts").update(row).eq("id", b.id).eq("owner", owner)
      : await sb.from("accounts").insert(row);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { slugify } from "@/lib/gastos";
export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { label?: string; emoji?: string; color?: string; parent_key?: string | null; person?: string };
    const owner = s.person === "admin" ? b.person : s.person;
    if (!owner) return NextResponse.json({ error: "Falta usuario destino" }, { status: 400 });
    if (!b.label?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const sb = svc();
    const { data: existing } = await sb.from("categories").select("key").eq("owner", owner);
    const keys = new Set((existing || []).map((c) => c.key));
    let key = slugify(b.label), i = 2;
    while (keys.has(key)) key = slugify(b.label) + "_" + i++;
    const { error } = await sb.from("categories").insert({
      owner, key, label: b.label.trim(), emoji: b.emoji || "🏷️", color: b.color || "#5C6BC0",
      parent_key: b.parent_key || null, is_custom: true, sort_order: (existing || []).length,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

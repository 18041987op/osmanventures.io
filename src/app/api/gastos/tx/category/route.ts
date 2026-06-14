import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { KNOWN_CATS } from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { id?: string | number; category?: string; subcategory?: string | null };
    if (!b.id || !b.category) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const label = KNOWN_CATS[b.category]?.label || null;
    const { error } = await svc().from("transactions")
      .update({ category: b.category, subcategory: b.subcategory || null, cat_label: label })
      .eq("id", b.id).eq("person", s.person);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

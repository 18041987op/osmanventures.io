import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { KNOWN_CATS, merchantKey } from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { id?: string | number; category?: string; subcategory?: string | null; person?: string };
    if (!b.id || !b.category) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const owner = s.person === "admin" && b.person ? b.person : s.person;
    const sb = svc();
    const label = KNOWN_CATS[b.category]?.label || null;
    // actualizar el movimiento
    const { data: row, error } = await sb.from("transactions")
      .update({ category: b.category, subcategory: b.subcategory || null, cat_label: label })
      .eq("id", b.id).eq("person", owner).select("original_description,description").maybeSingle();
    if (error) throw error;
    // aprender la regla (memoria) si hay un comercio reconocible
    const mk = merchantKey((row?.original_description || row?.description || "") as string);
    if (mk && mk.length >= 3) {
      await sb.from("category_rules").upsert(
        { owner, merchant: mk, category: b.category, updated_at: new Date().toISOString() },
        { onConflict: "owner,merchant" });
    }
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

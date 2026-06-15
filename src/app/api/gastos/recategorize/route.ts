import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { guessConcept, resolveConceptKey, KNOWN_CATS } from "@/lib/gastos";

export async function POST() {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const sb = svc();
    // claves de categoría que ya usa el usuario (para respetar su vocabulario)
    const { data: catRows } = await sb.from("categories").select("key").eq("owner", s.person).eq("archived", false);
    const available = new Set((catRows || []).map((c) => c.key));
    // transacciones sin clasificar (otros / other)
    const { data } = await sb.from("transactions")
      .select("id,original_description,description,category")
      .eq("person", s.person).in("category", ["otros", "other"]).limit(8000);
    let changed = 0;
    for (const t of (data || [])) {
      const concept = guessConcept(t.original_description || t.description || "");
      if (concept === "otros") continue;
      const key = resolveConceptKey(concept, available);
      if (key && key !== t.category) {
        const { error } = await sb.from("transactions")
          .update({ category: key, cat_label: KNOWN_CATS[key]?.label || null }).eq("id", t.id).eq("person", s.person);
        if (!error) changed++;
      }
    }
    return NextResponse.json({ changed, total: (data || []).length });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

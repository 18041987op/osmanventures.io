import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { guessCategory, KNOWN_CATS } from "@/lib/gastos";

export async function POST() {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const sb = svc();
    const { data } = await sb.from("transactions")
      .select("id,original_description,description,category")
      .eq("person", s.person).eq("category", "otros").limit(5000);
    let changed = 0;
    for (const t of (data || [])) {
      const g = guessCategory(t.original_description || t.description || "");
      if (g !== "otros") {
        const { error } = await sb.from("transactions")
          .update({ category: g, cat_label: KNOWN_CATS[g]?.label || null }).eq("id", t.id).eq("person", s.person);
        if (!error) changed++;
      }
    }
    return NextResponse.json({ changed, total: (data || []).length });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

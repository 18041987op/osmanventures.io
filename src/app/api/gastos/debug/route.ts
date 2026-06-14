import { NextResponse } from "next/server";
import { svc } from "@/lib/gastosServer";

export async function GET() {
  try {
    const sb = svc();
    const { data: profs } = await sb.from("profiles").select("person");
    const persons = (profs || []).map((p) => p.person);
    const counts: Record<string, number> = {};
    for (const p of persons) {
      const { count } = await sb.from("transactions").select("id", { count: "exact", head: true }).eq("person", p);
      counts[p] = count || 0;
    }
    const { count: total } = await sb.from("transactions").select("id", { count: "exact", head: true });
    return NextResponse.json({ counts, total: total || 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

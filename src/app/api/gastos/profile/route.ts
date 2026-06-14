import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { display_name?: string; occupation?: string; currency?: string; palette?: unknown; slug?: string };
    const patch: Record<string, unknown> = {};
    if (b.display_name !== undefined) patch.display_name = b.display_name;
    if (b.occupation !== undefined) patch.occupation = b.occupation;
    if (b.currency !== undefined) patch.currency = b.currency;
    if (b.palette !== undefined) patch.palette = b.palette;
    if (b.slug !== undefined) {
      const slug = (b.slug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug) return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      patch.slug = slug;
    }
    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
    const { error } = await svc().from("profiles").update(patch).eq("person", s.person);
    if (error) {
      if (String(error.message).includes("duplicate") || String(error.code) === "23505")
        return NextResponse.json({ error: "Esa URL ya está en uso" }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ ok: true, slug: patch.slug });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

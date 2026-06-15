import { NextResponse } from "next/server";
import { svc, currentSession, sha256hex } from "@/lib/gastosServer";
import { PIN_SALT } from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person !== "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { slug?: string; display_name?: string; occupation?: string; currency?: string; pin?: string };
    const slug = (b.slug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!slug) return NextResponse.json({ error: "URL/usuario inválido" }, { status: 400 });
    if (!b.pin || !/^\d{4}$/.test(b.pin)) return NextResponse.json({ error: "PIN de 4 dígitos requerido" }, { status: 400 });
    const person = slug; // el person interno = slug del usuario nuevo
    const sb = svc();
    const { data: exists } = await sb.from("profiles").select("person").or(`person.eq.${person},slug.eq.${slug}`).maybeSingle();
    if (exists) return NextResponse.json({ error: "Ese usuario o URL ya existe" }, { status: 409 });
    const { error } = await sb.from("profiles").insert({
      person, slug, display_name: b.display_name?.trim() || slug,
      occupation: b.occupation || "otro", currency: b.currency || "HNL",
      pin_hash: sha256hex(b.pin + PIN_SALT), palette: {}, ant_rules: {}, settings: {},
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, slug });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

import { NextResponse } from "next/server";
import { svc, sha256hex, makeSession, SESSION_COOKIE } from "@/lib/gastosServer";
import { PIN_SALT } from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const { slug, pin } = (await req.json()) as { slug?: string; pin?: string };
    if (!slug || !pin || !/^\d{4}$/.test(pin))
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const h = sha256hex(pin + PIN_SALT);
    const { data } = await svc().from("profiles")
      .select("person,display_name,occupation,currency,palette,slug")
      .eq("slug", slug).eq("pin_hash", h).maybeSingle();
    if (!data) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    const res = NextResponse.json({ profile: data });
    res.cookies.set(SESSION_COOKIE, makeSession(data.person, slug), {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

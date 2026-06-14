import { NextResponse } from "next/server";
import { svc, currentSession, sha256hex } from "@/lib/gastosServer";
import { PIN_SALT } from "@/lib/gastos";

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const { pin } = (await req.json()) as { pin?: string };
    if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: "El PIN debe ser de 4 dígitos" }, { status: 400 });
    const { error } = await svc().from("profiles").update({ pin_hash: sha256hex(pin + PIN_SALT) }).eq("person", s.person);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

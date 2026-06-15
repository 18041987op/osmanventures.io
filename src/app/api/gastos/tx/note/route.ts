import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

// Agrega o edita la NOTA de una transacción. Nunca toca la descripción del banco.
export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { id?: string | number; user_note?: string; person?: string };
    const owner = s.person === "admin" ? b.person : s.person;
    if (!owner || b.id === undefined || b.id === null) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const note = (b.user_note ?? "").toString().slice(0, 600).trim() || null;
    const { error } = await svc().from("transactions").update({ user_note: note }).eq("id", b.id).eq("person", owner);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { id?: string; person?: string; archived?: boolean };
    const owner = s.person === "admin" ? b.person : s.person;
    if (!owner || !b.id) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const archived = b.archived === false ? false : true;
    const { error } = await svc().from("accounts").update({ archived }).eq("id", b.id).eq("owner", owner);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

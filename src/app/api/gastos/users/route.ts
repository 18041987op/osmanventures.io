import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";

// Lista de usuarios: SOLO para el admin autenticado. No es pública.
export async function GET() {
  try {
    const s = await currentSession();
    if (!s || s.person !== "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const { data, error } = await svc()
      .from("profiles").select("slug,display_name,occupation").order("display_name");
    if (error) throw error;
    const list = (data || []).filter((p: { slug: string | null }) => p.slug && p.slug !== "admin");
    return NextResponse.json({ users: list });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

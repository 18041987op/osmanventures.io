import { NextResponse } from "next/server";
import { svc } from "@/lib/gastosServer";

// Devuelve SOLO el nombre del usuario de un slug exacto (para la pantalla de PIN).
// No expone la lista de usuarios.
export async function GET(req: Request) {
  try {
    const slug = (new URL(req.url).searchParams.get("slug") || "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 });
    const { data } = await svc().from("profiles").select("display_name").eq("slug", slug).maybeSingle();
    if (!data) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ display_name: data.display_name || slug });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}

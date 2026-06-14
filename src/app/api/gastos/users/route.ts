import { NextResponse } from "next/server";
import { svc } from "@/lib/gastosServer";

export async function GET() {
  try {
    const { data, error } = await svc()
      .from("profiles").select("slug,display_name,occupation").order("display_name");
    if (error) throw error;
    const list = (data || []).filter((p: { slug: string | null }) => p.slug);
    return NextResponse.json({ users: list });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

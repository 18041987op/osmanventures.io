import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { svc, readSession, SESSION_COOKIE } from "@/lib/gastosServer";
import { DEFAULT_CATS, type Category } from "@/lib/gastos";

const TX_COLS =
  "id,date,description,original_description,user_note,category,subcategory,cat_label,month,month_display,month_num,year,amount,type,person,direction,kind,counts_as_expense,account_id,transfer_account_id,income_source,source_note,has_receipt";

export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("slug") || "";
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const sess = readSession(token);
    if (!sess || sess.slug !== slug)
      return NextResponse.json({ error: "no-auth" }, { status: 401 });

    const person = sess.person;
    const sb = svc();
    const [{ data: profile }, { data: accounts }, catsRes, { data: tx }] = await Promise.all([
      sb.from("profiles").select("person,display_name,occupation,currency,palette,slug").eq("person", person).maybeSingle(),
      sb.from("accounts").select("*").eq("owner", person).eq("archived", false).order("created_at"),
      sb.from("categories").select("*").eq("owner", person).eq("archived", false),
      sb.from("transactions").select(TX_COLS).eq("person", person).order("created_at", { ascending: false }).limit(5000),
    ]);

    let categories = (catsRes.data as Category[]) || [];
    if (categories.length === 0 && profile) {
      const occ = profile.occupation || "otro";
      const defs = (DEFAULT_CATS[occ] || DEFAULT_CATS.otro).map((c, i) => ({
        owner: person, key: c.key, label: c.label, emoji: c.emoji, color: c.color,
        parent_key: null, is_custom: false, sort_order: i,
      }));
      const ins = await sb.from("categories").insert(defs).select();
      categories = (ins.data as Category[]) || defs;
    }
    categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return NextResponse.json({ profile, accounts: accounts || [], categories, tx: tx || [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

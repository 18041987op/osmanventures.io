import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { svc, readSession, SESSION_COOKIE } from "@/lib/gastosServer";
import { DEFAULT_CATS, type Category, type Account } from "@/lib/gastos";

const TX_COLS =
  "id,date,description,original_description,user_note,category,subcategory,cat_label,month,month_display,month_num,year,amount,type,person,direction,kind,counts_as_expense,account_id,transfer_account_id,income_source,source_note,has_receipt,added_by";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug") || "";
    const scope = url.searchParams.get("person") || "all"; // solo lo usa admin
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const sess = readSession(token);
    if (!sess || sess.slug !== slug)
      return NextResponse.json({ error: "no-auth" }, { status: 401 });

    const sb = svc();
    const isAdmin = sess.person === "admin";

    // ── Vista ADMIN: ver todo o filtrar por persona ──
    if (isAdmin) {
      const { data: profiles } = await sb.from("profiles")
        .select("person,display_name,occupation,currency,palette,ant_rules,slug");
      const persons = (profiles || []).filter((p) => p.person !== "admin")
        .map((p) => ({ person: p.person, display_name: p.display_name, currency: p.currency, occupation: p.occupation }));
      const adminProfile = (profiles || []).find((p) => p.person === "admin") || { person: "admin", display_name: "Admin" };

      let txQ = sb.from("transactions").select(TX_COLS).order("created_at", { ascending: false }).limit(8000);
      if (scope !== "all") txQ = txQ.eq("person", scope);
      const [{ data: tx }, { data: accounts }, { data: cats }] = await Promise.all([
        txQ,
        sb.from("accounts").select("*").eq("archived", false),
        sb.from("categories").select("*").eq("archived", false),
      ]);
      let exclusions: { merchant: string; label: string | null }[] = [];
      let archivedAccounts: unknown[] = [];
      let archivedCategories: unknown[] = [];
      if (scope !== "all") {
        const [{ data: ex }, { data: aAcc }, { data: aCat }] = await Promise.all([
          sb.from("ant_exclusions").select("merchant,label").eq("owner", scope),
          sb.from("accounts").select("*").eq("owner", scope).eq("archived", true),
          sb.from("categories").select("*").eq("owner", scope).eq("archived", true),
        ]);
        exclusions = ex || [];
        archivedAccounts = aAcc || [];
        archivedCategories = aCat || [];
      }
      return NextResponse.json({
        admin: true, scope, persons, profile: adminProfile,
        accounts: accounts || [], categories: cats || [], tx: tx || [], exclusions,
        archivedAccounts, archivedCategories,
      });
    }

    // ── Vista usuario normal ──
    const person = sess.person;
    const [{ data: profile }, { data: accounts }, catsRes, { data: tx }] = await Promise.all([
      sb.from("profiles").select("person,display_name,occupation,currency,palette,ant_rules,slug").eq("person", person).maybeSingle(),
      sb.from("accounts").select("*").eq("owner", person).eq("archived", false).order("created_at"),
      sb.from("categories").select("*").eq("owner", person).eq("archived", false),
      sb.from("transactions").select(TX_COLS).eq("person", person).order("created_at", { ascending: false }).limit(5000),
    ]);

    let accountsList = (accounts as Account[]) || [];
    let categories = (catsRes.data as Category[]) || [];
    const occ = profile?.occupation || "otro";

    // Asegurar las categorías por defecto de la ocupación (agrega las que falten)
    const have = new Set(categories.map((c) => c.key));
    const missing = (DEFAULT_CATS[occ] || DEFAULT_CATS.otro)
      .filter((d) => !have.has(d.key))
      .map((c, i) => ({ owner: person, key: c.key, label: c.label, emoji: c.emoji, color: c.color,
        parent_key: null, is_custom: false, sort_order: categories.length + i }));
    if (missing.length) {
      const ins = await sb.from("categories").insert(missing).select();
      categories = categories.concat((ins.data as Category[]) || (missing as unknown as Category[]));
    }

    // Asegurar una cuenta de Efectivo
    if (!accountsList.some((a) => a.kind === "cash")) {
      const ins = await sb.from("accounts").insert({ owner: person, name: "Efectivo", kind: "cash", color: "#ffd740" }).select();
      if (ins.data) accountsList = accountsList.concat(ins.data as Account[]);
    }

    categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const [{ data: ex }, { data: aAcc }, { data: aCat }] = await Promise.all([
      sb.from("ant_exclusions").select("merchant,label").eq("owner", person),
      sb.from("accounts").select("*").eq("owner", person).eq("archived", true),
      sb.from("categories").select("*").eq("owner", person).eq("archived", true),
    ]);
    return NextResponse.json({ admin: false, profile, accounts: accountsList, categories, tx: tx || [], exclusions: ex || [], archivedAccounts: aAcc || [], archivedCategories: aCat || [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

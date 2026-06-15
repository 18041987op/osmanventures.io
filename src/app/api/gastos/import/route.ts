import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { svc, currentSession, sha256hex } from "@/lib/gastosServer";
import { merchantKey } from "@/lib/gastos";

type Row = {
  date: string; original_description: string; amount: number;
  direction: string; kind: string; counts_as_expense: boolean;
  category: string; cat_label: string;
  month: string; month_display: string; month_num: number; year: number;
  income_source?: string;
};

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as { account_id?: string; file_hash?: string; filename?: string; rows?: Row[] };
    if (!b.account_id || !Array.isArray(b.rows) || b.rows.length === 0)
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

    const sb = svc();
    const { data: acc } = await sb.from("accounts").select("kind,owner").eq("id", b.account_id).maybeSingle();
    if (!acc || acc.owner !== s.person) return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
    const txType = acc.kind === "cash" ? "cash" : "bank";
    const batch = crypto.randomUUID();
    // memoria de categorías del usuario
    const { data: rulesData } = await sb.from("category_rules").select("merchant,category").eq("owner", s.person);
    const rules = new Map((rulesData || []).map((r) => [r.merchant, r.category]));

    const payload = await Promise.all(b.rows.map(async (r) => {
      const learned = r.kind === "withdrawal" || r.direction === "income" ? null : rules.get(merchantKey(r.original_description || ""));
      const category = learned || r.category;
      return ({
      person: s.person, account_id: b.account_id, type: txType,
      date: r.date, month: r.month, month_display: r.month_display, month_num: r.month_num, year: r.year,
      description: r.original_description, original_description: r.original_description,
      category, subcategory: null, cat_label: r.cat_label, amount: r.amount,
      direction: r.direction, kind: r.kind, counts_as_expense: r.counts_as_expense,
      income_source: r.income_source || null,
      file_hash: b.file_hash || null, import_batch_id: batch, has_receipt: false,
      fingerprint: await sha256hex(`${r.date}|${r.amount}|${(r.original_description || "").toUpperCase()}|${b.account_id}`),
      }); }));

    const { error } = await sb.from("transactions").insert(payload);
    if (error) throw error;
    await sb.from("uploads").insert({ owner: s.person, account_id: b.account_id, filename: b.filename || null, file_hash: b.file_hash || null, row_count: payload.length });
    return NextResponse.json({ inserted: payload.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

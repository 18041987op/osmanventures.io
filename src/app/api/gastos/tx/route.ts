import { NextResponse } from "next/server";
import { svc, currentSession } from "@/lib/gastosServer";
import { MONTHS_ES } from "@/lib/gastos";

type Body = {
  kind: "expense" | "income" | "withdrawal" | "transfer";
  amount: number;
  date: string;            // YYYY-MM-DD
  account_id: string;
  transfer_account_id?: string;
  category?: string;
  subcategory?: string;
  cat_label?: string;
  description?: string;
  user_note?: string;
  income_source?: string;
  source_note?: string;
};

function dateParts(ymd: string) {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  const mm = m || 1;
  return {
    date: `${String(d || 1).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${y || new Date().getFullYear()}`,
    month: MONTHS_ES[mm].toLowerCase(), month_display: MONTHS_ES[mm], month_num: mm, year: y || new Date().getFullYear(),
  };
}

export async function POST(req: Request) {
  try {
    const s = await currentSession();
    if (!s || s.person === "admin") return NextResponse.json({ error: "no-auth" }, { status: 401 });
    const b = (await req.json()) as Body;
    const amount = Number(b.amount);
    if (!(amount > 0)) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    if (!b.account_id) return NextResponse.json({ error: "Cuenta requerida" }, { status: 400 });

    const dp = dateParts(b.date);
    const desc = (b.description || "").trim();
    const base = {
      person: s.person, amount, ...dp, account_id: b.account_id,
      description: desc || (b.cat_label || "Movimiento"),
      original_description: desc || (b.cat_label || "Movimiento"),
      user_note: b.user_note || null, type: "manual", has_receipt: false,
    };

    let row: Record<string, unknown>;
    if (b.kind === "expense") {
      row = { ...base, category: b.category || "otros", subcategory: b.subcategory || null,
        cat_label: b.cat_label || null, direction: "expense", kind: "expense", counts_as_expense: true };
    } else if (b.kind === "income") {
      row = { ...base, category: "ingreso", cat_label: "💰 Ingreso", direction: "income", kind: "income",
        counts_as_expense: false, income_source: b.income_source || null, source_note: b.source_note || null };
    } else if (b.kind === "withdrawal") {
      if (!b.transfer_account_id) return NextResponse.json({ error: "Cuenta de efectivo requerida" }, { status: 400 });
      row = { ...base, transfer_account_id: b.transfer_account_id, category: "efectivo", cat_label: "💵 Retiro",
        description: "Retiro de efectivo", original_description: "Retiro de efectivo",
        direction: "transfer", kind: "withdrawal", counts_as_expense: false };
    } else {
      if (!b.transfer_account_id || b.transfer_account_id === b.account_id)
        return NextResponse.json({ error: "Elige dos cuentas distintas" }, { status: 400 });
      row = { ...base, transfer_account_id: b.transfer_account_id, category: "transfer", cat_label: "🔁 Traspaso",
        description: "Traspaso entre cuentas", original_description: "Traspaso entre cuentas",
        direction: "transfer", kind: "transfer", counts_as_expense: false };
    }

    const { error } = await svc().from("transactions").insert(row);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

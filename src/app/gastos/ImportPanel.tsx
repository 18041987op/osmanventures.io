"use client";
import { useState } from "react";
import { fmt, KNOWN_CATS, guessCategory, type Account, type Category, type Tx } from "@/lib/gastos";

const MONTHS_ES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type Row = {
  date: string; original_description: string; amount: number;
  direction: "expense" | "income"; kind: "expense" | "income" | "withdrawal";
  counts_as_expense: boolean; category: string; cat_label: string;
  month: string; month_display: string; month_num: number; year: number;
  income_source?: string; _dup?: boolean;
};

async function sha256hex(str: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function readLatin1(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => res(String(e.target?.result || ""));
    r.onerror = rej;
    r.readAsText(file, "windows-1252");
  });
}
function splitCSV(line: string): string[] {
  const cols: string[] = []; let cur = "", inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  cols.push(cur.trim()); return cols;
}
function parseStatement(content: string): Row[] {
  const lines = content.split(/\r?\n/);
  let mName = "", mNum = 0, mYear = new Date().getFullYear(), hdr = -1, debIdx = 4, credIdx = -1;
  for (const ln of lines) {
    if (ln.includes("Desde:")) {
      const p = ln.split(",");
      const dp = (p[1] || "").trim().split(/[\/\-]/);
      if (dp.length >= 2) { const mn = parseInt(dp[1]); if (mn >= 1 && mn <= 12) { mNum = mn; mName = MONTHS_ES[mn]; } }
      if (dp.length >= 3) { const y = parseInt(dp[2]); if (y >= 2020 && y <= 2099) mYear = y; const y0 = parseInt(dp[0]); if (y0 >= 2020 && y0 <= 2099) mYear = y0; }
      break;
    }
  }
  for (let i = 0; i < lines.length; i++) {
    if (/^Fecha,/i.test(lines[i])) {
      hdr = i; const c = lines[i].split(",");
      for (let j = 0; j < c.length; j++) { if (/[Dd].?bito/.test(c[j])) debIdx = j; if (/[Cc]r.?dito/.test(c[j])) credIdx = j; }
      break;
    }
  }
  if (hdr < 0) return [];
  const out: Row[] = [];
  for (let i = hdr + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !/^\d/.test(line)) continue;
    const cols = splitCSV(line);
    if (cols.length < 3) continue;
    const dp2 = cols[0].split(/[\/\-]/);
    const date = dp2.length >= 2 ? `${dp2[0]}/${dp2[1]}` : cols[0];
    const descRaw = cols[1] || "";
    const base = { month: mName.toLowerCase(), month_display: mName, month_num: mNum, year: mYear };

    let debit = 0; if (debIdx < cols.length) debit = parseFloat((cols[debIdx] || "").replace(/,/g, "")) || 0;
    if (debit > 0) {
      if (/TRANSFERENCIA|DEPOSITO|INTERES|CREDITOS VARIOS/i.test(descRaw)) continue;
      const clean = descRaw.replace(/Compras Tarjeta de Debito ?- ?/gi, "").replace(/\s{2,}/g, " ").replace(/\s+(HN|US|SE)\s*$/i, "").trim();
      const isAtm = /ATM|RETIRO DE EFECTIVO/i.test(descRaw);
      const cat = isAtm ? "efectivo" : guessCategory(clean);
      out.push({ date, original_description: clean, amount: debit, direction: "expense",
        kind: isAtm ? "withdrawal" : "expense", counts_as_expense: !isAtm,
        category: cat, cat_label: KNOWN_CATS[cat]?.label || cat, ...base });
    }
    let credit = 0; if (credIdx >= 0 && credIdx < cols.length) credit = parseFloat((cols[credIdx] || "").replace(/,/g, "")) || 0;
    if (credit > 1) {
      if (/INTERES|FIDEICOMISO/i.test(descRaw)) continue;
      out.push({ date, original_description: descRaw.replace(/\s{2,}/g, " ").trim(), amount: credit, direction: "income",
        kind: "income", counts_as_expense: false, income_source: "transfer_in",
        category: "ingreso", cat_label: "💰 Ingreso", ...base });
    }
  }
  return out;
}
function key(date: string, amount: number, desc: string, acc: string) {
  return `${date}|${amount.toFixed(2)}|${(desc || "").toUpperCase().replace(/\s+/g, " ").trim()}|${acc}`;
}

export default function ImportPanel({ accounts, cats, tx, cur, person, onDone }:
  { accounts: Account[]; cats: Category[]; tx: Tx[]; cur?: string | null; person?: string; onDone: () => void }) {
  const availKeys = new Set(cats.map((c) => c.key));
  const banks = accounts.filter((a) => a.kind !== "cash");
  const [account, setAccount] = useState((banks[0] || accounts[0])?.id || "");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name); setMsg("Leyendo…");
    const text = await readLatin1(f);
    setFileHash(await sha256hex(text));
    const parsed = parseStatement(text).map((r) => r.kind === "withdrawal" || r.direction === "income" ? r : { ...r, category: guessCategory(r.original_description, availKeys), cat_label: KNOWN_CATS[guessCategory(r.original_description, availKeys)]?.label || r.cat_label });
    const existing = new Set(tx.filter((t) => t.account_id === account).map((t) => key(t.date || "", Number(t.amount || 0), t.original_description || t.description || "", t.account_id || "")));
    parsed.forEach((r) => { r._dup = existing.has(key(r.date, r.amount, r.original_description, account)); });
    setRows(parsed); setMsg("");
  }

  const dup = rows.filter((r) => r._dup).length;
  const nuevos = rows.length - dup;

  async function commit(mode: "new" | "all") {
    const sel = mode === "new" ? rows.filter((r) => !r._dup) : rows;
    if (!sel.length) { alert("No hay movimientos para importar."); return; }
    setBusy(true);
    const r = await fetch("/api/gastos/import", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ account_id: account, file_hash: fileHash, filename: fileName, rows: sel, person }),
    });
    setBusy(false);
    if (!r.ok) { alert("Error al importar: " + (await r.json()).error); return; }
    const j = await r.json();
    alert(`✅ ${j.inserted} movimientos importados.`);
    onDone();
  }

  return (
    <div>
      {accounts.length === 0 ? <p className="muted">Primero crea una cuenta de banco en Cuentas.</p> : <>
        <label className="gx-lbl">Cuenta / banco destino</label>
        <select className="gx-inp" value={account} onChange={(e) => setAccount(e.target.value)}>
          {(banks.length ? banks : accounts).map((a) => <option key={a.id} value={a.id}>{a.name}{a.bank ? " · " + a.bank : ""}</option>)}
        </select>
        <label className="gx-lbl">Archivo del estado de cuenta (CSV)</label>
        <input className="gx-inp" type="file" accept=".csv,text/csv" onChange={onFile} />
        <p className="gx-hint" style={{ textAlign: "left" }}>Se detectan los movimientos repetidos automáticamente.</p>
        {msg && <p className="muted">{msg}</p>}

        {rows.length > 0 && <>
          <div style={{ fontWeight: 600, fontSize: ".86rem", margin: "10px 0" }}>
            {rows.length} movimientos · <b>{nuevos} nuevos</b> · {dup} duplicados
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 12, padding: "4px 8px", marginBottom: 12 }}>
            {rows.slice(0, 40).map((r, i) => (
              <div key={i} className="gx-tx" style={{ cursor: "default" }}>
                <span className="gx-ic" style={{ background: "#90A4AE22" }}>{r._dup ? "🔁" : r.direction === "income" ? "💰" : "💳"}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="d">{r.original_description}</span>
                  <span className="s">{r.date}{r._dup ? " · duplicado" : ""}</span>
                </span>
                <span className={"a " + (r.direction === "income" ? "gx-pos" : "")}>{r.direction === "income" ? "+" : "-"}{fmt(r.amount, cur)}</span>
              </div>
            ))}
            {rows.length > 40 && <p className="muted center">… y {rows.length - 40} más</p>}
          </div>
          <button className="gx-btn" disabled={busy} onClick={() => commit("new")} style={{ width: "100%", marginBottom: 8 }}>Importar solo nuevos ({nuevos})</button>
          <button className="gx-btn ghost" disabled={busy} onClick={() => commit("all")} style={{ width: "100%" }}>Importar todos ({rows.length})</button>
        </>}
      </>}
    </div>
  );
}

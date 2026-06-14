"use client";
import { useState } from "react";
import { INCOME_SOURCES, type Account, type Category, type Tx } from "@/lib/gastos";
import ImportPanel from "./ImportPanel";

type Kind = "expense" | "income" | "withdrawal" | "transfer";
const TABS: [Kind | "importar", string][] = [
  ["expense", "💸 Gasto"], ["income", "💰 Ingreso"], ["withdrawal", "🏧 Retiro"], ["transfer", "🔁 Traspaso"], ["importar", "📄 Importar"],
];

export default function EntryView({ accounts, cats, tx, cur, onDone, onCancel }:
  { accounts: Account[]; cats: Category[]; tx: Tx[]; cur?: string | null; onDone: () => void; onCancel: () => void }) {
  const [kind, setKind] = useState<Kind | "importar">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState(accounts[0]?.id || "");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState(cats[0]?.key || "otros");
  const [desc, setDesc] = useState("");
  const [note, setNote] = useState("");
  const [src, setSrc] = useState("payroll");
  const [srcNote, setSrcNote] = useState("");
  const [busy, setBusy] = useState(false);

  const cash = accounts.filter((a) => a.kind === "cash");
  const nonCash = accounts.filter((a) => a.kind !== "cash");
  const roots = cats.filter((c) => !c.parent_key);
  const catLabelOf = (k: string) => cats.find((c) => c.key === k)?.label || k;

  async function submit() {
    const amt = parseFloat(amount);
    if (!(amt > 0)) { alert("Escribe un monto válido."); return; }
    const body: Record<string, unknown> = { kind, amount: amt, date, account_id: account };
    if (kind === "expense") {
      const parent = cats.find((c) => c.key === cat)?.parent_key;
      body.category = parent || cat; body.subcategory = parent ? cat : undefined;
      body.cat_label = catLabelOf(cat); body.description = desc; body.user_note = note;
    } else if (kind === "income") {
      body.income_source = src; body.source_note = srcNote; body.description = desc;
    } else { body.transfer_account_id = to; body.user_note = note; }

    setBusy(true);
    const r = await fetch("/api/gastos/tx", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) { alert("No se pudo guardar: " + (await r.json()).error); return; }
    onDone();
  }

  const acctOpts = (list: Account[]) => list.map((a) => <option key={a.id} value={a.id}>{a.name}{a.bank ? " · " + a.bank : ""}</option>);

  return (
    <div className="gx-view">
      <div className="gx-vh"><h2>Agregar movimiento</h2><button className="gx-x" onClick={onCancel} title="Cancelar">✕</button></div>
      <div className="gx-segs">
        {TABS.map(([k, l]) => <button key={k} className={"gx-seg" + (k === kind ? " on" : "")} onClick={() => setKind(k)}>{l}</button>)}
      </div>

      <div className="gx-panel">
        {kind === "importar" ? <ImportPanel accounts={accounts} tx={tx} cur={cur} onDone={onDone} /> :
         accounts.length === 0 ? <p className="muted">Primero crea una cuenta en la pestaña Cuentas.</p> : <>
          <label className="gx-lbl">Monto</label>
          <input className="gx-inp" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />

          {kind === "expense" && <>
            <label className="gx-lbl">Cuenta</label>
            <select className="gx-inp" value={account} onChange={(e) => setAccount(e.target.value)}>{acctOpts(accounts)}</select>
            <label className="gx-lbl">Categoría</label>
            <select className="gx-inp" value={cat} onChange={(e) => setCat(e.target.value)}>
              {roots.map((c) => [
                <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>,
                ...cats.filter((s) => s.parent_key === c.key).map((s) => <option key={s.key} value={s.key}>&nbsp;&nbsp;↳ {s.emoji} {s.label}</option>),
              ])}
            </select>
            <label className="gx-lbl">Descripción</label>
            <input className="gx-inp" value={desc} placeholder="¿En qué gastaste?" onChange={(e) => setDesc(e.target.value)} />
            <label className="gx-lbl">Nota (opcional)</label>
            <input className="gx-inp" value={note} onChange={(e) => setNote(e.target.value)} />
          </>}

          {kind === "income" && <>
            <label className="gx-lbl">Cuenta destino</label>
            <select className="gx-inp" value={account} onChange={(e) => setAccount(e.target.value)}>{acctOpts(accounts)}</select>
            <label className="gx-lbl">Origen del ingreso</label>
            <select className="gx-inp" value={src} onChange={(e) => setSrc(e.target.value)}>
              {Object.entries(INCOME_SOURCES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <label className="gx-lbl">¿De dónde viene? (detalle)</label>
            <input className="gx-inp" value={srcNote} placeholder="Ej. Depósito de papá, mesada de la tía…" onChange={(e) => setSrcNote(e.target.value)} />
            <label className="gx-lbl">Descripción</label>
            <input className="gx-inp" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </>}

          {kind === "withdrawal" && (cash.length === 0
            ? <p className="muted">Para registrar un retiro necesitas una cuenta tipo <b>Efectivo</b>. Créala en Cuentas.</p>
            : <>
              <label className="gx-lbl">Desde (banco)</label>
              <select className="gx-inp" value={account} onChange={(e) => setAccount(e.target.value)}>{acctOpts(nonCash.length ? nonCash : accounts)}</select>
              <label className="gx-lbl">Hacia (efectivo)</label>
              <select className="gx-inp" value={to} onChange={(e) => setTo(e.target.value)}><option value="">—</option>{acctOpts(cash)}</select>
              <p className="gx-hint" style={{ textAlign: "left" }}>Un retiro NO cuenta como gasto: solo mueve dinero del banco a tu efectivo.</p>
            </>)}

          {kind === "transfer" && <>
            <label className="gx-lbl">Desde</label>
            <select className="gx-inp" value={account} onChange={(e) => setAccount(e.target.value)}>{acctOpts(accounts)}</select>
            <label className="gx-lbl">Hacia</label>
            <select className="gx-inp" value={to} onChange={(e) => setTo(e.target.value)}><option value="">—</option>{acctOpts(accounts)}</select>
          </>}

          {(kind === "expense" || kind === "income" || ((kind === "withdrawal") && cash.length) || kind === "transfer") && <>
            <label className="gx-lbl">Fecha</label>
            <input className="gx-inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="gx-btn" style={{ marginTop: 14 }} disabled={busy} onClick={submit}>{busy ? "Guardando…" : "Guardar"}</button>
          </>}
        </>}
      </div>
    </div>
  );
}

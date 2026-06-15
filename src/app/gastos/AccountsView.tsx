"use client";
import { useState } from "react";
import { fmt, accountBalance, type Account, type Tx } from "@/lib/gastos";

const KINDS: Record<string, { label: string; emoji: string }> = {
  bank: { label: "Banco", emoji: "🏦" }, cash: { label: "Efectivo", emoji: "💵" }, credit: { label: "Tarjeta", emoji: "💳" },
};

export default function AccountsView({ accounts, tx, cur, person, onReload, onClose }:
  { accounts: Account[]; tx: Tx[]; cur?: string | null; person?: string; onReload: () => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Account> | null>(null); // null = cerrado

  async function save() {
    if (!form?.name?.trim()) { alert("Ponle un nombre."); return; }
    const r = await fetch("/api/gastos/account", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: form.id, name: form.name, bank: form.bank, kind: form.kind || "bank", color: form.color || "#5C6BC0", person }),
    });
    if (!r.ok) { alert("No se pudo guardar: " + (await r.json()).error); return; }
    setForm(null); onReload();
  }
  async function archive(id: string) {
    if (!confirm("¿Archivar esta cuenta? No se borran sus movimientos.")) return;
    const r = await fetch("/api/gastos/account/archive", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, person }),
    });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    onReload();
  }

  return (
    <div className="gx-view">
      <div className="gx-vh"><h2>Mis cuentas</h2>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="gx-btn sm" onClick={() => setForm({ kind: "bank", color: "#5C6BC0" })}>+ Nueva</button>
          <button className="gx-x" onClick={onClose} title="Cerrar">✕</button>
        </span></div>

      {accounts.length === 0 ? <p className="muted center">Aún no tienes cuentas. Crea la primera.</p> :
        accounts.map((a) => {
          const k = KINDS[a.kind] || KINDS.bank;
          const bal = accountBalance(tx, a.id);
          return (
            <div key={a.id} className="gx-panel" style={{ padding: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="gx-ic" style={{ background: (a.color || "#5C6BC0") + "22", color: a.color || "#5C6BC0" }}>{k.emoji}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: ".92rem" }}>{a.name}{a.bank ? <small className="muted"> · {a.bank}</small> : null}</span>
                <span style={{ fontWeight: 700, fontSize: ".9rem", color: bal < 0 ? "var(--red)" : "var(--text)" }}>{fmt(bal, cur)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span className="muted" style={{ flex: 1, fontSize: ".76rem" }}>{k.label}</span>
                <button className="gx-btn ghost sm" onClick={() => setForm(a)}>Editar</button>
                <button className="gx-x" onClick={() => archive(a.id)}>✕</button>
              </div>
            </div>
          );
        })}

      {form && (
        <div className="gx-modal" onClick={() => setForm(null)}>
          <div className="gx-mcard" onClick={(e) => e.stopPropagation()}>
            <div className="gx-mtop"><h3>{form.id ? "Editar cuenta" : "Nueva cuenta"}</h3>
              <button className="gx-x" onClick={() => setForm(null)}>✕</button></div>
            <div className="gx-mbody">
              <label className="gx-lbl">Nombre</label>
              <input className="gx-inp" value={form.name || ""} placeholder="Ej. Ficohsa papá, Efectivo, Cuenta tía"
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label className="gx-lbl">Banco (opcional)</label>
              <input className="gx-inp" value={form.bank || ""} placeholder="Ej. Ficohsa, BAC, Atlántida"
                onChange={(e) => setForm({ ...form, bank: e.target.value })} />
              <div className="gx-row2">
                <div><label className="gx-lbl">Tipo</label>
                  <select className="gx-inp" value={form.kind || "bank"} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                    <option value="bank">🏦 Banco</option><option value="cash">💵 Efectivo</option><option value="credit">💳 Tarjeta</option>
                  </select></div>
                <div><label className="gx-lbl">Color</label>
                  <input className="gx-inp" type="color" value={form.color || "#5C6BC0"} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <button className="gx-btn" style={{ marginTop: 14 }} onClick={save}>Guardar cuenta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { fmt, similarity, isExpense, type Category, type Tx } from "@/lib/gastos";

export default function CategoriesView({ cats, tx, cur, person, onReload, onClose }:
  { cats: Category[]; tx: Tx[]; cur?: string | null; person?: string; onReload: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState("#5C6BC0");

  const roots = cats.filter((c) => !c.parent_key);
  const subsOf = (k: string) => cats.filter((c) => c.parent_key === k);
  const totals: Record<string, number> = {};
  tx.filter(isExpense).forEach((t) => { const k = t.category || "otros"; totals[k] = (totals[k] || 0) + Number(t.amount || 0); });

  // sugerencia de subcategoría
  let suggestion: Category | null = null;
  if (label.trim().length >= 3) {
    let bestScore = 0;
    for (const c of roots) {
      const sc = similarity(label, c.label);
      if (sc > bestScore && sc >= 0.55) { bestScore = sc; suggestion = c; }
    }
  }

  async function create(parentKey: string | null) {
    if (!label.trim()) { alert("Escribe un nombre."); return; }
    const r = await fetch("/api/gastos/category", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, emoji, color, parent_key: parentKey, person }),
    });
    if (!r.ok) { alert("No se pudo crear: " + (await r.json()).error); return; }
    setOpen(false); setLabel(""); setEmoji("🏷️"); setColor("#5C6BC0"); onReload();
  }
  async function archive(key: string) {
    if (!confirm("¿Archivar esta categoría? No se borran los gastos; solo deja de mostrarse para clasificar.")) return;
    const r = await fetch("/api/gastos/category/archive", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, person }),
    });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    onReload();
  }

  return (
    <div className="gx-view">
      <div className="gx-vh"><h2>Mis categorías</h2>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="gx-btn sm" onClick={() => setOpen(true)}>+ Nueva</button>
          <button className="gx-x" onClick={onClose} title="Cerrar">✕</button>
        </span></div>

      {roots.map((c) => {
        const subs = subsOf(c.key);
        return (
          <div key={c.key} className="gx-panel" style={{ padding: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="gx-ic" style={{ background: c.color + "22", color: c.color }}>{c.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: ".92rem" }}>{c.label}</span>
              <span style={{ fontWeight: 700, fontSize: ".84rem", color: "var(--muted)" }}>{fmt(totals[c.key] || 0, cur)}</span>
              {c.is_custom && <button className="gx-x" onClick={() => archive(c.key)}>✕</button>}
            </div>
            {subs.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {subs.map((sb) => (
                  <span key={sb.key} style={{ fontSize: ".76rem", border: "1.5px solid var(--line)", borderRadius: 20, padding: "3px 6px 3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                    {sb.emoji} {sb.label}<button className="gx-x" style={{ fontSize: ".7rem" }} onClick={() => archive(sb.key)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {open && (
        <div className="gx-modal" onClick={() => setOpen(false)}>
          <div className="gx-mcard" onClick={(e) => e.stopPropagation()}>
            <div className="gx-mtop"><h3>Nueva categoría</h3><button className="gx-x" onClick={() => setOpen(false)}>✕</button></div>
            <div className="gx-mbody">
              <label className="gx-lbl">Nombre</label>
              <input className="gx-inp" value={label} placeholder="Ej. Gimnasio, Mascota, Viajes…" onChange={(e) => setLabel(e.target.value)} />
              {suggestion && (
                <div style={{ background: "var(--primary-soft)", borderRadius: 12, padding: 11, margin: "10px 0", fontSize: ".82rem" }}>
                  Se parece a <b>{suggestion.emoji} {suggestion.label}</b>. ¿Crearla como <b>subcategoría</b>?
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
                    <button className="gx-btn sm" onClick={() => create(suggestion!.key)}>Sí, subcategoría</button>
                    <button className="gx-btn ghost sm" onClick={() => create(null)}>No, categoría nueva</button>
                  </div>
                </div>
              )}
              <div className="gx-row2">
                <div><label className="gx-lbl">Emoji</label><input className="gx-inp" value={emoji} maxLength={2} onChange={(e) => setEmoji(e.target.value)} /></div>
                <div><label className="gx-lbl">Color</label><input className="gx-inp" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
              </div>
              <button className="gx-btn" style={{ marginTop: 14 }} onClick={() => create(null)}>Crear categoría</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

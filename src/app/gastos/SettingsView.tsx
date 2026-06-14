"use client";
import { useState } from "react";
import { PALETTES, DEFAULT_PALETTE_KEY, OCCUPATIONS, type Profile, type Palette } from "@/lib/gastos";

function resolveKey(p?: Palette | null) {
  if (p?.key && PALETTES[p.key]) return p.key;
  if (p?.primary) return "custom";
  return DEFAULT_PALETTE_KEY;
}

export default function SettingsView({ profile, slug, onReload, onClose, onPalette }:
  { profile: Profile; slug: string; onReload: () => void; onClose: () => void; onPalette: (p: Palette) => void }) {
  const [name, setName] = useState(profile.display_name || "");
  const [occ, setOcc] = useState(profile.occupation || "otro");
  const [currency, setCurrency] = useState(profile.currency || "HNL");
  const [newSlug, setNewSlug] = useState(profile.slug || slug);
  const [pin, setPin] = useState("");
  const [primary, setPrimary] = useState(profile.palette?.primary || PALETTES[resolveKey(profile.palette)]?.primary || "#5C6BC0");
  const [accent, setAccent] = useState(profile.palette?.accent || PALETTES[resolveKey(profile.palette)]?.accent || "#7E57C2");
  const curKey = resolveKey(profile.palette);

  async function post(url: string, body: object) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { alert("Error: " + (j.error || r.status)); return false; }
    return true;
  }
  async function saveProfile() {
    if (await post("/api/gastos/profile", { display_name: name, occupation: occ, currency })) { onReload(); alert("Perfil guardado."); }
  }
  async function selectPalette(key: string) {
    onPalette({ key });           // live
    await post("/api/gastos/profile", { palette: { key } });
  }
  async function saveCustom() {
    const palette = { primary, accent };
    onPalette(palette);
    await post("/api/gastos/profile", { palette });
  }
  async function saveSlug() {
    const ok = await post("/api/gastos/profile", { slug: newSlug });
    if (ok) alert("Listo. Tu URL ahora es /gastos/" + newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""));
  }
  async function savePin() {
    if (!/^\d{4}$/.test(pin)) { alert("El PIN debe ser de 4 dígitos."); return; }
    if (await post("/api/gastos/pin", { pin })) { setPin(""); alert("PIN actualizado."); }
  }

  return (
    <div className="gx-view">
      <div className="gx-vh"><h2>Ajustes</h2><button className="gx-x" onClick={onClose} title="Cerrar">✕</button></div>

      <div className="gx-panel">
        <h3 className="gx-h">Perfil</h3>
        <label className="gx-lbl">Nombre</label>
        <input className="gx-inp" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="gx-lbl">Ocupación</label>
        <select className="gx-inp" value={occ} onChange={(e) => setOcc(e.target.value)}>
          {Object.entries(OCCUPATIONS).map(([k, o]) => <option key={k} value={k}>{o.emoji} {o.label}</option>)}
        </select>
        <small className="muted">La ocupación define tus categorías sugeridas.</small>
        <label className="gx-lbl">Moneda</label>
        <select className="gx-inp" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="HNL">Lempira (L)</option><option value="USD">Dólar ($)</option>
          <option value="EUR">Euro (€)</option><option value="GTQ">Quetzal (Q)</option><option value="MXN">Peso MX ($)</option>
        </select>
        <button className="gx-btn" style={{ marginTop: 12 }} onClick={saveProfile}>Guardar perfil</button>
      </div>

      <div className="gx-panel">
        <h3 className="gx-h">Paleta de colores</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {Object.entries(PALETTES).map(([k, p]) => (
            <button key={k} title={p.name} onClick={() => selectPalette(k)}
              style={{ aspectRatio: "1", borderRadius: 14, border: k === curKey ? "3px solid var(--text)" : "3px solid transparent",
                background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`, cursor: "pointer", color: "#fff", fontSize: "1.2rem" }}>
              {k === curKey ? "✓" : ""}
            </button>
          ))}
        </div>
        <label className="gx-lbl">Color personalizado</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={primary} onChange={(e) => { setPrimary(e.target.value); onPalette({ primary: e.target.value, accent }); }} style={{ width: 52, height: 42, borderRadius: 10, border: "1px solid var(--line)" }} />
          <input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); onPalette({ primary, accent: e.target.value }); }} style={{ width: 52, height: 42, borderRadius: 10, border: "1px solid var(--line)" }} />
          <button className="gx-btn sm" onClick={saveCustom}>Aplicar</button>
        </div>
      </div>

      <div className="gx-panel">
        <h3 className="gx-h">Acceso</h3>
        <label className="gx-lbl">URL del usuario</label>
        <input className="gx-inp" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
        <small className="muted">Tu app abrirá en /gastos/&lt;usuario&gt;</small>
        <button className="gx-btn sm" style={{ marginTop: 8, display: "block" }} onClick={saveSlug}>Guardar URL</button>
        <label className="gx-lbl">Cambiar PIN (4 dígitos)</label>
        <input className="gx-inp" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} />
        <button className="gx-btn sm" style={{ marginTop: 8, display: "block" }} onClick={savePin}>Cambiar PIN</button>
      </div>
    </div>
  );
}

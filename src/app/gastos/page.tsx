"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/gastos";
import "./gastos.css";

// Pantalla de entrada NEUTRAL: no muestra la lista de usuarios.
// Cada quien entra con su enlace personal (/gastos/su-usuario).
export default function ChooserPage() {
  const router = useRouter();
  const [u, setU] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(u);
    if (slug) router.push(`/gastos/${encodeURIComponent(slug)}`);
  }
  return (
    <div className="gx">
      <div className="gx-auth"><div className="gx-card">
        <div className="gx-logo">💳</div>
        <h1>Control de Gastos</h1>
        <p className="gx-sub">Entra con tu usuario</p>
        <form onSubmit={go}>
          <input className="gx-inp" value={u} autoFocus autoCapitalize="none" autoCorrect="off"
            placeholder="tu usuario (ej. fernanda)" onChange={(e) => setU(e.target.value)} />
          <button className="gx-btn" type="submit" style={{ marginTop: 12, width: "100%" }} disabled={!u.trim()}>Continuar</button>
        </form>
        <p className="muted center" style={{ fontSize: ".78rem", marginTop: 14 }}>
          Usa tu enlace personal. Si no lo conoces, pídeselo a quien administra la app.
        </p>
      </div></div>
    </div>
  );
}

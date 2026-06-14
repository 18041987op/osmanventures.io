"use client";
import { useEffect, useState } from "react";
import { OCCUPATIONS } from "@/lib/gastos";
import "./gastos.css";

type Row = { slug: string; display_name: string | null; occupation: string | null };

export default function ChooserPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/gastos/users");
        const j = await r.json();
        setList((j.users as Row[]) || []);
      } catch {}
      setLoading(false);
    })();
  }, []);
  return (
    <div className="gx">
      <div className="gx-auth"><div className="gx-card">
        <div className="gx-logo">💳</div>
        <h1>Control de Gastos</h1>
        <p className="gx-sub">¿Quién eres?</p>
        <div className="gx-list">
          {loading ? <p className="muted center">Cargando…</p> :
            list.length ? list.map((r) => {
              const o = OCCUPATIONS[r.occupation || "otro"] || OCCUPATIONS.otro;
              return (
                <a key={r.slug} className="gx-item" href={`/gastos-beta/${encodeURIComponent(r.slug)}`}>
                  <span style={{ fontSize: "1.4rem" }}>{o.emoji}</span>
                  <span>{r.display_name || r.slug}</span>
                  <span className="go">›</span>
                </a>
              );
            }) : <p className="muted center">No hay usuarios.</p>}
        </div>
      </div></div>
    </div>
  );
}

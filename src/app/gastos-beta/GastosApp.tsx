"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  db, PIN_SALT, sha256hex, fmt, cap, isExpense, isIncome, sumAmt,
  expenseByCategory, expenseByMonth, MONTHS_ES, DEFAULT_CATS, PALETTES,
  DEFAULT_PALETTE_KEY, OCCUPATIONS,
  type Profile, type Account, type Category, type Tx, type Palette,
} from "@/lib/gastos";
import { DonutChart, BarChart } from "./Charts";
import "./gastos.css";

type Phase = "loading" | "login" | "notfound" | "app";
const TX_COLS =
  "id,date,description,original_description,user_note,category,subcategory,cat_label,month,month_display,month_num,year,amount,type,person,direction,kind,counts_as_expense,account_id,income_source,source_note,has_receipt";

function resolvePalette(p?: Palette | null): Required<Pick<Palette, "primary" | "accent" | "bg">> & { dark: boolean } {
  if (p?.key && PALETTES[p.key]) { const x = PALETTES[p.key]; return { primary: x.primary!, accent: x.accent!, bg: x.bg!, dark: !!x.dark }; }
  if (p?.primary) return { primary: p.primary, accent: p.accent || p.primary, bg: p.bg || "#f4f5fb", dark: !!p.dark };
  const d = PALETTES[DEFAULT_PALETTE_KEY]; return { primary: d.primary!, accent: d.accent!, bg: d.bg!, dark: false };
}

export default function GastosApp({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [person, setPerson] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [fYear, setFYear] = useState<number | "all">("all");
  const [fMonth, setFMonth] = useState<string>("all");
  const [drillCat, setDrillCat] = useState<string | null>(null);
  const [detail, setDetail] = useState<Tx | null>(null);

  // ── cargar datos del usuario ──
  const loadData = useCallback(async (pers: string, prof: Profile) => {
    const [{ data: accs }, catsRes, { data: txs }] = await Promise.all([
      db.from("accounts").select("*").eq("owner", pers).eq("archived", false).order("created_at"),
      db.from("categories").select("*").eq("owner", pers).eq("archived", false),
      db.from("transactions").select(TX_COLS).eq("person", pers).order("created_at", { ascending: false }).limit(5000),
    ]);
    setAccounts((accs as Account[]) || []);
    let categories = (catsRes.data as Category[]) || [];
    if (categories.length === 0) {
      const occ = prof.occupation || "otro";
      const defs = (DEFAULT_CATS[occ] || DEFAULT_CATS.otro).map((c, i) => ({
        owner: pers, key: c.key, label: c.label, emoji: c.emoji, color: c.color,
        parent_key: null, is_custom: false, sort_order: i,
      }));
      const ins = await db.from("categories").insert(defs).select();
      categories = (ins.data as Category[]) || defs;
    }
    setCats(categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    const txList = (txs as Tx[]) || [];
    setTx(txList);
    const years = Array.from(new Set(txList.map((t) => t.year).filter(Boolean))) as number[];
    years.sort((a, b) => b - a);
    setFYear(years[0] ?? "all");
    setPhase("app");
  }, []);

  // ── arranque: buscar perfil por slug + restaurar sesión ──
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await db.from("profiles")
        .select("person,display_name,occupation,currency,palette,slug").eq("slug", slug).maybeSingle();
      if (!alive) return;
      if (!data) { setPhase("notfound"); return; }
      const prof = data as Profile;
      setProfile(prof); setPerson(prof.person);
      try {
        const raw = sessionStorage.getItem("gx_auth_" + slug);
        if (raw) {
          const s = JSON.parse(raw) as { h: string; day: string };
          if (s.day === new Date().toISOString().slice(0, 10)) {
            const { data: ok } = await db.from("profiles").select("person").eq("slug", slug).eq("pin_hash", s.h).maybeSingle();
            if (ok && alive) { await loadData(prof.person, prof); return; }
          }
        }
      } catch {}
      if (alive) setPhase("login");
    })();
    return () => { alive = false; };
  }, [slug, loadData]);

  // ── PIN ──
  const pressPin = (d: string) => {
    if (pin.length >= 4) return;
    const np = pin + d; setPin(np);
    if (np.length === 4) void submitPin(np);
  };
  const submitPin = async (p: string) => {
    const h = await sha256hex(p + PIN_SALT);
    const { data } = await db.from("profiles").select("person,display_name,occupation,currency,palette,slug")
      .eq("slug", slug).eq("pin_hash", h).maybeSingle();
    if (data) {
      sessionStorage.setItem("gx_auth_" + slug, JSON.stringify({ h, day: new Date().toISOString().slice(0, 10) }));
      const prof = data as Profile; setProfile(prof);
      await loadData(prof.person, prof);
    } else {
      setErr("PIN incorrecto"); setPin("");
      setTimeout(() => setErr(""), 2500);
    }
  };
  const logout = () => { sessionStorage.removeItem("gx_auth_" + slug); setPin(""); setPhase("login"); };

  // ── helpers de categorías ──
  const catBy = useCallback((k?: string | null) => cats.find((c) => c.key === k), [cats]);
  const catLabel = (k?: string | null) => catBy(k)?.label || (k === "ingreso" ? "Ingreso" : k || "Otros");
  const catEmoji = (k?: string | null) => catBy(k)?.emoji || (k === "ingreso" ? "💰" : "📦");
  const catColor = (k?: string | null) => catBy(k)?.color || "#90A4AE";
  const acctName = (id?: string | null) => accounts.find((a) => a.id === id)?.name || "";
  const cur = profile?.currency;

  // ── filtros ──
  const years = useMemo(() => {
    const y = Array.from(new Set(tx.map((t) => t.year).filter(Boolean))) as number[];
    return y.sort((a, b) => b - a);
  }, [tx]);
  const months = useMemo(() => {
    if (fYear === "all") return [];
    return Array.from(new Set(tx.filter((t) => t.year === fYear).map((t) => t.month).filter(Boolean))) as string[];
  }, [tx, fYear]);
  const filtered = useMemo(() => tx.filter((t) =>
    (fYear === "all" || t.year === fYear) && (fMonth === "all" || t.month === fMonth)), [tx, fYear, fMonth]);

  const expenses = filtered.filter(isExpense);
  const incomes = filtered.filter(isIncome);
  const totalExp = sumAmt(expenses);
  const totalInc = sumAmt(incomes);
  const byCat = expenseByCategory(expenses);
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const pal = resolvePalette(profile?.palette);
  const wrapStyle = {
    ["--primary"]: pal.primary, ["--accent"]: pal.accent, ["--bg"]: pal.bg,
  } as React.CSSProperties;

  // ── render ──
  if (phase === "loading")
    return <div className="gx"><div className="gx-spin">Cargando…</div></div>;

  if (phase === "notfound")
    return <div className="gx" style={wrapStyle}><div className="gx-auth"><div className="gx-card">
      <div className="gx-logo">💳</div><h1>Control de Gastos</h1>
      <p className="gx-sub">Usuario &quot;{slug}&quot; no encontrado.</p>
      <a className="gx-link" href="/gastos-beta">Elegir usuario</a>
    </div></div></div>;

  if (phase === "login")
    return <div className="gx" style={wrapStyle}><div className="gx-auth"><div className="gx-card">
      <div className="gx-logo">💳</div><h1>Control de Gastos</h1>
      <p className="gx-sub">Ingresa el PIN de</p>
      <p className="gx-user">{profile?.display_name || cap(person)}</p>
      <div className="gx-dots">{[0,1,2,3].map((i) => <span key={i} className={"gx-dot" + (i < pin.length ? " on" : "")} />)}</div>
      <div className="gx-err">{err}</div>
      <div className="gx-pad">
        {["1","2","3","4","5","6","7","8","9"].map((d) => <button key={d} className="gx-key" onClick={() => pressPin(d)}>{d}</button>)}
        <span />
        <button className="gx-key" onClick={() => pressPin("0")}>0</button>
        <button className="gx-key" onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
      </div>
      <a className="gx-link" href="/gastos-beta">Cambiar usuario</a>
    </div></div></div>;

  const occ = OCCUPATIONS[profile?.occupation || "otro"] || OCCUPATIONS.otro;
  const drillTx = drillCat ? expenses.filter((t) => (t.category || "otros") === drillCat) : [];
  const byMonth = fYear === "all" ? {} : expenseByMonth(tx, fYear as number);
  const barLabels = MONTHS_ES.slice(1).map((m) => m.slice(0, 3));
  const barData = Array.from({ length: 12 }, (_, i) => byMonth[i + 1] || 0);

  const txRow = (t: Tx) => {
    const inc = isIncome(t);
    return (
      <button key={String(t.id)} className="gx-tx" onClick={() => setDetail(t)}>
        <span className="gx-ic" style={{ background: (inc ? "#43A047" : catColor(t.category)) + "22", color: inc ? "#43A047" : catColor(t.category) }}>
          {inc ? "💰" : catEmoji(t.category)}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="d">{t.description || t.original_description || "(sin descripción)"}</span>
          <span className="s">{t.date || ""}{t.account_id ? " · " + acctName(t.account_id) : ""}{t.user_note ? " · 📝" : ""}</span>
        </span>
        <span className={"a " + (inc ? "gx-pos" : "")}>{inc ? "+" : "-"}{fmt(t.amount, cur)}</span>
      </button>
    );
  };

  return (
    <div className="gx" style={wrapStyle}>
      <div className="gx-shell">
        <header className="gx-hdr">
          <span>{occ.emoji} {profile?.display_name || cap(person)}</span>
          <button className="gx-out" onClick={logout} title="Salir">⎋</button>
        </header>

        <div className="gx-view">
          <div className="gx-filters">
            <select className="gx-sel" value={String(fYear)} onChange={(e) => { setFYear(e.target.value === "all" ? "all" : Number(e.target.value)); setFMonth("all"); }}>
              <option value="all">Todos los años</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="gx-sel" value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
              <option value="all">Todo el año</option>
              {months.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
            </select>
          </div>

          <div className="gx-cards">
            <div className="gx-c"><div className="ic" style={{ color: "var(--primary)" }}>💸</div><div className="v">{fmt(totalExp, cur)}</div><div className="l">Gastado</div></div>
            <div className="gx-c"><div className="ic" style={{ color: "var(--accent)" }}>💰</div><div className="v">{fmt(totalInc, cur)}</div><div className="l">Ingresos</div></div>
            <div className="gx-c"><div className="ic">⚖️</div><div className="v" style={{ color: totalInc - totalExp >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(totalInc - totalExp, cur)}</div><div className="l">Balance</div></div>
            <div className="gx-c"><div className="ic">🧾</div><div className="v">{filtered.length}</div><div className="l">Movimientos</div></div>
          </div>

          {catEntries.length > 0 && (
            <div className="gx-panel">
              <h3 className="gx-h">Gastos por categoría</h3>
              <div className="gx-chart">
                <DonutChart
                  labels={catEntries.map(([k]) => catLabel(k))}
                  data={catEntries.map(([, v]) => v)}
                  colors={catEntries.map(([k]) => catColor(k))}
                  onSlice={(i) => setDrillCat(catEntries[i][0])}
                />
              </div>
              <p className="gx-hint">Toca una categoría para ver sus gastos.</p>
            </div>
          )}

          {fYear !== "all" && (
            <div className="gx-panel">
              <h3 className="gx-h">Gasto por mes</h3>
              <div className="gx-chart"><BarChart labels={barLabels} data={barData} color={pal.primary} /></div>
            </div>
          )}

          <div className="gx-panel">
            <h3 className="gx-h">Categorías</h3>
            {catEntries.length === 0 ? <p className="muted center">Sin gastos en este periodo.</p> :
              catEntries.map(([k, v]) => {
                const pct = totalExp > 0 ? Math.round((v / totalExp) * 100) : 0;
                return (
                  <button key={k} className="gx-row" onClick={() => setDrillCat(k)}>
                    <span className="gx-ic" style={{ background: catColor(k) + "22", color: catColor(k) }}>{catEmoji(k)}</span>
                    <span className="gx-info">
                      <span className="gx-name">{catLabel(k)}</span>
                      <span className="gx-bar"><i style={{ width: pct + "%", background: catColor(k) }} /></span>
                    </span>
                    <span className="gx-amt">{fmt(v, cur)}<small>{pct}%</small></span>
                    <span className="gx-chev">›</span>
                  </button>
                );
              })}
          </div>

          <div className="gx-panel">
            <h3 className="gx-h">Movimientos recientes</h3>
            {filtered.length === 0 ? <p className="muted center">Sin movimientos.</p> : filtered.slice(0, 15).map(txRow)}
          </div>

          <p className="gx-hint">Versión nueva (beta). Próximamente: cuentas, agregar movimientos, importar y ajustes.</p>
        </div>
      </div>

      {drillCat && (
        <div className="gx-modal" onClick={() => setDrillCat(null)}>
          <div className="gx-mcard" onClick={(e) => e.stopPropagation()}>
            <div className="gx-mtop">
              <div><h3>{catEmoji(drillCat)} {catLabel(drillCat)}</h3>
                <p className="muted">{fmt(sumAmt(drillTx), cur)} · {drillTx.length} {drillTx.length === 1 ? "gasto" : "gastos"}</p></div>
              <button className="gx-x" onClick={() => setDrillCat(null)}>✕</button>
            </div>
            <div className="gx-mbody">{drillTx.length ? drillTx.map(txRow) : <p className="muted center">Sin gastos.</p>}</div>
          </div>
        </div>
      )}

      {detail && (
        <div className="gx-modal" onClick={() => setDetail(null)}>
          <div className="gx-mcard" onClick={(e) => e.stopPropagation()}>
            <div className="gx-mtop"><h3>Detalle</h3><button className="gx-x" onClick={() => setDetail(null)}>✕</button></div>
            <div className="gx-mbody">
              <div style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", margin: "6px 0 14px", color: isIncome(detail) ? "var(--green)" : "var(--text)" }}>
                {isIncome(detail) ? "+" : "-"}{fmt(detail.amount, cur)}
              </div>
              <label className="muted" style={{ fontSize: ".74rem" }}>Del estado de cuenta (no editable)</label>
              <div className="gx-locked">{detail.original_description || detail.description || "—"}</div>
              <p style={{ marginTop: 10, fontSize: ".85rem" }}><b>Fecha:</b> {detail.date || "—"}</p>
              <p style={{ fontSize: ".85rem" }}><b>Categoría:</b> {catEmoji(detail.category)} {catLabel(detail.category)}</p>
              {detail.account_id && <p style={{ fontSize: ".85rem" }}><b>Cuenta:</b> {acctName(detail.account_id)}</p>}
              {detail.user_note && <p style={{ fontSize: ".85rem" }}><b>Nota:</b> {detail.user_note}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

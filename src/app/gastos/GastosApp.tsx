"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fmt, cap, isExpense, isIncome, sumAmt, expenseByCategory, expenseByMonth,
  MONTHS_ES, PALETTES, DEFAULT_PALETTE_KEY, OCCUPATIONS, KNOWN_CATS,
  type Profile, type Account, type Category, type Tx, type Palette,
} from "@/lib/gastos";
import { DonutChart, BarChart } from "./Charts";
import AccountsView from "./AccountsView";
import EntryView from "./EntryView";
import "./gastos.css";

type Phase = "loading" | "login" | "notfound" | "app";

function resolvePalette(p?: Palette | null) {
  if (p?.key && PALETTES[p.key]) { const x = PALETTES[p.key]; return { primary: x.primary!, accent: x.accent!, bg: x.bg! }; }
  if (p?.primary) return { primary: p.primary, accent: p.accent || p.primary, bg: p.bg || "#f4f5fb" };
  const d = PALETTES[DEFAULT_PALETTE_KEY]; return { primary: d.primary!, accent: d.accent!, bg: d.bg! };
}

export default function GastosApp({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loginName, setLoginName] = useState<string>(slug);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [fYear, setFYear] = useState<number | "all">("all");
  const [fMonth, setFMonth] = useState<string>("all");
  const [drillCat, setDrillCat] = useState<string | null>(null);
  const [detail, setDetail] = useState<Tx | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [persons, setPersons] = useState<{ person: string; display_name: string | null }[]>([]);
  const [scope, setScope] = useState<string>("all");
  const [view, setView] = useState<"dashboard" | "cuentas" | "agregar">("dashboard");

  const loadData = useCallback(async (sc: string = "all"): Promise<boolean> => {
    const r = await fetch(`/api/gastos/data?slug=${encodeURIComponent(slug)}&person=${encodeURIComponent(sc)}`, { cache: "no-store" });
    if (r.status === 401) return false;
    const j = await r.json();
    setIsAdmin(!!j.admin);
    setPersons((j.persons as { person: string; display_name: string | null }[]) || []);
    setScope(j.scope || sc);
    setProfile(j.profile as Profile);
    setAccounts((j.accounts as Account[]) || []);
    setCats(((j.categories as Category[]) || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    const txList = (j.tx as Tx[]) || [];
    setTx(txList);
    const years = Array.from(new Set(txList.map((t) => t.year).filter(Boolean))) as number[];
    years.sort((a, b) => b - a);
    setFYear(years[0] ?? "all");
    setPhase("app");
    return true;
  }, [slug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await loadData();
      if (!alive) return;
      if (ok) return;
      // necesita login: traer nombre para mostrar
      try {
        const r = await fetch("/api/gastos/users");
        const j = await r.json();
        const u = ((j.users as { slug: string; display_name: string | null }[]) || []).find((x) => x.slug === slug);
        if (!alive) return;
        if (!u) { setPhase("notfound"); return; }
        setLoginName(u.display_name || slug);
      } catch {}
      if (alive) setPhase("login");
    })();
    return () => { alive = false; };
  }, [slug, loadData]);

  const pressPin = (d: string) => {
    if (pin.length >= 4) return;
    const np = pin + d; setPin(np);
    if (np.length === 4) void submitPin(np);
  };
  const submitPin = async (p: string) => {
    const r = await fetch("/api/gastos/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, pin: p }),
    });
    if (r.ok) { setPin(""); await loadData(); }
    else { setErr("PIN incorrecto"); setPin(""); setTimeout(() => setErr(""), 2500); }
  };
  const logout = async () => { await fetch("/api/gastos/logout", { method: "POST" }); setPin(""); setPhase("login"); };

  const catBy = useCallback((k?: string | null) => cats.find((c) => c.key === k), [cats]);
  const catLabel = (k?: string | null) => catBy(k)?.label || (k ? KNOWN_CATS[k]?.label : undefined) || (k === "ingreso" ? "Ingreso" : k || "Otros");
  const catEmoji = (k?: string | null) => catBy(k)?.emoji || (k ? KNOWN_CATS[k]?.emoji : undefined) || "📦";
  const catColor = (k?: string | null) => catBy(k)?.color || (k ? KNOWN_CATS[k]?.color : undefined) || "#90A4AE";
  const acctName = (id?: string | null) => accounts.find((a) => a.id === id)?.name || "";
  const personName = (p?: string | null) => persons.find((x) => x.person === p)?.display_name || p || "";
  const cur = profile?.currency;

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
  const wrapStyle = { ["--primary"]: pal.primary, ["--accent"]: pal.accent, ["--bg"]: pal.bg } as React.CSSProperties;

  if (phase === "loading")
    return <div className="gx"><div className="gx-spin">Cargando…</div></div>;

  if (phase === "notfound")
    return <div className="gx" style={wrapStyle}><div className="gx-auth"><div className="gx-card">
      <div className="gx-logo">💳</div><h1>Control de Gastos</h1>
      <p className="gx-sub">Usuario &quot;{slug}&quot; no encontrado.</p>
      <a className="gx-link" href="/gastos">Elegir usuario</a>
    </div></div></div>;

  if (phase === "login")
    return <div className="gx" style={wrapStyle}><div className="gx-auth"><div className="gx-card">
      <div className="gx-logo">💳</div><h1>Control de Gastos</h1>
      <p className="gx-sub">Ingresa el PIN de</p>
      <p className="gx-user">{loginName}</p>
      <div className="gx-dots">{[0,1,2,3].map((i) => <span key={i} className={"gx-dot" + (i < pin.length ? " on" : "")} />)}</div>
      <div className="gx-err">{err}</div>
      <div className="gx-pad">
        {["1","2","3","4","5","6","7","8","9"].map((d) => <button key={d} className="gx-key" onClick={() => pressPin(d)}>{d}</button>)}
        <span />
        <button className="gx-key" onClick={() => pressPin("0")}>0</button>
        <button className="gx-key" onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
      </div>
      <a className="gx-link" href="/gastos">Cambiar usuario</a>
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
          <span className="s">{t.date || ""}{isAdmin && scope === "all" && t.person ? " · " + personName(t.person) : ""}{t.account_id ? " · " + acctName(t.account_id) : ""}{t.user_note ? " · 📝" : ""}</span>
        </span>
        <span className={"a " + (inc ? "gx-pos" : "")}>{inc ? "+" : "-"}{fmt(t.amount, cur)}</span>
      </button>
    );
  };

  return (
    <div className="gx" style={wrapStyle}>
      <div className="gx-shell">
        <header className="gx-hdr">
          <span>{isAdmin ? "🛠️ Admin" : `${occ.emoji} ${profile?.display_name || cap(slug)}`}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <select className="gx-sel" style={{ maxWidth: 160 }} value={scope}
                onChange={(e) => { setScope(e.target.value); void loadData(e.target.value); }}>
                <option value="all">Todos</option>
                {persons.map((p) => <option key={p.person} value={p.person}>{p.display_name || p.person}</option>)}
              </select>
            )}
            <button className="gx-out" onClick={logout} title="Salir">⎋</button>
          </div>
        </header>

        {view === "dashboard" && (
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

          <p className="gx-hint">Importar estados de cuenta y ajustes llegan en las próximas fases.</p>
        </div>
        )}

        {view === "cuentas" && <AccountsView accounts={accounts} tx={tx} cur={cur} onReload={() => loadData(scope)} onClose={() => setView("dashboard")} />}
        {view === "agregar" && <EntryView accounts={accounts} cats={cats} tx={tx} cur={cur} onDone={() => { void loadData(scope); setView("dashboard"); }} onCancel={() => setView("dashboard")} />}

        {!isAdmin && (
          <nav className="gx-nav">
            <button className={"gx-navbtn" + (view === "dashboard" ? " on" : "")} onClick={() => setView("dashboard")}><span>📊</span>Inicio</button>
            <button className="gx-fab" onClick={() => setView("agregar")} title="Agregar">+</button>
            <button className={"gx-navbtn" + (view === "cuentas" ? " on" : "")} onClick={() => setView("cuentas")}><span>🏦</span>Cuentas</button>
          </nav>
        )}
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

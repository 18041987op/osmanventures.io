"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fmt, cap, isExpense, isIncome, sumAmt, expenseByCategory, expenseByMonth,
  MONTHS_ES, PALETTES, DEFAULT_PALETTE_KEY, OCCUPATIONS, KNOWN_CATS, guessCategory, computeBudget, computeAnt, antDefault,
  type Profile, type Account, type Category, type Tx, type Palette,
} from "@/lib/gastos";
import { DonutChart, BarChart } from "./Charts";
import AccountsView from "./AccountsView";
import EntryView from "./EntryView";
import CategoriesView from "./CategoriesView";
import SettingsView from "./SettingsView";
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
  const [persons, setPersons] = useState<{ person: string; display_name: string | null; currency?: string | null; occupation?: string | null }[]>([]);
  const [scope, setScope] = useState<string>("all");
  const [view, setView] = useState<"dashboard" | "cuentas" | "agregar" | "categorias" | "ajustes">("dashboard");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [exclusions, setExclusions] = useState<{ merchant: string; label: string | null }[]>([]);
  const [antDrill, setAntDrillState] = useState<string | null>(null);
  const [antOpen, setAntOpen] = useState<Set<string>>(new Set());
  const setAntDrill = (k: string | null) => { setAntOpen(new Set()); setAntDrillState(k); };

  const loadData = useCallback(async (sc: string = "all"): Promise<boolean> => {
    const r = await fetch(`/api/gastos/data?slug=${encodeURIComponent(slug)}&person=${encodeURIComponent(sc)}`, { cache: "no-store" });
    if (r.status === 401) return false;
    const j = await r.json();
    setIsAdmin(!!j.admin);
    setPersons((j.persons as { person: string; display_name: string | null; currency?: string | null; occupation?: string | null }[]) || []);
    setScope(j.scope || sc);
    setProfile(j.profile as Profile);
    setAccounts((j.accounts as Account[]) || []);
    setCats(((j.categories as Category[]) || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    const txList = (j.tx as Tx[]) || [];
    setTx(txList);
    setExclusions((j.exclusions as { merchant: string; label: string | null }[]) || []);
    const years = Array.from(new Set(txList.map((t) => t.year).filter(Boolean))) as number[];
    years.sort((a, b) => b - a);
    setFYear(j.admin ? "all" : (years[0] ?? "all"));
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

  useEffect(() => { setAnalysisOpen(false); }, [view, scope]);

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
  const cur = isAdmin ? (scope !== "all" ? persons.find((p) => p.person === scope)?.currency : profile?.currency) : profile?.currency;
  const availKeys = new Set(cats.map((c) => c.key));
  const target = isAdmin && scope !== "all" ? scope : undefined;
  const ownAccounts = target ? accounts.filter((a) => a.owner === target) : accounts;
  const ownCats = target ? cats.filter((c) => c.owner === target) : cats;
  const canEdit = !isAdmin || scope !== "all";
  async function excludeMerchant(merchant: string, label: string) {
    const person = isAdmin && scope !== "all" ? scope : undefined;
    const r = await fetch("/api/gastos/ant/exclude", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ merchant, label, person }) });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    await loadData(scope);
  }
  async function includeMerchant(merchant: string) {
    const person = isAdmin && scope !== "all" ? scope : undefined;
    const r = await fetch("/api/gastos/ant/include", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ merchant, person }) });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    await loadData(scope);
  }

  async function setTxCategory(id: string | number, category: string) {
    const r = await fetch("/api/gastos/tx/category", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, category }) });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    setTx((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
    setDetail((d) => (d && d.id === id ? { ...d, category } : d));
  }
  async function autoCategorize() {
    const r = await fetch("/api/gastos/recategorize", { method: "POST" });
    if (!r.ok) { alert("Error: " + (await r.json()).error); return; }
    const j = await r.json();
    setDrillCat(null);
    await loadData(scope);
    alert(`✨ ${j.changed} de ${j.total} reclasificados.`);
  }

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
  const perUser = (isAdmin && scope === "all")
    ? persons.map((p) => {
        const ptx = filtered.filter((t) => t.person === p.person);
        const exp = sumAmt(ptx.filter(isExpense));
        const inc = sumAmt(ptx.filter(isIncome));
        return { ...p, exp, inc, bal: inc - exp, count: ptx.length };
      })
    : [];
  const budget = !(isAdmin && scope === "all") ? computeBudget(tx) : null;
  const excludedSet = new Set(exclusions.map((e) => e.merchant));
  const ant = budget ? computeAnt(tx, profile?.ant_rules?.max ?? antDefault(profile?.occupation), excludedSet) : null;
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
          <span className="s">{t.date || ""}{isAdmin && scope === "all" && t.person ? " · " + personName(t.person) : ""}{t.account_id ? " · " + acctName(t.account_id) : ""}{t.user_note ? " · 📝" : ""}{t.added_by === "admin" ? " · 🛠️" : ""}</span>
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
                onChange={(e) => { const v = e.target.value; setScope(v); if (v === "all") setView("dashboard"); void loadData(v); }}>
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

          {isAdmin && scope === "all" ? (
            <div className="gx-panel">
              <h3 className="gx-h">Resumen por usuario</h3>
              {perUser.length === 0 ? <p className="muted center">Sin usuarios.</p> : perUser.map((u) => (
                <button key={u.person} className="gx-row" onClick={() => { setScope(u.person); void loadData(u.person); }}>
                  <span className="gx-ic" style={{ background: "var(--primary-soft)" }}>{(OCCUPATIONS[u.occupation || "otro"] || OCCUPATIONS.otro).emoji}</span>
                  <span className="gx-info">
                    <span className="gx-name">{u.display_name || u.person}</span>
                    <span className="tx-sub" style={{ color: "var(--muted)", fontSize: ".82rem" }}>Gasto {fmt(u.exp, u.currency)} · Balance {fmt(u.bal, u.currency)}</span>
                  </span>
                  <span className="gx-amt">{u.count}<small>mov.</small></span>
                  <span className="gx-chev">›</span>
                </button>
              ))}
            </div>
          ) : (
          <>
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

          {(budget || ant) && (
            <div className="gx-panel">
              <button className="gx-collap" onClick={() => setAnalysisOpen((o) => !o)}>
                <span>🔮 Análisis del mes{budget ? ` · ${MONTHS_ES[budget.cm]}` : ""}</span>
                <span className="gx-chev">{analysisOpen ? "▾" : "▸"}</span>
              </button>
              {analysisOpen && (
                <div style={{ marginTop: 14 }}>
                  {budget && budget.items.length > 0 && (
                    <>
                      <h3 className="gx-h">Presupuesto estimado</h3>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem" }}>
                          <span>Llevas {fmt(budget.totalActual, cur)}</span>
                          <span className="muted">de ~{fmt(budget.totalPredicted, cur)}</span>
                        </div>
                        <span className="gx-bar" style={{ height: 9, marginTop: 7 }}><i style={{ width: Math.min(100, budget.totalPredicted > 0 ? (budget.totalActual / budget.totalPredicted) * 100 : 0) + "%", background: budget.totalActual > budget.totalPredicted ? "var(--red)" : "var(--primary)" }} /></span>
                      </div>
                      {budget.items.map((it) => {
                        const over = it.actual > it.predicted && it.predicted > 0;
                        return (
                          <div key={it.key} className="gx-row" style={{ cursor: "default" }}>
                            <span className="gx-ic" style={{ background: catColor(it.key) + "22", color: catColor(it.key) }}>{catEmoji(it.key)}</span>
                            <span className="gx-info">
                              <span className="gx-name">{catLabel(it.key)}{over ? " ⚠️" : ""}</span>
                              <span className="gx-bar"><i style={{ width: Math.min(100, it.predicted > 0 ? (it.actual / it.predicted) * 100 : 0) + "%", background: over ? "var(--red)" : catColor(it.key) }} /></span>
                              {ant && ant.byCat[it.key] && (
                                <button className="gx-antnote" onClick={() => setAntDrill(it.key)}>
                                  🐜 <b>{fmt(ant.byCat[it.key].total, cur)}</b> en {ant.byCat[it.key].count} {ant.byCat[it.key].count === 1 ? "compra pequeña" : "compras pequeñas"} — revisar ›
                                </button>
                              )}
                            </span>
                            <span className="gx-amt">{fmt(it.actual, cur)}<small>de {fmt(it.predicted, cur)}</small></span>
                          </div>
                        );
                      })}
                      <p className="gx-hint">Estimado según el promedio de tus meses anteriores.</p>
                    </>
                  )}

                  {ant && (
                    <>
                      <h3 className="gx-h" style={{ marginTop: 18 }}>🐜 Gastos hormiga</h3>
                      {ant.count === 0
                        ? <p className="muted">Sin compras pequeñas (≤ {fmt(ant.threshold, cur)}) este mes. 👍</p>
                        : <div className="sug-box">Llevas <b>{fmt(ant.total, cur)}</b> en <b>{ant.count}</b> compras pequeñas (≤ {fmt(ant.threshold, cur)}) — {ant.monthExpense > 0 ? Math.round((ant.total / ant.monthExpense) * 100) : 0}% de tu gasto del mes. Tócalas bajo cada categoría del presupuesto para revisarlas.</div>}
                      {exclusions.length > 0 && (
                        <>
                          <div style={{ fontWeight: 600, fontSize: ".9rem", margin: "12px 0 6px" }}>Marcados como necesarios</div>
                          {exclusions.map((e) => (
                            <div key={e.merchant} className="gx-row" style={{ cursor: "default" }}>
                              <span className="gx-ic" style={{ background: "var(--primary-soft)" }}>✅</span>
                              <span className="gx-info"><span className="gx-name" style={{ fontSize: ".92rem" }}>{e.label || e.merchant}</span></span>
                              {canEdit && <button className="gx-btn ghost sm" onClick={() => includeMerchant(e.merchant)}>Volver a hormiga</button>}
                            </div>
                          ))}
                        </>
                      )}
                      <p className="gx-hint">Umbral configurable en Ajustes.</p>
                    </>
                  )}
                </div>
              )}
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

          </>
          )}
        </div>
        )}

        {view === "cuentas" && <AccountsView accounts={ownAccounts} tx={tx} cur={cur} person={target} onReload={() => loadData(scope)} onClose={() => setView("dashboard")} />}
        {view === "agregar" && <EntryView accounts={ownAccounts} cats={ownCats} tx={tx} cur={cur} person={target} onDone={() => { void loadData(scope); setView("dashboard"); }} onCancel={() => setView("dashboard")} />}
        {view === "categorias" && <CategoriesView cats={ownCats} tx={tx} cur={cur} person={target} onReload={() => loadData(scope)} onClose={() => setView("dashboard")} />}
        {view === "ajustes" && profile && <SettingsView profile={profile} slug={slug} isAdmin={isAdmin} onReload={() => loadData(scope)} onClose={() => setView("dashboard")} onPalette={(pl) => setProfile({ ...(profile as Profile), palette: pl })} />}

        <nav className="gx-nav">
          <button className={"gx-navbtn" + (view === "dashboard" ? " on" : "")} onClick={() => setView("dashboard")}><span>📊</span>Inicio</button>
          {canEdit && <button className={"gx-navbtn" + (view === "cuentas" ? " on" : "")} onClick={() => setView("cuentas")}><span>🏦</span>Cuentas</button>}
          {canEdit && <button className="gx-fab" onClick={() => setView("agregar")} title="Agregar">+</button>}
          {canEdit && <button className={"gx-navbtn" + (view === "categorias" ? " on" : "")} onClick={() => setView("categorias")}><span>🏷️</span>Categorías</button>}
          <button className={"gx-navbtn" + (view === "ajustes" ? " on" : "")} onClick={() => setView("ajustes")}><span>⚙️</span>Ajustes</button>
        </nav>
      </div>

      {drillCat && (
        <div className="gx-modal" onClick={() => setDrillCat(null)}>
          <div className="gx-mcard" onClick={(e) => e.stopPropagation()}>
            <div className="gx-mtop">
              <div><h3>{catEmoji(drillCat)} {catLabel(drillCat)}</h3>
                <p className="muted">{fmt(sumAmt(drillTx), cur)} · {drillTx.length} {drillTx.length === 1 ? "gasto" : "gastos"}</p></div>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!isAdmin && (drillCat === "otros" || drillCat === "other") && <button className="gx-btn ghost sm" onClick={autoCategorize}>✨ Auto-categorizar</button>}
                <button className="gx-x" onClick={() => setDrillCat(null)}>✕</button>
              </span>
            </div>
            <div className="gx-mbody">{drillTx.length ? drillTx.map(txRow) : <p className="muted center">Sin gastos.</p>}</div>
          </div>
        </div>
      )}

      {antDrill && ant && ant.byCat[antDrill] && (
        <div className="gx-modal" onClick={() => setAntDrill(null)}>
          <div className="gx-mcard" onClick={(ev) => ev.stopPropagation()}>
            <div className="gx-mtop">
              <div><h3>{catEmoji(antDrill)} {catLabel(antDrill)}</h3>
                <p className="muted">🐜 {fmt(ant.byCat[antDrill].total, cur)} en {ant.byCat[antDrill].count} compras pequeñas</p></div>
              <button className="gx-x" onClick={() => setAntDrill(null)}>✕</button>
            </div>
            <div className="gx-mbody">
              {ant.byCat[antDrill].merchants.map((m) => {
                const open = antOpen.has(m.merchant);
                return (
                  <div key={m.merchant}>
                    <div className="gx-row" style={{ cursor: "default" }}>
                      <button className="gx-info" style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: m.count > 1 ? "pointer" : "default" }}
                        onClick={() => { if (m.count <= 1) return; setAntOpen((p) => { const n = new Set(p); n.has(m.merchant) ? n.delete(m.merchant) : n.add(m.merchant); return n; }); }}>
                        <span className="gx-name">{m.label}</span>
                        <span className="tx-sub" style={{ color: "var(--muted)", fontSize: ".82rem" }}>{m.count} {m.count === 1 ? "compra" : "compras"} · {fmt(m.total, cur)}{m.count > 1 ? (open ? "  ▾ ocultar" : "  ▸ ver cada una") : ""}</span>
                      </button>
                      {canEdit && <button className="gx-btn warn sm" onClick={() => excludeMerchant(m.merchant, m.label)}>necesario</button>}
                    </div>
                    {open && m.count > 1 && (
                      <div className="gx-antexp">
                        {m.items.map((it) => (
                          <div key={it.id} className="row"><span>{it.date || "—"}</span><b>{fmt(it.amount, cur)}</b></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="gx-hint">&quot;Necesario&quot; lo saca de gastos hormiga y la app lo recuerda.</p>
            </div>
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
              {detail.added_by === "admin" && <div style={{ textAlign: "center", marginBottom: 8 }}><span style={{ background: "var(--primary-soft)", color: "var(--primary)", borderRadius: 20, padding: "3px 10px", fontSize: ".78rem", fontWeight: 600 }}>🛠️ Agregado por Admin</span></div>}
              <label className="muted" style={{ fontSize: ".74rem" }}>Del estado de cuenta (no editable)</label>
              <div className="gx-locked">{detail.original_description || detail.description || "—"}</div>
              <p style={{ marginTop: 10, fontSize: ".85rem" }}><b>Fecha:</b> {detail.date || "—"}</p>
              {isAdmin || isIncome(detail) ? (
                <p style={{ fontSize: ".85rem" }}><b>Categoría:</b> {catEmoji(detail.category)} {catLabel(detail.category)}</p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <label className="muted" style={{ fontSize: ".74rem" }}>Categoría</label>
                  <select className="gx-inp" value={detail.category || "otros"} onChange={(e) => setTxCategory(detail.id, e.target.value)}>
                    {cats.filter((c) => !c.parent_key).flatMap((c) => [
                      <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>,
                      ...cats.filter((sb) => sb.parent_key === c.key).map((sb) => <option key={sb.key} value={sb.key}>&nbsp;&nbsp;↳ {sb.emoji} {sb.label}</option>),
                    ])}
                  </select>
                  {(() => { const g = guessCategory(detail.original_description || detail.description || "", availKeys); return g !== "otros" && g !== "other" && g !== detail.category ? (
                    <button className="gx-btn ghost sm" style={{ marginTop: 8 }} onClick={() => setTxCategory(detail.id, g)}>Sugerencia: {catEmoji(g)} {catLabel(g)}</button>
                  ) : null; })()}
                </div>
              )}
              {detail.account_id && <p style={{ fontSize: ".85rem" }}><b>Cuenta:</b> {acctName(detail.account_id)}</p>}
              {detail.user_note && <p style={{ fontSize: ".85rem" }}><b>Nota:</b> {detail.user_note}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

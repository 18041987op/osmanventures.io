// ════════════════════════════════════════════════════════════════
// Control de Gastos — capa base (Supabase + config + helpers)
// Misma base de datos que el proyecto original (no se migra nada).
// ════════════════════════════════════════════════════════════════
export const PIN_SALT = "gastos-hn-2026";

// ── Tipos ───────────────────────────────────────────────────────
export interface Profile {
  person: string;
  display_name?: string | null;
  occupation?: string | null;
  currency?: string | null;
  palette?: Palette | null;
  slug?: string | null;
}
export interface Palette {
  key?: string;
  primary?: string;
  accent?: string;
  bg?: string;
  dark?: boolean;
}
export interface Account {
  id: string;
  owner: string;
  name: string;
  bank?: string | null;
  kind: string; // bank | cash | credit
  color?: string | null;
  archived?: boolean;
}
export interface Category {
  id?: string;
  owner: string;
  key: string;
  label: string;
  emoji: string;
  color: string;
  parent_key?: string | null;
  is_custom?: boolean;
  sort_order?: number;
  archived?: boolean;
}
export interface Tx {
  id: string | number;
  date?: string | null;
  description?: string | null;
  original_description?: string | null;
  user_note?: string | null;
  category?: string | null;
  subcategory?: string | null;
  cat_label?: string | null;
  month?: string | null;
  month_display?: string | null;
  month_num?: number | null;
  year?: number | null;
  amount?: number | null;
  type?: string | null;
  person?: string | null;
  direction?: string | null;
  kind?: string | null;
  counts_as_expense?: boolean | null;
  account_id?: string | null;
  transfer_account_id?: string | null;
  income_source?: string | null;
  source_note?: string | null;
  has_receipt?: boolean | null;
}

// ── Paletas ─────────────────────────────────────────────────────
export const PALETTES: Record<string, Palette & { name: string }> = {
  indigo:   { name: "Índigo", primary: "#5C6BC0", accent: "#7E57C2", bg: "#f4f5fb" },
  ocean:    { name: "Océano", primary: "#0277BD", accent: "#00ACC1", bg: "#eef6fb" },
  sunset:   { name: "Atardecer", primary: "#F4511E", accent: "#FB8C00", bg: "#fff5ef" },
  forest:   { name: "Bosque", primary: "#2E7D32", accent: "#66BB6A", bg: "#eef7ef" },
  grape:    { name: "Uva", primary: "#8E24AA", accent: "#D81B60", bg: "#faeffb" },
  slate:    { name: "Pizarra", primary: "#455A64", accent: "#26A69A", bg: "#eef1f3" },
  rose:     { name: "Rosa", primary: "#D81B60", accent: "#F06292", bg: "#fdeff5" },
  midnight: { name: "Medianoche", primary: "#3949AB", accent: "#5C6BC0", bg: "#0f1226", dark: true },
};
export const DEFAULT_PALETTE_KEY = "indigo";

export const OCCUPATIONS: Record<string, { label: string; emoji: string }> = {
  student:      { label: "Estudiante", emoji: "🎓" },
  parent:       { label: "Padre / Madre", emoji: "👨‍👩‍👧" },
  professional: { label: "Profesional", emoji: "💼" },
  otro:         { label: "Otro", emoji: "✨" },
};

type CatDef = { key: string; label: string; emoji: string; color: string };
export const DEFAULT_CATS: Record<string, CatDef[]> = {
  student: [
    { key: "cafeteria", label: "Cafeterías", emoji: "☕", color: "#667eea" },
    { key: "restaurante", label: "Restaurantes", emoji: "🍔", color: "#f7971e" },
    { key: "universidad", label: "Universidad", emoji: "📚", color: "#00b09b" },
    { key: "transporte", label: "Transporte", emoji: "🚌", color: "#42a5f5" },
    { key: "telefono", label: "Teléfono", emoji: "📱", color: "#26c6da" },
    { key: "suscripcion", label: "Suscripciones", emoji: "🎵", color: "#ff7043" },
    { key: "ropa", label: "Ropa y Moda", emoji: "👗", color: "#e040fb" },
    { key: "supermercado", label: "Supermercado", emoji: "🛒", color: "#66bb6a" },
    { key: "salud", label: "Salud", emoji: "💊", color: "#ef5350" },
    { key: "diversion", label: "Diversión", emoji: "🎬", color: "#ab47bc" },
    { key: "otros", label: "Otros", emoji: "📦", color: "#90a4ae" },
  ],
  parent: [
    { key: "hogar", label: "Hogar / Renta", emoji: "🏠", color: "#8d6e63" },
    { key: "servicios", label: "Servicios", emoji: "💡", color: "#ffd740" },
    { key: "supermercado", label: "Supermercado", emoji: "🛒", color: "#66bb6a" },
    { key: "restaurante", label: "Restaurantes", emoji: "🍽️", color: "#f7971e" },
    { key: "transporte", label: "Transporte", emoji: "🚗", color: "#ffa726" },
    { key: "educacion", label: "Educación", emoji: "🎒", color: "#5c6bc0" },
    { key: "salud", label: "Salud", emoji: "💊", color: "#ef5350" },
    { key: "ropa", label: "Ropa", emoji: "👕", color: "#ab47bc" },
    { key: "seguros", label: "Seguros", emoji: "🛡️", color: "#78909c" },
    { key: "ahorro", label: "Ahorro", emoji: "🏦", color: "#2e7d32" },
    { key: "otros", label: "Otros", emoji: "📦", color: "#90a4ae" },
  ],
  professional: [
    { key: "oficina", label: "Oficina", emoji: "🏢", color: "#5c6bc0" },
    { key: "restaurante", label: "Comidas", emoji: "🍽️", color: "#f7971e" },
    { key: "transporte", label: "Transporte", emoji: "🚗", color: "#ffa726" },
    { key: "tecnologia", label: "Tecnología", emoji: "💻", color: "#26c6da" },
    { key: "formacion", label: "Formación", emoji: "📖", color: "#00b09b" },
    { key: "salud", label: "Salud", emoji: "💊", color: "#ef5350" },
    { key: "ropa", label: "Ropa", emoji: "👔", color: "#ab47bc" },
    { key: "impuestos", label: "Impuestos", emoji: "🏛️", color: "#b71c1c" },
    { key: "inversiones", label: "Inversiones", emoji: "📈", color: "#1565c0" },
    { key: "otros", label: "Otros", emoji: "📦", color: "#90a4ae" },
  ],
  otro: [
    { key: "hogar", label: "Hogar", emoji: "🏠", color: "#8d6e63" },
    { key: "comida", label: "Comida", emoji: "🍽️", color: "#f7971e" },
    { key: "transporte", label: "Transporte", emoji: "🚗", color: "#ffa726" },
    { key: "salud", label: "Salud", emoji: "💊", color: "#ef5350" },
    { key: "personal", label: "Personal", emoji: "✨", color: "#ab47bc" },
    { key: "compras", label: "Compras", emoji: "🛍️", color: "#ff6f00" },
    { key: "otros", label: "Otros", emoji: "📦", color: "#90a4ae" },
  ],
};

export const INCOME_SOURCES: Record<string, { label: string; emoji: string }> = {
  payroll:     { label: "Nómina", emoji: "💼" },
  transfer_in: { label: "Transferencia", emoji: "📲" },
  deposit:     { label: "Depósito", emoji: "🏧" },
  gift:        { label: "Regalo / Familia", emoji: "🎁" },
  refund:      { label: "Reembolso", emoji: "↩️" },
  other:       { label: "Otro", emoji: "💰" },
};

export const MONTHS_ES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MONTH_ORDER: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// ── Helpers de seguridad ────────────────────────────────────────
export async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Helpers de dinero / fechas ──────────────────────────────────
export function curSymbol(currency?: string | null): string {
  const map: Record<string, string> = { HNL: "L ", USD: "$", EUR: "€", MXN: "$", GTQ: "Q " };
  return map[currency || "HNL"] || (currency || "L") + " ";
}
export function fmt(n: number | null | undefined, currency?: string | null): string {
  return curSymbol(currency) + Number(n || 0).toLocaleString("es-HN",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function cap(s: string): string {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}

// ── Reglas contables ────────────────────────────────────────────
export function isExpense(t: Tx): boolean {
  if (t.counts_as_expense === false) return false;
  if (t.kind === "income" || t.direction === "income") return false;
  if (t.kind === "transfer" || t.kind === "withdrawal") return false;
  return true;
}
export function isIncome(t: Tx): boolean {
  return t.kind === "income" || t.direction === "income";
}
export function sumAmt(arr: Tx[]): number {
  return arr.reduce((s, t) => s + Number(t.amount || 0), 0);
}
export function expenseByCategory(arr: Tx[]): Record<string, number> {
  const r: Record<string, number> = {};
  arr.filter(isExpense).forEach((t) => {
    const k = t.category || "otros";
    r[k] = (r[k] || 0) + Number(t.amount || 0);
  });
  return r;
}
export function expenseByMonth(all: Tx[], year: number): Record<number, number> {
  const r: Record<number, number> = {};
  all.filter((t) => t.year === year && isExpense(t)).forEach((t) => {
    const m = t.month_num || 0;
    r[m] = (r[m] || 0) + Number(t.amount || 0);
  });
  return r;
}
export function accountBalance(all: Tx[], accId: string): number {
  let bal = 0;
  all.forEach((t) => {
    const amt = Number(t.amount || 0);
    if (t.account_id === accId) bal += isIncome(t) ? amt : -amt;
    if (t.transfer_account_id === accId && (t.kind === "withdrawal" || t.kind === "transfer")) bal += amt;
  });
  return bal;
}

// ── Similitud (sugerir subcategoría) ────────────────────────────
function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "").trim();
}
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
export function similarity(a: string, b: string): number {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const l = 1 - lev(a, b) / Math.max(a.length, b.length);
  const ta = new Set(a.split(" ")), tb = new Set(b.split(" "));
  const inter = Array.from(ta).filter((x) => tb.has(x)).length;
  const jac = inter / new Set(Array.from(ta).concat(Array.from(tb))).size;
  return Math.max(l, jac);
}

export function slugify(label: string): string {
  return norm(label).replace(/ +/g, "_").slice(0, 30) || "cat";
}

// Mapa global de categorías conocidas (iconos/colores) para mostrar bien
// aunque la categoría no esté en la tabla del usuario.
export const KNOWN_CATS: Record<string, { label: string; emoji: string; color: string }> = (() => {
  const m: Record<string, { label: string; emoji: string; color: string }> = {};
  Object.values(DEFAULT_CATS).forEach((arr) => arr.forEach((c) => { if (!m[c.key]) m[c.key] = { label: c.label, emoji: c.emoji, color: c.color }; }));
  m.efectivo = { label: "Efectivo", emoji: "💵", color: "#ffd740" };
  m.ingreso = { label: "Ingreso", emoji: "💰", color: "#43A047" };
  m.transfer = { label: "Traspaso", emoji: "🔁", color: "#26A69A" };
  return m;
})();

// Categorización automática por palabras clave (Honduras). Devuelve una clave estándar.
export function guessCategory(desc: string): string {
  const d = (desc || "").toUpperCase();
  if (/\bUBER\b|INDRIVE|\bYANGO\b|\bDIDI\b|\bTAXI\b|GASOLINA|COMBUSTIBLE|\bPUMA\b|TEXACO|TERPEL|DIPPSA|ASERVICENTRO|SERVICENTRO|ESTACION|PEAJE|PARQUEO|\bBUS\b|RENT A CAR|UNO\b/.test(d)) return "transporte";
  if (/KENTUCKY|\bKFC\b|MC ?DONALD|BURGER|\bPIZZA\b|PIZZERIA|WENDY|POPEYE|LITTLE CAESAR|CAESAR|DOMINO|PAPA JOHN|MONSTER GRILL|\bGRILL\b|DELICIOUS|DENNY|BALEAD|CHURRASCO|ASADO|COMEDOR|\bPOLLO\b|CHICK|CHIKEN|\bTACO|SUSHI|RESTAURANT|FRIDAYS|SUBWAY|DUNKIN|FOOD|COMIDA|PEDIDOSYA|\bHUGO\b|ANTOJITOS|CARNES?/.test(d)) return "restaurante";
  if (/UNICAFE|COFFEE|\bCAFE\b|STARBUCKS|ESPRESSO/.test(d)) return "cafeteria";
  if (/SUPERMERCADO|\bSUPER\b|\bMAXI\b|PRICESMART|WAL ?MART|LA COLONIA|DESPENSA|ABARROTERIA|ABARROTES|CARNICERIA|PULPERIA|MERCADITO|MERCADO|JUNIOR|COMERCIAL|MINI ?SUPER|VERDURAS|FRUTAS/.test(d)) return "supermercado";
  if (/\bTIGO\b|\bCLARO\b|HONDUTEL|RECARGA/.test(d)) return "telefono";
  if (/SPOTIFY|NETFLIX|\bAPPLE\b|APPLEACOM|DISNEY|\bHBO\b|YOUTUBE|AMAZON|\bPRIME\b|GOOGLE|MICROSOFT|CANVA|ADOBE|OPENAI|CHATGPT/.test(d)) return "suscripcion";
  if (/UNIVERSIDAD|\bUNAH\b|UNICAH|\bUTH\b|CEUTEC|COLEGIO|MATRICULA|TUITION|LIBRERIA|UTILES|PAPELERIA/.test(d)) return "universidad";
  if (/FARMACIA|KIELSA|HOSPITAL|CLINICA|LABORATORIO|MEDICO|DENTAL|OPTICA|\bSALUD\b/.test(d)) return "salud";
  if (/\bENEE\b|AGUAS|\bSANAA\b|\bCABLE\b|INTERNET/.test(d)) return "servicios";
  if (/CINE|CINEMARK|CINEPOLIS|MULTICINEMAS|TEATRO|BOLICHE/.test(d)) return "diversion";
  if (/\bZARA\b|DIUNSA|LA MODERNA|NUEVO MUNDO|CALZADO|PAYLESS|\bBATA\b|BAZAR|FOREVER|SIMAN|\bROPA\b/.test(d)) return "ropa";
  return "otros";
}

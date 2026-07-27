import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import type { CashPosition } from "@/lib/hq/governance-server";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const bandConfig: Record<
  CashPosition["operatingBand"],
  { label: string; className: string; instruction: string }
> = {
  emergency: {
    label: "Emergency cash mode",
    className: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    instruction:
      "Stop owner distributions, outside-project funding, and nonessential capital expenditures. Protect payroll, taxes, required parts, rent, and core operating systems.",
  },
  stabilization: {
    label: "Stabilization",
    className: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    instruction:
      "Operate on essential commitments only and rebuild the hard floor before releasing any outside capital.",
  },
  reserve_compliant: {
    label: "Reserve compliant",
    className: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    instruction:
      "The operating reserve is covered, but outside capital remains blocked until the release threshold is reached.",
  },
  capital_review: {
    label: "Capital review eligible",
    className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    instruction:
      "Capital may be considered only through an approved request that leaves AutoRx above its release threshold.",
  },
};

export default function CashPositionPanel({ position }: { position: CashPosition | null }) {
  if (!position) {
    return (
      <section id="cash-position" className="rounded-[1.75rem] border border-white/8 bg-[#0c111b] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Landmark className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Verified Cash Position</h2>
        </div>
        <p className="mt-3 text-sm text-slate-500">No RunTech / QuickBooks cash-position snapshot has been recorded yet.</p>
      </section>
    );
  }

  const band = bandConfig[position.operatingBand];
  const primaryCards = [
    ["Checking cash", money(position.liquidBankCash), "Verified checking and savings balances", Landmark],
    ["Credit-card debt", money(position.creditCardDebt), "Current QuickBooks card balances", CreditCard],
    ["Net operating liquidity", money(position.netOperatingLiquidity), "Checking cash after current card debt", WalletCards],
    ["Reserve gap", money(position.reserveGap), `Gap to the ${money(position.requiredReserve)} policy`, ShieldAlert],
  ] as const;

  const commitments = [
    ["Payroll pending", position.payrollPending],
    ["Parts and vendors · 30 days", position.partsVendor30d],
    ["Taxes · 30 days", position.taxes30d],
    ["Rent and debt · 30 days", position.rentDebt30d],
    ["Other obligations · 30 days", position.otherObligations30d],
    ["Total known commitments", position.totalKnownCommitments],
  ] as const;

  return (
    <section id="cash-position" className="rounded-[1.75rem] border border-rose-300/15 bg-[#0c111b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-200">
            <Banknote className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Verified liquidity</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold">AutoRx Cash Position</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Actual checking cash, current card debt, pending payroll, and known obligations. This is the operating reality behind the reserve policy, not a bookkeeping account total.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${band.className}`}>
            {band.label}
          </span>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" /> Snapshot {position.snapshotDate}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map(([label, value, detail, Icon]) => (
          <article key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
              <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/8 bg-black/10 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-amber-200" />
            <h3 className="text-sm font-semibold">Known commitments</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {commitments.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/[0.02] px-3 py-3">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-200">{money(value)}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 rounded-xl border px-4 py-3 ${position.projectedAfterCommitments < 0 ? "border-rose-300/20 bg-rose-300/[0.07]" : "border-emerald-300/20 bg-emerald-300/[0.07]"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current cash after known commitments</p>
            <p className={`mt-1 text-2xl font-semibold ${position.projectedAfterCommitments < 0 ? "text-rose-200" : "text-emerald-200"}`}>
              {money(position.projectedAfterCommitments)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Coverage calculation only; future customer collections are not included.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Operator instruction</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{band.instruction}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">Hard floor</p>
                <p className="mt-1 text-lg font-semibold">{money(position.hardFloor)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">Restricted taxes</p>
                <p className="mt-1 text-lg font-semibold">{money(position.restrictedCash)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/70">Excluded bookkeeping balance</p>
            <p className="mt-2 text-2xl font-semibold text-amber-100">{money(position.excludedBookCash)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              QuickBooks “Cash Account” accumulates Daily Cash Sales. It is retained for reconciliation but is not treated as available cash unless physically verified and deposited.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

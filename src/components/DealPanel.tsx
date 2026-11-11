"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lot } from "@/lib/db/schema";
import { computeDeal, formatMoney, formatPct } from "@/lib/deal/math";

export function DealPanel({ lot }: { lot: Lot }) {
  const [bidPrice, setBidPrice] = useState(String(lot.bidPrice || ""));
  const [premium, setPremium] = useState(String(lot.buyerPremiumPct ?? 10));
  const [freight, setFreight] = useState(String(lot.freight || ""));
  const [salvage, setSalvage] = useState(String(lot.salvagePct ?? 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBidPrice(String(lot.bidPrice || ""));
    setPremium(String(lot.buyerPremiumPct ?? 10));
    setFreight(String(lot.freight || ""));
    setSalvage(String(lot.salvagePct ?? 10));
  }, [lot]);

  const deal = useMemo(
    () =>
      computeDeal({
        bidPrice: Number(bidPrice) || 0,
        buyerPremiumPct: Number(premium) || 0,
        freight: Number(freight) || 0,
        salvagePct: Number(salvage) || 0,
        estimatedMarket: lot.estimatedMarket,
        manifestRetail: lot.manifestRetail,
      }),
    [bidPrice, premium, freight, salvage, lot.estimatedMarket, lot.manifestRetail],
  );

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/lots/${lot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidPrice: Number(bidPrice) || 0,
          buyerPremiumPct: Number(premium) || 0,
          freight: Number(freight) || 0,
          salvagePct: Number(salvage) || 0,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  const coverage =
    lot.itemCount > 0 ? (lot.pricedItemCount / lot.itemCount) * 100 : 0;

  return (
    <section className="surface rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-steel">
            Deal math
          </h2>
          <p className="text-sm text-muted">
            Landed cost vs estimated resale for this lot only.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-steel px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save bid inputs"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="text-muted">Expected bid</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 mono-num"
            value={bidPrice}
            onChange={(e) => setBidPrice(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Buyer premium %</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 mono-num"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Freight</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 mono-num"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Salvage / unsellable %</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 mono-num"
            value={salvage}
            onChange={(e) => setSalvage(e.target.value)}
            inputMode="decimal"
          />
        </label>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Manifest retail" value={formatMoney(lot.manifestRetail)} />
        <Stat
          label={`Est. market (${formatPct(coverage)} priced)`}
          value={formatMoney(lot.estimatedMarket)}
          accent
        />
        <Stat label="Landed cost" value={formatMoney(deal.landedCost)} />
        <Stat
          label="Est. profit"
          value={formatMoney(deal.profit)}
          tone={deal.profit >= 0 ? "good" : "bad"}
        />
        <Stat label="ROI" value={formatPct(deal.roiPct)} />
        <Stat label="Market / retail" value={formatPct(deal.retailPct)} />
        <Stat label="Break-even bid" value={formatMoney(deal.breakEvenBid)} />
        <Stat label="Adjusted market" value={formatMoney(deal.adjustedMarket)} />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-good"
      : tone === "bad"
        ? "text-bad"
        : accent
          ? "text-accent"
          : "text-steel";
  return (
    <div className="rounded-xl border border-line/80 bg-white/70 px-3 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mono-num mt-1 text-lg font-bold ${color}`}>{value}</dd>
    </div>
  );
}

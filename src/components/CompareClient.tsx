"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LotWithStats } from "@/lib/lots/service";
import { computeDeal, formatMoney, formatPct } from "@/lib/deal/math";

export function CompareClient({ lots }: { lots: LotWithStats[] }) {
  const [selected, setSelected] = useState<string[]>(() =>
    lots.slice(0, 3).map((l) => l.id),
  );

  const chosen = useMemo(
    () => lots.filter((l) => selected.includes(l.id)),
    [lots, selected],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!lots.length) {
    return (
      <div className="surface rounded-2xl p-8 text-center text-muted">
        Import lots first, then compare them here.{" "}
        <Link href="/" className="text-accent underline">
          Go to lots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface rounded-2xl p-4">
        <p className="mb-3 text-sm text-muted">
          Select lots to compare side-by-side (inventory stays separate).
        </p>
        <div className="flex flex-wrap gap-2">
          {lots.map((lot) => {
            const on = selected.includes(lot.id);
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => toggle(lot.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  on
                    ? "bg-accent text-white"
                    : "border border-line bg-white text-steel hover:border-accent"
                }`}
              >
                {lot.title.length > 42
                  ? `${lot.title.slice(0, 42)}…`
                  : lot.title}
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length === 0 ? (
        <p className="text-muted">Select at least one lot.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-line bg-white/80 p-3 text-left text-muted">
                  Metric
                </th>
                {chosen.map((lot) => (
                  <th
                    key={lot.id}
                    className="border-b border-line bg-white/80 p-3 text-left"
                  >
                    <Link
                      href={`/lots/${lot.id}`}
                      className="font-[family-name:var(--font-display)] font-semibold text-steel hover:text-accent"
                    >
                      {lot.title}
                    </Link>
                    <div className="mt-1 font-mono text-[11px] font-normal text-muted">
                      {lot.lotId}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows(chosen).map((row) => (
                <tr key={row.label} className="odd:bg-white/50">
                  <td className="border-b border-line/70 p-3 text-muted">
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={`${row.label}-${i}`}
                      className={`border-b border-line/70 p-3 mono-num font-medium ${
                        row.accent ? "text-accent" : "text-steel"
                      }`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function rows(lots: LotWithStats[]) {
  const deals = lots.map((lot) =>
    computeDeal({
      bidPrice: lot.bidPrice,
      buyerPremiumPct: lot.buyerPremiumPct,
      freight: lot.freight,
      salvagePct: lot.salvagePct,
      estimatedMarket: lot.estimatedMarket,
      manifestRetail: lot.manifestRetail,
    }),
  );

  return [
    {
      label: "Lines",
      values: lots.map((l) => String(l.itemCount)),
    },
    {
      label: "Total qty",
      values: lots.map((l) => String(l.totalQty)),
    },
    {
      label: "Manifest retail",
      values: lots.map((l) => formatMoney(l.manifestRetail)),
    },
    {
      label: "Est. market",
      values: lots.map((l) => formatMoney(l.estimatedMarket)),
      accent: true,
    },
    {
      label: "Priced coverage",
      values: lots.map((l) =>
        formatPct(l.itemCount ? (l.pricedItemCount / l.itemCount) * 100 : 0),
      ),
    },
    {
      label: "Saved bid",
      values: lots.map((l) => formatMoney(l.bidPrice)),
    },
    {
      label: "Landed cost",
      values: deals.map((d) => formatMoney(d.landedCost)),
    },
    {
      label: "Est. profit",
      values: deals.map((d) => formatMoney(d.profit)),
    },
    {
      label: "ROI",
      values: deals.map((d) => formatPct(d.roiPct)),
    },
    {
      label: "Break-even bid",
      values: deals.map((d) => formatMoney(d.breakEvenBid)),
    },
    {
      label: "Market / retail",
      values: deals.map((d) => formatPct(d.retailPct)),
    },
  ];
}

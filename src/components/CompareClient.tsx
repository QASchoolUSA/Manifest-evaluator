"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LotWithStats } from "@/lib/lots/service";
import { computeDeal, formatMoney, formatPct } from "@/lib/deal/math";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <Card>
        <CardHeader>
          <CardTitle>No lots to compare</CardTitle>
          <CardDescription>
            Import lots first, then compare them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants()}>
            Go to lots
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select lots</CardTitle>
          <CardDescription>
            Side-by-side summary only — each pallet’s inventory stays on its own
            detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {lots.map((lot) => {
            const on = selected.includes(lot.id);
            return (
              <Button
                key={lot.id}
                type="button"
                size="sm"
                variant={on ? "default" : "outline"}
                onClick={() => toggle(lot.id)}
                className="max-w-xs"
              >
                <span className="truncate">
                  {lot.title.length > 42
                    ? `${lot.title.slice(0, 42)}…`
                    : lot.title}
                </span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {chosen.length === 0 ? (
        <p className="text-muted-foreground">Select at least one lot.</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-(--card-spacing)">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b p-3 text-left font-medium text-muted-foreground">
                    Metric
                  </th>
                  {chosen.map((lot) => (
                    <th key={lot.id} className="border-b p-3 text-left align-top">
                      <Link
                        href={`/lots/${lot.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {lot.title}
                      </Link>
                      <div className="mt-1">
                        <Badge variant="outline" className="font-mono font-normal">
                          {lot.lotId}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows(chosen).map((row) => (
                  <tr key={row.label} className="odd:bg-muted/30">
                    <td className="border-b p-3 text-muted-foreground">
                      {row.label}
                    </td>
                    {row.values.map((v, i) => (
                      <td
                        key={`${row.label}-${i}`}
                        className={cn(
                          "mono-num border-b p-3 font-medium",
                          row.accent && "text-primary",
                        )}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
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
    { label: "Lines", values: lots.map((l) => String(l.itemCount)) },
    { label: "Total qty", values: lots.map((l) => String(l.totalQty)) },
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
    { label: "Saved bid", values: lots.map((l) => formatMoney(l.bidPrice)) },
    {
      label: "Landed cost",
      values: deals.map((d) => formatMoney(d.landedCost)),
    },
    { label: "Est. profit", values: deals.map((d) => formatMoney(d.profit)) },
    { label: "ROI", values: deals.map((d) => formatPct(d.roiPct)) },
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

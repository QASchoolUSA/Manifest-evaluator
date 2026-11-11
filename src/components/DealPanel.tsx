"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Lot } from "@/lib/db/schema";
import { computeDeal, formatMoney, formatPct } from "@/lib/deal/math";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
      const res = await fetch(`/api/lots/${lot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidPrice: Number(bidPrice) || 0,
          buyerPremiumPct: Number(premium) || 0,
          freight: Number(freight) || 0,
          salvagePct: Number(salvage) || 0,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Bid inputs saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const coverage =
    lot.itemCount > 0 ? (lot.pricedItemCount / lot.itemCount) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Deal math</CardTitle>
          <CardDescription>
            Landed cost vs estimated resale for this lot only.
          </CardDescription>
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? "Saving…" : "Save bid inputs"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Expected bid" value={bidPrice} onChange={setBidPrice} />
          <Field label="Buyer premium %" value={premium} onChange={setPremium} />
          <Field label="Freight" value={freight} onChange={setFreight} />
          <Field
            label="Salvage / unsellable %"
            value={salvage}
            onChange={setSalvage}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <Input
        className="mono-num"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
      />
    </div>
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
  return (
    <div className="rounded-xl border bg-card px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mono-num mt-1 text-lg font-semibold",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
          accent && !tone && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

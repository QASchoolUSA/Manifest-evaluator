export type DealInputs = {
  bidPrice: number;
  buyerPremiumPct: number;
  freight: number;
  salvagePct: number;
  estimatedMarket: number;
  manifestRetail: number;
};

export type DealOutputs = {
  premiumAmount: number;
  landedCost: number;
  adjustedMarket: number;
  profit: number;
  roiPct: number | null;
  retailPct: number | null;
  breakEvenBid: number | null;
};

export function computeDeal(input: DealInputs): DealOutputs {
  const premiumAmount = input.bidPrice * (input.buyerPremiumPct / 100);
  const landedCost = input.bidPrice + premiumAmount + input.freight;
  const salvageFactor = Math.max(0, 1 - input.salvagePct / 100);
  const adjustedMarket = input.estimatedMarket * salvageFactor;
  const profit = adjustedMarket - landedCost;
  const roiPct = landedCost > 0 ? (profit / landedCost) * 100 : null;
  const retailPct =
    input.manifestRetail > 0
      ? (adjustedMarket / input.manifestRetail) * 100
      : null;

  let breakEvenBid: number | null = null;
  const denom = 1 + input.buyerPremiumPct / 100;
  if (denom > 0) {
    breakEvenBid = Math.max(0, (adjustedMarket - input.freight) / denom);
  }

  return {
    premiumAmount,
    landedCost,
    adjustedMarket,
    profit,
    roiPct,
    retailPct,
    breakEvenBid,
  };
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

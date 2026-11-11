import { NextResponse } from "next/server";
import { getLot, getLotItems } from "@/lib/lots/service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const lot = await getLot(id);
  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rows = await getLotItems(id);

  const headers = [
    "Item #",
    "Brand",
    "Part Number",
    "Description",
    "Qty",
    "Unit Retail",
    "Ext Retail",
    "Market Unit Low",
    "Market Unit Median",
    "Market Unit High",
    "Line Market Total",
    "Market Source",
    "Fitment",
    "Fitment Location",
    "Seller Category",
    "Condition",
    "eBay URL",
    "RockAuto URL",
    "Amazon URL",
  ];

  const lines = [headers.join(",")];
  for (const item of rows) {
    const lineMarket =
      item.marketUnitMedian != null ? item.marketUnitMedian * item.qty : "";
    lines.push(
      [
        item.itemNumber,
        item.brand,
        item.partNumber,
        item.description,
        item.qty,
        item.unitRetail,
        item.extRetail,
        item.marketUnitLow ?? "",
        item.marketUnitMedian ?? "",
        item.marketUnitHigh ?? "",
        lineMarket,
        item.marketSource ?? "",
        item.fitmentSummary ?? "",
        item.fitmentLocation ?? "",
        item.sellerCategory,
        item.condition,
        item.ebayUrl ?? "",
        item.rockautoUrl ?? "",
        item.amazonUrl ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const filename = `${lot.filename.replace(/\.csv$/i, "")}-enriched.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

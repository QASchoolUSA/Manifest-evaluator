import { NextResponse } from "next/server";
import { getLot, getLotItems } from "@/lib/lots/service";
import { advanceGoogleFindUrl } from "@/lib/pricing/advance";
import {
  amazonSearchUrl,
  ebaySearchUrl,
  rockautoSearchUrl,
} from "@/lib/pricing/urls";

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
    "Advance Price",
    "Advance Resolved",
    "Advance URL",
    "eBay URL",
    "RockAuto URL",
    "Amazon URL",
  ];

  const lines = [headers.join(",")];
  for (const item of rows) {
    const lineMarket =
      item.marketUnitMedian != null ? item.marketUnitMedian * item.qty : "";
    const advanceResolved =
      Boolean(item.advanceResolved) ||
      Boolean(item.advanceUrl?.includes("/p/"));
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
        item.advancePrice ?? "",
        advanceResolved ? "yes" : "no",
        advanceResolved && item.advanceUrl
          ? item.advanceUrl
          : advanceGoogleFindUrl(item.partNumber, item.brand),
        ebaySearchUrl(item.brand, item.partNumber, item.description),
        rockautoSearchUrl(item.brand, item.partNumber),
        amazonSearchUrl(item.brand, item.partNumber, item.description),
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

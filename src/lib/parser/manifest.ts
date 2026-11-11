import Papa from "papaparse";
import { decodeItemNumber } from "@/lib/brands/prefixes";

export type ParsedManifestItem = {
  itemNumber: string;
  partNumber: string;
  vendorPrefix: string;
  brand: string;
  description: string;
  qty: number;
  unitRetail: number;
  extRetail: number;
  sellerCategory: string;
  category: string;
  condition: string;
  sourceLotId: string;
};

export type ParsedManifest = {
  title: string;
  filename: string;
  lotId: string;
  items: ParsedManifestItem[];
  totalQty: number;
  manifestRetail: number;
};

function money(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function qty(value: unknown): number {
  const n = Math.round(money(value));
  return n > 0 ? n : 0;
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  // case-insensitive fallback
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const v = lower[key.toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.csv$/i, "").replace(/^BStock_/i, "");
  return base.replace(/_/g, " ").trim() || filename;
}

export function parseManifestCsv(
  csvText: string,
  filename: string,
): ParsedManifest {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(parsed.errors[0]?.message ?? "Failed to parse CSV");
  }

  const items: ParsedManifestItem[] = [];
  const lotIds = new Set<string>();

  for (const row of parsed.data) {
    const itemNumber = pick(row, ["Item #", "Item#", "Item Number", "SKU"]);
    if (!itemNumber) continue;

    const description = pick(row, ["Item Description", "Description"]);
    const sellerCategory = pick(row, ["Seller Category", "SellerCategory"]);
    const category = pick(row, ["Category"]);
    const condition = pick(row, ["Condition"]) || "UNKNOWN";
    const sourceLotId = pick(row, ["Lot ID", "LotID", "Lot Id"]) || "UNKNOWN";
    const unitRetail = money(pick(row, ["Unit Retail", "UnitRetail", "MSRP"]));
    const qtyVal = qty(pick(row, ["Qty", "Quantity", "QTY"]));
    let extRetail = money(pick(row, ["Ext. Retail", "Ext Retail", "Extended Retail", "Total Retail"]));
    if (!extRetail && unitRetail && qtyVal) extRetail = unitRetail * qtyVal;

    const decoded = decodeItemNumber(itemNumber);
    lotIds.add(sourceLotId);

    items.push({
      itemNumber,
      partNumber: decoded.partNumber,
      vendorPrefix: decoded.vendorPrefix,
      brand: decoded.brand,
      description,
      qty: qtyVal,
      unitRetail,
      extRetail,
      sellerCategory,
      category,
      condition,
      sourceLotId,
    });
  }

  if (items.length === 0) {
    throw new Error("No valid line items found in manifest");
  }

  const lotId =
    lotIds.size === 1
      ? [...lotIds][0]
      : [...lotIds].sort()[0] ?? "UNKNOWN";

  return {
    title: titleFromFilename(filename),
    filename,
    lotId,
    items,
    totalQty: items.reduce((s, i) => s + i.qty, 0),
    manifestRetail: items.reduce((s, i) => s + i.extRetail, 0),
  };
}

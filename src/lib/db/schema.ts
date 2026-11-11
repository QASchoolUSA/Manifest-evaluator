import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const lots = sqliteTable("lots", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  lotId: text("lot_id").notNull(),
  itemCount: integer("item_count").notNull().default(0),
  totalQty: integer("total_qty").notNull().default(0),
  manifestRetail: real("manifest_retail").notNull().default(0),
  estimatedMarket: real("estimated_market").notNull().default(0),
  pricedItemCount: integer("priced_item_count").notNull().default(0),
  bidPrice: real("bid_price").notNull().default(0),
  buyerPremiumPct: real("buyer_premium_pct").notNull().default(0),
  freight: real("freight").notNull().default(0),
  salvagePct: real("salvage_pct").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    lotId: text("lot_id")
      .notNull()
      .references(() => lots.id, { onDelete: "cascade" }),
    itemNumber: text("item_number").notNull(),
    partNumber: text("part_number").notNull(),
    vendorPrefix: text("vendor_prefix").notNull(),
    brand: text("brand").notNull(),
    description: text("description").notNull(),
    qty: integer("qty").notNull(),
    unitRetail: real("unit_retail").notNull(),
    extRetail: real("ext_retail").notNull(),
    sellerCategory: text("seller_category").notNull(),
    category: text("category").notNull(),
    condition: text("condition").notNull(),
    sourceLotId: text("source_lot_id").notNull(),
    marketUnitLow: real("market_unit_low"),
    marketUnitMedian: real("market_unit_median"),
    marketUnitHigh: real("market_unit_high"),
    marketSource: text("market_source"),
    marketUrl: text("market_url"),
    marketSamples: integer("market_samples"),
    marketFetchedAt: text("market_fetched_at"),
    fitmentSummary: text("fitment_summary"),
    fitmentVehiclesJson: text("fitment_vehicles_json"),
    fitmentLocation: text("fitment_location"),
    fitmentStatus: text("fitment_status").notNull().default("pending"),
    priceStatus: text("price_status").notNull().default("pending"),
    ebayUrl: text("ebay_url"),
    rockautoUrl: text("rockauto_url"),
    amazonUrl: text("amazon_url"),
    advanceUrl: text("advance_url"),
  },
  (table) => [
    index("items_lot_id_idx").on(table.lotId),
    index("items_item_number_idx").on(table.itemNumber),
  ],
);

export const priceCache = sqliteTable("price_cache", {
  cacheKey: text("cache_key").primaryKey(),
  itemNumber: text("item_number").notNull(),
  brand: text("brand").notNull(),
  partNumber: text("part_number").notNull(),
  low: real("low"),
  median: real("median"),
  high: real("high"),
  samples: integer("samples"),
  source: text("source"),
  url: text("url"),
  ebayUrl: text("ebay_url"),
  rockautoUrl: text("rockauto_url"),
  amazonUrl: text("amazon_url"),
  advanceUrl: text("advance_url"),
  fetchedAt: text("fetched_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  rawJson: text("raw_json"),
});

export const fitmentCache = sqliteTable("fitment_cache", {
  cacheKey: text("cache_key").primaryKey(),
  itemNumber: text("item_number").notNull(),
  brand: text("brand").notNull(),
  partNumber: text("part_number").notNull(),
  summary: text("summary"),
  vehiclesJson: text("vehicles_json"),
  location: text("location"),
  status: text("status").notNull(),
  fetchedAt: text("fetched_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export type Lot = typeof lots.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewLot = typeof lots.$inferInsert;
export type NewItem = typeof items.$inferInsert;

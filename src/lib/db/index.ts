import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  libsql?: Client;
  db?: ReturnType<typeof drizzle<typeof schema>>;
  schemaReady?: Promise<void>;
};

function resolveDbUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  if (process.env.LIBSQL_URL) return process.env.LIBSQL_URL;
  // Local/dev default: file-backed libSQL (works offline; not used on Vercel)
  const filePath = path.join(process.cwd(), "data", "manifest-evaluator.db");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return `file:${filePath}`;
}

async function ensureSchema(client: Client) {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS lots (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      lot_id TEXT NOT NULL,
      item_count INTEGER NOT NULL DEFAULT 0,
      total_qty INTEGER NOT NULL DEFAULT 0,
      manifest_retail REAL NOT NULL DEFAULT 0,
      estimated_market REAL NOT NULL DEFAULT 0,
      priced_item_count INTEGER NOT NULL DEFAULT 0,
      bid_price REAL NOT NULL DEFAULT 0,
      buyer_premium_pct REAL NOT NULL DEFAULT 0,
      freight REAL NOT NULL DEFAULT 0,
      salvage_pct REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
      `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      lot_id TEXT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
      item_number TEXT NOT NULL,
      part_number TEXT NOT NULL,
      vendor_prefix TEXT NOT NULL,
      brand TEXT NOT NULL,
      description TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_retail REAL NOT NULL,
      ext_retail REAL NOT NULL,
      seller_category TEXT NOT NULL,
      category TEXT NOT NULL,
      condition TEXT NOT NULL,
      source_lot_id TEXT NOT NULL,
      market_unit_low REAL,
      market_unit_median REAL,
      market_unit_high REAL,
      market_source TEXT,
      market_url TEXT,
      market_samples INTEGER,
      market_fetched_at TEXT,
      fitment_summary TEXT,
      fitment_vehicles_json TEXT,
      fitment_location TEXT,
      fitment_status TEXT NOT NULL DEFAULT 'pending',
      price_status TEXT NOT NULL DEFAULT 'pending',
      ebay_url TEXT,
      rockauto_url TEXT,
      amazon_url TEXT
    )`,
      `CREATE INDEX IF NOT EXISTS items_lot_id_idx ON items(lot_id)`,
      `CREATE INDEX IF NOT EXISTS items_item_number_idx ON items(item_number)`,
      `CREATE TABLE IF NOT EXISTS price_cache (
      cache_key TEXT PRIMARY KEY,
      item_number TEXT NOT NULL,
      brand TEXT NOT NULL,
      part_number TEXT NOT NULL,
      low REAL,
      median REAL,
      high REAL,
      samples INTEGER,
      source TEXT,
      url TEXT,
      ebay_url TEXT,
      rockauto_url TEXT,
      amazon_url TEXT,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      raw_json TEXT
    )`,
      `CREATE TABLE IF NOT EXISTS fitment_cache (
      cache_key TEXT PRIMARY KEY,
      item_number TEXT NOT NULL,
      brand TEXT NOT NULL,
      part_number TEXT NOT NULL,
      summary TEXT,
      vehicles_json TEXT,
      location TEXT,
      status TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`,
    ],
    "write",
  );
}

function createClientInstance() {
  const url = resolveDbUrl();
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined;
  return createClient({ url, authToken });
}

export async function getDb() {
  if (!globalForDb.libsql) {
    globalForDb.libsql = createClientInstance();
  }
  if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.libsql, { schema });
  }
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = ensureSchema(globalForDb.libsql);
  }
  await globalForDb.schemaReady;
  return globalForDb.db;
}

export function getLibsqlClient() {
  if (!globalForDb.libsql) {
    globalForDb.libsql = createClientInstance();
  }
  return globalForDb.libsql;
}

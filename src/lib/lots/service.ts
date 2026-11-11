import { eq, desc, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import {
  items,
  lots,
  priceCache,
  fitmentCache,
  type Item,
  type Lot,
} from "@/lib/db/schema";
import { parseManifestCsv } from "@/lib/parser/manifest";
import { lookupFitment } from "@/lib/fitment/lookup";
import { lookupMarketPrice } from "@/lib/pricing/providers";
import {
  advanceSearchUrl,
  amazonSearchUrl,
  ebaySearchUrl,
  rockautoSearchUrl,
} from "@/lib/pricing/urls";
import { lookupAdvanceProduct } from "@/lib/pricing/advance";

const CACHE_TTL_DAYS = 7;

function nowIso() {
  return new Date().toISOString();
}

function expiresIso(days = CACHE_TTL_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function cacheKey(itemNumber: string) {
  return itemNumber.trim().toUpperCase();
}

export type LotWithStats = Lot & {
  pricedCoveragePct: number;
  marketCoverageRetail: number;
};

export async function listLots(): Promise<LotWithStats[]> {
  const db = await getDb();
  const rows = await db.select().from(lots).orderBy(desc(lots.createdAt));
  return rows.map((lot) => ({
    ...lot,
    pricedCoveragePct:
      lot.itemCount > 0 ? (lot.pricedItemCount / lot.itemCount) * 100 : 0,
    marketCoverageRetail: lot.manifestRetail,
  }));
}

export async function getLot(id: string): Promise<Lot | undefined> {
  const db = await getDb();
  const rows = await db.select().from(lots).where(eq(lots.id, id)).limit(1);
  return rows[0];
}

export async function getLotItems(lotId: string): Promise<Item[]> {
  const db = await getDb();
  return db.select().from(items).where(eq(items.lotId, lotId));
}

export async function importManifest(
  csvText: string,
  filename: string,
): Promise<Lot> {
  const parsed = parseManifestCsv(csvText, filename);
  const db = await getDb();
  const id = nanoid();
  const ts = nowIso();

  const lotRow = {
    id,
    title: parsed.title,
    filename: parsed.filename,
    lotId: parsed.lotId,
    itemCount: parsed.items.length,
    totalQty: parsed.totalQty,
    manifestRetail: parsed.manifestRetail,
    estimatedMarket: 0,
    pricedItemCount: 0,
    bidPrice: 0,
    buyerPremiumPct: 10,
    freight: 0,
    salvagePct: 10,
    createdAt: ts,
    updatedAt: ts,
  };

  const itemRows = parsed.items.map((item) => {
    const fit = lookupFitment({
      vendorPrefix: item.vendorPrefix,
      brand: item.brand,
      partNumber: item.partNumber,
      description: item.description,
      sellerCategory: item.sellerCategory,
    });

    return {
      id: nanoid(),
      lotId: id,
      itemNumber: item.itemNumber,
      partNumber: item.partNumber,
      vendorPrefix: item.vendorPrefix,
      brand: item.brand,
      description: item.description,
      qty: item.qty,
      unitRetail: item.unitRetail,
      extRetail: item.extRetail,
      sellerCategory: item.sellerCategory,
      category: item.category,
      condition: item.condition,
      sourceLotId: item.sourceLotId,
      fitmentSummary: fit.summary,
      fitmentVehiclesJson: JSON.stringify(fit.vehicles),
      fitmentLocation: fit.location,
      fitmentStatus: fit.status,
      priceStatus: "pending" as const,
      ebayUrl: ebaySearchUrl(item.brand, item.partNumber, item.description),
      rockautoUrl: rockautoSearchUrl(item.brand, item.partNumber),
      amazonUrl: amazonSearchUrl(item.brand, item.partNumber, item.description),
      advanceUrl: advanceSearchUrl(item.partNumber),
      advancePrice: null,
      advanceResolved: 0,
    };
  });

  await db.insert(lots).values(lotRow);
  if (itemRows.length) {
    const chunk = 50;
    for (let i = 0; i < itemRows.length; i += chunk) {
      await db.insert(items).values(itemRows.slice(i, i + chunk));
    }
  }

  await applyCacheToLot(id);
  const lot = await getLot(id);
  if (!lot) throw new Error("Failed to create lot");
  return lot;
}

export async function updateLotDeal(
  id: string,
  patch: Partial<
    Pick<Lot, "bidPrice" | "buyerPremiumPct" | "freight" | "salvagePct">
  >,
): Promise<Lot | undefined> {
  const db = await getDb();
  const cleaned: Record<string, number | string> = { updatedAt: nowIso() };
  if (patch.bidPrice != null && Number.isFinite(patch.bidPrice)) {
    cleaned.bidPrice = patch.bidPrice;
  }
  if (patch.buyerPremiumPct != null && Number.isFinite(patch.buyerPremiumPct)) {
    cleaned.buyerPremiumPct = patch.buyerPremiumPct;
  }
  if (patch.freight != null && Number.isFinite(patch.freight)) {
    cleaned.freight = patch.freight;
  }
  if (patch.salvagePct != null && Number.isFinite(patch.salvagePct)) {
    cleaned.salvagePct = patch.salvagePct;
  }
  await db.update(lots).set(cleaned).where(eq(lots.id, id));
  return getLot(id);
}

export async function deleteLot(id: string) {
  const db = await getDb();
  await db.delete(lots).where(eq(lots.id, id));
}

async function applyCacheToLot(lotId: string) {
  const db = await getDb();
  const lotItems = await getLotItems(lotId);
  const keys = [...new Set(lotItems.map((i) => cacheKey(i.itemNumber)))];
  if (!keys.length) return;

  const caches = await db
    .select()
    .from(priceCache)
    .where(inArray(priceCache.cacheKey, keys));
  const cacheMap = new Map(caches.map((c) => [c.cacheKey, c]));
  const now = nowIso();

  for (const item of lotItems) {
    const cached = cacheMap.get(cacheKey(item.itemNumber));
    if (!cached || cached.expiresAt < now) continue;
    if (cached.median == null) continue;

    await db
      .update(items)
      .set({
        marketUnitLow: cached.low,
        marketUnitMedian: cached.median,
        marketUnitHigh: cached.high,
        marketSource: cached.source,
        marketUrl: cached.url,
        marketSamples: cached.samples,
        marketFetchedAt: cached.fetchedAt,
        priceStatus: "ready",
        ebayUrl: cached.ebayUrl ?? item.ebayUrl,
        rockautoUrl: cached.rockautoUrl ?? item.rockautoUrl,
        amazonUrl: cached.amazonUrl ?? item.amazonUrl,
        advanceUrl:
          cached.advanceUrl ?? item.advanceUrl ?? advanceSearchUrl(item.partNumber),
        advancePrice: cached.advancePrice ?? item.advancePrice,
        advanceResolved: cached.advanceResolved ?? item.advanceResolved ?? 0,
      })
      .where(eq(items.id, item.id));
  }

  await recomputeLotMarket(lotId);
}

async function recomputeLotMarket(lotId: string) {
  const db = await getDb();
  const lotItems = await getLotItems(lotId);
  let estimated = 0;
  let priced = 0;
  for (const item of lotItems) {
    if (item.marketUnitMedian != null && item.priceStatus === "ready") {
      estimated += item.marketUnitMedian * item.qty;
      priced += 1;
    }
  }
  await db
    .update(lots)
    .set({
      estimatedMarket: estimated,
      pricedItemCount: priced,
      updatedAt: nowIso(),
    })
    .where(eq(lots.id, lotId));
}

export async function enrichLot(
  lotId: string,
  opts: { limit?: number; force?: boolean } = {},
): Promise<{ enriched: number; remaining: number }> {
  const db = await getDb();
  const lot = await getLot(lotId);
  if (!lot) throw new Error("Lot not found");

  const allItems = await getLotItems(lotId);
  const pending = allItems.filter(
    (i) =>
      opts.force || i.priceStatus === "pending" || i.priceStatus === "error",
  );
  const limit = opts.limit ?? 12;
  const batch = pending.slice(0, limit);

  const seen = new Set<string>();
  const uniqueBatch: Item[] = [];
  for (const item of batch) {
    const key = cacheKey(item.itemNumber);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueBatch.push(item);
  }

  let enriched = 0;
  for (const item of uniqueBatch) {
    const key = cacheKey(item.itemNumber);
    const existingRows = await db
      .select()
      .from(priceCache)
      .where(eq(priceCache.cacheKey, key))
      .limit(1);
    const existing = existingRows[0];

    let price =
      existing && existing.expiresAt >= nowIso() && !opts.force
        ? {
            low: existing.low,
            median: existing.median,
            high: existing.high,
            samples: existing.samples ?? 0,
            source: existing.source ?? "cache",
            url: existing.url,
            ebayUrl: existing.ebayUrl ?? item.ebayUrl!,
            rockautoUrl: existing.rockautoUrl ?? item.rockautoUrl!,
            amazonUrl: existing.amazonUrl ?? item.amazonUrl!,
            advanceUrl:
              existing.advanceUrl ??
              item.advanceUrl ??
              advanceSearchUrl(item.partNumber),
            advancePrice: existing.advancePrice ?? item.advancePrice ?? null,
            advanceResolved: Boolean(
              existing.advanceResolved ?? item.advanceResolved ?? 0,
            ),
          }
        : null;

    if (!price) {
      try {
        price = await lookupMarketPrice(
          {
            itemNumber: item.itemNumber,
            brand: item.brand,
            partNumber: item.partNumber,
            description: item.description,
            vendorPrefix: item.vendorPrefix,
          },
          item.unitRetail,
        );

        await db
          .insert(priceCache)
          .values({
            cacheKey: key,
            itemNumber: item.itemNumber,
            brand: item.brand,
            partNumber: item.partNumber,
            low: price.low,
            median: price.median,
            high: price.high,
            samples: price.samples,
            source: price.source,
            url: price.url,
            ebayUrl: price.ebayUrl,
            rockautoUrl: price.rockautoUrl,
            amazonUrl: price.amazonUrl,
            advanceUrl: price.advanceUrl,
            advancePrice: price.advancePrice,
            advanceResolved: price.advanceResolved ? 1 : 0,
            fetchedAt: nowIso(),
            expiresAt: expiresIso(),
            rawJson: null,
          })
          .onConflictDoUpdate({
            target: priceCache.cacheKey,
            set: {
              low: price.low,
              median: price.median,
              high: price.high,
              samples: price.samples,
              source: price.source,
              url: price.url,
              ebayUrl: price.ebayUrl,
              rockautoUrl: price.rockautoUrl,
              amazonUrl: price.amazonUrl,
              advanceUrl: price.advanceUrl,
              advancePrice: price.advancePrice,
              advanceResolved: price.advanceResolved ? 1 : 0,
              fetchedAt: nowIso(),
              expiresAt: expiresIso(),
            },
          });
      } catch {
        await db
          .update(items)
          .set({ priceStatus: "error" })
          .where(
            sql`${items.lotId} = ${lotId} AND upper(${items.itemNumber}) = ${key}`,
          );
        continue;
      }
    } else if (!price.advanceResolved) {
      // Upgrade cached search links to direct product pages + shelf price.
      const advance = await lookupAdvanceProduct({
        partNumber: item.partNumber,
        brand: item.brand,
        vendorPrefix: item.vendorPrefix,
      });
      price = {
        ...price,
        advanceUrl: advance.url,
        advancePrice: advance.price,
        advanceResolved: advance.resolved,
      };
      if (advance.resolved || advance.url) {
        await db
          .update(priceCache)
          .set({
            advanceUrl: advance.url,
            advancePrice: advance.price,
            advanceResolved: advance.resolved ? 1 : 0,
          })
          .where(eq(priceCache.cacheKey, key));
      }
    }

    const fit = lookupFitment({
      vendorPrefix: item.vendorPrefix,
      brand: item.brand,
      partNumber: item.partNumber,
      description: item.description,
      sellerCategory: item.sellerCategory,
    });
    await db
      .insert(fitmentCache)
      .values({
        cacheKey: key,
        itemNumber: item.itemNumber,
        brand: item.brand,
        partNumber: item.partNumber,
        summary: fit.summary,
        vehiclesJson: JSON.stringify(fit.vehicles),
        location: fit.location,
        status: fit.status,
        fetchedAt: nowIso(),
        expiresAt: expiresIso(30),
      })
      .onConflictDoUpdate({
        target: fitmentCache.cacheKey,
        set: {
          summary: fit.summary,
          vehiclesJson: JSON.stringify(fit.vehicles),
          location: fit.location,
          status: fit.status,
          fetchedAt: nowIso(),
          expiresAt: expiresIso(30),
        },
      });

    const status = price.median != null ? "ready" : "unpriced";
    await db
      .update(items)
      .set({
        marketUnitLow: price.low,
        marketUnitMedian: price.median,
        marketUnitHigh: price.high,
        marketSource: price.source,
        marketUrl: price.url,
        marketSamples: price.samples,
        marketFetchedAt: nowIso(),
        priceStatus: status,
        ebayUrl: price.ebayUrl,
        rockautoUrl: price.rockautoUrl,
        amazonUrl: price.amazonUrl,
        advanceUrl: price.advanceUrl,
        advancePrice: price.advancePrice,
        advanceResolved: price.advanceResolved ? 1 : 0,
        fitmentSummary: fit.summary,
        fitmentVehiclesJson: JSON.stringify(fit.vehicles),
        fitmentLocation: fit.location,
        fitmentStatus: fit.status,
      })
      .where(
        sql`${items.lotId} = ${lotId} AND upper(${items.itemNumber}) = ${key}`,
      );

    enriched += 1;
  }

  const allLots = await listLots();
  for (const l of allLots) {
    await applyCacheToLot(l.id);
  }

  const remaining = (await getLotItems(lotId)).filter(
    (i) => i.priceStatus === "pending" || i.priceStatus === "error",
  ).length;

  return { enriched, remaining };
}

export async function lotsExist(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select({ c: sql<number>`count(*)` }).from(lots).limit(1);
  return (rows[0]?.c ?? 0) > 0;
}

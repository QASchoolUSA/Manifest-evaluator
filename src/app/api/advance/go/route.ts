import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { items, priceCache } from "@/lib/db/schema";
import {
  advanceGoogleFindUrl,
  lookupAdvanceProduct,
  parseAdvanceProductUrl,
} from "@/lib/pricing/advance";
import { advanceSearchUrl } from "@/lib/pricing/urls";

export const runtime = "nodejs";
export const maxDuration = 15;

function cacheKey(itemNumber: string) {
  return itemNumber.trim().toUpperCase();
}

/**
 * Click-through resolver: redirect the browser to a real Advance /p/ product page
 * when possible (cache → live Serper/capi), else Google site-search for that part.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partNumber = (searchParams.get("part") || "").trim();
  const brand = (searchParams.get("brand") || "").trim();
  const vendorPrefix = (searchParams.get("prefix") || "").trim();
  const itemNumber = (searchParams.get("item") || "").trim();

  if (!partNumber) {
    return NextResponse.redirect(advanceSearchUrl(""), 302);
  }

  // 1) Use a previously resolved product URL from DB when available.
  try {
    const db = await getDb();
    if (itemNumber) {
      const key = cacheKey(itemNumber);
      const cached = await db
        .select()
        .from(priceCache)
        .where(eq(priceCache.cacheKey, key))
        .limit(1);
      const hit = cached[0];
      if (hit?.advanceUrl && parseAdvanceProductUrl(hit.advanceUrl)) {
        return NextResponse.redirect(hit.advanceUrl, 302);
      }

      const rows = await db
        .select()
        .from(items)
        .where(eq(items.itemNumber, itemNumber))
        .limit(5);
      const resolved = rows.find(
        (r) => r.advanceUrl && parseAdvanceProductUrl(r.advanceUrl),
      );
      if (resolved?.advanceUrl) {
        return NextResponse.redirect(resolved.advanceUrl, 302);
      }
    }
  } catch {
    // continue to live lookup
  }

  // 2) Live resolve (Serper / short capi / DDG).
  try {
    const result = await lookupAdvanceProduct({
      partNumber,
      brand: brand || undefined,
      vendorPrefix: vendorPrefix || undefined,
    });

    if (result.resolved && result.url) {
      // Persist Advance fields without creating an incomplete market-price cache row.
      if (itemNumber) {
        try {
          const db = await getDb();
          const key = cacheKey(itemNumber);
          await db
            .update(items)
            .set({
              advanceUrl: result.url,
              advancePrice: result.price,
              advanceResolved: 1,
            })
            .where(eq(items.itemNumber, itemNumber));

          const existing = await db
            .select({ cacheKey: priceCache.cacheKey })
            .from(priceCache)
            .where(eq(priceCache.cacheKey, key))
            .limit(1);
          if (existing[0]) {
            await db
              .update(priceCache)
              .set({
                advanceUrl: result.url,
                advancePrice: result.price,
                advanceResolved: 1,
              })
              .where(eq(priceCache.cacheKey, key));
          }
        } catch {
          // redirect anyway
        }
      }
      return NextResponse.redirect(result.url, 302);
    }
  } catch {
    // fall through
  }

  // 3) Last resort: Google site-search usually surfaces the exact /p/ page.
  return NextResponse.redirect(advanceGoogleFindUrl(partNumber, brand), 302);
}

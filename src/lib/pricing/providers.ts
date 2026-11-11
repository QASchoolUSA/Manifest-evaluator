import type { PriceLookupInput, PriceResult } from "./types";
import { amazonSearchUrl, ebaySearchUrl, rockautoSearchUrl } from "./urls";

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function parsePricesFromText(text: string): number[] {
  const matches = text.matchAll(/\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g);
  const prices: number[] = [];
  for (const m of matches) {
    const n = Number(m[1].replace(/,/g, ""));
    if (n >= 1 && n <= 5000) prices.push(n);
  }
  return prices;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ManifestEvaluator/1.0; +local)",
        Accept: "text/html,application/json",
      },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function lookupEbayApi(input: PriceLookupInput): Promise<Partial<PriceResult> | null> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return null;

  const keywords = `${input.brand} ${input.partNumber}`.trim();
  const endpoint =
    `https://svcs.ebay.com/services/search/FindingService/v1` +
    `?OPERATION-NAME=findCompletedItems` +
    `&SERVICE-VERSION=1.13.0` +
    `&SECURITY-APPNAME=${encodeURIComponent(appId)}` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&REST-PAYLOAD` +
    `&keywords=${encodeURIComponent(keywords)}` +
    `&itemFilter(0).name=SoldItemsOnly` +
    `&itemFilter(0).value=true` +
    `&paginationInput.entriesPerPage=20`;

  const text = await fetchText(endpoint, 10000);
  if (!text) return null;

  try {
    const json = JSON.parse(text);
    const result = json?.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    const items = result?.item ?? [];
    const prices: number[] = [];
    for (const item of items) {
      const price = Number(item?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__);
      if (Number.isFinite(price) && price > 0) prices.push(price);
    }
    if (!prices.length) return null;
    return {
      low: Math.min(...prices),
      median: median(prices),
      high: Math.max(...prices),
      samples: prices.length,
      source: "ebay_sold",
      url: ebaySearchUrl(input.brand, input.partNumber, input.description),
    };
  } catch {
    return null;
  }
}

async function lookupEbayHtml(input: PriceLookupInput): Promise<Partial<PriceResult> | null> {
  const url = ebaySearchUrl(input.brand, input.partNumber, input.description);
  const html = await fetchText(url);
  if (!html) return null;
  const prices = parsePricesFromText(html).slice(0, 40);
  if (prices.length < 2) return null;
  return {
    low: Math.min(...prices),
    median: median(prices),
    high: Math.max(...prices),
    samples: prices.length,
    source: "ebay_sold_estimate",
    url,
  };
}

async function lookupRockAuto(input: PriceLookupInput): Promise<Partial<PriceResult> | null> {
  // RockAuto blocks most bots; try part search page and parse if available.
  const url = `https://www.rockauto.com/en/partsearch/?partnum=${encodeURIComponent(input.partNumber)}`;
  const html = await fetchText(url);
  if (!html) return null;
  const prices = parsePricesFromText(html).filter((p) => p < 500);
  if (!prices.length) return null;
  return {
    low: Math.min(...prices),
    median: median(prices),
    high: Math.max(...prices),
    samples: prices.length,
    source: "rockauto",
    url: rockautoSearchUrl(input.brand, input.partNumber),
  };
}

async function lookupAmazon(input: PriceLookupInput): Promise<Partial<PriceResult> | null> {
  const url = amazonSearchUrl(input.brand, input.partNumber, input.description);
  const html = await fetchText(url);
  if (!html) return null;
  const prices = parsePricesFromText(html).slice(0, 30);
  if (prices.length < 1) return null;
  return {
    low: Math.min(...prices),
    median: median(prices),
    high: Math.max(...prices),
    samples: prices.length,
    source: "amazon",
    url,
  };
}

/**
 * Heuristic fallback when live lookups fail: discount manifest retail based on
 * category/condition so lots still get a usable estimate. Marked clearly as estimate.
 */
function retailHeuristic(input: PriceLookupInput, unitRetail: number): Partial<PriceResult> | null {
  if (!unitRetail || unitRetail <= 0) return null;
  // Liquidation / like-new auto parts typically realize ~25–45% of shelf retail on secondary markets.
  const factor = input.description.toUpperCase().includes("LIFT SUPPORT") ? 0.35 : 0.4;
  const medianVal = Math.round(unitRetail * factor * 100) / 100;
  return {
    low: Math.round(medianVal * 0.75 * 100) / 100,
    median: medianVal,
    high: Math.round(medianVal * 1.25 * 100) / 100,
    samples: 0,
    source: "retail_estimate",
    url: null,
  };
}

export async function lookupMarketPrice(
  input: PriceLookupInput,
  unitRetail = 0,
): Promise<PriceResult> {
  const ebayUrl = ebaySearchUrl(input.brand, input.partNumber, input.description);
  const rockautoUrl = rockautoSearchUrl(input.brand, input.partNumber);
  const amazonUrl = amazonSearchUrl(input.brand, input.partNumber, input.description);

  const ebayApi = await lookupEbayApi(input);
  const ebayHtml = ebayApi ? null : await lookupEbayHtml(input);
  const rock = ebayApi || ebayHtml ? null : await lookupRockAuto(input);
  const amazon = ebayApi || ebayHtml || rock ? null : await lookupAmazon(input);
  const heuristic =
    ebayApi || ebayHtml || rock || amazon
      ? null
      : retailHeuristic(input, unitRetail);

  const chosen = ebayApi ?? ebayHtml ?? rock ?? amazon ?? heuristic;

  return {
    low: chosen?.low ?? null,
    median: chosen?.median ?? null,
    high: chosen?.high ?? null,
    samples: chosen?.samples ?? 0,
    source: chosen?.source ?? "unpriced",
    url: chosen?.url ?? ebayUrl,
    ebayUrl,
    rockautoUrl,
    amazonUrl,
  };
}

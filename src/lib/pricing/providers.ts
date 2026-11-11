import { lookupAdvanceProduct } from "./advance";
import type { PriceLookupInput, PriceResult } from "./types";
import { amazonSearchUrl, ebaySearchUrl, rockautoSearchUrl } from "./urls";

/** Skip eBay API until this time when free-tier limits trip. */
let ebayApiCooldownUntil = 0;

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

type FetchResult = {
  ok: boolean;
  status: number;
  text: string | null;
};

async function fetchResponse(
  url: string,
  timeoutMs = 3500,
): Promise<FetchResult> {
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
    const text = await res.text().catch(() => null);
    return { ok: res.ok, status: res.status, text };
  } catch {
    return { ok: false, status: 0, text: null };
  }
}

async function fetchText(url: string, timeoutMs = 3500): Promise<string | null> {
  const res = await fetchResponse(url, timeoutMs);
  return res.ok ? res.text : null;
}

function isEbayRateLimited(status: number, body: string | null): boolean {
  if (status === 429 || status === 503) return true;
  if (!body) return false;
  const lower = body.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("exceeded the number of times") ||
    lower.includes("call limit") ||
    lower.includes("usage limit") ||
    lower.includes("too many requests")
  ) {
    return true;
  }
  // Common Finding API error ids for throttle / auth quota issues
  if (
    /"errorid"\s*:\s*\["?(10001|21829|21916284|21919188)"?\]/i.test(body) ||
    /errorId["\s:>]+(10001|21829|21916284)/i.test(body)
  ) {
    return true;
  }
  return false;
}

function tripEbayCooldown(minutes = 10) {
  ebayApiCooldownUntil = Date.now() + minutes * 60_000;
}

function ebayApiAvailable(): boolean {
  return Boolean(process.env.EBAY_APP_ID) && Date.now() >= ebayApiCooldownUntil;
}

type LookupOutcome =
  | { kind: "hit"; result: Partial<PriceResult> }
  | { kind: "miss" }
  | { kind: "rate_limited" };

async function lookupEbayApi(input: PriceLookupInput): Promise<LookupOutcome> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId || Date.now() < ebayApiCooldownUntil) return { kind: "miss" };

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

  const res = await fetchResponse(endpoint, 10000);
  if (isEbayRateLimited(res.status, res.text)) {
    tripEbayCooldown(10);
    return { kind: "rate_limited" };
  }
  if (!res.ok || !res.text) return { kind: "miss" };

  try {
    const json = JSON.parse(res.text);
    const response = json?.findCompletedItemsResponse?.[0];
    const ack = String(response?.ack?.[0] ?? "").toLowerCase();
    const errorBody = JSON.stringify(response?.errorMessage ?? response?.error ?? "");
    if (ack === "failure" || ack === "partialfailure") {
      if (isEbayRateLimited(res.status, errorBody || res.text)) {
        tripEbayCooldown(10);
        return { kind: "rate_limited" };
      }
      return { kind: "miss" };
    }

    const result = response?.searchResult?.[0];
    const items = result?.item ?? [];
    const prices: number[] = [];
    for (const item of items) {
      const price = Number(item?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__);
      if (Number.isFinite(price) && price > 0) prices.push(price);
    }
    if (!prices.length) return { kind: "miss" };
    return {
      kind: "hit",
      result: {
        low: Math.min(...prices),
        median: median(prices),
        high: Math.max(...prices),
        samples: prices.length,
        source: "ebay_sold",
        url: ebaySearchUrl(input.brand, input.partNumber, input.description),
      },
    };
  } catch {
    return { kind: "miss" };
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function lookupMarketPrice(
  input: PriceLookupInput,
  unitRetail = 0,
): Promise<PriceResult> {
  const ebayUrl = ebaySearchUrl(input.brand, input.partNumber, input.description);
  const rockautoUrl = rockautoSearchUrl(input.brand, input.partNumber);
  const amazonUrl = amazonSearchUrl(input.brand, input.partNumber, input.description);

  // Resolve Advance Auto product page + shelf price (capi → Serper → search).
  const advance = await lookupAdvanceProduct({
    partNumber: input.partNumber,
    brand: input.brand,
    vendorPrefix: input.vendorPrefix,
  });

  let chosen: Partial<PriceResult> | null = null;

  // 1) eBay Finding API (sold) when App ID is present and not in cooldown
  if (ebayApiAvailable()) {
    const ebayApi = await lookupEbayApi(input);
    if (ebayApi.kind === "hit") {
      chosen = ebayApi.result;
      // Soft throttle free-tier: brief pause before next SKU can call again
      await sleep(250);
    }
    // rate_limited or miss → fall through to local fallbacks
  }

  // 2–5) Existing project fallbacks when API is missing, empty, or rate-limited
  if (!chosen) chosen = await lookupEbayHtml(input);
  if (!chosen) chosen = await lookupRockAuto(input);
  if (!chosen) chosen = await lookupAmazon(input);
  if (!chosen) chosen = retailHeuristic(input, unitRetail);

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
    advanceUrl: advance.url,
    advancePrice: advance.price,
    advanceResolved: advance.resolved,
  };
}

import { advanceProductUrl, advanceSearchUrl } from "./urls";

export type AdvanceLookupResult = {
  url: string;
  productId: string | null;
  seoKeyword: string | null;
  partNumber: string | null;
  manufacturerName: string | null;
  manufacturerCode: string | null;
  price: number | null;
  resolved: boolean;
  source: "capi" | "serper" | "ddg" | "search";
};

type AdvanceProduct = {
  productName?: string;
  manufacturerName?: string;
  manufacturerCode?: string;
  partNumber?: string;
  seoKeyword?: string;
  id?: string;
  price?: number;
  salePrice?: number;
  regularPrice?: number;
};

type SerperOrganic = {
  title?: string;
  link?: string;
  snippet?: string;
};

/** Advance capi is blocked from most serverless IPs — skip after first failure. */
let advanceCapiCooldownUntil = 0;

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

function partToken(partNumber: string): string {
  return norm(partNumber).replace(/[^A-Z0-9]/g, "");
}

export function advanceGoogleFindUrl(partNumber: string, brand?: string): string {
  const q = ["site:shop.advanceautoparts.com/p", partNumber, brand]
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=en&gl=us`;
}

function unresolved(partNumber: string, brand?: string): AdvanceLookupResult {
  // Prefer Google site-search over Advance SearchResults — it ranks the real /p/ page.
  return {
    url: advanceGoogleFindUrl(partNumber, brand),
    productId: null,
    seoKeyword: null,
    partNumber: null,
    manufacturerName: null,
    manufacturerCode: null,
    price: null,
    resolved: false,
    source: "search",
  };
}

function pickAdvancePrice(p: AdvanceProduct): number | null {
  for (const candidate of [p.salePrice, p.price, p.regularPrice]) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }
  return null;
}

function parsePriceFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 && n < 5000 ? n : null;
}

function pathContainsPart(url: string, partNumber: string): boolean {
  const want = partToken(partNumber);
  if (!want) return false;
  const path = url.split("?")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  return path.includes(want);
}

export function parseAdvanceProductUrl(url: string): {
  seoKeyword: string;
  productId: string;
} | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("advanceautoparts.com")) return null;
    const m = u.pathname.match(/\/p\/([^/]+)\/(\d+)-P\/?$/i);
    if (!m) return null;
    return { seoKeyword: decodeURIComponent(m[1]), productId: m[2] };
  } catch {
    return null;
  }
}

function preferProduct(
  products: AdvanceProduct[],
  partNumber: string,
  brand?: string,
  vendorPrefix?: string,
): AdvanceProduct | undefined {
  const wantPart = norm(partNumber);
  const wantPrefix = norm(vendorPrefix);
  const exact = products.filter((p) => norm(p.partNumber) === wantPart);
  return (
    (wantPrefix
      ? exact.find((p) => norm(p.manufacturerCode) === wantPrefix)
      : undefined) ??
    exact.find((p) =>
      brand ? norm(p.manufacturerName).includes(norm(brand)) : false,
    ) ??
    exact[0]
  );
}

function extractProductFromOrganic(
  organic: SerperOrganic[],
  partNumber: string,
  brand?: string,
  source: "serper" | "ddg" = "serper",
): AdvanceLookupResult | null {
  for (const row of organic) {
    const link = row.link;
    if (!link) continue;
    const parsed = parseAdvanceProductUrl(link);
    if (!parsed) continue;
    if (!pathContainsPart(link, partNumber)) continue;

    return {
      url: advanceProductUrl(parsed.seoKeyword, parsed.productId),
      productId: parsed.productId,
      seoKeyword: parsed.seoKeyword,
      partNumber,
      manufacturerName: brand ?? null,
      manufacturerCode: null,
      price: parsePriceFromText(row.snippet) ?? parsePriceFromText(row.title),
      resolved: true,
      source,
    };
  }
  return null;
}

async function lookupAdvanceCapi(input: {
  partNumber: string;
  brand?: string;
  vendorPrefix?: string;
}): Promise<AdvanceLookupResult | null> {
  if (Date.now() < advanceCapiCooldownUntil) return null;

  const endpoint =
    `https://shop.advanceautoparts.com/capi/v56/search` +
    `?order=BEST_MATCH&count=8` +
    `&withoutVehicleForInterchangeableParts=true` +
    `&page=1&offset=0&v2=true` +
    `&term=${encodeURIComponent(input.partNumber)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: advanceSearchUrl(input.partNumber),
        Origin: "https://shop.advanceautoparts.com",
      },
      cache: "no-store",
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("json")) {
      advanceCapiCooldownUntil = Date.now() + 60 * 60_000;
      return null;
    }

    const json = (await res.json()) as { products?: AdvanceProduct[] };
    const preferred = preferProduct(
      json.products ?? [],
      input.partNumber,
      input.brand,
      input.vendorPrefix,
    );
    if (!preferred?.id || !preferred.seoKeyword) return null;

    return {
      url: advanceProductUrl(preferred.seoKeyword, preferred.id),
      productId: preferred.id,
      seoKeyword: preferred.seoKeyword,
      partNumber: preferred.partNumber ?? null,
      manufacturerName: preferred.manufacturerName ?? null,
      manufacturerCode: preferred.manufacturerCode ?? null,
      price: pickAdvancePrice(preferred),
      resolved: true,
      source: "capi",
    };
  } catch {
    advanceCapiCooldownUntil = Date.now() + 60 * 60_000;
    return null;
  }
}

async function serperSearch(query: string): Promise<SerperOrganic[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
        gl: "us",
        hl: "en",
      }),
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = (await res.json()) as { organic?: SerperOrganic[] };
    return json.organic ?? [];
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function lookupAdvanceSerper(input: {
  partNumber: string;
  brand?: string;
}): Promise<AdvanceLookupResult | null> {
  if (!process.env.SERPER_API_KEY) return null;

  const queries = [
    `site:shop.advanceautoparts.com/p ${input.partNumber} ${input.brand ?? ""}`.trim(),
    `"${input.partNumber}" site:shop.advanceautoparts.com/p`,
    `${input.brand ?? ""} ${input.partNumber} site:shop.advanceautoparts.com`.trim(),
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  for (const query of queries) {
    const organic = await serperSearch(query);
    const hit = extractProductFromOrganic(organic, input.partNumber, input.brand, "serper");
    if (hit) return hit;
  }

  return null;
}

/**
 * DuckDuckGo HTML occasionally works from some hosts; Node/Vercel usually gets a challenge.
 * Keep as a cheap best-effort before falling back.
 */
async function lookupAdvanceDdg(input: {
  partNumber: string;
  brand?: string;
}): Promise<AdvanceLookupResult | null> {
  const query =
    `site:shop.advanceautoparts.com/p ${input.partNumber} ${input.brand ?? ""}`.trim();
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const organic: SerperOrganic[] = [];
    for (const m of html.matchAll(/uddg=([^&"]+)/g)) {
      try {
        const link = decodeURIComponent(m[1]);
        if (link.includes("shop.advanceautoparts.com/p/")) {
          organic.push({ link });
        }
      } catch {
        // ignore bad encoding
      }
    }
    return extractProductFromOrganic(organic, input.partNumber, input.brand, "ddg");
  } catch {
    return null;
  }
}

/**
 * Resolve an Advance Auto product page + shelf price.
 * Waterfall: capi (fast-fail/circuit) → Serper → DuckDuckGo → Google site-search link.
 */
export async function lookupAdvanceProduct(input: {
  partNumber: string;
  brand?: string;
  vendorPrefix?: string;
}): Promise<AdvanceLookupResult> {
  const capi = await lookupAdvanceCapi(input);
  if (capi?.resolved) return capi;

  const serper = await lookupAdvanceSerper(input);
  if (serper?.resolved) return serper;

  const ddg = await lookupAdvanceDdg(input);
  if (ddg?.resolved) return ddg;

  return unresolved(input.partNumber, input.brand);
}

export function hasAdvanceSearchProvider(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

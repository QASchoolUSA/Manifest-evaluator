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
  source: "capi" | "serper" | "search";
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

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

function unresolved(partNumber: string): AdvanceLookupResult {
  return {
    url: advanceSearchUrl(partNumber),
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
  const want = norm(partNumber).replace(/[^A-Z0-9]/g, "");
  if (!want) return false;
  const path = url.split("?")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  return path.includes(want);
}

function parseAdvanceProductUrl(url: string): {
  seoKeyword: string;
  productId: string;
} | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("advanceautoparts.com")) return null;
    const m = u.pathname.match(/\/p\/([^/]+)\/(\d+)-P\/?$/i);
    if (!m) return null;
    return { seoKeyword: m[1], productId: m[2] };
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

async function lookupAdvanceCapi(input: {
  partNumber: string;
  brand?: string;
  vendorPrefix?: string;
}): Promise<AdvanceLookupResult | null> {
  const fallback = advanceSearchUrl(input.partNumber);
  const terms = [
    input.partNumber,
    [input.brand, input.partNumber].filter(Boolean).join(" ").trim(),
  ].filter((t, i, arr) => t && arr.indexOf(t) === i);

  for (const term of terms) {
    const endpoint =
      `https://shop.advanceautoparts.com/capi/v56/search` +
      `?order=BEST_MATCH&count=12` +
      `&withoutVehicleForInterchangeableParts=true` +
      `&page=1&offset=0&v2=true` +
      `&term=${encodeURIComponent(term)}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: fallback,
          Origin: "https://shop.advanceautoparts.com",
        },
        cache: "no-store",
      });
      clearTimeout(timer);

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("json")) continue;

      const json = (await res.json()) as { products?: AdvanceProduct[] };
      const preferred = preferProduct(
        json.products ?? [],
        input.partNumber,
        input.brand,
        input.vendorPrefix,
      );
      if (!preferred?.id || !preferred.seoKeyword) continue;

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
      // try next term / fall through to Serper
    }
  }

  return null;
}

async function serperSearch(query: string): Promise<SerperOrganic[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
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
        num: 8,
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
    `site:shop.advanceautoparts.com/p ${input.partNumber}`,
  ].filter((q, i, arr) => arr.indexOf(q) === i);

  for (const query of queries) {
    const organic = await serperSearch(query);
    for (const row of organic) {
      const link = row.link;
      if (!link) continue;
      const parsed = parseAdvanceProductUrl(link);
      if (!parsed) continue;
      if (!pathContainsPart(link, input.partNumber)) continue;

      return {
        url: advanceProductUrl(parsed.seoKeyword, parsed.productId),
        productId: parsed.productId,
        seoKeyword: parsed.seoKeyword,
        partNumber: input.partNumber,
        manufacturerName: input.brand ?? null,
        manufacturerCode: null,
        price:
          parsePriceFromText(row.snippet) ?? parsePriceFromText(row.title),
        resolved: true,
        source: "serper",
      };
    }
  }

  return null;
}

/**
 * Resolve an Advance Auto product page + shelf price.
 * Waterfall: native capi (often blocked) → Serper Google search → search URL.
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

  return unresolved(input.partNumber);
}

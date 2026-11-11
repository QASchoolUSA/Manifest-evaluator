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
};

type AdvanceProduct = {
  productName?: string;
  manufacturerName?: string;
  manufacturerCode?: string;
  partNumber?: string;
  seoKeyword?: string;
  id?: string;
  price?: number;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

/**
 * Try Advance Auto's public search API for an exact product page.
 * Often blocked from datacenter IPs — callers must fall back to search URL.
 */
export async function lookupAdvanceProduct(input: {
  partNumber: string;
  brand?: string;
  vendorPrefix?: string;
}): Promise<AdvanceLookupResult> {
  const fallback = advanceSearchUrl(input.partNumber);
  const endpoint =
    `https://shop.advanceautoparts.com/capi/v56/search` +
    `?order=BEST_MATCH&count=12` +
    `&withoutVehicleForInterchangeableParts=true` +
    `&page=1&offset=0&v2=true` +
    `&term=${encodeURIComponent(input.partNumber)}`;

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
    if (!res.ok || !contentType.includes("json")) {
      return {
        url: fallback,
        productId: null,
        seoKeyword: null,
        partNumber: null,
        manufacturerName: null,
        manufacturerCode: null,
        price: null,
        resolved: false,
      };
    }

    const json = (await res.json()) as { products?: AdvanceProduct[] };
    const products = json.products ?? [];
    const wantPart = norm(input.partNumber);
    const wantPrefix = norm(input.vendorPrefix);

    const exact = products.filter((p) => norm(p.partNumber) === wantPart);
    const preferred =
      (wantPrefix
        ? exact.find((p) => norm(p.manufacturerCode) === wantPrefix)
        : undefined) ??
      exact.find((p) =>
        input.brand
          ? norm(p.manufacturerName).includes(norm(input.brand))
          : false,
      ) ??
      exact[0];

    if (preferred?.id && preferred?.seoKeyword) {
      return {
        url: advanceProductUrl(preferred.seoKeyword, preferred.id),
        productId: preferred.id,
        seoKeyword: preferred.seoKeyword,
        partNumber: preferred.partNumber ?? null,
        manufacturerName: preferred.manufacturerName ?? null,
        manufacturerCode: preferred.manufacturerCode ?? null,
        price:
          typeof preferred.price === "number" && preferred.price > 0
            ? preferred.price
            : null,
        resolved: true,
      };
    }
  } catch {
    // fall through to search URL
  }

  return {
    url: fallback,
    productId: null,
    seoKeyword: null,
    partNumber: null,
    manufacturerName: null,
    manufacturerCode: null,
    price: null,
    resolved: false,
  };
}

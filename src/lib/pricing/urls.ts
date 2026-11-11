/** Strip manifest noise like "1 EA STRNG" so market searches stay on-part. */
export function cleanSearchPhrase(description: string, maxWords = 4): string {
  return description
    .replace(/\b\d+\s*EA\b/gi, " ")
    .replace(/\b(STRNG|MTHR|WREVR|ATC|DORM|TRICO)\b/gi, " ")
    .replace(/[^a-zA-Z0-9.\-/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

export function ebaySearchUrl(brand: string, partNumber: string, description: string): string {
  const q = [brand, partNumber, cleanSearchPhrase(description, 4)]
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1&rt=nc`;
}

export function rockautoSearchUrl(_brand: string, partNumber: string): string {
  // RockAuto's part search only keys off partnum; extra brand params often confuse results.
  return `https://www.rockauto.com/en/partsearch/?partnum=${encodeURIComponent(partNumber)}`;
}

export function amazonSearchUrl(brand: string, partNumber: string, description: string): string {
  const q = [brand, partNumber, cleanSearchPhrase(description, 5)]
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;
}

/**
 * Advance Auto storefront search. Opens real results in-browser for the part #.
 * (Exact /p/... product IDs require their capi lookup when available.)
 */
export function advanceSearchUrl(partNumber: string): string {
  const term = partNumber.trim();
  return (
    `https://shop.advanceautoparts.com/web/SearchResults` +
    `?searchTerm=${encodeURIComponent(term)}` +
    `&autoSuggest=false&recentSearch=false&popularSearch=false` +
    `&storeId=10151&catalogId=10051&langId=-1`
  );
}

export function advanceProductUrl(seoKeyword: string, productId: string): string {
  const seo = seoKeyword.replace(/^\/+|\/+$/g, "");
  const id = productId.replace(/-P$/i, "");
  return `https://shop.advanceautoparts.com/p/${seo}/${id}-P`;
}

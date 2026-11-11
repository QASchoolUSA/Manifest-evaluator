export function ebaySearchUrl(brand: string, partNumber: string, description: string): string {
  const q = [brand, partNumber, description.split(" ").slice(0, 4).join(" ")]
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1&rt=nc`;
}

export function rockautoSearchUrl(brand: string, partNumber: string): string {
  const q = `${brand} ${partNumber}`.trim();
  return `https://www.rockauto.com/en/partsearch/?partnum=${encodeURIComponent(partNumber)}&brand=${encodeURIComponent(brand)}&q=${encodeURIComponent(q)}`;
}

export function amazonSearchUrl(brand: string, partNumber: string, description: string): string {
  const q = [brand, partNumber, description.split(" ").slice(0, 5).join(" ")]
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;
}

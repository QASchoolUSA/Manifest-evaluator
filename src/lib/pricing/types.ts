export type PriceResult = {
  low: number | null;
  median: number | null;
  high: number | null;
  samples: number;
  source: string;
  url: string | null;
  ebayUrl: string;
  rockautoUrl: string;
  amazonUrl: string;
  advanceUrl: string;
  advancePrice: number | null;
  advanceResolved: boolean;
};

export type PriceLookupInput = {
  itemNumber: string;
  brand: string;
  partNumber: string;
  description: string;
  vendorPrefix?: string;
};

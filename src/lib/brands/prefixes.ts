/** Advance Auto / B-Stock vendor prefixes → brand names */
export const VENDOR_PREFIX_MAP: Record<string, string> = {
  STR: "StrongArm",
  TRM: "Trico",
  DCD: "DieHard",
  AWU: "Awar",
  TYS: "Type S",
  PUR: "Purfresh",
  MRS: "Mothers",
  ATC: "AutoCraft",
  MCX: "Mechanix",
  LMR: "Lund",
  CWD: "Carwise",
  HTT: "Hopkins",
  RYC: "Raybestos",
  KDD: "Cowles",
  IHM: "Innova",
  CMG: "Chemglass",
  RSO: "Rain-X",
  FRZ: "Fritz",
  PTX: "Prestone",
  CUA: "Custom Accessories",
  MVP: "Mighty",
  DOR: "Dorman",
  RGL: "Rally",
  MON: "Monroe",
  DWK: "Dewalt",
  WIX: "WIX",
  FRM: "Fram",
  BOS: "Bosch",
  NGK: "NGK",
  AC: "ACDelco",
};

export function decodeItemNumber(itemNumber: string): {
  vendorPrefix: string;
  partNumber: string;
  brand: string;
} {
  const raw = itemNumber.trim();
  const underscore = raw.indexOf("_");
  if (underscore > 0) {
    const vendorPrefix = raw.slice(0, underscore).toUpperCase();
    const partNumber = raw.slice(underscore + 1);
    const brand = VENDOR_PREFIX_MAP[vendorPrefix] ?? vendorPrefix;
    return { vendorPrefix, partNumber, brand };
  }
  return {
    vendorPrefix: "UNK",
    partNumber: raw,
    brand: "Unknown",
  };
}

export function isVehicleFitmentCandidate(
  vendorPrefix: string,
  sellerCategory: string,
  description: string,
): boolean {
  const cat = sellerCategory.toUpperCase();
  const desc = description.toUpperCase();
  if (vendorPrefix === "STR") return true;
  if (cat.includes("SUPPORT") || cat.includes("RIDE CONTROL")) return true;
  if (desc.includes("LIFT SUPPORT") || desc.includes("SHOCK") || desc.includes("STRUT"))
    return true;
  if (
    cat.includes("BRAKE") ||
    cat.includes("FILTER") ||
    cat.includes("IGNITION") ||
    cat.includes("WIPER") ||
    cat.includes("LIGHTING") ||
    cat.includes("STEERING")
  ) {
    return true;
  }
  return false;
}

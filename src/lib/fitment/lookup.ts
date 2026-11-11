import { isVehicleFitmentCandidate } from "@/lib/brands/prefixes";
import {
  STRONGARM_FITMENT,
  summarizeFitment,
  type VehicleFit,
} from "./strongarm";

export type FitmentResult = {
  status: "ready" | "na" | "unknown";
  summary: string;
  location: string | null;
  vehicles: VehicleFit[];
};

export function lookupFitment(input: {
  vendorPrefix: string;
  brand: string;
  partNumber: string;
  description: string;
  sellerCategory: string;
}): FitmentResult {
  if (
    !isVehicleFitmentCandidate(
      input.vendorPrefix,
      input.sellerCategory,
      input.description,
    )
  ) {
    return {
      status: "na",
      summary: "N/A — consumable/accessory",
      location: null,
      vehicles: [],
    };
  }

  const partKey = input.partNumber.toUpperCase();
  const vehicles =
    STRONGARM_FITMENT[partKey] ??
    STRONGARM_FITMENT[partKey.replace(/^0+/, "")] ??
    [];

  if (vehicles.length) {
    const { summary, location } = summarizeFitment(vehicles);
    return { status: "ready", summary, location, vehicles };
  }

  // Brand/part known as vehicle part but no local application row yet
  if (input.vendorPrefix === "STR" || input.description.toUpperCase().includes("LIFT SUPPORT")) {
    return {
      status: "unknown",
      summary: `StrongArm ${input.partNumber} — check RockAuto/eBay fitment`,
      location: "Lift Support",
      vehicles: [],
    };
  }

  return {
    status: "unknown",
    summary: `${input.brand} ${input.partNumber} — vehicle part, fitment TBD`,
    location: null,
    vehicles: [],
  };
}

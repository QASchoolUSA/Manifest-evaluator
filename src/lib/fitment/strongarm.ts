/**
 * Compact StrongArm application snippets keyed by part number.
 * Expanded over time via live enrichment cache; these cover common SKUs
 * and give instant fitment for many lift supports in Advance manifests.
 */
export type VehicleFit = {
  yearFrom: number;
  yearTo: number;
  make: string;
  model: string;
  location: string;
};

export const STRONGARM_FITMENT: Record<string, VehicleFit[]> = {
  C4761: [
    { yearFrom: 2007, yearTo: 2014, make: "Chevrolet", model: "Suburban 1500", location: "Liftgate" },
    { yearFrom: 2007, yearTo: 2014, make: "GMC", model: "Yukon XL", location: "Liftgate" },
  ],
  E6314: [
    { yearFrom: 2011, yearTo: 2017, make: "Honda", model: "Odyssey", location: "Liftgate" },
  ],
  F4068: [
    { yearFrom: 2005, yearTo: 2010, make: "Chrysler", model: "300", location: "Trunk Lid" },
    { yearFrom: 2005, yearTo: 2008, make: "Dodge", model: "Magnum", location: "Liftgate" },
  ],
  C6154: [
    { yearFrom: 2015, yearTo: 2020, make: "Ford", model: "Mustang", location: "Deck Lid" },
  ],
  D6127: [
    { yearFrom: 2011, yearTo: 2016, make: "BMW", model: "X3", location: "Liftgate" },
  ],
  E7129: [
    { yearFrom: 2015, yearTo: 2020, make: "Ford", model: "Mustang", location: "Deck Lid" },
  ],
  C7127: [
    { yearFrom: 2010, yearTo: 2015, make: "BMW", model: "X1", location: "Liftgate" },
  ],
  D7048: [
    { yearFrom: 2009, yearTo: 2012, make: "Hyundai", model: "Elantra", location: "Hatch" },
  ],
  C7050: [
    { yearFrom: 2013, yearTo: 2017, make: "Acura", model: "RDX", location: "Liftgate" },
  ],
  E7132: [
    { yearFrom: 2011, yearTo: 2017, make: "Buick", model: "Regal", location: "Trunk Lid" },
  ],
  C7134: [
    { yearFrom: 2007, yearTo: 2011, make: "Hyundai", model: "Accent", location: "Trunk Lid" },
  ],
  D7053: [
    { yearFrom: 2007, yearTo: 2015, make: "Audi", model: "Q7", location: "Liftgate" },
  ],
  C7135: [
    { yearFrom: 2007, yearTo: 2010, make: "Saturn", model: "Outlook", location: "Hood" },
  ],
  D7136: [
    { yearFrom: 2012, yearTo: 2017, make: "Toyota", model: "Yaris", location: "Hatch" },
  ],
  E7055: [
    { yearFrom: 2008, yearTo: 2014, make: "Mini", model: "Cooper", location: "Hatch" },
  ],
  C7057: [
    { yearFrom: 2006, yearTo: 2011, make: "Land Rover", model: "Range Rover Sport", location: "Liftgate" },
  ],
  F7138: [
    { yearFrom: 2006, yearTo: 2013, make: "Mazda", model: "6", location: "Trunk Lid" },
  ],
  E7058: [
    { yearFrom: 2008, yearTo: 2021, make: "Audi", model: "A5 / S5", location: "Trunk Lid" },
  ],
  C7073: [
    { yearFrom: 2007, yearTo: 2012, make: "BMW", model: "328i", location: "Liftgate" },
  ],
  C7155: [
    { yearFrom: 2015, yearTo: 2020, make: "Acura", model: "TLX", location: "Hood" },
  ],
  C7174: [
    { yearFrom: 2014, yearTo: 2019, make: "Kia", model: "Soul", location: "Liftgate" },
  ],
  C7178: [
    { yearFrom: 2016, yearTo: 2018, make: "Honda", model: "HR-V", location: "Hatch" },
  ],
  C7168: [
    { yearFrom: 2014, yearTo: 2021, make: "Toyota", model: "Tundra", location: "Hood" },
  ],
  C7170: [
    { yearFrom: 2018, yearTo: 2021, make: "Toyota", model: "Camry", location: "Hood" },
  ],
  D7173: [
    { yearFrom: 2014, yearTo: 2016, make: "Acura", model: "MDX", location: "Hood" },
  ],
  "4418": [
    { yearFrom: 1990, yearTo: 2020, make: "Multi", model: "Universal", location: "Multi-purpose" },
  ],
  // High-frequency Advance Auto manifest SKUs (compact applications)
  A4952L: [
    { yearFrom: 2007, yearTo: 2014, make: "Toyota", model: "Tundra", location: "Hood (LH)" },
  ],
  A4979: [
    { yearFrom: 2008, yearTo: 2016, make: "Chrysler", model: "Town & Country", location: "Liftgate" },
  ],
  A6188: [
    { yearFrom: 2011, yearTo: 2017, make: "Jeep", model: "Grand Cherokee", location: "Liftgate" },
  ],
  B4328: [
    { yearFrom: 2005, yearTo: 2010, make: "Honda", model: "Odyssey", location: "Liftgate" },
  ],
  B4558: [
    { yearFrom: 2007, yearTo: 2013, make: "Chevrolet", model: "Silverado 1500", location: "Hood" },
  ],
  B4588: [
    { yearFrom: 2009, yearTo: 2014, make: "Ford", model: "F-150", location: "Hood" },
  ],
  B4987L: [
    { yearFrom: 2010, yearTo: 2015, make: "Toyota", model: "Prius", location: "Hatch (LH)" },
  ],
  B4995: [
    { yearFrom: 2006, yearTo: 2011, make: "Honda", model: "Civic", location: "Trunk Lid" },
  ],
  B6162: [
    { yearFrom: 2013, yearTo: 2018, make: "Ford", model: "Escape", location: "Liftgate" },
  ],
  B6238: [
    { yearFrom: 2011, yearTo: 2016, make: "Volkswagen", model: "Jetta", location: "Trunk Lid" },
  ],
  B6336: [
    { yearFrom: 2014, yearTo: 2019, make: "Jeep", model: "Cherokee", location: "Liftgate" },
  ],
  B6486: [
    { yearFrom: 2015, yearTo: 2020, make: "Honda", model: "CR-V", location: "Liftgate" },
  ],
  C4218: [
    { yearFrom: 2004, yearTo: 2009, make: "Toyota", model: "Sienna", location: "Liftgate" },
  ],
  C4219: [
    { yearFrom: 2004, yearTo: 2009, make: "Toyota", model: "Sienna", location: "Liftgate" },
  ],
  C4221L: [
    { yearFrom: 2007, yearTo: 2011, make: "Toyota", model: "Camry", location: "Trunk (LH)" },
  ],
  C4256: [
    { yearFrom: 2005, yearTo: 2010, make: "Chrysler", model: "300", location: "Trunk Lid" },
  ],
  C4294: [
    { yearFrom: 2006, yearTo: 2011, make: "Chevrolet", model: "Impala", location: "Trunk Lid" },
  ],
  C4321: [
    { yearFrom: 2007, yearTo: 2012, make: "Nissan", model: "Altima", location: "Trunk Lid" },
  ],
  C4396: [
    { yearFrom: 2008, yearTo: 2012, make: "Honda", model: "Accord", location: "Trunk Lid" },
  ],
  C4567: [
    { yearFrom: 2007, yearTo: 2014, make: "Cadillac", model: "Escalade", location: "Liftgate" },
  ],
  C4585: [
    { yearFrom: 2007, yearTo: 2014, make: "GMC", model: "Sierra 1500", location: "Hood" },
  ],
  C4589: [
    { yearFrom: 2009, yearTo: 2014, make: "Ford", model: "Flex", location: "Liftgate" },
  ],
  C4593: [
    { yearFrom: 2008, yearTo: 2015, make: "Nissan", model: "Rogue", location: "Liftgate" },
  ],
  C4754: [
    { yearFrom: 2007, yearTo: 2014, make: "Chevrolet", model: "Tahoe", location: "Liftgate" },
  ],
  C4758: [
    { yearFrom: 2007, yearTo: 2014, make: "GMC", model: "Yukon", location: "Liftgate" },
  ],
  C4799: [
    { yearFrom: 2010, yearTo: 2015, make: "Lexus", model: "RX350", location: "Liftgate" },
  ],
  C4964: [
    { yearFrom: 2011, yearTo: 2016, make: "Dodge", model: "Durango", location: "Liftgate" },
  ],
  C6102: [
    { yearFrom: 2012, yearTo: 2017, make: "Subaru", model: "Outback", location: "Liftgate" },
  ],
  C6174: [
    { yearFrom: 2013, yearTo: 2018, make: "Ford", model: "Explorer", location: "Liftgate" },
  ],
  C6197: [
    { yearFrom: 2014, yearTo: 2018, make: "Mazda", model: "CX-5", location: "Liftgate" },
  ],
  C6222L: [
    { yearFrom: 2011, yearTo: 2016, make: "BMW", model: "X5", location: "Liftgate (LH)" },
  ],
  C6235: [
    { yearFrom: 2013, yearTo: 2018, make: "Nissan", model: "Pathfinder", location: "Liftgate" },
  ],
  C6246: [
    { yearFrom: 2012, yearTo: 2017, make: "Toyota", model: "Prius v", location: "Hatch" },
  ],
  C6249: [
    { yearFrom: 2014, yearTo: 2019, make: "Jeep", model: "Cherokee", location: "Liftgate" },
  ],
  C6310: [
    { yearFrom: 2015, yearTo: 2020, make: "Honda", model: "Pilot", location: "Liftgate" },
  ],
  C6321: [
    { yearFrom: 2014, yearTo: 2019, make: "Chevrolet", model: "Equinox", location: "Liftgate" },
  ],
  C6360: [
    { yearFrom: 2013, yearTo: 2018, make: "Hyundai", model: "Santa Fe", location: "Liftgate" },
  ],
  C6503: [
    { yearFrom: 2016, yearTo: 2021, make: "Toyota", model: "Rav4", location: "Liftgate" },
  ],
  C6519: [
    { yearFrom: 2015, yearTo: 2020, make: "Ford", model: "Edge", location: "Liftgate" },
  ],
  C6656: [
    { yearFrom: 2017, yearTo: 2021, make: "Honda", model: "CR-V", location: "Liftgate" },
  ],
  C6940: [
    { yearFrom: 2018, yearTo: 2022, make: "Toyota", model: "Camry", location: "Trunk Lid" },
  ],
  C6947: [
    { yearFrom: 2016, yearTo: 2021, make: "Honda", model: "Civic", location: "Trunk Lid" },
  ],
  D4152: [
    { yearFrom: 2003, yearTo: 2008, make: "Toyota", model: "Corolla", location: "Trunk Lid" },
  ],
  D6121: [
    { yearFrom: 2011, yearTo: 2016, make: "BMW", model: "3 Series", location: "Trunk Lid" },
  ],
  D6172: [
    { yearFrom: 2012, yearTo: 2018, make: "Audi", model: "A6", location: "Trunk Lid" },
  ],
  D6178: [
    { yearFrom: 2013, yearTo: 2017, make: "Mercedes-Benz", model: "C-Class", location: "Trunk Lid" },
  ],
  D6194: [
    { yearFrom: 2014, yearTo: 2019, make: "Lexus", model: "IS", location: "Trunk Lid" },
  ],
  D6244: [
    { yearFrom: 2013, yearTo: 2018, make: "Ford", model: "Fusion", location: "Trunk Lid" },
  ],
  D6275: [
    { yearFrom: 2014, yearTo: 2019, make: "Chevrolet", model: "Malibu", location: "Trunk Lid" },
  ],
  D6325: [
    { yearFrom: 2015, yearTo: 2020, make: "Nissan", model: "Altima", location: "Trunk Lid" },
  ],
  D6352: [
    { yearFrom: 2014, yearTo: 2018, make: "Hyundai", model: "Sonata", location: "Trunk Lid" },
  ],
  E4069: [
    { yearFrom: 2005, yearTo: 2010, make: "Chrysler", model: "300", location: "Hood" },
  ],
  E4082: [
    { yearFrom: 2006, yearTo: 2011, make: "Dodge", model: "Charger", location: "Hood" },
  ],
  E4124: [
    { yearFrom: 2007, yearTo: 2012, make: "Honda", model: "Accord", location: "Hood" },
  ],
  E4127: [
    { yearFrom: 2007, yearTo: 2011, make: "Toyota", model: "Camry", location: "Hood" },
  ],
};

export function formatVehicle(v: VehicleFit): string {
  const years =
    v.yearFrom === v.yearTo ? `${v.yearFrom}` : `${v.yearFrom}–${String(v.yearTo).slice(-2)}`;
  return `${years} ${v.make} ${v.model}`;
}

export function summarizeFitment(vehicles: VehicleFit[], max = 3): {
  summary: string;
  location: string | null;
} {
  if (!vehicles.length) return { summary: "No fitment found", location: null };
  const location = vehicles[0]?.location ?? null;
  const labels = vehicles.slice(0, max).map(formatVehicle);
  const extra = vehicles.length - labels.length;
  const summary =
    extra > 0 ? `${labels.join("; ")}; +${extra} more` : labels.join("; ");
  return { summary, location };
}

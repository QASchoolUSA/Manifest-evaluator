import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { importManifest, listLots, lotsExist } from "@/lib/lots/service";

export const runtime = "nodejs";

const SAMPLE_FILES = [
  {
    file: "lot-dc29.csv",
    title:
      "1 Pallets of Front Room Support, Appearance Chemicals, Front Room Solutions, Air Fresheners & More",
  },
  {
    file: "lot-dc48.csv",
    title:
      "1 Pallets of Front Room Support, Exterior Accessories, Protective Gear, Appearance Chemicals & More",
  },
  {
    file: "lot-dc52.csv",
    title:
      "1 Pallets of Protective Gear, Front Room Support, Appearance Accessories, Air Fresheners & More",
  },
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const force = Boolean(body.force);

  if ((await lotsExist()) && !force) {
    return NextResponse.json({
      seeded: false,
      message: "Lots already exist",
      lots: await listLots(),
    });
  }

  const samplesDir = path.join(process.cwd(), "samples");
  const created = [];

  for (const sample of SAMPLE_FILES) {
    const full = path.join(samplesDir, sample.file);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8");
    const lot = await importManifest(
      text,
      `BStock_${sample.title}_Manifest.csv`,
    );
    created.push(lot);
  }

  return NextResponse.json({ seeded: true, lots: created });
}

export async function GET() {
  return NextResponse.json({
    exists: await lotsExist(),
    lots: await listLots(),
  });
}

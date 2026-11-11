import { NextResponse } from "next/server";
import { importManifest, listLots } from "@/lib/lots/service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ lots: await listLots() });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files");
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const created = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        return NextResponse.json(
          { error: `Only CSV manifests are supported: ${file.name}` },
          { status: 400 },
        );
      }
      const text = await file.text();
      const lot = await importManifest(text, file.name);
      created.push(lot);
    }

    return NextResponse.json({ lots: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { enrichLot, getLot } from "@/lib/lots/service";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!(await getLot(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const result = await enrichLot(id, {
    limit: body.limit ?? 15,
    force: Boolean(body.force),
  });
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import {
  deleteLot,
  getLot,
  getLotItems,
  updateLotDeal,
} from "@/lib/lots/service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const lot = await getLot(id);
  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await getLotItems(id);
  return NextResponse.json({ lot, items });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const lot = await updateLotDeal(id, {
    bidPrice: body.bidPrice != null ? Number(body.bidPrice) : undefined,
    buyerPremiumPct:
      body.buyerPremiumPct != null ? Number(body.buyerPremiumPct) : undefined,
    freight: body.freight != null ? Number(body.freight) : undefined,
    salvagePct: body.salvagePct != null ? Number(body.salvagePct) : undefined,
  });
  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lot });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await deleteLot(id);
  return NextResponse.json({ ok: true });
}

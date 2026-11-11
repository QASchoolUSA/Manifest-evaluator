import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DealPanel } from "@/components/DealPanel";
import { EnrichControls } from "@/components/EnrichControls";
import { ItemsTable } from "@/components/ItemsTable";
import { DeleteLotButton } from "@/components/DeleteLotButton";
import { formatMoney } from "@/lib/deal/math";
import { getLot, getLotItems } from "@/lib/lots/service";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LotDetailPage({ params }: Props) {
  const { id } = await params;
  const lot = await getLot(id);
  if (!lot) notFound();
  const items = await getLotItems(id);
  const pending = items.filter(
    (i) => i.priceStatus === "pending" || i.priceStatus === "error",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Lots
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Lot detail</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Separate pallet</Badge>
            <Badge variant="outline" className="font-mono font-normal">
              {lot.lotId}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {lot.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lot.itemCount} lines · {lot.totalQty} units · manifest{" "}
            {formatMoney(lot.manifestRetail)} · est. market{" "}
            {formatMoney(lot.estimatedMarket)}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <EnrichControls lotId={lot.id} pendingCount={pending} />
          <DeleteLotButton lotId={lot.id} />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <DealPanel lot={lot} />
        <ItemsTable items={items} />
      </div>
    </div>
  );
}

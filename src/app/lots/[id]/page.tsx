import Link from "next/link";
import { notFound } from "next/navigation";
import { DealPanel } from "@/components/DealPanel";
import { EnrichControls } from "@/components/EnrichControls";
import { ItemsTable } from "@/components/ItemsTable";
import { DeleteLotButton } from "@/components/DeleteLotButton";
import { formatMoney } from "@/lib/deal/math";
import { getLot, getLotItems } from "@/lib/lots/service";

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
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Lots
        </Link>
        <span>/</span>
        <span className="text-steel">Lot detail</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Separate pallet · {lot.lotId}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-steel">
            {lot.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
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

import Link from "next/link";
import type { LotWithStats } from "@/lib/lots/service";
import { formatMoney, formatPct } from "@/lib/deal/math";

export function LotCard({ lot }: { lot: LotWithStats }) {
  const coverage =
    lot.itemCount > 0 ? (lot.pricedItemCount / lot.itemCount) * 100 : 0;

  return (
    <Link
      href={`/lots/${lot.id}`}
      className="surface group block rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Separate lot
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-steel line-clamp-2 group-hover:text-accent">
            {lot.title}
          </h3>
          <p className="mt-1 truncate font-mono text-xs text-muted">{lot.lotId}</p>
        </div>
        <div className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          {formatPct(coverage)} priced
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Lines / Qty</dt>
          <dd className="mono-num font-semibold">
            {lot.itemCount} / {lot.totalQty}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Manifest retail</dt>
          <dd className="mono-num font-semibold">
            {formatMoney(lot.manifestRetail)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Est. market value</dt>
          <dd className="mono-num text-base font-bold text-accent">
            {lot.estimatedMarket > 0
              ? formatMoney(lot.estimatedMarket)
              : "Pending enrichment"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

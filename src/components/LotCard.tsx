import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LotWithStats } from "@/lib/lots/service";
import { formatMoney, formatPct } from "@/lib/deal/math";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LotCard({ lot }: { lot: LotWithStats }) {
  const coverage =
    lot.itemCount > 0 ? (lot.pricedItemCount / lot.itemCount) * 100 : 0;

  return (
    <Link href={`/lots/${lot.id}`} className="group block h-full">
      <Card className="h-full transition-all hover:ring-foreground/20 group-hover:shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <Badge variant="secondary">Separate lot</Badge>
            <Badge variant={coverage > 0 ? "default" : "outline"}>
              {formatPct(coverage)} priced
            </Badge>
          </div>
          <div>
            <CardTitle className="line-clamp-2 text-base leading-snug group-hover:text-primary">
              {lot.title}
            </CardTitle>
            <CardDescription className="mt-1 truncate font-mono text-xs">
              {lot.lotId}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Lines / Qty</p>
              <p className="mono-num font-medium">
                {lot.itemCount} / {lot.totalQty}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Manifest retail</p>
              <p className="mono-num font-medium">
                {formatMoney(lot.manifestRetail)}
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/60 px-3 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Est. market value</p>
              <p className="mono-num text-lg font-semibold text-primary">
                {lot.estimatedMarket > 0
                  ? formatMoney(lot.estimatedMarket)
                  : "Pending enrichment"}
              </p>
            </div>
            <ArrowUpRight className="mb-1 size-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

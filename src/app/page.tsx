import { LotCard } from "@/components/LotCard";
import { SeedSamplesButton } from "@/components/SeedSamplesButton";
import { UploadZone } from "@/components/UploadZone";
import { listLots } from "@/lib/lots/service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lots = await listLots();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8 max-w-3xl space-y-3">
        <Badge variant="secondary">Advance Auto · B-Stock</Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Manifest Evaluator
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Import each pallet as its own lot. See products, vehicle fitment, and
          real market comps before you bid. No login — every uploaded lot is
          public.
        </p>
      </section>

      <UploadZone />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your lots</h2>
          <p className="text-sm text-muted-foreground">
            {lots.length} separate lot{lots.length === 1 ? "" : "s"}
          </p>
        </div>
        {lots.length === 0 && <SeedSamplesButton />}
      </div>

      {lots.length === 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No lots yet</CardTitle>
            <CardDescription>
              Upload CSV manifests or load the three sample Advance Auto
              pallets to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeedSamplesButton />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}

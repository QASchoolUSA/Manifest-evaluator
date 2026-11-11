import { LotCard } from "@/components/LotCard";
import { SeedSamplesButton } from "@/components/SeedSamplesButton";
import { UploadZone } from "@/components/UploadZone";
import { listLots } from "@/lib/lots/service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lots = await listLots();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Advance Auto · B-Stock · Public
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-steel sm:text-5xl">
          Manifest Evaluator
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Import each pallet as its own lot. See products, vehicle fitment, and
          real market comps before you bid. No login — uploaded manifests are
          visible to everyone.
        </p>
      </section>

      <UploadZone />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-steel">
          All lots
          <span className="ml-2 text-sm font-normal text-muted">
            ({lots.length} public)
          </span>
        </h2>
        {lots.length === 0 && <SeedSamplesButton />}
      </div>

      {lots.length === 0 ? (
        <div className="surface mt-4 rounded-2xl p-8 text-center">
          <p className="text-muted">
            No lots yet. Upload CSV manifests or load the three sample Advance
            Auto pallets.
          </p>
        </div>
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

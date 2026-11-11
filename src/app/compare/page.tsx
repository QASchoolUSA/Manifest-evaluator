import { CompareClient } from "@/components/CompareClient";
import { listLots } from "@/lib/lots/service";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const lots = await listLots();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-steel">
        Compare lots
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Side-by-side summary only — each pallet’s inventory stays on its own
        detail page. All lots are public.
      </p>
      <div className="mt-6">
        <CompareClient lots={lots} />
      </div>
    </div>
  );
}

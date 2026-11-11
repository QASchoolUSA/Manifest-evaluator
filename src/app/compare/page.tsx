import { CompareClient } from "@/components/CompareClient";
import { listLots } from "@/lib/lots/service";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const lots = await listLots();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Compare lots</h1>
        <p className="text-muted-foreground">
          Side-by-side summary only — each pallet’s inventory stays on its own
          detail page.
        </p>
      </div>
      <CompareClient lots={lots} />
    </div>
  );
}

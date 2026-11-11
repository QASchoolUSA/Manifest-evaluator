"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SeedSamplesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force: false }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Seed failed");
          toast.success(
            data.seeded
              ? `Loaded ${data.lots?.length ?? 0} sample lots`
              : "Lots already exist",
          );
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Seed failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      Load 3 sample Advance Auto lots
    </Button>
  );
}

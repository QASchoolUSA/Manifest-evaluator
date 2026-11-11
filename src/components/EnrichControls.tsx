"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EnrichControls({
  lotId,
  pendingCount,
}: {
  lotId: string;
  pendingCount: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const stopRef = useRef(false);

  const runBatch = useCallback(async () => {
    const res = await fetch(`/api/lots/${lotId}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 15 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Enrichment failed");
    return data as { enriched: number; remaining: number };
  }, [lotId]);

  async function start() {
    stopRef.current = false;
    setRunning(true);
    setStatus("Looking up market prices…");
    try {
      let remaining = pendingCount;
      while (!stopRef.current && remaining > 0) {
        const result = await runBatch();
        remaining = result.remaining;
        setStatus(
          result.remaining > 0
            ? `Enriched ${result.enriched} SKUs · ${result.remaining} remaining`
            : "All SKUs priced",
        );
        router.refresh();
        if (result.enriched === 0) break;
      }
      if (!stopRef.current) toast.success("Pricing pass complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enrichment failed";
      setStatus(message);
      toast.error(message);
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  useEffect(() => {
    return () => {
      stopRef.current = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={running || pendingCount === 0} onClick={start}>
        {running ? <Loader2 className="size-4 animate-spin" /> : null}
        {running
          ? "Enriching…"
          : pendingCount > 0
            ? `Price ${pendingCount} SKUs`
            : "Fully priced"}
      </Button>
      {running && (
        <Button
          variant="outline"
          onClick={() => {
            stopRef.current = true;
          }}
        >
          <StopCircle className="size-4" />
          Stop
        </Button>
      )}
      <a
        href={`/api/lots/${lotId}/export`}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        <Download className="size-4" />
        Export CSV
      </a>
      {status && (
        <span className="text-sm text-muted-foreground">{status}</span>
      )}
    </div>
  );
}

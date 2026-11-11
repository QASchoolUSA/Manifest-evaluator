"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Enrichment failed");
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
      <button
        type="button"
        disabled={running || pendingCount === 0}
        onClick={start}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {running
          ? "Enriching…"
          : pendingCount > 0
            ? `Price ${pendingCount} SKUs`
            : "Fully priced"}
      </button>
      {running && (
        <button
          type="button"
          onClick={() => {
            stopRef.current = true;
          }}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
        >
          Stop
        </button>
      )}
      <a
        href={`/api/lots/${lotId}/export`}
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium hover:border-accent"
      >
        Export enriched CSV
      </a>
      {status && <span className="text-sm text-muted">{status}</span>}
    </div>
  );
}

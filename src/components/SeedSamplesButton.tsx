"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeedSamplesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force: false }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-steel transition hover:border-accent hover:text-accent disabled:opacity-60"
    >
      {busy ? "Loading samples…" : "Load 3 sample Advance Auto lots"}
    </button>
  );
}

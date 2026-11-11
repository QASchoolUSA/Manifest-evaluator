"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteLotButton({ lotId }: { lotId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this lot? This cannot be undone.")) return;
        setBusy(true);
        try {
          await fetch(`/api/lots/${lotId}`, { method: "DELETE" });
          router.push("/");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="text-sm text-muted underline-offset-2 hover:text-bad hover:underline disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete lot"}
    </button>
  );
}

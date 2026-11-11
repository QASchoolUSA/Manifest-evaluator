"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteLotButton({ lotId }: { lotId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      className="text-muted-foreground hover:text-destructive"
      onClick={async () => {
        if (!confirm("Delete this lot? This cannot be undone.")) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/lots/${lotId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          toast.success("Lot deleted");
          router.push("/");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Delete failed");
          setBusy(false);
        }
      }}
    >
      <Trash2 className="size-4" />
      {busy ? "Deleting…" : "Delete lot"}
    </Button>
  );
}

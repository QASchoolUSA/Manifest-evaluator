"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function UploadZone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith(".csv"),
      );
      if (!list.length) {
        toast.error("Drop one or more B-Stock CSV manifests.");
        return;
      }
      setBusy(true);
      try {
        const form = new FormData();
        for (const file of list) form.append("files", file);
        const res = await fetch("/api/lots", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        toast.success(
          data.lots?.length === 1
            ? "Lot imported"
            : `${data.lots.length} lots imported`,
        );
        router.refresh();
        if (data.lots?.length === 1) {
          router.push(`/lots/${data.lots[0].id}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        dragging && "border-primary bg-accent/40",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileUp className="size-4 text-primary" />
          Import B-Stock manifests
        </CardTitle>
        <CardDescription>
          Each CSV becomes its own lot. Upload multiple files at once — they stay
          separate for pricing, fitment, and deal math.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button disabled={busy} className="relative">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importing…
            </>
          ) : (
            "Choose CSV files"
          )}
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
        </Button>
        <p className="text-sm text-muted-foreground">or drag and drop here</p>
      </CardContent>
    </Card>
  );
}

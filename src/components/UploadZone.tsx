"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadZone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith(".csv"),
      );
      if (!list.length) {
        setError("Drop one or more B-Stock CSV manifests.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        for (const file of list) form.append("files", file);
        const res = await fetch("/api/lots", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        router.refresh();
        if (data.lots?.length === 1) {
          router.push(`/lots/${data.lots[0].id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  return (
    <div
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
      className={`surface relative overflow-hidden rounded-2xl p-6 transition-all ${
        dragging ? "border-accent ring-2 ring-accent/30" : ""
      }`}
    >
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-steel">
            Import B-Stock manifests
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Each CSV becomes its own lot. Upload multiple files at once — they
            stay separate for pricing, fitment, and deal math.
          </p>
          {error && <p className="mt-2 text-sm text-bad">{error}</p>}
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60">
          {busy ? "Importing…" : "Choose CSV files"}
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

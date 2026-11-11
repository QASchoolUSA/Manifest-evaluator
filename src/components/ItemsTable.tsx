"use client";

import { useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Item } from "@/lib/db/schema";
import { formatMoney } from "@/lib/deal/math";

type Props = {
  items: Item[];
};

export function ItemsTable({ items }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "extRetail", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [fitmentFilter, setFitmentFilter] = useState("all");

  const categories = useMemo(
    () =>
      [...new Set(items.map((i) => i.sellerCategory).filter(Boolean))].sort(),
    [items],
  );
  const brands = useMemo(
    () => [...new Set(items.map((i) => i.brand).filter(Boolean))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.sellerCategory !== category) return false;
      if (brand !== "all" && item.brand !== brand) return false;
      if (priceFilter === "priced" && item.priceStatus !== "ready") return false;
      if (priceFilter === "pending" && item.priceStatus === "ready") return false;
      if (fitmentFilter === "has" && item.fitmentStatus !== "ready") return false;
      if (fitmentFilter === "vehicle" && item.fitmentStatus === "na") return false;
      if (fitmentFilter === "na" && item.fitmentStatus !== "na") return false;
      return true;
    });
  }, [items, category, brand, priceFilter, fitmentFilter]);

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        accessorKey: "itemNumber",
        header: "Item #",
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs font-medium">
              {row.original.itemNumber}
            </div>
            <div className="text-xs text-muted">{row.original.brand}</div>
          </div>
        ),
        size: 140,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.description}</div>
            <div className="truncate text-xs text-muted">
              {row.original.sellerCategory} · {row.original.condition}
            </div>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: "qty",
        header: "Qty",
        cell: ({ getValue }) => (
          <span className="mono-num">{getValue<number>()}</span>
        ),
        size: 60,
      },
      {
        accessorKey: "unitRetail",
        header: "Unit retail",
        cell: ({ getValue }) => (
          <span className="mono-num">{formatMoney(getValue<number>())}</span>
        ),
        size: 100,
      },
      {
        accessorKey: "extRetail",
        header: "Ext retail",
        cell: ({ getValue }) => (
          <span className="mono-num">{formatMoney(getValue<number>())}</span>
        ),
        size: 100,
      },
      {
        id: "marketUnit",
        accessorFn: (row) => row.marketUnitMedian ?? -1,
        header: "Market unit",
        cell: ({ row }) => {
          const item = row.original;
          if (item.marketUnitMedian == null) {
            return <span className="text-xs text-muted">{item.priceStatus}</span>;
          }
          return (
            <div>
              <div className="mono-num font-semibold text-accent">
                {formatMoney(item.marketUnitMedian)}
              </div>
              <div className="mono-num text-[11px] text-muted">
                {formatMoney(item.marketUnitLow)}–{formatMoney(item.marketUnitHigh)}
              </div>
              <div className="text-[11px] text-muted">{item.marketSource}</div>
            </div>
          );
        },
        size: 120,
      },
      {
        id: "lineMarket",
        accessorFn: (row) =>
          row.marketUnitMedian != null ? row.marketUnitMedian * row.qty : -1,
        header: "Line market",
        cell: ({ row }) => {
          const m = row.original.marketUnitMedian;
          if (m == null) return <span className="text-muted">—</span>;
          return (
            <span className="mono-num font-semibold">
              {formatMoney(m * row.original.qty)}
            </span>
          );
        },
        size: 110,
      },
      {
        id: "fitment",
        accessorFn: (row) => row.fitmentSummary ?? "",
        header: "Vehicles / fitment",
        cell: ({ row }) => (
          <div className="text-xs leading-snug">
            <div>{row.original.fitmentSummary}</div>
            {row.original.fitmentLocation && (
              <div className="mt-0.5 text-muted">{row.original.fitmentLocation}</div>
            )}
          </div>
        ),
        size: 240,
      },
      {
        id: "links",
        header: "Check",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-xs">
            {row.original.ebayUrl && (
              <a
                className="text-accent hover:underline"
                href={row.original.ebayUrl}
                target="_blank"
                rel="noreferrer"
              >
                eBay sold
              </a>
            )}
            {row.original.rockautoUrl && (
              <a
                className="text-accent hover:underline"
                href={row.original.rockautoUrl}
                target="_blank"
                rel="noreferrer"
              >
                RockAuto
              </a>
            )}
            {row.original.amazonUrl && (
              <a
                className="text-accent hover:underline"
                href={row.original.amazonUrl}
                target="_blank"
                rel="noreferrer"
              >
                Amazon
              </a>
            )}
          </div>
        ),
        size: 90,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filter) => {
      const q = String(filter).toLowerCase();
      if (!q) return true;
      const item = row.original;
      return (
        item.itemNumber.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        (item.fitmentSummary ?? "").toLowerCase().includes(q)
      );
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 12,
  });

  return (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-steel">
            Products in this lot
          </h2>
          <p className="text-sm text-muted">
            Showing {rows.length} of {items.length} lines
          </p>
        </div>
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search SKU, brand, car…"
          className="w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm sm:w-64"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Select
          label="Category"
          value={category}
          onChange={setCategory}
          options={[["all", "All categories"], ...categories.map((c) => [c, c])]}
        />
        <Select
          label="Brand"
          value={brand}
          onChange={setBrand}
          options={[["all", "All brands"], ...brands.map((b) => [b, b])]}
        />
        <Select
          label="Price"
          value={priceFilter}
          onChange={setPriceFilter}
          options={[
            ["all", "All price states"],
            ["priced", "Priced"],
            ["pending", "Pending / missing"],
          ]}
        />
        <Select
          label="Fitment"
          value={fitmentFilter}
          onChange={setFitmentFilter}
          options={[
            ["all", "All fitment"],
            ["vehicle", "Vehicle parts"],
            ["has", "Known vehicles"],
            ["na", "Consumables only"],
          ]}
        />
      </div>

      <div
        ref={parentRef}
        className="mt-4 h-[min(70vh,720px)] overflow-auto rounded-xl border border-line bg-white"
      >
        <div className="sticky top-0 z-10 grid grid-cols-[140px_minmax(200px,1.4fr)_60px_100px_100px_120px_110px_minmax(180px,1.2fr)_90px] gap-2 border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted min-w-[1100px]">
          {table.getHeaderGroups().map((hg) =>
            hg.headers.map((header) => (
              <button
                key={header.id}
                type="button"
                className="text-left hover:text-accent"
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{
                  asc: " ↑",
                  desc: " ↓",
                }[header.column.getIsSorted() as string] ?? null}
              </button>
            )),
          )}
        </div>

        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          className="min-w-[1100px]"
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="absolute left-0 top-0 grid w-full grid-cols-[140px_minmax(200px,1.4fr)_60px_100px_100px_120px_110px_minmax(180px,1.2fr)_90px] gap-2 border-b border-line/70 px-3 py-2 text-sm hover:bg-accent-soft/40"
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="overflow-hidden">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | string[])[];
}) {
  return (
    <label className="text-xs text-muted">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-steel"
      >
        {options.map((opt) => {
          const [v, t] = Array.isArray(opt) ? opt : [opt, opt];
          return (
            <option key={v} value={v}>
              {t}
            </option>
          );
        })}
      </select>
    </label>
  );
}

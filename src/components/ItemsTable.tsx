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
import { ExternalLink, Search } from "lucide-react";
import type { Item } from "@/lib/db/schema";
import { formatMoney } from "@/lib/deal/math";
import {
  advanceSearchUrl,
  amazonSearchUrl,
  ebaySearchUrl,
  rockautoSearchUrl,
} from "@/lib/pricing/urls";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = { items: Item[] };

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
            <div className="text-xs text-muted-foreground">{row.original.brand}</div>
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
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline">{row.original.sellerCategory}</Badge>
              <Badge variant="secondary">{row.original.condition}</Badge>
            </div>
          </div>
        ),
        size: 280,
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
            return (
              <Badge variant="outline" className="capitalize">
                {item.priceStatus}
              </Badge>
            );
          }
          return (
            <div>
              <div className="mono-num font-semibold text-primary">
                {formatMoney(item.marketUnitMedian)}
              </div>
              <div className="mono-num text-[11px] text-muted-foreground">
                {formatMoney(item.marketUnitLow)}–{formatMoney(item.marketUnitHigh)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {item.marketSource}
              </div>
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
          if (m == null) return <span className="text-muted-foreground">—</span>;
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
              <div className="mt-0.5 text-muted-foreground">
                {row.original.fitmentLocation}
              </div>
            )}
          </div>
        ),
        size: 240,
      },
      {
        id: "links",
        header: "Check",
        cell: ({ row }) => {
          const item = row.original;
          // Prefer a resolved Advance product page; otherwise their live search.
          const advanceHref =
            item.advanceUrl && item.advanceUrl.includes("/p/")
              ? item.advanceUrl
              : advanceSearchUrl(item.partNumber);
          const ebayHref = ebaySearchUrl(
            item.brand,
            item.partNumber,
            item.description,
          );
          const rockHref = rockautoSearchUrl(item.brand, item.partNumber);
          const amazonHref = amazonSearchUrl(
            item.brand,
            item.partNumber,
            item.description,
          );
          return (
            <div className="flex flex-col gap-1 text-xs">
              <a
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                href={advanceHref}
                target="_blank"
                rel="noreferrer"
              >
                Advance <ExternalLink className="size-3" />
              </a>
              <a
                className="inline-flex items-center gap-1 text-primary hover:underline"
                href={ebayHref}
                target="_blank"
                rel="noreferrer"
              >
                eBay <ExternalLink className="size-3" />
              </a>
              <a
                className="inline-flex items-center gap-1 text-primary hover:underline"
                href={rockHref}
                target="_blank"
                rel="noreferrer"
              >
                RockAuto <ExternalLink className="size-3" />
              </a>
              <a
                className="inline-flex items-center gap-1 text-primary hover:underline"
                href={amazonHref}
                target="_blank"
                rel="noreferrer"
              >
                Amazon <ExternalLink className="size-3" />
              </a>
            </div>
          );
        },
        size: 110,
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
    estimateSize: () => 84,
    overscan: 12,
  });

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Products in this lot</CardTitle>
            <CardDescription>
              Showing {rows.length} of {items.length} lines
            </CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search SKU, brand, car…"
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={category}
            onChange={setCategory}
            options={[["all", "All categories"], ...categories.map((c) => [c, c])]}
          />
          <FilterSelect
            value={brand}
            onChange={setBrand}
            options={[["all", "All brands"], ...brands.map((b) => [b, b])]}
          />
          <FilterSelect
            value={priceFilter}
            onChange={setPriceFilter}
            options={[
              ["all", "All price states"],
              ["priced", "Priced"],
              ["pending", "Pending / missing"],
            ]}
          />
          <FilterSelect
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
      </CardHeader>
      <CardContent>
        <div
          ref={parentRef}
          className="h-[min(70vh,720px)] overflow-auto rounded-xl border bg-card"
        >
          <div className="sticky top-0 z-10 grid min-w-[1100px] grid-cols-[140px_minmax(200px,1.5fr)_60px_100px_100px_120px_110px_minmax(180px,1.2fr)_100px] gap-2 border-b bg-muted/80 px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">
            {table.getHeaderGroups().map((hg) =>
              hg.headers.map((header) => (
                <button
                  key={header.id}
                  type="button"
                  className="text-left hover:text-foreground"
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
                  className="absolute top-0 left-0 grid w-full grid-cols-[140px_minmax(200px,1.5fr)_60px_100px_100px_120px_110px_minmax(180px,1.2fr)_100px] gap-2 border-b px-3 py-2 text-sm hover:bg-muted/40"
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
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | string[])[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
  );
}

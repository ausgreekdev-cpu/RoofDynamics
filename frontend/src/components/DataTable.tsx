"use client";

import React, { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchFields?: string[];
  pageSize?: number;
  emptyMessage?: string;
  rowKey?: (row: T) => string;
  /** When true and data is large, render a virtualized scrollable table. */
  virtualize?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchFields = [],
  pageSize = 10,
  emptyMessage = "No data available",
  rowKey = (row) => String(row.id),
  virtualize = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchFields.some((field) => {
        const val = row[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    const getVal = (row: T) => {
      if (col?.sortValue) return col.sortValue(row);
      return row[sortKey];
    };
    return [...filtered].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va ?? "").localeCompare(String(vb ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const useVirtual = virtualize && sorted.length > pageSize;

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: useVirtual ? sorted.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
    enabled: useVirtual,
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const renderRow = (row: T) => (
    <tr key={rowKey(row)} className="border-b border-[#1E293B]/30 hover:bg-[#1E293B]/50 transition">
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3 text-sm text-[#F8FAFC]">
          {col.render ? col.render(row) : row[col.key] != null ? String(row[col.key]) : "—"}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-3">
      {/* Search bar */}
      {searchFields.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            aria-label="Search table"
            className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC]"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
        {useVirtual ? (
          <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 480 }}>
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50 sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-xs font-bold text-[#94A3B8] whitespace-nowrap">
                      {col.sortable !== false ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-[#F8FAFC] transition"
                        >
                          {col.header}
                          {sortKey === col.key ? (
                            sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((vRow) => {
                  const row = sorted[vRow.index];
                  return (
                    <tr
                      key={rowKey(row)}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vRow.start}px)` }}
                      className="border-b border-[#1E293B]/30 hover:bg-[#1E293B]/50 transition"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-[#F8FAFC]">
                          {col.render ? col.render(row) : row[col.key] != null ? String(row[col.key]) : "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-xs font-bold text-[#94A3B8] whitespace-nowrap">
                      {col.sortable !== false ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-[#F8FAFC] transition"
                        >
                          {col.header}
                          {sortKey === col.key ? (
                            sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row) => renderRow(row))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-[#64748B]">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination (non-virtual only) */}
      {!useVirtual && sorted.length > pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#94A3B8]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

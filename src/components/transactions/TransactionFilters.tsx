"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Category, TransactionWithCategory } from "@/types/database";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { AmountRangeSlider } from "./AmountRangeSlider";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { TransactionList } from "@/components/TransactionList";
import { filterByRange } from "@/lib/compute";
import { toISODate } from "@/lib/format";

function defaultDateRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function parseDate(s: string | null, fallback: Date): Date {
  if (!s) return fallback;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? fallback : d;
}

interface TransactionFiltersProps {
  categories: Category[];
  allTransactions: TransactionWithCategory[];
}

export function TransactionFilters({ categories, allTransactions }: TransactionFiltersProps) {
  const searchParams = useSearchParams();

  const dflt = defaultDateRange();
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseDate(searchParams.get("from"), dflt.from),
    to: parseDate(searchParams.get("to"), dflt.to),
  }));
  const [sort, setSort] = useState<"asc" | "desc">(() =>
    searchParams.get("sort") === "asc" ? "asc" : "desc"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    searchParams.get("categories")?.split(",").filter(Boolean) ?? []
  );
  // null means "full range" (no amount filtering); set by user interaction
  const [amountRange, setAmountRange] = useState<[number, number] | null>(null);

  const startISO = toISODate(dateRange.from);
  const endISO = toISODate(dateRange.to);
  const rangeFiltered = filterByRange(allTransactions, startISO, endISO);
  const amountMax = rangeFiltered.length ? Math.max(...rangeFiltered.map((t) => t.amount)) : 0;
  const effectiveAmountRange = amountRange ?? [0, amountMax];

  // Sync URL without triggering a Next.js navigation (no RSC round-trip)
  function updateURL(updates: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function handleDateChange(range: DateRange) {
    setDateRange(range);
    setAmountRange(null); // reset amount filter on date change
    updateURL({ from: toISODate(range.from), to: toISODate(range.to) });
  }

  function handleCategoriesChange(ids: string[]) {
    setSelectedCategories(ids);
    updateURL({ categories: ids.join(",") });
  }

  function toggleSort() {
    const newSort = sort === "desc" ? "asc" : "desc";
    setSort(newSort);
    updateURL({ sort: newSort });
  }

  const filtered = rangeFiltered.filter((t) => {
    const inAmount =
      amountRange === null ||
      (t.amount >= effectiveAmountRange[0] && t.amount <= effectiveAmountRange[1]);
    const inCategory =
      selectedCategories.length === 0 ||
      (t.category_id !== null && selectedCategories.includes(t.category_id));
    return inAmount && inCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return sort === "asc" ? dateCmp : -dateCmp;
    return sort === "asc"
      ? a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker value={dateRange} onChange={handleDateChange} />
        <CategoryMultiSelect
          categories={categories}
          selected={selectedCategories}
          onChange={handleCategoriesChange}
        />
        {amountMax > 0 && (
          <AmountRangeSlider
            min={0}
            max={amountMax}
            value={effectiveAmountRange}
            onChange={setAmountRange}
          />
        )}
        <button
          type="button"
          onClick={toggleSort}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <ArrowUpDown className="h-4 w-4 text-zinc-400" />
          {sort === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <TransactionList transactions={sorted} categories={categories} />
    </div>
  );
}

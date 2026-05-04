"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Category, TransactionWithCategory } from "@/types/database";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { AmountRangeSlider } from "./AmountRangeSlider";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { TransactionList } from "@/components/TransactionList";
import { toISODate } from "@/lib/format";

interface TransactionFiltersProps {
  categories: Category[];
  allTransactions: TransactionWithCategory[];
  initialFrom: Date;
  initialTo: Date;
  amountMax: number;
}

export function TransactionFilters({
  categories,
  allTransactions,
  initialFrom,
  initialTo,
  amountMax,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL — useSearchParams updates optimistically on router.replace(),
  // so the UI responds immediately without waiting for the server RSC round-trip.
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

  const [amountRange, setAmountRange] = useState<[number, number]>([0, amountMax]);

  useEffect(() => {
    setAmountRange([0, amountMax]);
  }, [amountMax]);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleDateChange(range: DateRange) {
    updateParams({ from: toISODate(range.from), to: toISODate(range.to) });
  }

  function handleCategoriesChange(ids: string[]) {
    updateParams({ categories: ids.join(",") });
  }

  function toggleSort() {
    updateParams({ sort: sort === "desc" ? "asc" : "desc" });
  }

  const filtered = allTransactions.filter((t) => {
    const inAmount = t.amount >= amountRange[0] && t.amount <= amountRange[1];
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
        <DateRangePicker
          value={{ from: initialFrom, to: initialTo }}
          onChange={handleDateChange}
        />
        <CategoryMultiSelect
          categories={categories}
          selected={selectedCategories}
          onChange={handleCategoriesChange}
        />
        {amountMax > 0 && (
          <AmountRangeSlider
            min={0}
            max={amountMax}
            value={amountRange}
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

"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Category, TransactionWithCategory } from "@/types/database";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { AmountRangeSlider } from "./AmountRangeSlider";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { TransactionList } from "@/components/TransactionList";

interface TransactionFiltersProps {
  categories: Category[];
  allTransactions: TransactionWithCategory[];
  initialFrom: Date;
  initialTo: Date;
  initialSelectedCategories: string[];
  initialSort: "asc" | "desc";
  amountMin: number;
  amountMax: number;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TransactionFilters({
  categories,
  allTransactions,
  initialFrom,
  initialTo,
  initialSelectedCategories,
  initialSort,
  amountMin,
  amountMax,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [amountRange, setAmountRange] = useState<[number, number]>([amountMin, amountMax]);
  const sort = initialSort;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  function handleDateChange(range: DateRange) {
    updateParams({ from: toISODate(range.from), to: toISODate(range.to) });
  }

  function handleCategoriesChange(ids: string[]) {
    updateParams({ categories: ids.join(",") });
  }

  function toggleSort() {
    updateParams({ sort: sort === "desc" ? "asc" : "desc" });
  }

  // Client-side amount filter applied to the already-server-filtered list
  const filtered = allTransactions.filter(
    (t) => t.amount >= amountRange[0] && t.amount <= amountRange[1]
  );

  const sorted =
    sort === "asc" ? [...filtered].reverse() : filtered;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker
          value={{ from: initialFrom, to: initialTo }}
          onChange={handleDateChange}
        />
        <CategoryMultiSelect
          categories={categories}
          selected={initialSelectedCategories}
          onChange={handleCategoriesChange}
        />
        {amountMax > amountMin && (
          <AmountRangeSlider
            min={amountMin}
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

"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateRangePicker, DateRange } from "./DateRangePicker";

interface DateRangeNavProps {
  from: Date;
  to: Date;
}

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateRangeNav({ from, to }: DateRangeNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(newFrom: Date, newTo: Date) {
    const params = new URLSearchParams();
    params.set("from", toISODate(newFrom));
    params.set("to", toISODate(newTo));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handlePickerChange(range: DateRange) {
    navigate(range.from, range.to);
  }

  const rangeDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  function shiftBack() {
    const newTo = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
    const newFrom = new Date(newTo.getFullYear(), newTo.getMonth(), newTo.getDate() - rangeDays);
    navigate(newFrom, newTo);
  }

  function shiftForward() {
    const newFrom = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    const newTo = new Date(newFrom.getFullYear(), newFrom.getMonth(), newFrom.getDate() + rangeDays);
    navigate(newFrom, newTo);
  }

  const forwardStart = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const canGoForward = forwardStart < today();

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={shiftBack}
        aria-label="Go to previous period"
        className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <DateRangePicker value={{ from, to }} onChange={handlePickerChange} />

      {canGoForward ? (
        <button
          type="button"
          onClick={shiftForward}
          aria-label="Go to next period"
          className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
}

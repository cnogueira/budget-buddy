"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseMonthParam, formatMonthParam } from "@/lib/month";

interface MonthNavProps {
  currentMonth: string;
}

export function MonthNav({ currentMonth }: MonthNavProps) {
  const current = parseMonthParam(currentMonth);
  const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);

  const linkClass =
    "rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

  return (
    <div className="flex items-center gap-1">
      <Link href={`/?month=${formatMonthParam(prev)}`} aria-label="Previous month" className={linkClass}>
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Link href={`/?month=${formatMonthParam(next)}`} aria-label="Next month" className={linkClass}>
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

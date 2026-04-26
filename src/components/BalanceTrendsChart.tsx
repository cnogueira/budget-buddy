"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { MonthlyTrendItem } from "@/types/database";

interface BalanceTrendsChartProps {
  trends: MonthlyTrendItem[];
  selectedMonth: string;
}

export function BalanceTrendsChart({ trends, selectedMonth }: BalanceTrendsChartProps) {
  const trendScale = Math.max(...trends.map((t) => Math.abs(t.net)), 1);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-6">
      {trends.map((trend) => {
        const isSelected = trend.monthKey === selectedMonth;
        const height = Math.round((Math.abs(trend.net) / trendScale) * 64);
        return (
          <Link
            key={trend.monthKey}
            href={`/?month=${trend.monthKey}`}
            aria-label={`View ${trend.month}`}
            className="flex cursor-pointer flex-col items-center gap-2"
          >
            {trend.net === 0 ? (
              <div className="flex h-20 items-end">
                <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />
              </div>
            ) : (
              <div className="flex h-20 items-end">
                <div
                  className={
                    trend.net >= 0
                      ? `w-6 rounded-md bg-green-500 ${isSelected ? "opacity-100" : "opacity-50"}`
                      : `w-6 rounded-md bg-red-500 ${isSelected ? "opacity-100" : "opacity-50"}`
                  }
                  style={{ height }}
                />
              </div>
            )}
            <span
              className={`text-xs ${
                isSelected
                  ? "font-bold text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {trend.month}
            </span>
            {trend.net === 0 ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">—</span>
            ) : (
              <span
                className={`text-xs ${
                  trend.net >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(trend.net)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { useData } from "@/providers/DataProvider";
import { computeOverviewData } from "@/lib/compute";
import { PeriodBalanceChart } from "@/components/overview/PeriodBalanceChart";
import { ChangesChart } from "@/components/overview/ChangesChart";
import { PeriodCategoryWidget } from "@/components/overview/PeriodCategoryWidget";

interface OverviewClientContentProps {
  from: string;
  to: string;
}

export function OverviewClientContent({ from, to }: OverviewClientContentProps) {
  const { transactions, status } = useData();
  const data = computeOverviewData(transactions, from, to);

  if (status === "loading") {
    return <OverviewSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PeriodBalanceChart transactions={data.transactions} from={from} to={to} />
      <ChangesChart transactions={data.transactions} from={from} to={to} />
      <PeriodCategoryWidget type="income" categoryBreakdown={data.categoryBreakdown} from={from} to={to} />
      <PeriodCategoryWidget type="expense" categoryBreakdown={data.categoryBreakdown} from={from} to={to} />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex justify-between">
            <div>
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1 h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="h-7 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-48 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

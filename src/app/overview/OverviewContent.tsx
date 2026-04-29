import { getOverviewData } from "@/app/actions/overview-actions";
import { PeriodBalanceChart } from "@/components/overview/PeriodBalanceChart";
import { ChangesChart } from "@/components/overview/ChangesChart";
import { PeriodCategoryWidget } from "@/components/overview/PeriodCategoryWidget";

interface OverviewContentProps {
  start: string;
  end: string;
}

export async function OverviewContent({ start, end }: OverviewContentProps) {
  const result = await getOverviewData(start, end);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Failed to load overview data.
      </div>
    );
  }

  const { transactions, categoryBreakdown } = result.data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PeriodBalanceChart transactions={transactions} from={start} to={end} />
      <ChangesChart transactions={transactions} from={start} to={end} />
      <PeriodCategoryWidget type="income" categoryBreakdown={categoryBreakdown} from={start} to={end} />
      <PeriodCategoryWidget type="expense" categoryBreakdown={categoryBreakdown} from={start} to={end} />
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

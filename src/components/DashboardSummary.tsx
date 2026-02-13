import { getDashboardSummary } from "@/app/actions/transaction-actions";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import type { ReactNode } from "react";

export async function DashboardSummary() {
  const result = await getDashboardSummary();

  if (!result.success || !result.data) {
    return (
      <section className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p>Failed to load dashboard summary: {result.error}</p>
      </section>
    );
  }

  const {
    monthIncomeTotal,
    monthExpenseTotal,
    monthNet,
    categoryBreakdown,
    recentTransactions,
    monthlyTrends,
  } = result.data;

  const incomeCategories = categoryBreakdown.filter((item) => item.type === "income");
  const expenseCategories = categoryBreakdown.filter((item) => item.type === "expense");
  const trendScale = Math.max(
    ...monthlyTrends.map((trend) => Math.abs(trend.net)),
    1
  );

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard Summary
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Income (This Month)"
          value={formatCurrency(monthIncomeTotal)}
          accent="text-green-600 dark:text-green-400"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
        <SummaryCard
          label="Expenses (This Month)"
          value={formatCurrency(monthExpenseTotal)}
          accent="text-red-600 dark:text-red-400"
          icon={<ArrowDownRight className="h-5 w-5" />}
        />
        <SummaryCard
          label="Net Balance"
          value={formatCurrency(monthNet)}
          accent={
            monthNet >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Category Breakdown
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CategoryBreakdownList title="Income" items={incomeCategories} />
            <CategoryBreakdownList title="Expenses" items={expenseCategories} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Transactions
          </h3>
          <ul className="mt-4 space-y-3">
            {recentTransactions.length === 0 ? (
              <li className="text-sm text-zinc-500 dark:text-zinc-400">
                No recent activity yet.
              </li>
            ) : (
              recentTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="text-zinc-900 dark:text-zinc-50">
                      {transaction.categories?.name || "Uncategorized"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <span
                    className={
                      transaction.type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Balance Trends (Last 6 Months)
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Net income vs expenses
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          {monthlyTrends.map((trend) => {
            const height = Math.max(
              Math.round((Math.abs(trend.net) / trendScale) * 64),
              6
            );
            return (
              <div key={trend.month} className="flex flex-col items-center gap-2">
                <div className="flex h-20 items-end">
                  <div
                    className={
                      trend.net >= 0
                        ? "w-6 rounded-md bg-green-500/70"
                        : "w-6 rounded-md bg-red-500/70"
                    }
                    style={{ height }}
                  />
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {trend.month}
                </span>
                <span
                  className={
                    trend.net >= 0
                      ? "text-xs text-green-600 dark:text-green-400"
                      : "text-xs text-red-600 dark:text-red-400"
                  }
                >
                  {formatCurrency(trend.net)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  readonly label: string;
  readonly value: string;
  readonly accent: string;
  readonly icon: ReactNode;
}

function SummaryCard({ label, value, accent, icon }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

interface CategoryBreakdownListProps {
  readonly title: string;
  readonly items: Array<{
    name: string;
    color: string | null;
    total: number;
  }>;
}

function CategoryBreakdownList({ title, items }: CategoryBreakdownListProps) {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No data yet.</p>
        ) : (
          items.map((item) => {
            const percent = total > 0 ? (item.total / total) * 100 : 0;
            const percentLabel = `${percent.toFixed(1)}%`;
            return (
              <div key={`${title}-${item.name}`} className="group space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {item.name}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full"
                    title={percentLabel}
                    style={{
                      width: `${Math.max(Math.round(percent), 2)}%`,
                      backgroundColor: item.color || "#9ca3af",
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-400">
                  {percentLabel} of total {title.toLowerCase()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

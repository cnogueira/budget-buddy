import { getDashboardSummary } from "@/app/actions/transaction-actions";
import { BalanceTrendsChart } from "@/components/BalanceTrendsChart";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardSummaryProps {
  month: string;
}

export async function DashboardSummary({ month }: DashboardSummaryProps) {
  const result = await getDashboardSummary(month);

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
    monthlyTrends,
  } = result.data;

  const incomeCategories = categoryBreakdown.filter((item) => item.type === "income");
  const expenseCategories = categoryBreakdown.filter((item) => item.type === "expense");

  return (
    <section className="mb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Income"
          value={formatCurrency(monthIncomeTotal)}
          accent="text-green-600 dark:text-green-400"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(monthExpenseTotal)}
          accent="text-red-600 dark:text-red-400"
          icon={<ArrowDownRight className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saved This Month"
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
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Monthly Insights</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Savings rate</p>
              <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                {monthIncomeTotal > 0 ? `${Math.round((monthNet / monthIncomeTotal) * 100)}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Top expense</p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {expenseCategories[0]?.name ?? "—"}
              </p>
              {expenseCategories[0] && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formatCurrency(expenseCategories[0].total)}
                </p>
              )}
            </div>
          </div>
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
        <BalanceTrendsChart trends={monthlyTrends} selectedMonth={month} />
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

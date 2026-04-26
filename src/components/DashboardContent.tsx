import { getTransactions } from "@/app/actions/transaction-actions";
import { getCategories } from "@/app/actions/category-actions";
import { AddTransactionButton } from "@/components/AddTransactionButton";
import { ImportTransactionsButton } from "@/components/ImportTransactionsButton";
import { DashboardSummary } from "@/components/DashboardSummary";
import { TransactionList } from "@/components/TransactionList";

export async function DashboardContent({ month }: { month: string }) {
  const [transactionResult, categoryResult] = await Promise.all([
    getTransactions(month),
    getCategories(),
  ]);

  const transactions = transactionResult.success ? transactionResult.data || [] : [];
  const categories = categoryResult.success ? categoryResult.data || [] : [];

  return (
    <>
      <DashboardSummary month={month} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Transactions</h2>
          <div className="flex gap-2">
            <ImportTransactionsButton />
            <AddTransactionButton />
          </div>
        </div>

        {transactionResult.success ? (
          <TransactionList transactions={transactions} categories={categories} />
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p>Failed to load transactions: {transactionResult.error}</p>
          </div>
        )}
      </section>
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-5 w-5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-2 h-8 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
            <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[0, 1].map((col) => (
                <div key={col} className="space-y-3">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      <div className="h-2 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 space-y-4">
              <div>
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-1 h-7 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div>
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-1 h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-1 h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-6">
            {[32, 48, 24, 56, 40, 36].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex h-20 items-end">
                  <div className="w-6 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" style={{ height: h }} />
                </div>
                <div className="h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-7 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-36 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="grid grid-cols-4 gap-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              ))}
            </div>
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
              <div className="grid grid-cols-4 gap-8">
                <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

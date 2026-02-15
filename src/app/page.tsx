import { getTransactions } from "@/app/actions/transaction-actions";
import { getCategories } from "@/app/actions/category-actions";
import { AddTransactionButton } from "@/components/AddTransactionButton";
import { ImportTransactionsButton } from "@/components/ImportTransactionsButton";
import { DashboardSummary } from "@/components/DashboardSummary";
import { TransactionList } from "@/components/TransactionList";

export default async function Home() {
  const [transactionResult, categoryResult] = await Promise.all([
    getTransactions(),
    getCategories(),
  ]);

  const transactions = transactionResult.success ? transactionResult.data || [] : [];
  const categories = categoryResult.success ? categoryResult.data || [] : [];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Budget Buddy
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Track your income and expenses
          </p>
        </header>

        <DashboardSummary />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Recent Transactions
            </h2>
            <div className="flex gap-2">
              <ImportTransactionsButton />
              <AddTransactionButton />
            </div>
          </div>

          {transactionResult.success ? (
            <TransactionList
              transactions={transactions}
              categories={categories}
            />
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <p>Failed to load transactions: {transactionResult.error}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

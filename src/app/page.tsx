import { getTransactions } from "@/app/actions/transaction-actions";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { DashboardSummary } from "@/components/DashboardSummary";
import { TransactionList } from "@/components/TransactionList";

export default async function Home() {
  const result = await getTransactions();

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

        <section className="mb-8">
          <AddTransactionForm />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Transactions
          </h2>
          {result.success && result.data ? (
            <TransactionList transactions={result.data} />
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <p>Failed to load transactions: {result.error}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

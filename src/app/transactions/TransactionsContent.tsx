import { getTransactionsByRange } from "@/app/actions/transaction-actions";
import { getCategories } from "@/app/actions/category-actions";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";

interface TransactionsContentProps {
  start: string;
  end: string;
  categoryIds: string[];
  sort: "asc" | "desc";
  fromDate: Date;
  toDate: Date;
}

export async function TransactionsContent({
  start,
  end,
  categoryIds,
  sort,
  fromDate,
  toDate,
}: TransactionsContentProps) {
  const [txResult, catResult] = await Promise.all([
    getTransactionsByRange(start, end, { categoryIds: categoryIds.length ? categoryIds : undefined, sort }),
    getCategories(),
  ]);

  const transactions = txResult.data ?? [];
  const categories = catResult.data ?? [];

  const amounts = transactions.map((t) => t.amount);
  const amountMin = amounts.length ? Math.min(...amounts) : 0;
  const amountMax = amounts.length ? Math.max(...amounts) : 0;

  return (
    <TransactionFilters
      categories={categories}
      allTransactions={transactions}
      initialFrom={fromDate}
      initialTo={toDate}
      initialSelectedCategories={categoryIds}
      initialSort={sort}
      amountMin={amountMin}
      amountMax={amountMax}
    />
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-40 flex-1 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

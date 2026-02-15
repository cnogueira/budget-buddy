import { TransactionWithCategory, Category } from "@/types/database";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { CategoryPicker } from "./CategoryPicker";

interface TransactionListProps {
  readonly transactions: TransactionWithCategory[];
  readonly categories: Category[];
}

export function TransactionList({ transactions, categories }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          No transactions found. Start by adding your first transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Category
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Description
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-3 text-sm">
                <CategoryPicker
                  transactionId={transaction.id}
                  currentCategoryId={transaction.categories?.id || null}
                  currentCategoryName={transaction.categories?.name || "Uncategorized"}
                  currentCategoryColor={transaction.categories?.color || "#9ca3af"}
                  categories={categories.filter(c => c.category_type === transaction.type)}
                />
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {transaction.description || "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${transaction.type === "income"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpCircle className="h-4 w-4" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4" />
                  )}
                  {transaction.type === "income" ? "+" : "-"}$
                  {transaction.amount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <DeleteTransactionButton id={transaction.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

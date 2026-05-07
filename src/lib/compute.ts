import { Category, OverviewCategoryItem, OverviewData, OverviewTransaction, TransactionWithCategory } from "@/types/database";

export function filterByRange(
  transactions: TransactionWithCategory[],
  from: string,
  to: string
): TransactionWithCategory[] {
  return transactions.filter((t) => t.date >= from && t.date <= to);
}

export function computeOverviewData(
  transactions: TransactionWithCategory[],
  from: string,
  to: string
): OverviewData {
  const inRange = filterByRange(transactions, from, to);

  const overviewTransactions: OverviewTransaction[] = inRange.map((t) => ({
    date: t.date,
    amount: t.amount,
    type: t.type,
  }));

  const breakdownMap = new Map<string, OverviewCategoryItem>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of inRange) {
    const id = t.category_id ?? "uncategorized";
    const cat = t.categories;
    const name = cat?.name ?? "Uncategorized";
    const color = cat?.color ?? null;
    const icon = cat?.icon ?? "circle";

    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;

    const existing = breakdownMap.get(id);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      breakdownMap.set(id, {
        categoryId: t.category_id,
        name,
        color,
        icon,
        total: t.amount,
        count: 1,
        type: t.type,
      });
    }
  }

  const categoryBreakdown = Array.from(breakdownMap.values()).sort(
    (a, b) => b.total - a.total
  );

  return { transactions: overviewTransactions, categoryBreakdown, totalIncome, totalExpense };
}

export function computeFingerprint(
  transactions: TransactionWithCategory[],
  categories: Category[]
): string {
  const txMax = transactions.reduce(
    (max, t) => (t.updated_at > max ? t.updated_at : max),
    ""
  );
  const catMax = categories.reduce(
    (max, c) => (c.updated_at > max ? c.updated_at : max),
    ""
  );
  return `tx:${transactions.length}:${txMax}|cat:${categories.length}:${catMax}`;
}

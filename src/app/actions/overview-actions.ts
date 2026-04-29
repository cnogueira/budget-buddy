"use server";

import { createClient } from "@/lib/supabase/server";
import { Category, OverviewCategoryItem, OverviewData, OverviewTransaction, TransactionType } from "@/types/database";

type RawRow = {
  date: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  categories: Pick<Category, 'name' | 'color' | 'icon'> | Pick<Category, 'name' | 'color' | 'icon'>[] | null;
};

interface GetOverviewDataResult {
  success: boolean;
  data?: OverviewData;
  error?: string;
}

export async function getOverviewData(
  start: string,
  end: string
): Promise<GetOverviewDataResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("date, amount, type, category_id, categories(name, color, icon)")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const rows = (data || []) as RawRow[];

    const transactions: OverviewTransaction[] = rows.map((r) => ({
      date: r.date,
      amount: r.amount,
      type: r.type,
    }));

    const breakdownMap = new Map<string, OverviewCategoryItem>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of rows) {
      const id = row.category_id ?? "uncategorized";
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      const name = cat?.name ?? "Uncategorized";
      const color = cat?.color ?? null;
      const icon = cat?.icon ?? "circle";

      if (row.type === "income") totalIncome += row.amount;
      else totalExpense += row.amount;

      const existing = breakdownMap.get(id);
      if (existing) {
        existing.total += row.amount;
        existing.count += 1;
      } else {
        breakdownMap.set(id, {
          categoryId: row.category_id,
          name,
          color,
          icon,
          total: row.amount,
          count: 1,
          type: row.type,
        });
      }
    }

    const categoryBreakdown = Array.from(breakdownMap.values()).sort(
      (a, b) => b.total - a.total
    );

    return {
      success: true,
      data: { transactions, categoryBreakdown, totalIncome, totalExpense },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

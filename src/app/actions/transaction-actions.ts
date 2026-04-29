"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Category, MonthlyTrendItem, TransactionInsert, TransactionType, TransactionWithCategory } from "@/types/database";
import { parseMonthParam, formatMonthParam } from "@/lib/month";

type RawTransactionRow = Omit<TransactionWithCategory, 'categories'> & {
  categories: Category | Category[] | null;
};

type MonthTransaction = {
  amount: number;
  type: TransactionType;
  category_id: string | null;
  categories: Pick<Category, 'name' | 'color' | 'icon'> | Pick<Category, 'name' | 'color' | 'icon'>[] | null;
};

interface GetTransactionsResult {
  success: boolean;
  data?: TransactionWithCategory[];
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface DashboardSummaryData {
  monthIncomeTotal: number;
  monthExpenseTotal: number;
  monthNet: number;
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: TransactionWithCategory[];
  monthlyTrends: MonthlyTrendItem[];
}

interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  color: string | null;
  icon: string;
  total: number;
  type: TransactionType;
}

interface GetDashboardSummaryResult {
  success: boolean;
  data?: DashboardSummaryData;
  error?: string;
}

export async function getTransactions(month?: string): Promise<GetTransactionsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    let query = supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (month) {
      const anchor = parseMonthParam(month);
      const prefix = formatMonthParam(anchor);
      const endDate = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      const start = `${prefix}-01`;
      const end = `${prefix}-${String(endDate.getDate()).padStart(2, "0")}`;
      query = query.gte("date", start).lte("date", end).limit(200);
    } else {
      query = query.limit(20);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const normalizedData = (data || []).map((t: RawTransactionRow) => ({
      ...t,
      categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
    }));

    return { success: true, data: normalizedData as TransactionWithCategory[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function addTransaction(
  transaction: TransactionInsert
): Promise<ActionResult> {
  try {
    // Validation
    if (!transaction.amount || transaction.amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    if (!transaction.type || !["income", "expense"].includes(transaction.type)) {
      return { success: false, error: "Invalid transaction type" };
    }

    if (!transaction.category_id || transaction.category_id.trim() === "") {
      return { success: false, error: "Category is required" };
    }

    if (!transaction.date) {
      return { success: false, error: "Date is required" };
    }

    // Insert transaction
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase.from("transactions").insert({
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.category_id,
      description: transaction.description?.trim() || null,
      date: transaction.date,
      user_id: user.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the home page to show the new transaction
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    if (!id || id.trim() === "") {
      return { success: false, error: "Transaction ID is required" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the home page to refresh the list
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getDashboardSummary(month?: string): Promise<GetDashboardSummaryResult> {
  try {
    const anchor = parseMonthParam(month);
    const startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const endOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfTrendRange = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const endOfTrendRange = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfMonthString = formatDateToYYYYMMDD(startOfMonth);
    const endOfMonthString = formatDateToYYYYMMDD(endOfMonth);
    const startOfTrendRangeString = formatDateToYYYYMMDD(startOfTrendRange);
    const endOfTrendRangeString = formatDateToYYYYMMDD(endOfTrendRange);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: monthTransactions, error: monthError } = await supabase
      .from("transactions")
      .select("amount, type, category_id, categories(name, color, icon)")
      .eq("user_id", user.id)
      .gte("date", startOfMonthString)
      .lte("date", endOfMonthString);

    if (monthError) {
      return { success: false, error: monthError.message };
    }

    const { data: trendTransactions, error: trendError } = await supabase
      .from("transactions")
      .select("amount, type, date")
      .eq("user_id", user.id)
      .gte("date", startOfTrendRangeString)
      .lte("date", endOfTrendRangeString);

    if (trendError) {
      return { success: false, error: trendError.message };
    }

    const { data: recentTransactions, error: recentError } = await supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("user_id", user.id)
      .gte("date", startOfMonthString)
      .lte("date", endOfMonthString)
      .order("date", { ascending: false })
      .limit(5);

    if (recentError) {
      return { success: false, error: recentError.message };
    }

    const totals = calculateMonthTotals(monthTransactions || []);
    const categoryBreakdown = buildCategoryBreakdown(monthTransactions || []);
    const monthlyTrends = buildMonthlyTrends(trendTransactions || [], today);

    const normalizedRecentTransactions = (recentTransactions || []).map((t: RawTransactionRow) => ({
      ...t,
      categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
    }));

    return {
      success: true,
      data: {
        monthIncomeTotal: totals.income,
        monthExpenseTotal: totals.expense,
        monthNet: totals.income - totals.expense,
        categoryBreakdown,
        recentTransactions: normalizedRecentTransactions as TransactionWithCategory[],
        monthlyTrends,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateMonthTotals(
  transactions: Array<{ amount: number; type: TransactionType }>
) {
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

function buildCategoryBreakdown(
  transactions: MonthTransaction[]
): CategoryBreakdownItem[] {
  const breakdownMap = new Map<string, CategoryBreakdownItem>();

  transactions.forEach((transaction) => {
    const id = transaction.category_id || "uncategorized";

    // Supabase can return joined data as either a single object or an array of objects
    // depending on the relationship configuration and environment.
    const categoryData = Array.isArray(transaction.categories)
      ? transaction.categories[0]
      : transaction.categories;

    const name = categoryData?.name || "Uncategorized";
    const color = categoryData?.color || null;
    const icon = categoryData?.icon || "circle";

    const existing = breakdownMap.get(id);
    if (existing) {
      existing.total += transaction.amount;
      return;
    }

    breakdownMap.set(id, {
      categoryId: transaction.category_id,
      name,
      color,
      icon,
      total: transaction.amount,
      type: transaction.type,
    });
  });

  return Array.from(breakdownMap.values()).sort((a, b) => b.total - a.total);
}

function buildMonthlyTrends(
  transactions: Array<{ amount: number; type: TransactionType; date: string }>,
  now: Date
): MonthlyTrendItem[] {
  const trendKeys: string[] = [];
  const trendLabels: string[] = [];
  const trendMap = new Map<string, { income: number; expense: number }>();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    trendKeys.push(key);
    trendLabels.push(
      date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    );
    trendMap.set(key, { income: 0, expense: 0 });
  }

  transactions.forEach((transaction) => {
    const key = transaction.date.slice(0, 7);
    const entry = trendMap.get(key);
    if (!entry) {
      return;
    }

    if (transaction.type === "income") {
      entry.income += transaction.amount;
    } else {
      entry.expense += transaction.amount;
    }
  });

  return trendKeys.map((key, index) => {
    const entry = trendMap.get(key) || { income: 0, expense: 0 };
    return {
      month: trendLabels[index],
      monthKey: key,
      income: entry.income,
      expense: entry.expense,
      net: entry.income - entry.expense,
    };
  });
}

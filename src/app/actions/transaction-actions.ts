"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Category, TransactionInsert, TransactionWithCategory } from "@/types/database";

type RawTransactionRow = Omit<TransactionWithCategory, 'categories'> & {
  categories: Category | Category[] | null;
};

interface GetTransactionsResult {
  success: boolean;
  data?: TransactionWithCategory[];
  error?: string;
}

interface AddTransactionResult {
  success: boolean;
  data?: TransactionWithCategory;
  error?: string;
}

interface DeleteTransactionResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function getTransactionsByRange(
  start: string,
  end: string,
  filters?: { categoryIds?: string[]; sort?: "asc" | "desc" }
): Promise<GetTransactionsResult> {
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
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: filters?.sort === "asc" });

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      query = query.in("category_id", filters.categoryIds);
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
): Promise<AddTransactionResult> {
  try {
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        amount: transaction.amount,
        type: transaction.type,
        category_id: transaction.category_id,
        description: transaction.description?.trim() || null,
        date: transaction.date,
        user_id: user.id,
      })
      .select("*, categories(*)")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const row = data as RawTransactionRow;
    const normalized: TransactionWithCategory = {
      ...row,
      categories: Array.isArray(row.categories) ? row.categories[0] : row.categories,
    };

    revalidatePath("/transactions");
    revalidatePath("/overview");

    return { success: true, data: normalized };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteTransaction(id: string): Promise<DeleteTransactionResult> {
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

    revalidatePath("/transactions");
    revalidatePath("/overview");

    return { success: true, data: { id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { DEV_CONFIG } from "@/lib/dev-config";
import { TransactionInsert, TransactionWithCategory } from "@/types/database";

interface GetTransactionsResult {
  success: boolean;
  data?: TransactionWithCategory[];
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getTransactions(): Promise<GetTransactionsResult> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("user_id", DEV_CONFIG.DEV_USER_ID)
      .order("date", { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as TransactionWithCategory[] };
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
    const { error } = await supabase.from("transactions").insert({
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.category_id,
      description: transaction.description?.trim() || null,
      date: transaction.date,
      user_id: DEV_CONFIG.DEV_USER_ID, // Dev user until auth is implemented
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

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", DEV_CONFIG.DEV_USER_ID); // Only delete dev user's transactions

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


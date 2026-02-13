"use server";

import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/database";

interface GetTransactionsResult {
  success: boolean;
  data?: Transaction[];
  error?: string;
}

export async function getTransactions(): Promise<GetTransactionsResult> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Transaction[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

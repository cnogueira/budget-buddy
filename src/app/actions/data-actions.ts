"use server";

import { createClient } from "@/lib/supabase/server";
import { Category, TransactionWithCategory } from "@/types/database";

type RawTransactionRow = Omit<TransactionWithCategory, "categories"> & {
  categories: Category | Category[] | null;
};

interface FingerprintResult {
  success: boolean;
  fingerprint?: string;
  error?: string;
}

interface AllDataResult {
  success: boolean;
  data?: {
    transactions: TransactionWithCategory[];
    categories: Category[];
    fingerprint: string;
  };
  error?: string;
}

export async function getFingerprint(): Promise<FingerprintResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "User not authenticated" };

    const [txResult, catResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("updated_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("categories")
        .select("updated_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    if (txResult.error) return { success: false, error: txResult.error.message };
    if (catResult.error) return { success: false, error: catResult.error.message };

    const txMax = txResult.data?.[0]?.updated_at ?? "0";
    const catMax = catResult.data?.[0]?.updated_at ?? "0";
    const txCount = txResult.count ?? 0;
    const catCount = catResult.count ?? 0;

    return {
      success: true,
      fingerprint: `tx:${txCount}:${txMax}|cat:${catCount}:${catMax}`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getAllData(): Promise<AllDataResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "User not authenticated" };

    const [txResult, catResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, categories(*)", { count: "exact" })
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1000),
      supabase
        .from("categories")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
    ]);

    if (txResult.error) return { success: false, error: txResult.error.message };
    if (catResult.error) return { success: false, error: catResult.error.message };

    const transactions: TransactionWithCategory[] = (txResult.data || []).map(
      (t: RawTransactionRow) => ({
        ...t,
        categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
      })
    );

    const categories = catResult.data as Category[];

    // Compute fingerprint from the fetched data — avoids an extra round-trip
    const txMax = transactions.reduce((m, t) => (t.updated_at > m ? t.updated_at : m), "0");
    const catMax = categories.reduce((m, c) => (c.updated_at > m ? c.updated_at : m), "0");
    const fingerprint = `tx:${txResult.count ?? 0}:${txMax}|cat:${catResult.count ?? 0}:${catMax}`;

    return {
      success: true,
      data: { transactions, categories, fingerprint },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

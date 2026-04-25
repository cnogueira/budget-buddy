"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const SEED_CATEGORIES = {
  income: [
    { name: "Salary", color: "#0d9488" },
    { name: "Freelance", color: "#22c55e" },
  ],
  expense: [
    { name: "Groceries", color: "#ef4444" },
    { name: "Rent", color: "#7f1d1d" },
    { name: "Entertainment", color: "#7c3aed" },
    { name: "Transport", color: "#2563eb" },
    { name: "Dining", color: "#f97316" },
  ],
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function seedFakeTransactions(): Promise<ActionResult> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "dev only" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    const cats = existingCategories || [];
    const categoryMap: Record<string, string> = {};

    for (const c of cats) {
      categoryMap[c.name] = c.id;
    }

    if (cats.length < 2) {
      for (const cat of SEED_CATEGORIES.income) {
        if (!categoryMap[cat.name]) {
          const { data } = await supabase
            .from("categories")
            .insert({ name: cat.name, category_type: "income", color: cat.color, user_id: user.id })
            .select("id, name")
            .single();
          if (data) categoryMap[data.name] = data.id;
        }
      }
      for (const cat of SEED_CATEGORIES.expense) {
        if (!categoryMap[cat.name]) {
          const { data } = await supabase
            .from("categories")
            .insert({ name: cat.name, category_type: "expense", color: cat.color, user_id: user.id })
            .select("id, name")
            .single();
          if (data) categoryMap[data.name] = data.id;
        }
      }
    }

    const salaryId = categoryMap["Salary"];
    const freelanceId = categoryMap["Freelance"];
    const groceriesId = categoryMap["Groceries"];
    const rentId = categoryMap["Rent"];
    const entertainmentId = categoryMap["Entertainment"];
    const transportId = categoryMap["Transport"];
    const diningId = categoryMap["Dining"];

    const transactions = [
      { amount: 3200, type: "income", category_id: salaryId, description: "Monthly salary", date: daysAgo(2) },
      { amount: 850, type: "income", category_id: freelanceId, description: "Web project", date: daysAgo(5) },
      { amount: 1200, type: "expense", category_id: rentId, description: "Rent payment", date: daysAgo(3) },
      { amount: 87.5, type: "expense", category_id: groceriesId, description: "Weekly groceries", date: daysAgo(1) },
      { amount: 42, type: "expense", category_id: diningId, description: "Dinner out", date: daysAgo(4) },
      { amount: 15.8, type: "expense", category_id: transportId, description: "Metro pass", date: daysAgo(6) },
      { amount: 60, type: "expense", category_id: entertainmentId, description: "Movie & drinks", date: daysAgo(8) },
      { amount: 95, type: "expense", category_id: groceriesId, description: "Supermarket run", date: daysAgo(15) },
      { amount: 500, type: "income", category_id: freelanceId, description: "Logo design", date: daysAgo(20) },
      { amount: 3200, type: "income", category_id: salaryId, description: "Monthly salary", date: daysAgo(32) },
      { amount: 1200, type: "expense", category_id: rentId, description: "Rent payment", date: daysAgo(33) },
      { amount: 73, type: "expense", category_id: groceriesId, description: "Grocery store", date: daysAgo(38) },
      { amount: 29, type: "expense", category_id: diningId, description: "Lunch with team", date: daysAgo(45) },
      { amount: 120, type: "expense", category_id: entertainmentId, description: "Concert tickets", date: daysAgo(55) },
      { amount: 22.4, type: "expense", category_id: transportId, description: "Taxi rides", date: daysAgo(70) },
    ].filter((t) => t.category_id);

    const rows = transactions.map((t) => ({ ...t, user_id: user.id }));

    const { error } = await supabase.from("transactions").insert(rows);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");

    return { success: true, message: `Seeded ${rows.length} transactions` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function wipeUserData(): Promise<ActionResult> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "dev only" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error: merchantError } = await supabase
      .from("merchant_rules")
      .delete()
      .eq("user_id", user.id);

    if (merchantError) {
      return { success: false, error: merchantError.message };
    }

    const { error: txError } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", user.id);

    if (txError) {
      return { success: false, error: txError.message };
    }

    const { error: catError } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", user.id);

    if (catError) {
      return { success: false, error: catError.message };
    }

    revalidatePath("/");

    return { success: true, message: "All data wiped" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

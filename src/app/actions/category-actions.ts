"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Category, CategoryInsert, TransactionType } from "@/types/database";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  OTHERS_NAME,
  OTHERS_COLOR,
  OTHERS_ICON,
} from "@/lib/categories/constants";

interface GetCategoriesResult {
  success: boolean;
  data?: Category[];
  error?: string;
}

interface CategoryResult {
  success: boolean;
  data?: Category;
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Category[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getCategoriesByType(
  type: TransactionType
): Promise<GetCategoriesResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("category_type", type)
      .order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Category[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function createCategory(
  category: CategoryInsert
): Promise<CategoryResult> {
  try {
    if (!category.name || category.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    if (!category.category_type || !["income", "expense"].includes(category.category_type)) {
      return { success: false, error: "Invalid category type" };
    }

    if (!CATEGORY_COLORS.includes(category.color as typeof CATEGORY_COLORS[number])) {
      return { success: false, error: "Invalid color selection" };
    }

    if (!CATEGORY_ICONS.includes(category.icon as typeof CATEGORY_ICONS[number])) {
      return { success: false, error: "Invalid icon selection" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: category.name.trim(),
        category_type: category.category_type,
        color: category.color,
        icon: category.icon,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A category with this name already exists for this type.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/categories");

    return { success: true, data: data as Category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateCategory(
  id: string,
  fields: { name: string; color: string; icon: string }
): Promise<CategoryResult> {
  try {
    if (!fields.name || fields.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    if (!CATEGORY_COLORS.includes(fields.color as typeof CATEGORY_COLORS[number])) {
      return { success: false, error: "Invalid color selection" };
    }

    if (!CATEGORY_ICONS.includes(fields.icon as typeof CATEGORY_ICONS[number])) {
      return { success: false, error: "Invalid icon selection" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ name: fields.name.trim(), color: fields.color, icon: fields.icon })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A category with this name already exists for this type.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/categories");

    return { success: true, data: data as Category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Load target category (also verifies ownership via user_id)
    const { data: target, error: targetError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (targetError || !target) {
      return { success: false, error: "Category not found" };
    }

    // Check if transactions reference this category
    const { count: txCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    const hasTransactions = (txCount ?? 0) > 0;

    // Special guard: deleting Others when it has transactions
    if (target.name === OTHERS_NAME && hasTransactions) {
      return {
        success: false,
        error: "Use merge to move these transactions elsewhere first.",
      };
    }

    if (hasTransactions) {
      // Look for an existing Others category of same type
      const { data: othersCategory } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("category_type", target.category_type)
        .eq("name", OTHERS_NAME)
        .single();

      if (!othersCategory) {
        // Rename target in place to become Others
        await supabase
          .from("categories")
          .update({ name: OTHERS_NAME, color: OTHERS_COLOR, icon: OTHERS_ICON })
          .eq("id", id);
      } else {
        // Reassign transactions and rules to existing Others, then delete target
        await supabase
          .from("transactions")
          .update({ category_id: othersCategory.id })
          .eq("category_id", id);

        await supabase
          .from("merchant_rules")
          .update({ category_id: othersCategory.id })
          .eq("category_id", id);

        await supabase.from("categories").delete().eq("id", id);
      }
    } else {
      // No transactions: update or delete merchant_rules then delete category
      const { data: othersCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_type", target.category_type)
        .eq("name", OTHERS_NAME)
        .single();

      if (othersCategory) {
        await supabase
          .from("merchant_rules")
          .update({ category_id: othersCategory.id })
          .eq("category_id", id);
      } else {
        await supabase.from("merchant_rules").delete().eq("category_id", id);
      }

      await supabase.from("categories").delete().eq("id", id);
    }

    revalidatePath("/");
    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function mergeCategories(
  sourceId: string,
  targetId: string
): Promise<ActionResult> {
  try {
    if (sourceId === targetId) {
      return { success: false, error: "Source and target must be different categories" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Load both categories and verify ownership
    const { data: source } = await supabase
      .from("categories")
      .select("*")
      .eq("id", sourceId)
      .eq("user_id", user.id)
      .single();

    const { data: target } = await supabase
      .from("categories")
      .select("*")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (!source || !target) {
      return { success: false, error: "Category not found" };
    }

    if (source.category_type !== target.category_type) {
      return { success: false, error: "Cannot merge categories of different types" };
    }

    // Reassign transactions
    await supabase
      .from("transactions")
      .update({ category_id: targetId })
      .eq("category_id", sourceId);

    // Reassign merchant_rules; delete source rule on (user_id, match_pattern) conflict
    const { data: sourceRules } = await supabase
      .from("merchant_rules")
      .select("id, match_pattern")
      .eq("category_id", sourceId);

    if (sourceRules && sourceRules.length > 0) {
      const { data: targetRules } = await supabase
        .from("merchant_rules")
        .select("match_pattern")
        .eq("user_id", user.id)
        .eq("category_id", targetId);

      const targetPatterns = new Set((targetRules ?? []).map((r: { match_pattern: string }) => r.match_pattern));

      for (const rule of sourceRules) {
        if (targetPatterns.has(rule.match_pattern)) {
          // Conflict: delete the source rule
          await supabase.from("merchant_rules").delete().eq("id", rule.id);
        } else {
          await supabase
            .from("merchant_rules")
            .update({ category_id: targetId })
            .eq("id", rule.id);
        }
      }
    }

    // Delete source category
    await supabase.from("categories").delete().eq("id", sourceId);

    revalidatePath("/");
    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

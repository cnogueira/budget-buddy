"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { DEV_CONFIG } from "@/lib/dev-config";
import { Category, CategoryInsert, TransactionType } from "@/types/database";

interface GetCategoriesResult {
  success: boolean;
  data?: Category[];
  error?: string;
}

interface CreateCategoryResult {
  success: boolean;
  data?: Category;
  error?: string;
}

// Color palettes
const INCOME_COLORS = [
    "#0d9488", // teal-600
    "#86efac", // green-300
    "#22c55e", // green-500
    "#84cc16", // lime-500
    "#15803d", // green-700
    "#052e16", // green-950
];

const EXPENSE_COLORS = [
    // Neutrals (high separation anchors)
    "#000000", // black
    "#ffffff", // white
    "#111827", // near-black (slate-900)
    "#d1d5db", // light gray (gray-300)

    // Reds / warm
    "#7f1d1d", // deep red
    "#ef4444", // red
    "#fb7185", // coral / salmon
    "#be123c", // raspberry (dark rose)

    // Oranges / yellows (spaced by lightness + warmth)
    "#c2410c", // burnt orange
    "#f97316", // orange
    "#f59e0b", // amber / gold
    "#fde047", // bright yellow
    "#a16207", // mustard / ochre

    // Browns / tans (non-green earthy separation)
    "#7c2d12", // deep brown
    "#9a3412", // rust
    "#e0c097", // tan / sand
    "#fed7aa", // peach

    // Pinks / magentas / purples (varied intensity)
    "#ec4899", // hot pink
    "#ff00ff", // pure magenta
    "#d946ef", // fuchsia
    "#a21caf", // deep fuchsia
    "#7e22ce", // purple
    "#581c87", // deep purple
    "#7c3aed", // violet
    "#c4b5fd", // lavender (light violet)

    // Blues (kept “blue”, not cyan/teal)
    "#1e3a8a", // navy
    "#2563eb", // blue
    "#60a5fa", // light blue
    "#a5b4fc", // periwinkle (indigo-200)
];



const MAX_INCOME_CATEGORIES = 6;
const MAX_EXPENSE_CATEGORIES = 26;

export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", DEV_CONFIG.DEV_USER_ID)
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
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", DEV_CONFIG.DEV_USER_ID)
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
): Promise<CreateCategoryResult> {
  try {
    // Validation
    if (!category.name || category.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    if (!category.category_type || !["income", "expense"].includes(category.category_type)) {
      return { success: false, error: "Invalid category type" };
    }

    // Get existing categories for this user and type
    const { data: existingCategories, error: fetchError } = await supabase
      .from("categories")
      .select("color")
      .eq("user_id", DEV_CONFIG.DEV_USER_ID)
      .eq("category_type", category.category_type);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Check category limits
    const categoryCount = existingCategories?.length || 0;
    const maxCategories =
      category.category_type === "income" ? MAX_INCOME_CATEGORIES : MAX_EXPENSE_CATEGORIES;

    if (categoryCount >= maxCategories) {
      return {
        success: false,
        error: `You have reached the maximum of ${maxCategories} ${category.category_type} categories. Please delete some categories before creating new ones.`,
      };
    }

    // Get available colors for this category type
    const colorPalette =
      category.category_type === "income" ? INCOME_COLORS : EXPENSE_COLORS;
    const usedColors = new Set(existingCategories?.map((c) => c.color) || []);
    const availableColors = colorPalette.filter((color) => !usedColors.has(color));

    if (availableColors.length === 0) {
      return {
        success: false,
        error: "No available colors for this category type. Please delete some categories first.",
      };
    }

    // Pick a random color from available colors
    const randomColor =
      availableColors[Math.floor(Math.random() * availableColors.length)];

    // Insert category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: category.name.trim(),
        category_type: category.category_type,
        color: randomColor,
        user_id: DEV_CONFIG.DEV_USER_ID,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return {
          success: false,
          error: "A category with this name already exists",
        };
      }
      return { success: false, error: error.message };
    }

    // Revalidate pages that show categories
    revalidatePath("/");

    return { success: true, data: data as Category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

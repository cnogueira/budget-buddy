'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeDescription } from "@/lib/categorization/engine";
import { Category, TransactionWithCategory } from "@/types/database";

type RawTransactionRow = Omit<TransactionWithCategory, "categories"> & {
  categories: Category | Category[] | null;
};

export async function updateTransactionCategory(transactionId: string, categoryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // 1. Fetch the transaction to get the description
    const { data: tx, error: fetchError } = await supabase
        .from('transactions')
        .select('description, user_id')
        .eq('id', transactionId)
        .single();

    if (fetchError || !tx) {
        return { success: false, error: "Transaction not found" };
    }

    if (tx.user_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    // 2. Update the transaction and return the updated row with category joined
    const { data: updatedRow, error: updateError } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transactionId)
        .select('*, categories(*)')
        .single();

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // 3. LEARNING MECHANISM: Upsert a merchant rule for this user
    if (tx.description) {
        const cleanPattern = normalizeDescription(tx.description);

        // Only create a rule if there's a substantial description
        if (cleanPattern.length >= 3) {
            await supabase
                .from('merchant_rules')
                .upsert({
                    user_id: user.id,
                    match_pattern: cleanPattern,
                    category_id: categoryId,
                    match_type: 'CONTAINS' // Default to contains for learning
                }, { onConflict: 'user_id, match_pattern' });
        }
    }

    const raw = updatedRow as RawTransactionRow;
    const normalized: TransactionWithCategory = {
        ...raw,
        categories: Array.isArray(raw.categories) ? raw.categories[0] : raw.categories,
    };

    revalidatePath('/transactions');
    revalidatePath('/overview');
    return { success: true, data: normalized };
}

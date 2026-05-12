'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseBBVA, ParsedTransaction } from "@/lib/parsers/bbva-parser";
import { guessCategory } from "@/lib/categorization/engine";
import { aiPropose, TxContext } from "@/lib/categorization/ai-categorizer";
import { AiReviewProposal, AiCategoryProposal } from "@/types/database";
import { createCategory } from "@/app/actions/category-actions";

interface ImportResult {
    success: boolean;
    count?: number;
    duplicateCount?: number;
    error?: string;
    pendingReview?: AiReviewProposal;
}

export async function importTransactions(formData: FormData): Promise<ImportResult> {
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: "No file provided" };
    }

    const buffer = await file.arrayBuffer();

    let parsedTransactions: ParsedTransaction[] = [];
    try {
        parsedTransactions = await parseBBVA(buffer);
    } catch (e) {
        console.error("Parse error:", e);
        return { success: false, error: "Failed to parse file. Please ensure it is a valid BBVA Excel or CSV file." };
    }

    if (parsedTransactions.length === 0) {
        return { success: false, error: "No transactions found in file." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // --- IDEMPOTENCY LOGIC ---
    const groupedFileTransactions = new Map<string, ParsedTransaction[]>();

    for (const tr of parsedTransactions) {
        const key = `${tr.date}|${tr.description}|${tr.amount}`;
        const group = groupedFileTransactions.get(key) || [];
        group.push(tr);
        groupedFileTransactions.set(key, group);
    }

    let importedCount = 0;
    let duplicateCount = 0;
    const allTxContext: TxContext[] = [];
    let txIndex = 0;

    for (const [, trs] of groupedFileTransactions.entries()) {
        const tr = trs[0];
        const isExpense = tr.amount < 0;
        const type = isExpense ? 'expense' : 'income';
        const absAmount = Math.abs(tr.amount);
        const description = tr.description || 'Imported Transaction';

        // Check how many already exist in DB
        const { count: dbCount, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('date', tr.date)
            .eq('description', description)
            .eq('amount', absAmount)
            .eq('type', type);

        if (countError) {
            console.error("Error checking duplicates:", countError);
            continue;
        }

        const existingInDb = dbCount || 0;
        const inThisFile = trs.length;
        const toAddNow = Math.max(0, inThisFile - existingInDb);
        duplicateCount += (inThisFile - toAddNow);

        if (toAddNow <= 0) {
            txIndex += inThisFile;
            continue;
        }

        const { categoryId: guessedId, source } = await guessCategory(supabase, user.id, description, type);
        const finalCategoryId = guessedId || null;

        // Fetch the matched category name for AI context
        let matchedCategoryName: string | null = null;
        if (finalCategoryId && source !== 'UNKNOWN') {
            const { data: cat } = await supabase
                .from('categories')
                .select('name')
                .eq('id', finalCategoryId)
                .single();
            matchedCategoryName = cat?.name ?? null;
        }

        for (let i = 0; i < toAddNow; i++) {
            const { data: inserted, error: insertError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    amount: absAmount,
                    type: type,
                    category_id: finalCategoryId,
                    description: description,
                    date: tr.date,
                })
                .select('id')
                .single();

            if (!insertError && inserted) {
                importedCount++;
                allTxContext.push({
                    index: txIndex,
                    transactionId: inserted.id,
                    description,
                    amount: absAmount,
                    type,
                    date: tr.date,
                    matchedCategoryName,
                });
            } else if (insertError) {
                console.error("Failed to insert transaction:", insertError.message);
            }
            txIndex++;
        }
    }

    revalidatePath('/transactions');
    revalidatePath('/overview');

    const hasUnknown = allTxContext.some(tx => tx.matchedCategoryName === null);
    if (hasUnknown) {
        const [{ data: categories }, { data: rules }] = await Promise.all([
            supabase.from('categories').select('id, name, category_type, color, icon, created_at, updated_at, user_id').eq('user_id', user.id),
            supabase.from('merchant_rules').select('match_pattern, match_type, category_id').eq('user_id', user.id),
        ]);

        const pendingReview = await aiPropose(
            allTxContext,
            categories ?? [],
            rules ?? [],
        );

        if (pendingReview) {
            return { success: true, count: importedCount, duplicateCount, pendingReview };
        }
    }

    return { success: true, count: importedCount, duplicateCount };
}

export async function approveReview(
    transactions: Array<{ transactionId: string; categoryId: string | null; newCategory: AiCategoryProposal | null }>,
    rules: Array<{ match_pattern: string; match_type: 'EXACT' | 'CONTAINS'; categoryId: string | null; newCategory: AiCategoryProposal | null }>,
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'User not authenticated' };

    // Collect unique new categories to create (dedup by name + category_type)
    const newCategoriesNeeded = new Map<string, AiCategoryProposal>();
    for (const tx of transactions) {
        if (tx.newCategory) {
            const key = `${tx.newCategory.name}:${tx.newCategory.category_type}`;
            if (!newCategoriesNeeded.has(key)) newCategoriesNeeded.set(key, tx.newCategory);
        }
    }
    for (const rule of rules) {
        if (rule.newCategory) {
            const key = `${rule.newCategory.name}:${rule.newCategory.category_type}`;
            if (!newCategoriesNeeded.has(key)) newCategoriesNeeded.set(key, rule.newCategory);
        }
    }

    // Create new categories and build name:type → id map
    const resolvedIds = new Map<string, string>();
    for (const [key, proposal] of newCategoriesNeeded.entries()) {
        const result = await createCategory(proposal);
        if (result.success && result.data) {
            resolvedIds.set(key, result.data.id);
        } else if (!result.success && result.error?.includes('already exists')) {
            // Category already exists — look it up
            const { data: existing } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', proposal.name)
                .eq('category_type', proposal.category_type)
                .single();
            if (existing) resolvedIds.set(key, existing.id);
        }
    }

    const resolveCategoryId = (categoryId: string | null, newCategory: AiCategoryProposal | null): string | null => {
        if (categoryId) return categoryId;
        if (newCategory) {
            const key = `${newCategory.name}:${newCategory.category_type}`;
            return resolvedIds.get(key) ?? null;
        }
        return null;
    };

    // Update transaction categories
    for (const tx of transactions) {
        const resolvedId = resolveCategoryId(tx.categoryId, tx.newCategory);
        if (!resolvedId) continue;
        await supabase
            .from('transactions')
            .update({ category_id: resolvedId })
            .eq('id', tx.transactionId)
            .eq('user_id', user.id);
    }

    // Upsert merchant rules
    for (const rule of rules) {
        const resolvedId = resolveCategoryId(rule.categoryId, rule.newCategory);
        if (!resolvedId) continue;
        await supabase
            .from('merchant_rules')
            .upsert(
                { user_id: user.id, match_pattern: rule.match_pattern, match_type: rule.match_type, category_id: resolvedId },
                { onConflict: 'user_id, match_pattern' },
            );
    }

    revalidatePath('/transactions');
    revalidatePath('/overview');
    return { success: true };
}

'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseBBVA, ParsedTransaction } from "@/lib/parsers/bbva-parser";
import { guessCategory } from "@/lib/categorization/engine";

interface ImportResult {
    success: boolean;
    count?: number;
    duplicateCount?: number;
    error?: string;
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

    // Fetch User Categories for matching
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

    const userCategories = categories || [];

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

    for (const [key, trs] of groupedFileTransactions.entries()) {
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

        if (toAddNow <= 0) continue;

        // NEW: Resolve Category using Inference Engine
        const { categoryId: guessedId } = await guessCategory(supabase, user.id, description, type);

        // If no category found, we allow it to be NULL (Uncategorized)
        const finalCategoryId = guessedId || null;

        // Insert missing instances
        for (let i = 0; i < toAddNow; i++) {
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: user.id,
                amount: absAmount,
                type: type,
                category_id: finalCategoryId,
                description: description,
                date: tr.date,
            });

            if (!insertError) {
                importedCount++;
            } else {
                console.error("Failed to insert transaction:", insertError.message);
            }
        }
    }

    revalidatePath('/');
    return { success: true, count: importedCount, duplicateCount };
}

'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseBBVA, ParsedTransaction } from "@/lib/parsers/bbva-parser";

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

    let importedCount = 0;
    let duplicateCount = 0;

    for (const tr of parsedTransactions) {
        const isExpense = tr.amount < 0;
        const type = isExpense ? 'expense' : 'income';
        const absAmount = Math.abs(tr.amount);
        const description = tr.description || 'Imported Transaction';

        // Fix date if needed (ensure YYYY-MM-DD)
        // parsedTransactions already returns YYYY-MM-DD from parser

        // 3. Check for duplicates
        const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('date', tr.date)
            // Description match can be fuzzy, but strict for now
            .eq('description', description)
            .eq('amount', absAmount)
            .eq('type', type);

        if (count && count > 0) {
            duplicateCount++;
            continue;
        }

        // 4. Resolve Category
        let categoryId = '';

        // Try to match by name (simple keyword matching could be added here)
        // For now, simple exact match on description vs category name? Unlikely.

        // Simple keyword matching
        const lowDesc = description.toLowerCase();

        // Check if any category name is contained in description
        const categoryMatch = userCategories.find(c =>
            lowDesc.includes(c.name.toLowerCase()) && c.category_type === type
        );

        if (categoryMatch) {
            categoryId = categoryMatch.id;
        }

        // If no match, try to find "General", "Uncategorized", "Imported"
        if (!categoryId) {
            const fallbackNames = ['Uncategorized', 'General', 'Imported', 'Others', 'Varios'];
            const fallback = userCategories.find(c =>
                fallbackNames.some(name => c.name.toLowerCase() === name.toLowerCase()) && c.category_type === type
            );
            if (fallback) {
                categoryId = fallback.id;
            }
        }

        // If STILL no category, we must create one "Imported"
        if (!categoryId) {
            // Check if "Imported" exists
            let importedCat = userCategories.find(c => c.name === 'Imported' && c.category_type === type);

            if (!importedCat) {
                const { data: newCat } = await supabase
                    .from('categories')
                    .insert({
                        user_id: user.id,
                        name: 'Imported',
                        category_type: type,
                        color: '#9ca3af' // Zinc-400
                    })
                    .select()
                    .single();
                if (newCat) {
                    importedCat = newCat;
                    userCategories.push(newCat);
                }
            }

            if (importedCat) {
                categoryId = importedCat.id;
            } else {
                // Fallback to ANY category
                const anyCat = userCategories.find(c => c.category_type === type);
                if (anyCat) categoryId = anyCat.id;
            }
        }

        if (!categoryId) {
            console.error("Could not resolve category for transaction", tr);
            // Skip if no category can be assigned (should not happen with fallback)
            continue;
        }

        // 5. Insert
        const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            amount: absAmount,
            type: type,
            category_id: categoryId, // Now required in DB
            description: description,
            date: tr.date,
            // category: categoryId // Legacy field, might be needed if triggers use it, but type says optional/legacy
        });

        if (!error) {
            importedCount++;
        } else {
            console.error("Failed to insert imported transaction", error);
        }
    }

    revalidatePath('/');
    return { success: true, count: importedCount, duplicateCount };
}

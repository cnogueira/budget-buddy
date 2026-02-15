'use server';

import { spawn } from 'child_process';
import path from 'path';
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ImportResult {
    success: boolean;
    count?: number;
    duplicateCount?: number;
    error?: string;
}

interface WoobTransaction {
    date: string;
    amount: number;
    label: string;
    raw_label?: string;
    category?: string;
    id?: string;
}

export async function importTransactions(bank: string, credentials: any): Promise<ImportResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // 1. Fetch transactions via Python
    let fetchedTransactions: WoobTransaction[] = [];
    try {
        fetchedTransactions = await runPythonScript(bank, credentials);
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Unknown Python Error' };
    }

    if (!fetchedTransactions || fetchedTransactions.length === 0) {
        return { success: true, count: 0, duplicateCount: 0 };
    }

    // 2. Fetch User Categories for matching
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

    const userCategories = categories || [];

    let importedCount = 0;
    let duplicateCount = 0;

    for (const tr of fetchedTransactions) {
        const isExpense = tr.amount < 0;
        const type = isExpense ? 'expense' : 'income';
        const absAmount = Math.abs(tr.amount);
        const description = tr.label || tr.raw_label || 'Imported Transaction';

        // 3. Check for duplicates
        // Simple duplicate check: same user, same date, same amount, same description (type is implied by amount sign/type)
        const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('date', tr.date)
            .eq('description', description)
            .eq('amount', absAmount)
            .eq('type', type);

        if (count && count > 0) {
            duplicateCount++;
            continue;
        }

        // 4. Resolve Category
        let categoryId = '';

        // Try to match by name
        if (tr.category) {
            const match = userCategories.find(c =>
                c.name.toLowerCase() === tr.category!.toLowerCase() && c.category_type === type
            );
            if (match) {
                categoryId = match.id;
            }
        }

        // If no match, try to find "General", "Uncategorized", "Imported"
        if (!categoryId) {
            const fallbackNames = ['Uncategorized', 'General', 'Imported', 'Others'];
            const fallback = userCategories.find(c =>
                fallbackNames.includes(c.name) && c.category_type === type
            );
            if (fallback) {
                categoryId = fallback.id;
            }
        }

        // If STILL no category, we must create one "Imported"
        if (!categoryId) {
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
                categoryId = newCat.id;
                userCategories.push(newCat);
            } else {
                // Fallback to ANY category of that type?
                const anyCat = userCategories.find(c => c.category_type === type);
                if (anyCat) categoryId = anyCat.id;
            }
        }

        if (!categoryId) {
            console.error("Could not resolve category for transaction", tr);
            continue;
        }

        // 5. Insert
        const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            amount: absAmount,
            type: type,
            category_id: categoryId,
            description: description,
            date: tr.date,
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

async function runPythonScript(bank: string, credentials: any): Promise<WoobTransaction[]> {
    return new Promise((resolve, reject) => {
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(process.cwd(), 'scripts', 'import_transactions.py');

        const pyProcess = spawn(pythonCommand, [scriptPath, bank]);

        let outputData = '';
        let errorData = '';

        pyProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pyProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pyProcess.on('close', (code) => {
            if (code !== 0) {
                try {
                    const jsonError = JSON.parse(outputData);
                    if (jsonError.error) {
                        reject(new Error(jsonError.error));
                        return;
                    }
                } catch (e) {
                    // ignore
                }
                reject(new Error(`Process exited with code ${code}. Error: ${errorData || outputData}`));
                return;
            }

            try {
                const results = JSON.parse(outputData);
                if (results.error) {
                    reject(new Error(results.error));
                } else {
                    resolve(results);
                }
            } catch (err) {
                reject(new Error(`Failed to parse Python output: ${err.message}. Output: ${outputData}`));
            }
        });

        pyProcess.on('error', (err) => {
            reject(new Error(`Failed to spawn python process: ${err.message}`));
        });

        pyProcess.stdin.write(JSON.stringify(credentials));
        pyProcess.stdin.end();
    });
}

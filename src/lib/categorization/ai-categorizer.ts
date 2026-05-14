import { getAiProvider } from '@/lib/ai/provider';
import { Category, AiReviewProposal, AiTransactionProposal, AiRuleProposal, AiCategoryProposal, TransactionType } from '@/types/database';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/categories/constants';

export interface TxContext {
    index: number;
    transactionId: string;
    description: string;
    amount: number;
    type: TransactionType;
    date: string;
    matchedCategoryName: string | null;
}

interface DbRule {
    match_pattern: string;
    match_type: string;
    category_id: string;
}

interface AiCategorization {
    transactionIndex: number;
    existingCategoryId: string | null;
    newCategoryName: string | null;
    proposedRule: { match_pattern: string; match_type: 'EXACT' | 'CONTAINS' } | null;
}

interface AiStandaloneRule {
    match_pattern: string;
    match_type: 'EXACT' | 'CONTAINS';
    existingCategoryId: string | null;
    newCategoryName: string | null;
}

interface AiNewCategory {
    name: string;
    icon: string;
    color: string;
    category_type: TransactionType;
}

interface AiResponse {
    categorizations: AiCategorization[];
    standaloneRules: AiStandaloneRule[];
    newCategories: AiNewCategory[];
}

export async function aiPropose(
    allTransactions: TxContext[],
    categories: Category[],
    rules: DbRule[],
): Promise<AiReviewProposal | null> {
    const provider = getAiProvider();
    if (!provider) {
        console.log('[ai-categorizer] no AI provider configured, skipping');
        return null;
    }

    const unknownTxs = allTransactions.filter(tx => tx.matchedCategoryName === null);
    console.log('[ai-categorizer] unknownTxs:', unknownTxs.length, '/', allTransactions.length);
    if (unknownTxs.length === 0) return null;

    try {
        const txList = allTransactions.map(tx =>
            `[${tx.index}] ${tx.date} | ${tx.type} | €${tx.amount.toFixed(2)} | "${tx.description}" | category: ${tx.matchedCategoryName ?? 'UNMATCHED'}`
        ).join('\n');

        const catList = categories.map(c =>
            `  id=${c.id} name="${c.name}" type=${c.category_type}`
        ).join('\n');

        const ruleList = rules.length > 0
            ? rules.map(r => {
                const cat = categories.find(c => c.id === r.category_id);
                return `  ${r.match_type} "${r.match_pattern}" → ${cat?.name ?? r.category_id}`;
            }).join('\n')
            : '  (none)';

        const prompt = `You are a personal finance assistant. Categorize uncategorized bank transactions.

## All transactions in this import batch
${txList}

## Existing categories
${catList}

## Existing merchant rules
${ruleList}

## Available icons (use exact values)
${CATEGORY_ICONS.join(', ')}

## Available colors (use exact hex values)
${CATEGORY_COLORS.join(', ')}

## Task
1. For each UNMATCHED transaction, assign a category from existing ones or propose a new one.
2. If the assignment can be expressed as a simple keyword rule (e.g. the merchant always maps to that category), add a proposedRule. Skip the rule for context-dependent cases (e.g. a supermarket purchase during an apparent travel day based on surrounding transactions).
3. Use the full batch context: if multiple transactions on the same date suggest a travel/trip scenario, group purchases accordingly.
4. Propose new categories only when no existing one fits. Use valid icon and color values from the lists above.
5. Avoid duplicating existing rules — check the rule list before proposing new ones.

## Response JSON schema
{
  "categorizations": [
    {
      "transactionIndex": <number>,
      "existingCategoryId": "<uuid or null>",
      "newCategoryName": "<string or null>",
      "proposedRule": { "match_pattern": "<lowercase keyword>", "match_type": "EXACT | CONTAINS" } | null
    }
  ],
  "standaloneRules": [
    {
      "match_pattern": "<lowercase keyword>",
      "match_type": "EXACT | CONTAINS",
      "existingCategoryId": "<uuid or null>",
      "newCategoryName": "<string or null>"
    }
  ],
  "newCategories": [
    {
      "name": "<string>",
      "icon": "<valid icon name>",
      "color": "<valid hex color>",
      "category_type": "income | expense"
    }
  ]
}

Only include UNMATCHED transactions in categorizations. Return valid JSON only.`;

        console.log('[ai-categorizer] calling provider...');
        const text = await provider(prompt);
        console.log('[ai-categorizer] response length:', text.length);
        const raw = JSON.parse(text) as AiResponse;

        const newCatMap = new Map<string, AiNewCategory>(
            (raw.newCategories ?? []).map(nc => [nc.name, nc])
        );

        const resolveCategory = (existingId: string | null, newName: string | null): Pick<AiTransactionProposal, 'categoryId' | 'newCategory'> => {
            if (existingId && categories.find(c => c.id === existingId)) {
                return { categoryId: existingId, newCategory: null };
            }
            if (newName && newCatMap.has(newName)) {
                const nc = newCatMap.get(newName)!;
                return {
                    categoryId: null,
                    newCategory: {
                        name: nc.name,
                        icon: nc.icon,
                        color: nc.color,
                        category_type: nc.category_type,
                    } satisfies AiCategoryProposal,
                };
            }
            // Fallback: if a newName was given but not defined, still expose it with defaults
            if (newName) {
                return {
                    categoryId: null,
                    newCategory: {
                        name: newName,
                        icon: 'wallet',
                        color: '#3b82f6',
                        category_type: 'expense',
                    } satisfies AiCategoryProposal,
                };
            }
            return { categoryId: null, newCategory: null };
        };

        const transactions: AiTransactionProposal[] = [];
        for (const c of (raw.categorizations ?? [])) {
            const tx = allTransactions.find(t => t.index === c.transactionIndex);
            if (!tx) continue;
            const { categoryId, newCategory } = resolveCategory(c.existingCategoryId, c.newCategoryName);
            transactions.push({
                transactionId: tx.transactionId,
                description: tx.description,
                amount: tx.amount,
                type: tx.type,
                categoryId,
                newCategory,
            });
        }

        const rules_out: AiRuleProposal[] = [];

        // Rules embedded in categorizations
        for (const c of (raw.categorizations ?? [])) {
            if (!c.proposedRule) continue;
            const { categoryId, newCategory } = resolveCategory(c.existingCategoryId, c.newCategoryName);
            rules_out.push({
                match_pattern: c.proposedRule.match_pattern,
                match_type: c.proposedRule.match_type,
                categoryId,
                newCategory,
            });
        }

        // Standalone rules
        for (const r of (raw.standaloneRules ?? [])) {
            const { categoryId, newCategory } = resolveCategory(r.existingCategoryId, r.newCategoryName);
            rules_out.push({
                match_pattern: r.match_pattern,
                match_type: r.match_type,
                categoryId,
                newCategory,
            });
        }

        // Deduplicate rules by match_pattern
        const seenPatterns = new Set<string>();
        const dedupedRules = rules_out.filter(r => {
            if (seenPatterns.has(r.match_pattern)) return false;
            seenPatterns.add(r.match_pattern);
            return true;
        });

        if (transactions.length === 0 && dedupedRules.length === 0) return null;

        return { transactions, rules: dedupedRules };
    } catch (e) {
        console.error('[ai-categorizer] error:', e instanceof Error ? e.message : e);
        if (e instanceof Error && e.stack) console.error(e.stack);
        return null;
    }
}

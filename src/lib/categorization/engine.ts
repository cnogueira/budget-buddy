export interface GuessResult {
    categoryId: string | null;
    source: 'USER_RULE' | 'GLOBAL_MATCH' | 'KEYWORD_MATCH' | 'UNKNOWN';
}

export function normalizeDescription(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[0-9]{3,}/g, '') // Remove long number sequences (store IDs)
        .replace(/\s+/g, ' ')      // Collapse whitespace
        .trim();
}

/**
 * Guesses a category for a given transaction description.
 * This is intended to be used in server actions.
 */
export async function guessCategory(
    supabase: any,
    userId: string,
    rawDescription: string,
    type: 'income' | 'expense'
): Promise<GuessResult> {
    const cleanDesc = normalizeDescription(rawDescription);
    if (!cleanDesc) return { categoryId: null, source: 'UNKNOWN' };

    // 1. Fetch User Rules (Priority 1)
    const { data: userRules } = await supabase
        .from('merchant_rules')
        .select('category_id, match_pattern, match_type')
        .eq('user_id', userId);

    if (userRules) {
        // 1a. Exact Match
        const exact = userRules.find((r: any) => r.match_type === 'EXACT' && r.match_pattern === cleanDesc);
        if (exact) return { categoryId: exact.category_id, source: 'USER_RULE' };

        // 1b. Contains Match
        const contains = userRules.find((r: any) => cleanDesc.includes(r.match_pattern));
        if (contains) return { categoryId: contains.category_id, source: 'USER_RULE' };
    }

    // 2. Fetch Global Rules (Priority 2)
    const { data: globalRules } = await supabase
        .from('merchant_rules')
        .select('category_id, match_pattern')
        .is('user_id', null);

    if (globalRules) {
        const globalMatch = globalRules.find((r: any) => cleanDesc.includes(r.match_pattern.toLowerCase()));
        if (globalMatch) return { categoryId: globalMatch.category_id, source: 'GLOBAL_MATCH' };
    }

    // 3. Keyword Match against Category Names (Priority 3)
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId)
        .eq('category_type', type);

    if (categories) {
        // Sort by length longest first to catch "Dining Out" before "Dining"
        const sortedCats = [...categories].sort((a, b) => b.name.length - a.name.length);
        const keywordMatch = sortedCats.find((c: any) => cleanDesc.includes(c.name.toLowerCase()));
        if (keywordMatch) return { categoryId: keywordMatch.id, source: 'KEYWORD_MATCH' };
    }

    return { categoryId: null, source: 'UNKNOWN' };
}

# AI Categorization — Handoff Plan

## What was built

Added a two-layer transaction categorization system to Budget Buddy:

1. **Rule layer** (existing): `merchant_rules` table — description-based EXACT/CONTAINS patterns, run during import via `guessCategory()`.
2. **AI layer** (new): Gemini 2.0 Flash — runs after insert when any transactions are UNKNOWN (no rule match). Returns proposed categorizations + new merchant rules, which the user reviews and approves before anything is committed.

The AI receives the **full import batch** (including already-categorized transactions) for context-aware grouping — e.g. detecting a travel day from surrounding transactions and overriding a "Groceries" match with "Travel".

---

## Current state

All changes are committed on branch **`feat/ai-categorization`**. No DB migrations required — the existing `merchant_rules` table is sufficient.

### Files changed

| File | Change |
|------|--------|
| `src/types/database.ts` | Added `AiCategoryProposal`, `AiTransactionProposal`, `AiRuleProposal`, `AiReviewProposal` |
| `src/lib/categorization/ai-categorizer.ts` | **New** — Gemini 2.0 Flash integration |
| `src/app/actions/import-transactions.ts` | ID capture on insert, AI call, new `approveReview` server action |
| `src/components/ImportTransactionsForm.tsx` | Review panel UI shown after import when AI proposals exist |
| `package.json` / `package-lock.json` | Added `@google/generative-ai` dependency |

---

## Setup required

Add to `.env.local` (and Vercel env vars for production):

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a key at https://aistudio.google.com/app/apikey (free tier is sufficient).

Without this key the feature is silently disabled — imports work exactly as before.

---

## Architecture notes

### Import flow (updated)

```
importTransactions()
  ├── parse + deduplicate (unchanged)
  ├── for each group:
  │     ├── guessCategory() → rule match or UNKNOWN
  │     └── insert with category_id (or null) — captures inserted id
  ├── if any UNKNOWN transactions AND GEMINI_API_KEY set:
  │     ├── fetch user categories + merchant_rules
  │     └── aiPropose(allTxContext, categories, rules) → AiReviewProposal | null
  └── return { success, count, duplicateCount, pendingReview? }
```

### AI prompt strategy (`src/lib/categorization/ai-categorizer.ts`)

- Sends all transactions in the batch (with their rule-matched category or "UNMATCHED")
- Sends existing categories and existing rules (so AI understands the user's taxonomy)
- Sends valid icon/color lists from `src/lib/categories/constants.ts`
- Asks AI to: (1) assign a category to each UNMATCHED transaction, (2) propose a merchant rule where applicable (not for context-dependent cases), (3) suggest new categories with valid icon/color if needed
- Response parsed from JSON (`responseMimeType: 'application/json'`)
- Returns `null` silently on any error — never breaks the import

### approveReview server action (`src/app/actions/import-transactions.ts`)

- Creates any new AI-proposed categories via `createCategory()`
- Handles "category already exists" gracefully (looks it up instead)
- Updates `transactions.category_id` directly (bypasses `updateTransactionCategory` to avoid double-rule creation)
- Upserts approved rules into `merchant_rules` with `onConflict: 'user_id, match_pattern'`

### Review UI (`src/components/ImportTransactionsForm.tsx`)

- On import success with `pendingReview`: shows review panel instead of auto-closing
- Each UNKNOWN transaction: `<select>` with existing categories + AI-suggested new ones (grouped by `<optgroup>`)
- Each proposed rule: dismissable individually (dismissed rules are excluded from `approveReview` call)
- **"Approve & Apply"**: calls `approveReview`, then `invalidateAndRefetch()`, then closes modal
- **"Skip & Close"**: closes modal immediately — transactions stay uncategorized

---

## What still needs to be done

### 1. End-to-end testing
- Import a BBVA file with merchants that have no matching rules
- Verify the review panel appears with AI proposals
- Test the category picker (existing + new categories)
- Test rule dismiss/restore
- Test "Approve & Apply" → verify transactions get categories, rules appear in DB
- Test "Skip & Close" → verify transactions stay uncategorized
- Test re-import after approval → same merchants should now be auto-categorized by the new rules

### 2. Loading UX during AI call
Currently the import button shows "Processing File..." the entire time, including the AI call (which can take 2–5 seconds). Consider adding a second loading message like "Asking AI for suggestions..." once the file parsing/insert is done. This would require splitting the import into two server actions (insert → then AI), or using a streaming approach.

### 3. Edge cases to verify
- What happens when AI proposes a new category but user changes it to an existing one before approving? ✓ Handled — `txEdits` state overrides the proposal.
- What if `createCategory()` fails for a new category? Currently silently skipped — the transaction gets `category_id = null`. Consider surfacing this error.
- Duplicate rule patterns across categorizations + standaloneRules — deduplicated by `match_pattern` in `aiPropose`.

### 4. Optional improvements (not required for MVP)
- Show a spinner/skeleton in the review panel while AI is running (requires async split)
- Allow user to manually type a new category name in the picker (currently only AI-proposed new categories appear)
- Add a "Rules" management page where users can view/edit/delete their merchant rules
- Consider persisting the `pendingReview` state so a page refresh doesn't lose it

---

## Key files to read for context

```
src/lib/categorization/engine.ts          # existing rule engine (guessCategory)
src/lib/categorization/ai-categorizer.ts  # new Gemini integration
src/app/actions/import-transactions.ts    # import + approveReview actions
src/components/ImportTransactionsForm.tsx # import modal UI with review panel
src/types/database.ts                     # all canonical types incl. AI types
src/lib/categories/constants.ts           # CATEGORY_ICONS, CATEGORY_COLORS
src/app/actions/category-actions.ts       # createCategory() used in approveReview
src/providers/DataProvider.tsx            # useData() — categories + invalidateAndRefetch
```

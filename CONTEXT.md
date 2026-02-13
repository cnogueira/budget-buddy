# Project Context
You are building "Budget Buddy," a personal finance tracker.
You are a Senior Frontend Engineer specializing in Next.js 14+, TypeScript, and Supabase.

# Tech Stack Rules
1. **Framework:** Next.js (App Router). Do NOT use the old `pages/` directory.
2. **Data Fetching:** Use Server Actions for all mutations (create, update, delete). Use Server Components for data fetching.
3. **Database:** Supabase. Use the `supabase-js` client.
4. **Styling:** Tailwind CSS. Use `lucide-react` for icons.
5. **UI Components:** Use standard HTML/Tailwind. Do not install heavy UI libraries (like MUI) unless asked.

# Coding Style
- **Strict Typing:** All components must be typed. Use the interfaces defined in `@/types/database`.
- **Validation:** Always validate inputs before sending them to the DB.
- **Error Handling:** Wrap Server Actions in `try/catch` and return `{ success: boolean, error?: string }` objects.
- **Simplicity:** Prefer readable, simple code over complex abstractions.
- **Directory Structure:** The project uses the `src/` directory. All components, pages, and library code reside in `src/`.
- **React Compiler:** The project uses React Compiler. Do NOT manually use `useMemo` or `useCallback` unless absolutely necessary for referential equality. Trust the compiler.
- **Router:** Use the Next.js App Router (`src/app`). Do NOT use the `pages/` directory.
- **Data Fetching:** Prefer fetching data directly in Server Components using `await`. Do NOT use `useEffect` for initial data loading.
- **Client Components:** Only add `'use client'` to leaf components that require interactivity (hooks, event listeners). Keep logic on the server as much as possible.

# Current Task
We are building the core transaction management features.

## Completed
✅ Supabase client initialized in `src/lib/supabase.ts`
   - Two clients: `supabase` (anon key, respects RLS) and `supabaseAdmin` (service role, bypasses RLS)
   - Admin client used in Server Actions for development (until auth is implemented)
✅ Database schema deployed to Supabase with RLS policies
✅ Transaction List feature:
   - Server Action: `getTransactions()` in `src/app/actions/transaction-actions.ts`
   - UI Component: `TransactionList` in `src/components/TransactionList.tsx`
   - Home page displays recent transactions with proper error handling
✅ Add Transaction feature:
   - Server Action: `addTransaction()` in `src/app/actions/transaction-actions.ts` with validation
   - UI Component: `AddTransactionForm` in `src/components/AddTransactionForm.tsx`
   - Form includes: amount, type (income/expense), category, description (optional), and date
   - Success/error feedback shown to user
   - Page revalidates after adding transaction
✅ Delete Transaction feature:
   - Server Action: `deleteTransaction(id)` in `src/app/actions/transaction-actions.ts`
   - UI Component: `DeleteTransactionButton` in `src/components/DeleteTransactionButton.tsx`
   - Delete button added to each row in TransactionList
   - Confirmation dialog before deletion
   - Page revalidates after deletion to refresh the list
✅ RLS Error Fixed:
   - Using `supabaseAdmin` (service role key) in Server Actions to bypass RLS during development
   - Service role key added to `.env.local` (must be obtained from Supabase Dashboard)

## Next Steps

1. Categories!

Categories are no longer a simple string.
We need to create a `categories` table in Supabase and link it to transactions via a foreign key.
This will allow users to manage their categories and ensure data integrity.

We can start simple for now, a category just has an `id`, `name`, `category_type` (income/expense), and `user_id` and a `color` (for UI purposes). We can expand this later with features like icons, budgets, etc.
For now, we will manage categories through the AddTransactionForm (users can select from existing categories or add a new one on the fly). We will implement a full category management UI in a future iteration.
The color field will be unique between categories of the same user. This will allow us to easily assign colors to categories in the UI without conflicts. To ensure colors are good-looking and distinct, we will start with a predefined set of 32 colors and assign them at random as new categories are created.
If a user tries to create more than 32 categories, we will show an error message asking them to delete some old categories first (or we can implement a color reuse strategy in the future). This approach keeps things simple while ensuring a good user experience.
To make sure green-ish colors are used for income categories, we will allow for up-to 6 income categories (with green-ish colors) and up-to 26 expense categories with the rest of the color palette. This way we can ensure a good visual distinction between income and expense categories in the UI. We will enforce this limit in the Server Action that creates categories, returning an error if the user tries to exceed these limits.
So we will have 2 color palettes, a 6-color palette for income categories and a 26-color palette for expense categories. When a new category is created, we will check the type (income/expense) and assign a random color from the appropriate palette, ensuring that the color is not already in use by another category of the same user. Once all colors of a category type are used, we will return an error message asking the user to delete some old categories before creating new ones. For now, we will omit the delete functionality for categories to keep things simple.





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
✅ Database schema deployed to Supabase
✅ Transaction List feature:
   - Server Action: `getTransactions()` in `src/app/actions/transaction-actions.ts`
   - UI Component: `TransactionList` in `src/components/TransactionList.tsx`
   - Home page displays recent transactions with proper error handling

## Next Steps
Implement Add and Delete transaction features:
1. **Add Transaction Feature:**
   - Create a Server Action `addTransaction()` that validates and inserts a new transaction
   - Create a form component `AddTransactionForm.tsx` with fields: amount, type (income/expense), category, description (optional), and date
   - Add the form to the home page above the transaction list
   - Use proper validation (e.g., amount > 0, required fields)
   - Show success/error feedback to the user

2. **Delete Transaction Feature:**
   - Create a Server Action `deleteTransaction(id)` that removes a transaction
   - Add a delete button to each row in the TransactionList
   - Add confirmation before deletion (use a client component for the delete button)
   - Revalidate the page after deletion to refresh the list

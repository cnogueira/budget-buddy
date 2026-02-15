# Project Context
You are building "Budget Buddy," a personal finance tracker.
You are a Senior Frontend Engineer specializing in Next.js 14+, TypeScript, and Supabase.

# Agent Guidelines

These rules apply to all AI agents working on this project:

## Documentation & File Organization
1. **No .md files in root** - Keep root clean. Only CONTEXT.md and README.md allowed
2. **Use temp/ folder** - Put all temporary docs, instructions, and notes in `temp/`
3. **Cleanup after yourself** - Remove outdated files, consolidate fragmented docs
4. **No clutter** - Don't create multiple instruction files for a single feature

## Supabase SQL Files
1. **Self-contained files** - Each .sql file should be complete and runnable independently
2. **One file per logical feature** - Don't split a feature across multiple files
3. **Numbered ordering** - Use `01_`, `02_`, etc. if execution order matters
4. **Simple instructions** - Just tell the user "Execute this SQL file" - don't over-explain
5. **Keep folder organized** - Consolidate the supabase/ folder as if for first-time setup

## Communication
- Be concise in instructions
- Don't create elaborate setup scripts unless requested
- Trust the developer to know how to execute SQL files
- Focus on code quality over documentation quantity

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
   - Configured with `anon` key for frontend and server-side interactions
   - Development uses `DEV_CONFIG.DEV_USER_ID` as a hardcoded UUID to simulate multi-tenancy until auth is fully implemented
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
✅ Multi-tenancy simulation:
   - Using `DEV_CONFIG.DEV_USER_ID` in all Server Actions to filter data correctly during development

✅ Categories Feature:
   - Created `categories` table with RLS policies
   - Categories have: id, name, category_type (income/expense), color, user_id
   - Color palettes: 6 green-ish colors for income, 26 varied colors for expenses
   - Category limits enforced: max 6 income categories, max 26 expense categories
   - Server Actions: `getCategories()`, `getCategoriesByType()`, `createCategory()` in `src/app/actions/category-actions.ts`
   - Updated `Transaction` type to include `category_id` foreign key (legacy `category` field kept for migration)
   - Added `TransactionWithCategory` type for joined queries
   - Updated `getTransactions()` to join with categories table
   - Updated `addTransaction()` to use `category_id`
   - Updated `TransactionList` component to display categories with colors
   - Updated `AddTransactionForm` to allow selecting existing categories or creating new ones on the fly
   - Category selector shows colored badges for quick selection
   - Form validates category limits and shows helpful error messages
✅ Dashboard Summary:
   - Server Action: `getDashboardSummary()` in `src/app/actions/transaction-actions.ts`
   - UI Component: `DashboardSummary` in `src/components/DashboardSummary.tsx`
   - Displays month-to-date income vs expenses
   - Category breakdown with progress bars and color coding
   - Recent transactions list
   - 6-month balance trends visualization

## Next Steps

1. **User Authentication (MVP Priority 1)**
   - **Login/Register Page**: Create an initial landing page for users to sign up or sign in using Supabase Auth
   - **Route Protection**: Ensure the dashboard and other features are only accessible after authentication
   - **Global Navigation Bar**: Implement a persistent nav bar at the top of every page showing:
     - Project logo/link to dashboard
     - Logged-in user information (email/avatar)
     - Logout button/link
   - **Legacy Migration**: Replace `DEV_CONFIG.DEV_USER_ID` with `auth.uid()` from the actual Supabase session in all Server Actions

2. **Bank Integration (MVP Priority 2)**
   - Implement automatic transaction scraping
   - Tech stack: Integration with `woob` (Web Outside Of Browsers)
   - Interop: Python integration to handle the scraping logic
   - Automate the list of transactions from banks directly into the app






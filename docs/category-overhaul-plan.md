# implementation_plan: Category Overhaul & Inference Engine

This document outlines the consolidated plan to overhaul the category system with hierarchy and icons, and implement a hybrid transaction categorization engine for bulk imports.

## 1. Database Migration (Supabase)

The database schema will be updated to support hierarchical categories and a rules-based categorization engine.

### A. Categories Table Evolution
- **Add Column**: `parent_id` (UUID, self-references `public.categories.id` ON DELETE CASCADE).
- **Add Column**: `icon` (text, stores Lucide icon name, default 'circle-help').
- **Constraint Update**:
    - Drop `unique (user_id, name)`.
    - Add `unique (user_id, name, parent_id)`. This allows "Other" under different parents.

### B. Merchant Rules Table (The Brain)
Create a new table `public.merchant_rules`:
- `id`: UUID (PK).
- `user_id`: UUID (FK to auth.users, NULL means Global).
- `match_pattern`: TEXT (The keyword to match).
- `category_id`: UUID (FK to categories).
- `match_type`: TEXT (Enum: 'EXACT', 'CONTAINS').
- `created_at`: TIMESTAMPTZ.
- **Unique Constraint**: `(user_id, match_pattern)` for specific user rules.

## 2. Global "Seed" Categories & Rules

A seed script will populate the system with a standard hierarchy.

### Standard Hierarchy (Icons & Colors)
| Parent | Icon | Color | Children |
|---|---|---|---|
| **Housing** | `Home` | `#3b82f6` (Blue) | Rent, Utilities, Maintenance |
| **Food & Drink** | `Utensils` | `#f59e0b` (Amber) | Groceries, Dining Out, Coffee |
| **Transport** | `Car` | `#6366f1` (Indigo) | Fuel, Public Transit, Uber/Lyft |
| **Entertainment** | `Ticket` | `#ec4899` (Pink) | Movies, Gaming, Subscriptions |
| **Health** | `HeartPulse` | `#ef4444` (Red) | Pharmacy, Gym, Insurance |
| **Income** | `TrendingUp` | `#10b981` (Emerald) | Salary, Freelance, Dividends |

### Global Starter Rules
Seed `merchant_rules` (where `user_id is NULL`) with common patterns:
- `uber`, `lyft`, `shell` -> Transport
- `mcdonalds`, `starbucks`, `burger king` -> Food & Drink
- `netflix`, `spotify`, `hulu` -> Entertainment
- `amazon`, `walmart`, `target` -> Shopping (or Food & Drink if applicable)

## 3. Categorization Inference Mechanism

Implement a fall-through logic in `/src/lib/categorization/engine.ts`:

1.  **Normalization**: Lowercase, remove excess whitespace, strip long numeric sequences (store IDs).
2.  **User Rules (Priority 1)**: Query `merchant_rules` where `user_id = current_user`.
    - Match Exact first, then Contains.
3.  **Global Dictionary (Priority 2)**: Query `merchant_rules` where `user_id IS NULL`.
4.  **Keyword Matching**: Check if any Category name is contained in the description.
5.  **Fallback**: Return NULL (mark as "Uncategorized" in UI for manual review).

## 4. UI/UX Adaptations

### A. Main Dashboard
- Since we don't have a `/settings` page yet, add a **"Settings" icon/link** in the `Navbar` or header that opens a dedicated **Category Manager Modal**.

### B. Transaction Forms
- **Grouped Combobox**: Update the category selector in `AddTransactionForm` and `ImportTransactionsForm` to show Parent categories as headers and children as indented items.
- **Icon Rendering**: Create a `CategoryIcon` component to dynamically render Lucide icons.

### C. Learning Mechanism
- When a user manually updates a transaction's category, automatically create/upsert a `merchant_rules` entry for that user and pattern.

## 5. Implementation Steps

1.  **SQL Execution**: Apply the migration to Supabase.
2.  **Seed Script**: Create a script to populate categories and global rules.
3.  **Engine Logic**: Implement the `guessCategory` utility.
4.  **Form Updates**: Refactor the category selectors to support hierarchy.
5.  **Integration**: Update `importTransactions` action to use the new engine.
6.  **Admin UI**: Build the Category Manager view.

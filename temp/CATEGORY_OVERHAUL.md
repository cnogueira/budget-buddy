# Technical Spec: Hierarchical Category System

## 1. Database Schema Evolution

We need to modify the `public.categories` table to support hierarchy.

### Migration Requirements:

* **Self-Reference:** Add a `parent_id` column that references `categories.id`.
* **Icon Support:** Add an `icon` column to store the name of the Lucide icon string (e.g., "shopping-cart").
* **Constraint Update:** The unique constraint should now be `(user_id, name, parent_id)` so a user can have "Other" under "Food" and "Other" under "Travel".

```sql
-- Migration Proposal
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN icon text DEFAULT 'circle-help';

-- Drop old unique constraint and add new one
ALTER TABLE public.categories DROP CONSTRAINT categories_user_id_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_user_id_name_parent_unique 
UNIQUE (user_id, name, parent_id);

```

---

## 2. Global "Seed" Categories (The Starter Pack)

When a user signs up, the agent should populate these defaults. I've mapped these to **Lucide-React** icons and sensible hex colors.

| Parent Category         | Icon           | Color                 | Child Examples                  |
| ----------------------- | -------------- | --------------------- | ------------------------------- |
| **Housing**       | `Home`       | `#3b82f6` (Blue)    | Rent, Utilities, Maintenance    |
| **Food & Drink**  | `Utensils`   | `#f59e0b` (Amber)   | Groceries, Dining Out, Coffee   |
| **Transport**     | `Car`        | `#6366f1` (Indigo)  | Fuel, Public Transit, Uber/Lyft |
| **Entertainment** | `Ticket`     | `#ec4899` (Pink)    | Movies, Gaming, Subscriptions   |
| **Health**        | `HeartPulse` | `#ef4444` (Red)     | Pharmacy, Gym, Insurance        |
| **Income**        | `TrendingUp` | `#10b981` (Emerald) | Salary, Freelance, Dividends    |

---

## 3. UI/UX Strategy: The "Command Palette" Approach

Since you want to avoid bloating the "Add Transaction" modal, we will split the concerns:

### A. The Transaction Modal (The "Selector")

Instead of a simple `<select>` dropdown, use a **Combobox (Searchable Select)**.

* **Visual Grouping:** Use bold headers for Parents and indented rows for Children.
* **Searchability:** Users should be able to type "Rent" and see "Housing > Rent".
* **Shortcut:** Keep the "Add New" button, but it should open a **nested mini-modal** or redirect to a dedicated Category Management page.

### B. Dedicated Category Manager (New Page)

Move the heavy editing (changing colors, re-parenting, deleting) to a separate `/settings/categories` page.

* **UX Pattern:** Use an "Accordion" or "Tree" view.
* **Drag & Drop:** (Future improvement) allow users to drag a child from one parent to another.

---

## 4. Implementation Instructions for the Agent

### Step 1: Frontend Logic (Lucide Icon Renderer)

Since you are using `lucide-react`, create a dynamic icon component to render icons stored as strings in the DB.

```typescript
import * as Icons from 'lucide-react';

export const CategoryIcon = ({ name, color, size = 20 }) => {
  const LucideIcon = Icons[name as keyof typeof Icons] || Icons.HelpCircle;
  return <LucideIcon color={color} size={size} />;
};

```

### Step 2: The Category Selector Component

Implement a grouped dropdown in the "Add Transaction" modal. Use `optgroup` for standard HTML or a custom Div-based list for better styling.

```typescript
// Proposed logic for grouping categories for the UI
const organizedCategories = categories.reduce((acc, cat) => {
  if (!cat.parent_id) {
    acc[cat.id] = { ...cat, children: [] };
  } else {
    acc[cat.parent_id]?.children.push(cat);
  }
  return acc;
}, {});

```

### Step 3: Color Logic Refinement

* **Incomes:** Stay within the Emerald/Teal/Green spectrum (`#10b981`, `#14b8a6`, `#22c55e`).
* **Expenses:** Use a broader palette (Blue, Red, Amber, Pink, Purple, Indigo).
* **Hierarchy:** Child categories should inherit the parent's color by default, but allow an override.

---

## 5. Summary of Next Steps

1. **Run Migration:** Update the Supabase schema to include `parent_id` and `icon`.
2. **Seed Data:** Insert the hierarchical "Starter Pack" for the current user.
3. **Update Modal:** Replace the flat dropdown with a grouped Searchable Combobox.
4. **Category Settings:** Create a new view under `/settings` to allow full management of the hierarchy.

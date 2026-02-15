# Technical Spec: Hybrid Transaction Categorization Engine

## 1. Context & Objective

We are building a transaction classification engine that will be used when bulk importing transactions.

The goal is to automatically assign a category (e.g., "Groceries", "Transport") to imported bank transactions based on their description.

**Core Philosophy:**

1. **User Sovereignty (Top Priority):** If a user manually categorizes a merchant once, the system must remember and apply that logic forever for that specific user.
2. **Cost-Effective Intelligence:** Use lightweight, local string algorithms (Fuzzy Matching/Regex) instead of expensive external AI/Vector APIs for the general categorization logic.

---

## 2. Architecture & Data Flow

The categorization pipeline follows a "Fall-Through" logic. As soon as a step finds a match, the process stops, and the category is assigned.

1. **Input:** Raw Transaction (Date, Amount, Description).
2. **Step 0 - Normalization:** Clean string (lowercase, remove excess whitespace/numbers).
3. **Step 1 - Private User Rules (Exact & Pattern):** Check if *this* user has categorized this merchant before.
4. **Step 2 - Global Dictionary (Fuzzy/Regex):** Check against a built-in JSON library of common merchants.
5. **Step 3 - Fallback:** Mark as "Uncategorized" for manual review.

---

## 3. Database Schema (PostgreSQL/SQL Flavor)

We need to store transactions and the rules that classify them.

### A. `categories`

*Standard list of categories.*

* `id` (UUID, PK)
* `name` (String) - e.g., "Dining", "Utilities"
* `icon` (String, optional)

### B. `transactions`

*The actual bank data.*

* `id` (UUID, PK)
* `user_id` (FK)
* `raw_description` (String) - Original bank text (e.g., "UBER EATS San Francisco")
* `clean_description` (String) - Normalized text (e.g., "uber eats")
* `amount` (Decimal)
* `category_id` (FK, Nullable) - The assigned category
* `is_manual` (Boolean) - `true` if set by user, `false` if guessed by system.

### C. `merchant_rules` (The Brain)

*Stores learned associations. Can be User-specific or Global.*

* `id` (UUID, PK)
* `user_id` (FK, Nullable) - **Crucial.** If `NULL`, it is a "Global Rule". If set, it applies *only* to that user.
* `match_pattern` (String) - The keyword or string to match (e.g., "netflix", "starbucks").
* `category_id` (FK) - The target category.
* `match_type` (Enum: 'EXACT', 'CONTAINS') - Optimization for search strategy.

---

## 4. Backend Implementation (Node.js)

### Step 0: Helper - String Normalizer

**Goal:** Remove noise to make matching easier.

**TypeScript**

```
// utils/normalizer.ts
export function normalizeDescription(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[0-9]{3,}/g, '') // Remove long number sequences (store IDs)
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim();
}
```

### The Categorization Logic (Service Layer)

This function should be called during the "Bulk Upload" process.

**TypeScript**

```
// services/categorizationService.ts

import { db } from '@/lib/db';
import { normalizeDescription } from '@/utils/normalizer';
import { closest } from 'fastest-levenshtein'; // Recommendation: Use 'fastest-levenshtein' for fuzzy matching

export async function guessCategory(userId: string, rawDescription: string) {
  const cleanDesc = normalizeDescription(rawDescription);
  
  // --- PRIORITY 1: CHECK USER RULES ---
  // Query DB: Find rules where user_id = current_user AND cleanDesc contains rule.pattern
  // We prioritize "Exact Matches" over "Contains" if both exist.
  
  const userRules = await db.merchantRules.findMany({
    where: { userId: userId }
  });

  // 1a. Exact Match (Fastest)
  const exactMatch = userRules.find(r => r.match_pattern === cleanDesc);
  if (exactMatch) return { categoryId: exactMatch.categoryId, source: 'USER_RULE' };

  // 1b. Substring Match
  const subMatch = userRules.find(r => cleanDesc.includes(r.match_pattern));
  if (subMatch) return { categoryId: subMatch.categoryId, source: 'USER_RULE' };

  // --- PRIORITY 2: GLOBAL DICTIONARY (The "General Mechanism") ---
  // If no user rule exists, check the global rules (where user_id is NULL).
  // For performance, load these into memory or cache (Redis) on app startup.
  
  const globalRules = await getGlobalRulesCached(); // Returns array of { pattern: 'uber', categoryId: '...' }

  // 2a. Standard Keyword Search
  const globalMatch = globalRules.find(r => cleanDesc.includes(r.match_pattern));
  if (globalMatch) return { categoryId: globalMatch.categoryId, source: 'GLOBAL_MATCH' };
  
  // 2b. Fuzzy Match (Optional but Recommended)
  // Handles typos: "Netlfix" -> "Netflix"
  // Only run this if no direct match found.
  // Warning: Set a high threshold (e.g. distance < 3) to avoid false positives.
  
  // --- FALLBACK ---
  return { categoryId: null, source: 'UNKNOWN' };
}
```

---

## 5. The "Learning" Mechanism (Frontend Next.js Integration)

The system only gets smarter if we capture user feedback.

**Action:** When a user updates a transaction's category in the UI.

**Endpoint Logic (`POST /api/transactions/update-category`):**

1. Update the `transactions` table with the new `category_id`.
2. **The Trigger:** Automatically create (or update) a `merchant_rules` entry for this user.

**TypeScript**

```
// api/update-category.ts (Pseudo-code)

async function handleUserCategoryChange(transactionId, newCategoryId, userId) {
  // 1. Update the specific transaction
  const tx = await db.transaction.update({
    where: { id: transactionId },
    data: { categoryId: newCategoryId, isManual: true }
  });

  // 2. Learn for the future (Upsert Rule)
  // We use the 'clean_description' of the transaction as the pattern
  await db.merchantRules.upsert({
    where: { 
      userId_matchPattern: { 
        userId: userId, 
        matchPattern: tx.clean_description 
      } 
    },
    create: {
      userId: userId,
      matchPattern: tx.clean_description, // e.g., "starbucks coffee"
      categoryId: newCategoryId,
      matchType: 'EXACT' // Default to Exact to avoid over-matching initially
    },
    update: {
      categoryId: newCategoryId // Overwrite old rule if they changed their mind
    }
  });
}
```

---

## 6. Seed Data (Global Dictionary Starter Pack)

To make "Priority 2" work immediately, seed the `merchant_rules` table (entries where `user_id = NULL`) with common patterns:

| **Pattern** | **Category** |
| ----------------- | ------------------ |
| `uber`          | Transport          |
| `lyft`          | Transport          |
| `shell`         | Transport          |
| `mcdonalds`     | Food & Dining      |
| `starbucks`     | Food & Dining      |
| `walmart`       | Groceries          |
| `kroger`        | Groceries          |
| `netflix`       | Subscriptions      |
| `spotify`       | Subscriptions      |
| `amazon`        | Shopping           |

---

## 7. Summary of Advantages

* **Zero Marginal Cost:** No OpenAI/Pinecone API bills. It's just DB text queries.
* **High Precision:** User rules always win.
* **Self-Correcting:** As users categorize "Unknown" items, the `merchant_rules` table grows, and the system auto-learns *for that user* without needing to retrain a model.

---

### Next Steps for the Agent

1. **Database Migration:** Create the `merchant_rules` table as specified.
2. **Seed Script:** Write a script to populate the Global Rules with top 50 common US/EU merchants.
3. **Hook Implementation:** Connect the "Save Category" button in the frontend to the "Upsert Rule" logic in the backend.

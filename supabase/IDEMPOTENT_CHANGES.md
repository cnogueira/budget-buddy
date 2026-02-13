# Idempotent SQL Scripts - Changes Summary

## Problem
Running `01_initial_schema.sql` multiple times resulted in the error:
```
[42710] ERROR: type "transaction_type" already exists
```

## Solution
All SQL scripts have been updated to be **idempotent**, meaning they can be run multiple times safely without errors. Existing data is preserved.

## Changes Made

### 01_initial_schema.sql

#### 1. ENUMS
- ✅ **Idempotent** - Uses `DO` block with exception handling for `transaction_type` enum

#### 2. TABLES
- ✅ Changed `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS` for both:
  - `public.categories`
  - `public.transactions`
- ✅ **Added migration logic** - Adds `category_id` column to existing `transactions` table if missing
- ✅ Preserves existing data and structure

#### 3. INDEXES
- ✅ Changed `CREATE INDEX` to `CREATE INDEX IF NOT EXISTS` for all 5 indexes:
  - `idx_transactions_user_id`
  - `idx_transactions_category_id`
  - `idx_transactions_date`
  - `idx_categories_user_id`
  - `idx_categories_user_type`

#### 4. ROW LEVEL SECURITY (RLS)
- ✅ Wrapped all policy creation in `DO` blocks
- ✅ Each block drops the policy if it exists, then recreates it
- ✅ Handles all 8 policies (4 for categories, 4 for transactions)

### 02_dev_setup.sql
- ✅ **Idempotent** - Uses `DO` block with `NOT EXISTS` check for test user (handles both id and email conflicts)
- ✅ `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` is naturally idempotent

### 03_restore_rls.sql
- ✅ **Already idempotent** - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is naturally idempotent

## Data Preservation

All changes preserve existing data:
- ✅ Tables: `IF NOT EXISTS` skips creation if table already exists
- ✅ **Schema migration**: Adds missing `category_id` column to existing tables
- ✅ Indexes: `IF NOT EXISTS` skips creation if index already exists
- ✅ Enums: Exception handling skips creation if enum already exists
- ✅ Policies: `DROP IF EXISTS` + `CREATE` recreates policies with same definitions
- ✅ User data: `NOT EXISTS` check prevents duplicate test user creation (handles both id and email conflicts)

## Common Migration Scenarios

### Scenario 1: Fresh Database
- All tables, columns, and indexes are created from scratch
- No migration needed

### Scenario 2: Database with Old Schema (missing `category_id`)
- Tables already exist → skipped
- `category_id` column missing → automatically added
- Indexes created after column exists → no errors
- Existing transaction data preserved

### Scenario 3: Database with Current Schema
- Everything already exists → all commands safely skipped
- No changes, no errors

## Usage

You can now safely run any script multiple times:

```bash
# Run as many times as needed - no errors!
# Execute in Supabase SQL Editor
01_initial_schema.sql
02_dev_setup.sql  # optional, dev only
03_restore_rls.sql  # when ready for production
```

## Notes

- ✅ All scripts maintain the same functionality
- ✅ No data loss when re-running scripts
- ✅ Policies are recreated to ensure they match the latest definitions
- ✅ RLS enable/disable commands are naturally idempotent in PostgreSQL


# Supabase Database Setup

This folder contains SQL scripts to set up the Budget Buddy database.

## Quick Start (First Time Setup)

Run these scripts **in order** via the Supabase SQL Editor:

### 1. Initial Schema
```
File: 01_initial_schema.sql
```
Creates all tables, indexes, and RLS policies.

**Note**: All scripts are idempotent and can be safely run multiple times. Existing data will be preserved.

### 2. Development Setup (Optional)
```
File: 02_dev_setup.sql
```
Creates a test user and disables RLS for easier development.

⚠️ **Development only** - skip this in production.

### 3. Restore RLS (When Ready for Production)
```
File: 03_restore_rls.sql
```
Re-enables RLS when you implement proper authentication.

## How to Execute

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of each file
4. Paste and execute in order
5. Verify tables were created in **Table Editor**

## Database Schema

### Tables

**categories**
- User-defined categories with colors
- Linked to auth.users via user_id
- Unique names and colors per user
- Max 6 income categories (green palette)
- Max 26 expense categories (varied palette)

**transactions**
- Financial transactions (income/expenses)
- Linked to categories via category_id
- Linked to auth.users via user_id

### Security

All tables use Row Level Security (RLS) to ensure users can only access their own data.

RLS is **disabled** in development mode (02_dev_setup.sql) and **re-enabled** for production (03_restore_rls.sql).

## Dev User Details

The dev user created by `02_dev_setup.sql`:
- **UUID**: `00000000-0000-0000-0000-000000000001`
- **Email**: `dev@budgetbuddy.local`
- **Password**: `devpassword123`

This is already configured in `src/lib/dev-config.ts`.

## After Running the Scripts

Start the dev server:
```bash
npm run dev
```

Test the app:
- Open http://localhost:3000
- Add a transaction
- Create categories
- See colored categories in the list

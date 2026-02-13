-- =====================================================
-- Budget Buddy - Complete Database Schema
-- =====================================================
-- This is a self-contained script that sets up the entire database schema.
-- Run this once on a fresh Supabase project to initialize everything.
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Transaction type enum (income or expense)
-- Using DO block to make enum creation idempotent
do $$ begin
    create type transaction_type as enum ('income', 'expense');
exception
    when duplicate_object then null;
end $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Categories table
-- Stores user-defined categories with colors for visual organization
create table if not exists public.categories
(
    id            uuid        default gen_random_uuid() primary key,
    user_id       uuid        references auth.users not null,
    name          text        not null,
    category_type transaction_type not null,
    color         text        not null, -- hex color code
    created_at    timestamptz default now() not null,

    -- Constraints
    unique (user_id, name),  -- Category names must be unique per user
    unique (user_id, color)  -- Colors must be unique per user
);

-- Transactions table
-- Stores all financial transactions (income and expenses)
create table if not exists public.transactions
(
    id          uuid             default gen_random_uuid() primary key,
    user_id     uuid             references auth.users not null,
    amount      decimal(12, 2)   not null,
    type        transaction_type not null,
    category_id uuid             references public.categories(id),
    description text,
    date        date             not null default current_date,
    created_at  timestamptz      default now() not null
);

-- Add category_id column if it doesn't exist (migration for existing tables)
do $$ begin
    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
        and table_name = 'transactions'
        and column_name = 'category_id'
    ) then
        alter table public.transactions add column category_id uuid references public.categories(id);
    end if;
end $$;

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Indexes for better query performance
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_categories_user_type on public.categories(user_id, category_type);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Categories policies
-- Drop existing policies if they exist, then create them
do $$ begin
    drop policy if exists "Users can view their own categories" on public.categories;
    create policy "Users can view their own categories"
        on public.categories for select
        using (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can insert their own categories" on public.categories;
    create policy "Users can insert their own categories"
        on public.categories for insert
        with check (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can update their own categories" on public.categories;
    create policy "Users can update their own categories"
        on public.categories for update
        using (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can delete their own categories" on public.categories;
    create policy "Users can delete their own categories"
        on public.categories for delete
        using (auth.uid() = user_id);
end $$;

-- Transactions policies
do $$ begin
    drop policy if exists "Users can view their own transactions" on public.transactions;
    create policy "Users can view their own transactions"
        on public.transactions for select
        using (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can insert their own transactions" on public.transactions;
    create policy "Users can insert their own transactions"
        on public.transactions for insert
        with check (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can update their own transactions" on public.transactions;
    create policy "Users can update their own transactions"
        on public.transactions for update
        using (auth.uid() = user_id);
end $$;

do $$ begin
    drop policy if exists "Users can delete their own transactions" on public.transactions;
    create policy "Users can delete their own transactions"
        on public.transactions for delete
        using (auth.uid() = user_id);
end $$;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your database is now ready to use!
-- =====================================================


-- =====================================================
-- Budget Buddy - Category Hierarchy & Merchant Rules Migration
-- =====================================================

-- 1. ENUMS (Ensure they exist)
do $$ begin
    create type match_strategy as enum ('EXACT', 'CONTAINS');
exception
    when duplicate_object then null;
end $$;

-- 2. CATEGORIES TABLE EVOLUTION
-- Add hierarchy and icon column
alter table public.categories 
    add column if not exists parent_id uuid references public.categories(id) on delete cascade,
    add column if not exists icon text default 'circle-help';

-- Drop old unique constraint (user_id, name) if it exists and replace it
do $$ begin
    alter table public.categories drop constraint if exists categories_user_id_name_key;
exception
    when undefined_object then null;
end $$;

-- Add new hierarchical unique constraint
do $$ begin
    alter table public.categories add constraint categories_user_id_name_parent_unique 
    unique (user_id, name, parent_id);
exception
    when duplicate_object then null;
end $$;

-- 3. MERCHANT RULES TABLE
create table if not exists public.merchant_rules
(
    id            uuid        default gen_random_uuid() primary key,
    user_id       uuid        references auth.users, -- NULL means Global Rule
    match_pattern text        not null,
    category_id   uuid        references public.categories(id) on delete cascade not null,
    match_type    match_strategy not null default 'CONTAINS',
    created_at    timestamptz default now() not null,

    -- Constraints
    unique (user_id, match_pattern)
);

-- 4. INDEXES
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_merchant_rules_user_id on public.merchant_rules(user_id);
create index if not exists idx_merchant_rules_pattern on public.merchant_rules(match_pattern);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

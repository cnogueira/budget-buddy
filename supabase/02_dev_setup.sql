-- =====================================================
-- Budget Buddy - Development Setup
-- =====================================================
-- This script creates a test user and temporarily disables RLS
-- for easier development without authentication.
--
-- ⚠️  DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION
--
-- Run this AFTER running 01_initial_schema.sql
-- Run 03_restore_rls.sql when you're ready to implement auth
-- =====================================================

-- =====================================================
-- 1. CREATE DEV TEST USER
-- =====================================================

-- Insert a test user directly into auth.users
-- This bypasses the normal Supabase Auth flow for development
-- Use DO block to handle the insert idempotently
do $$ begin
    -- Only insert if the user doesn't exist (by email or id)
    if not exists (
        select 1 from auth.users
        where id = '00000000-0000-0000-0000-000000000001'::uuid
        or email = 'dev@budgetbuddy.local'
    ) then
        insert into auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        )
        values (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'dev@budgetbuddy.local',
            crypt('devpassword123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{}'::jsonb,
            false,
            'authenticated'
        );
    end if;
end $$;

-- =====================================================
-- 2. DISABLE RLS FOR DEVELOPMENT
-- =====================================================

-- Temporarily disable RLS enforcement
-- This allows Server Actions to work without authentication
alter table public.categories disable row level security;
alter table public.transactions disable row level security;

-- =====================================================
-- DEV SETUP COMPLETE
-- =====================================================
-- You can now develop without worrying about auth!
-- The dev user ID is: 00000000-0000-0000-0000-000000000001
-- (This is already configured in src/lib/dev-config.ts)
-- =====================================================


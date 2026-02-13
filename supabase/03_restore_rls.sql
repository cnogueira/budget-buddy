-- =====================================================
-- Budget Buddy - Restore RLS for Production
-- =====================================================
-- This script re-enables RLS when you're ready to implement
-- proper authentication.
--
-- Run this BEFORE deploying to production or when implementing auth
-- =====================================================

-- Re-enable RLS on all tables
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Delete the dev test user (optional - only if you want a clean slate)
-- delete from auth.users where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- RLS RESTORED
-- =====================================================
-- Row Level Security is now active.
-- Users can only access their own data.
-- Make sure to implement proper authentication!
-- =====================================================


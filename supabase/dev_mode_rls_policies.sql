-- Development-friendly RLS policies that don't require authentication
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/ncgwwlyccmpdfuzzlhsy/sql/new

-- Drop existing strict policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Create development policies that allow operations for the dev user without requiring auth
-- These check the user_id in the row, not auth.uid()

CREATE POLICY "Dev mode: allow select for dev user"
ON public.transactions FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Dev mode: allow insert for dev user"
ON public.transactions FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Dev mode: allow update for dev user"
ON public.transactions FOR UPDATE
USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Dev mode: allow delete for dev user"
ON public.transactions FOR DELETE
USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Verify RLS is still enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'transactions';


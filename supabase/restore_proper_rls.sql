-- Restore proper schema with dev user support
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/ncgwwlyccmpdfuzzlhsy/sql/new

-- First, update any NULL user_ids to the dev user (if you ran the previous nullable migration)
UPDATE public.transactions
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Make user_id NOT NULL again
ALTER TABLE public.transactions
ALTER COLUMN user_id SET NOT NULL;

-- Drop development-only policies
DROP POLICY IF EXISTS "Allow all select during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all insert during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all update during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all delete during development" ON public.transactions;

-- Restore proper RLS policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);


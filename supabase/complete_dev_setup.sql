-- Complete development setup for Budget Buddy
-- Run this entire script in Supabase SQL Editor: https://app.supabase.com/project/ncgwwlyccmpdfuzzlhsy/sql/new
-- This will set up everything you need for development

-- Step 1: Create dev user if it doesn't exist
DO $$
DECLARE
  dev_user_id UUID := '00000000-0000-0000-0000-000000000000';
  user_exists BOOLEAN;
BEGIN
  -- Check if user already exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = dev_user_id) INTO user_exists;

  IF NOT user_exists THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      dev_user_id,
      '00000000-0000-0000-0000-000000000000',
      'dev@budgetbuddy.local',
      crypt('DevPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Dev User","full_name":"Development User"}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Dev user created with ID: %', dev_user_id;
  ELSE
    RAISE NOTICE 'Dev user already exists with ID: %', dev_user_id;
  END IF;
END $$;

-- Step 2: Handle user_id column constraints
DO $$
BEGIN
  -- First, temporarily drop NOT NULL constraint if it exists
  BEGIN
    ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;
  EXCEPTION
    WHEN OTHERS THEN
      NULL; -- Ignore if constraint doesn't exist
  END;

  -- Update any NULL user_ids to dev user (if any exist)
  UPDATE public.transactions
  SET user_id = '00000000-0000-0000-0000-000000000000'
  WHERE user_id IS NULL;

  -- Now set NOT NULL constraint
  ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;

  RAISE NOTICE 'user_id column configured as NOT NULL';
END $$;

-- Step 3: Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all select during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all insert during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all update during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow all delete during development" ON public.transactions;
DROP POLICY IF EXISTS "Dev mode: allow select for dev user" ON public.transactions;
DROP POLICY IF EXISTS "Dev mode: allow insert for dev user" ON public.transactions;
DROP POLICY IF EXISTS "Dev mode: allow update for dev user" ON public.transactions;
DROP POLICY IF EXISTS "Dev mode: allow delete for dev user" ON public.transactions;

-- Step 4: Create development-friendly RLS policies
-- These allow operations for the dev user WITHOUT requiring authentication
-- They check the user_id column value, not auth.uid()

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

-- Step 5: Verify everything is set up correctly
DO $$
DECLARE
  user_count INTEGER;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check dev user exists
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE id = '00000000-0000-0000-0000-000000000000';

  RAISE NOTICE 'Dev users found: %', user_count;

  -- Check RLS is enabled
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'transactions' AND relnamespace = 'public'::regnamespace;

  RAISE NOTICE 'RLS enabled on transactions: %', rls_enabled;

  -- Check policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'transactions' AND schemaname = 'public';

  RAISE NOTICE 'RLS policies on transactions: %', policy_count;
END $$;

-- Display final status
SELECT
  'Dev User' as component,
  CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000')
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
UNION ALL
SELECT
  'RLS Enabled' as component,
  CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'transactions' AND relnamespace = 'public'::regnamespace)
    THEN '✅ Yes'
    ELSE '❌ No'
  END as status
UNION ALL
SELECT
  'RLS Policies' as component,
  (SELECT COUNT(*)::text || ' policies' FROM pg_policies WHERE tablename = 'transactions' AND schemaname = 'public') as status;


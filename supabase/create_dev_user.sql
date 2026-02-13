-- Create a development user for testing
-- This user will be used during development until proper authentication is implemented
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/ncgwwlyccmpdfuzzlhsy/sql/new

-- Using all-zeros UUID for easy identification: 00000000-0000-0000-0000-000000000000

DO $$
DECLARE
  dev_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insert dev user if doesn't exist
  INSERT INTO auth.users (
    id,
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
    'dev@budgetbuddy.local',
    crypt('DevPassword123!', gen_salt('bf')), -- Password: DevPassword123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dev User","full_name":"Development User"}',
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Dev user created with ID: %', dev_user_id;
END $$;

-- Verify the user was created
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000000';


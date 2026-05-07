+-- =====================================================
-- Budget Buddy - Category Management Migration
-- =====================================================
-- Self-contained. Run independently against any environment.

-- 1. Drop hierarchy index and column
DROP INDEX IF EXISTS idx_categories_parent_id;
ALTER TABLE public.categories DROP COLUMN IF EXISTS parent_id;

-- 2. Drop color uniqueness (colors are no longer unique per user)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_user_id_color_key;

-- 3. Replace name uniqueness:
--    Old: unique per (user_id, name) or (user_id, name, parent_id)
--    New: unique per (user_id, category_type, name)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_user_id_name_parent_id_key;
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_user_id_name_parent_unique;
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE public.categories
  ADD CONSTRAINT IF NOT EXISTS categories_user_id_type_name_key
  UNIQUE (user_id, category_type, name);

-- 4. Update icon default from 'circle-help' to 'circle'
ALTER TABLE public.categories ALTER COLUMN icon SET DEFAULT 'circle';

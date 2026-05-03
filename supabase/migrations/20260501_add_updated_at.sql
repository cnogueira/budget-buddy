-- =====================================================
-- Budget Buddy - Add updated_at to transactions and categories
-- =====================================================
-- Self-contained. Run independently against any environment.
-- Enables fingerprint-based client-side cache invalidation.

-- 1. Add updated_at column to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill existing rows with created_at so the column is meaningful
UPDATE public.transactions SET updated_at = created_at WHERE updated_at = NOW();

-- 2. Add updated_at column to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.categories SET updated_at = created_at WHERE updated_at = NOW();

-- 3. Trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to transactions
DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Attach trigger to categories
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

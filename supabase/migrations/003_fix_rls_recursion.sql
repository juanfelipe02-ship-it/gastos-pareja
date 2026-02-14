-- Helper function that bypasses RLS to get the user's household_id
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =============================================
-- Fix PROFILES policies
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view household profiles" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR
    household_id = public.get_my_household_id()
  );

-- =============================================
-- Fix CATEGORIES policies
-- =============================================
DROP POLICY IF EXISTS "Users can view household categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert household categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update household categories" ON public.categories;

CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (household_id = public.get_my_household_id());

CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT
  WITH CHECK (household_id = public.get_my_household_id());

CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE
  USING (household_id = public.get_my_household_id());

-- =============================================
-- Fix EXPENSES policies
-- =============================================
DROP POLICY IF EXISTS "Users can view household expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert household expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update household expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete household expenses" ON public.expenses;

CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (household_id = public.get_my_household_id());

CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (household_id = public.get_my_household_id());

CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (household_id = public.get_my_household_id());

CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (household_id = public.get_my_household_id());

-- =============================================
-- Fix SETTLEMENTS policies
-- =============================================
DROP POLICY IF EXISTS "Users can view household settlements" ON public.settlements;
DROP POLICY IF EXISTS "Users can insert household settlements" ON public.settlements;

CREATE POLICY "settlements_select"
  ON public.settlements FOR SELECT
  USING (household_id = public.get_my_household_id());

CREATE POLICY "settlements_insert"
  ON public.settlements FOR INSERT
  WITH CHECK (household_id = public.get_my_household_id());

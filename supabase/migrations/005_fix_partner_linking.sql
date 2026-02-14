-- Server-side function to link partners (bypasses RLS)
CREATE OR REPLACE FUNCTION public.link_partner(invite_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  partner_record RECORD;
  current_record RECORD;
BEGIN
  -- Get current user
  SELECT * INTO current_record FROM profiles WHERE id = current_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Usuario no encontrado');
  END IF;

  -- Check if already linked
  IF current_record.partner_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Ya tienes una pareja vinculada');
  END IF;

  -- Find partner by invite code
  SELECT * INTO partner_record FROM profiles
    WHERE invite_code = upper(invite_code_input);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Código inválido');
  END IF;

  -- Can't link with yourself
  IF partner_record.id = current_user_id THEN
    RETURN jsonb_build_object('error', 'No puedes vincularte contigo mismo');
  END IF;

  -- Check if partner already linked
  IF partner_record.partner_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Esta persona ya tiene pareja vinculada');
  END IF;

  -- Link: move current user to partner's household
  UPDATE profiles SET
    partner_id = partner_record.id,
    household_id = partner_record.household_id
  WHERE id = current_user_id;

  -- Link: set partner's partner_id to current user
  UPDATE profiles SET
    partner_id = current_user_id
  WHERE id = partner_record.id;

  -- Move current user's categories to partner's household (merge)
  -- Delete current user's default categories (they'll use partner's)
  DELETE FROM categories WHERE household_id = current_record.household_id;

  RETURN jsonb_build_object(
    'success', true,
    'partner_name', partner_record.name,
    'household_id', partner_record.household_id
  );
END;
$$;

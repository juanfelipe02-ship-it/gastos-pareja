-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = 'public'
as $$
declare
  new_household_id uuid := gen_random_uuid();
  new_invite_code text := upper(substr(md5(random()::text), 1, 6));
begin
  -- Create profile
  insert into public.profiles (id, name, email, household_id, invite_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new_household_id,
    new_invite_code
  );

  -- Create default categories for this household
  insert into public.categories (name, icon, color, household_id) values
    ('Mercado', '🛒', '#10b981', new_household_id),
    ('Restaurantes', '🍽️', '#f59e0b', new_household_id),
    ('Hogar', '🏠', '#3b82f6', new_household_id),
    ('Transporte', '🚗', '#8b5cf6', new_household_id),
    ('Salud', '💊', '#ef4444', new_household_id),
    ('Entretenimiento', '🎬', '#ec4899', new_household_id),
    ('Ropa', '👕', '#06b6d4', new_household_id),
    ('Otros', '📦', '#6b7280', new_household_id);

  return new;
end;
$$;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

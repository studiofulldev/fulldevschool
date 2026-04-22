-- Auto-creates a profiles row when a new user signs up via GoTrue.
-- Without this trigger, the profiles row only exists if the Angular app's
-- auth service calls upsertProfile during the registration flow. Direct
-- signups via GoTrue API (e.g., OAuth callbacks, local dev) would leave
-- users without a profile row, causing social links and other profile
-- operations to silently fail.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, provider, role, accepted_terms)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'user',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Updated handle_new_user: check for is_invited metadata
-- If invited, use the provided organization_id; otherwise create a new org (owner registration)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  invited_org_id UUID;
  invited_role TEXT;
BEGIN
  -- Check if this user was invited (created by owner/manager via edge function)
  invited_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  invited_role := COALESCE(NEW.raw_user_meta_data->>'invited_role', 'employee');

  IF invited_org_id IS NOT NULL THEN
    -- Invited user: join existing org with assigned role
    INSERT INTO public.profiles (user_id, full_name, organization_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', invited_org_id);

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, invited_role::app_role, invited_org_id);
  ELSE
    -- Self-registered user: create new org, become owner
    INSERT INTO public.organizations (name, owner_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Organization'),
      NEW.id
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (user_id, full_name, organization_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_org_id);

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'owner', new_org_id);
  END IF;

  RETURN NEW;
END;
$$;

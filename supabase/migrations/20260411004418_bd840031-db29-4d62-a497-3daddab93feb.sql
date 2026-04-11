
-- 1. Add senior_employee to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'senior_employee';

-- 2. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Organization',
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Add organization_id to all tables
ALTER TABLE public.farms ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.farm_assignments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.crops ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.livestock ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.harvests ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.finance_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. Helper function: get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 5. Helper function: check same org
CREATE OR REPLACE FUNCTION public.same_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- 6. Helper: is senior employee with farm access
CREATE OR REPLACE FUNCTION public.is_senior_employee_on_farm(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_assignments
    WHERE user_id = _user_id AND farm_id = _farm_id AND role = 'senior_employee'
  )
$$;

-- 7. Update handle_new_user trigger function
-- Now creates an organization and assigns owner role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for this user (they become owner)
  INSERT INTO public.organizations (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Organization') || '''s Organization', NEW.id)
  RETURNING id INTO new_org_id;

  -- Create profile linked to org
  INSERT INTO public.profiles (user_id, full_name, organization_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_org_id);

  -- Assign owner role linked to org
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'owner', new_org_id);

  RETURN NEW;
END;
$$;

-- 8. Organizations RLS
CREATE POLICY "Owners see own org"
ON public.organizations FOR SELECT
USING (owner_id = auth.uid() OR same_org(auth.uid(), id));

CREATE POLICY "Owners update own org"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- 9. Drop ALL existing RLS policies and recreate with org scoping

-- FARMS
DROP POLICY IF EXISTS "Owners full access to farms" ON public.farms;
DROP POLICY IF EXISTS "Assigned users can view farms" ON public.farms;
DROP POLICY IF EXISTS "Managers can update assigned farms" ON public.farms;

CREATE POLICY "Owner full access farms"
ON public.farms FOR ALL
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers view assigned farms"
ON public.farms FOR SELECT
USING (same_org(auth.uid(), organization_id) AND (has_farm_access_direct(auth.uid(), id)));

CREATE POLICY "Managers update assigned farms"
ON public.farms FOR UPDATE
USING (is_farm_manager(auth.uid(), id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees view assigned farm"
ON public.farms FOR SELECT
USING (is_senior_employee_on_farm(auth.uid(), id) AND same_org(auth.uid(), organization_id));

-- CROPS
DROP POLICY IF EXISTS "Owners full access to crops" ON public.crops;
DROP POLICY IF EXISTS "Managers CRUD crops" ON public.crops;
DROP POLICY IF EXISTS "Employees view crops" ON public.crops;

CREATE POLICY "Owner view crops"
ON public.crops FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD crops"
ON public.crops FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees view crops"
ON public.crops FOR SELECT
USING (is_senior_employee_on_farm(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

-- LIVESTOCK
DROP POLICY IF EXISTS "Owners full access to livestock" ON public.livestock;
DROP POLICY IF EXISTS "Managers CRUD livestock" ON public.livestock;
DROP POLICY IF EXISTS "Employees view livestock" ON public.livestock;

CREATE POLICY "Owner view livestock"
ON public.livestock FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD livestock"
ON public.livestock FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees view livestock"
ON public.livestock FOR SELECT
USING (is_senior_employee_on_farm(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

-- HARVESTS
DROP POLICY IF EXISTS "Owners full access to harvests" ON public.harvests;
DROP POLICY IF EXISTS "Managers CRUD harvests" ON public.harvests;
DROP POLICY IF EXISTS "Employees view harvests" ON public.harvests;

CREATE POLICY "Owner view harvests"
ON public.harvests FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD harvests"
ON public.harvests FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees view harvests"
ON public.harvests FOR SELECT
USING (is_senior_employee_on_farm(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

-- INVENTORY
DROP POLICY IF EXISTS "Owners full access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Managers CRUD inventory" ON public.inventory;
DROP POLICY IF EXISTS "Employees view inventory" ON public.inventory;

CREATE POLICY "Owner view inventory"
ON public.inventory FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD inventory"
ON public.inventory FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees CRUD inventory"
ON public.inventory FOR ALL
USING (is_senior_employee_on_farm(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

-- FINANCE_RECORDS (owner & manager only, no senior employee access)
DROP POLICY IF EXISTS "Owners full access to finance" ON public.finance_records;
DROP POLICY IF EXISTS "Managers CRUD finance" ON public.finance_records;
DROP POLICY IF EXISTS "Employees view finance" ON public.finance_records;

CREATE POLICY "Owner view finance"
ON public.finance_records FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD finance"
ON public.finance_records FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

-- TASKS
DROP POLICY IF EXISTS "Owners full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers CRUD tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees update own tasks" ON public.tasks;

CREATE POLICY "Owner view tasks"
ON public.tasks FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers CRUD tasks"
ON public.tasks FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees view farm tasks"
ON public.tasks FOR SELECT
USING (is_senior_employee_on_farm(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Senior employees update assigned tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = assigned_to AND same_org(auth.uid(), organization_id));

-- FARM_ASSIGNMENTS
DROP POLICY IF EXISTS "Owners manage assignments" ON public.farm_assignments;
DROP POLICY IF EXISTS "Users see own assignments" ON public.farm_assignments;

CREATE POLICY "Owner manage assignments"
ON public.farm_assignments FOR ALL
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers manage farm assignments"
ON public.farm_assignments FOR ALL
USING (is_farm_manager(auth.uid(), farm_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Users see own assignments"
ON public.farm_assignments FOR SELECT
USING (auth.uid() = user_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners manage all roles" ON public.user_roles;

CREATE POLICY "Users view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owner manage roles in org"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers view roles in org"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'manager') AND same_org(auth.uid(), organization_id));

-- PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners view all profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner view org profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'owner') AND same_org(auth.uid(), organization_id));

CREATE POLICY "Managers view org profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'manager') AND same_org(auth.uid(), organization_id));

-- MESSAGES (communication rules enforced)
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients mark as read" ON public.messages;
DROP POLICY IF EXISTS "Users delete own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users delete received messages" ON public.messages;

CREATE POLICY "Users see own messages"
ON public.messages FOR SELECT
USING ((auth.uid() = sender_id OR auth.uid() = recipient_id) AND same_org(auth.uid(), organization_id));

CREATE POLICY "Users send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND same_org(auth.uid(), organization_id));

CREATE POLICY "Recipients mark as read"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id AND same_org(auth.uid(), organization_id));

CREATE POLICY "Users delete own messages"
ON public.messages FOR DELETE
USING ((auth.uid() = sender_id OR auth.uid() = recipient_id) AND same_org(auth.uid(), organization_id));

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_farms_org ON public.farms(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_farm_assignments_org ON public.farm_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_crops_org ON public.crops(organization_id);
CREATE INDEX IF NOT EXISTS idx_livestock_org ON public.livestock(organization_id);
CREATE INDEX IF NOT EXISTS idx_harvests_org ON public.harvests(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON public.inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_org ON public.finance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_org ON public.messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_farm_assignments_role ON public.farm_assignments(role);

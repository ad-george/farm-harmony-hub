
-- Drop ALL existing policies to start fresh

-- farms
DROP POLICY IF EXISTS "Owners full access to farms" ON public.farms;
DROP POLICY IF EXISTS "Assigned users can view farms" ON public.farms;
DROP POLICY IF EXISTS "Managers can update assigned farms" ON public.farms;

-- farm_assignments
DROP POLICY IF EXISTS "Owners manage assignments" ON public.farm_assignments;
DROP POLICY IF EXISTS "Managers see farm assignments" ON public.farm_assignments;
DROP POLICY IF EXISTS "Users see own assignments" ON public.farm_assignments;

-- crops
DROP POLICY IF EXISTS "Owners full access to crops" ON public.crops;
DROP POLICY IF EXISTS "Managers CRUD crops on assigned farms" ON public.crops;
DROP POLICY IF EXISTS "Employees view crops on assigned farms" ON public.crops;

-- livestock
DROP POLICY IF EXISTS "Owners full access to livestock" ON public.livestock;
DROP POLICY IF EXISTS "Managers CRUD livestock on assigned farms" ON public.livestock;
DROP POLICY IF EXISTS "Employees view livestock on assigned farms" ON public.livestock;

-- inventory
DROP POLICY IF EXISTS "Owners full access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Managers CRUD inventory on assigned farms" ON public.inventory;
DROP POLICY IF EXISTS "Employees view inventory on assigned farms" ON public.inventory;

-- finance_records
DROP POLICY IF EXISTS "Owners full access to finance" ON public.finance_records;
DROP POLICY IF EXISTS "Managers CRUD finance on assigned farms" ON public.finance_records;
DROP POLICY IF EXISTS "Employees view finance on assigned farms" ON public.finance_records;

-- tasks
DROP POLICY IF EXISTS "Owners full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers CRUD tasks on assigned farms" ON public.tasks;
DROP POLICY IF EXISTS "Employees view tasks on assigned farms" ON public.tasks;
DROP POLICY IF EXISTS "Employees update own tasks" ON public.tasks;

-- messages
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients mark as read" ON public.messages;

-- user_roles
DROP POLICY IF EXISTS "Owners can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- ========== RECREATE ALL AS PERMISSIVE ==========

-- Helper: has_farm_access_direct (avoids querying farm_assignments from within farm_assignments policies)
CREATE OR REPLACE FUNCTION public.has_farm_access_direct(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    has_role(_user_id, 'owner') 
    OR EXISTS (
      SELECT 1 FROM public.farm_assignments 
      WHERE user_id = _user_id AND farm_id = _farm_id
    )
$$;

CREATE OR REPLACE FUNCTION public.is_farm_manager(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_assignments 
    WHERE user_id = _user_id AND farm_id = _farm_id AND role = 'manager'
  )
$$;

-- ===== farm_assignments =====
CREATE POLICY "Users see own assignments" ON public.farm_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners manage assignments" ON public.farm_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- ===== farms =====
CREATE POLICY "Owners full access to farms" ON public.farms
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Assigned users can view farms" ON public.farms
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), id));

CREATE POLICY "Managers can update assigned farms" ON public.farms
  FOR UPDATE USING (public.is_farm_manager(auth.uid(), id));

-- ===== crops =====
CREATE POLICY "Owners full access to crops" ON public.crops
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers CRUD crops" ON public.crops
  FOR ALL USING (public.is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view crops" ON public.crops
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), farm_id));

-- ===== livestock =====
CREATE POLICY "Owners full access to livestock" ON public.livestock
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers CRUD livestock" ON public.livestock
  FOR ALL USING (public.is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view livestock" ON public.livestock
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), farm_id));

-- ===== inventory =====
CREATE POLICY "Owners full access to inventory" ON public.inventory
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers CRUD inventory" ON public.inventory
  FOR ALL USING (public.is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view inventory" ON public.inventory
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), farm_id));

-- ===== finance_records =====
CREATE POLICY "Owners full access to finance" ON public.finance_records
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers CRUD finance" ON public.finance_records
  FOR ALL USING (public.is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view finance" ON public.finance_records
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), farm_id));

-- ===== tasks =====
CREATE POLICY "Owners full access to tasks" ON public.tasks
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers CRUD tasks" ON public.tasks
  FOR ALL USING (public.is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view tasks" ON public.tasks
  FOR SELECT USING (public.has_farm_access_direct(auth.uid(), farm_id));

CREATE POLICY "Employees update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- ===== messages =====
CREATE POLICY "Users see own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients mark as read" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ===== user_roles =====
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- ===== profiles =====
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

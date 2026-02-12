
-- =============================================
-- 1. FARMS TABLE
-- =============================================
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  size TEXT,
  type TEXT NOT NULL DEFAULT 'Mixed',
  status TEXT NOT NULL DEFAULT 'Active',
  employees INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. FARM ASSIGNMENTS (manager/employee to farm)
-- =============================================
CREATE TABLE public.farm_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);
ALTER TABLE public.farm_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. CROPS TABLE
-- =============================================
CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT,
  area TEXT,
  planted_date DATE,
  expected_harvest DATE,
  status TEXT NOT NULL DEFAULT 'Growing',
  yield_estimate NUMERIC,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. LIVESTOCK TABLE
-- =============================================
CREATE TABLE public.livestock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  breed TEXT,
  count INTEGER NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'Healthy',
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. INVENTORY TABLE
-- =============================================
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  min_stock NUMERIC DEFAULT 0,
  cost_per_unit NUMERIC DEFAULT 0,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'In Stock',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. FINANCE RECORDS TABLE
-- =============================================
CREATE TABLE public.finance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- 9. HELPER FUNCTION: Check farm access
-- =============================================
CREATE OR REPLACE FUNCTION public.has_farm_access(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'owner') 
    OR EXISTS (
      SELECT 1 FROM public.farm_assignments 
      WHERE user_id = _user_id AND farm_id = _farm_id
    )
$$;

-- =============================================
-- 10. RLS POLICIES
-- =============================================

-- FARMS: Owner sees all, managers/employees see assigned farms
CREATE POLICY "Owners full access to farms" ON public.farms FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Assigned users can view farms" ON public.farms FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = id AND user_id = auth.uid()));
CREATE POLICY "Managers can update assigned farms" ON public.farms FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = id AND user_id = auth.uid() AND role = 'manager'));

-- FARM ASSIGNMENTS: Owner manages all, users see own assignments
CREATE POLICY "Owners manage assignments" ON public.farm_assignments FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers see farm assignments" ON public.farm_assignments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments fa WHERE fa.farm_id = farm_id AND fa.user_id = auth.uid() AND fa.role = 'manager'));
CREATE POLICY "Users see own assignments" ON public.farm_assignments FOR SELECT 
  USING (auth.uid() = user_id);

-- CROPS: Owner full, manager CRUD on assigned farm, employee view assigned farm
CREATE POLICY "Owners full access to crops" ON public.crops FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers CRUD crops on assigned farms" ON public.crops FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = crops.farm_id AND user_id = auth.uid() AND role = 'manager'));
CREATE POLICY "Employees view crops on assigned farms" ON public.crops FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = crops.farm_id AND user_id = auth.uid()));

-- LIVESTOCK: same pattern
CREATE POLICY "Owners full access to livestock" ON public.livestock FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers CRUD livestock on assigned farms" ON public.livestock FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = livestock.farm_id AND user_id = auth.uid() AND role = 'manager'));
CREATE POLICY "Employees view livestock on assigned farms" ON public.livestock FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = livestock.farm_id AND user_id = auth.uid()));

-- INVENTORY: same pattern
CREATE POLICY "Owners full access to inventory" ON public.inventory FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers CRUD inventory on assigned farms" ON public.inventory FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = inventory.farm_id AND user_id = auth.uid() AND role = 'manager'));
CREATE POLICY "Employees view inventory on assigned farms" ON public.inventory FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = inventory.farm_id AND user_id = auth.uid()));

-- FINANCE: Owner + manager on assigned farm
CREATE POLICY "Owners full access to finance" ON public.finance_records FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers CRUD finance on assigned farms" ON public.finance_records FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = finance_records.farm_id AND user_id = auth.uid() AND role = 'manager'));
CREATE POLICY "Employees view finance on assigned farms" ON public.finance_records FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = finance_records.farm_id AND user_id = auth.uid()));

-- TASKS: Owner full, manager CRUD on farm tasks, employee view + update own
CREATE POLICY "Owners full access to tasks" ON public.tasks FOR ALL 
  USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Managers CRUD tasks on assigned farms" ON public.tasks FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = tasks.farm_id AND user_id = auth.uid() AND role = 'manager'));
CREATE POLICY "Employees view tasks on assigned farms" ON public.tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.farm_assignments WHERE farm_id = tasks.farm_id AND user_id = auth.uid()));
CREATE POLICY "Employees update own tasks" ON public.tasks FOR UPDATE 
  USING (auth.uid() = assigned_to);

-- MESSAGES: Users see messages they sent or received
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients mark as read" ON public.messages FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- =============================================
-- 11. UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_updated_at BEFORE UPDATE ON public.finance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

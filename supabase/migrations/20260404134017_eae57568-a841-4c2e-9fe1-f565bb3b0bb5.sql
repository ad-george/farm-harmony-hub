
CREATE TABLE public.harvests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'crops',
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  quality_grade TEXT DEFAULT 'A',
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners full access to harvests"
ON public.harvests FOR ALL
TO public
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Managers CRUD harvests"
ON public.harvests FOR ALL
TO public
USING (is_farm_manager(auth.uid(), farm_id));

CREATE POLICY "Employees view harvests"
ON public.harvests FOR SELECT
TO public
USING (has_farm_access_direct(auth.uid(), farm_id));

CREATE TRIGGER update_harvests_updated_at
  BEFORE UPDATE ON public.harvests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

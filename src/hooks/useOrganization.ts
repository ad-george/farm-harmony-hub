
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useOrganization() {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setOrganizationId(data.organization_id);
    };
    fetchOrg();
  }, [user]);

  return organizationId;
}

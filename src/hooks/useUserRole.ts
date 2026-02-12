import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "manager" | "employee";

interface UserRoleData {
  role: AppRole;
  loading: boolean;
  assignedFarmIds: string[];
  isOwner: boolean;
  isManager: boolean;
  isEmployee: boolean;
  canCreate: boolean;
  canEditFarm: (farmId: string) => boolean;
  canDeleteFarm: (farmId: string) => boolean;
  canViewFarm: (farmId: string) => boolean;
  canManageRoles: boolean;
  canAccessFinance: (farmId?: string) => boolean;
  canEditTask: (taskFarmId?: string, assignedTo?: string) => boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("employee");
  const [loading, setLoading] = useState(true);
  const [assignedFarmIds, setAssignedFarmIds] = useState<string[]>([]);

  const fetchRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
      }

      // Fetch farm assignments
      const { data: assignments } = await supabase
        .from("farm_assignments")
        .select("farm_id, role")
        .eq("user_id", user.id);

      if (assignments) {
        setAssignedFarmIds(assignments.map((a) => a.farm_id));
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user]);

  const isOwner = role === "owner";
  const isManager = role === "manager";
  const isEmployee = role === "employee";

  const canCreate = isOwner || isManager;

  const canEditFarm = (farmId: string) => {
    if (isOwner) return true;
    if (isManager) return assignedFarmIds.includes(farmId);
    return false;
  };

  const canDeleteFarm = (farmId: string) => {
    if (isOwner) return true;
    return false;
  };

  const canViewFarm = (farmId: string) => {
    if (isOwner) return true;
    return assignedFarmIds.includes(farmId);
  };

  const canManageRoles = isOwner;

  const canAccessFinance = (farmId?: string) => {
    if (isOwner) return true;
    if (isManager && farmId) return assignedFarmIds.includes(farmId);
    if (isEmployee) return true; // view-only per RLS
    return false;
  };

  const canEditTask = (taskFarmId?: string, assignedTo?: string) => {
    if (isOwner) return true;
    if (isManager && taskFarmId) return assignedFarmIds.includes(taskFarmId);
    if (isEmployee && assignedTo === user?.id) return true;
    return false;
  };

  return {
    role,
    loading,
    assignedFarmIds,
    isOwner,
    isManager,
    isEmployee,
    canCreate,
    canEditFarm,
    canDeleteFarm,
    canViewFarm,
    canManageRoles,
    canAccessFinance,
    canEditTask,
    refetch: fetchRole,
  };
}


import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "manager" | "senior_employee" | "employee";

interface UserRoleData {
  role: AppRole;
  loading: boolean;
  organizationId: string | null;
  assignedFarmIds: string[];
  isOwner: boolean;
  isManager: boolean;
  isSeniorEmployee: boolean;
  isEmployee: boolean;
  isViewOnly: boolean; // owner is view-only on operations
  canCreate: boolean; // can create operational data (manager + senior_employee)
  canCreateFarm: boolean;
  canManageEmployees: boolean;
  canEditFarm: (farmId: string) => boolean;
  canDeleteFarm: (farmId: string) => boolean;
  canViewFarm: (farmId: string) => boolean;
  canManageRoles: boolean;
  canAccessFinance: (farmId?: string) => boolean;
  canAccessHR: boolean;
  canEditTask: (taskFarmId?: string, assignedTo?: string) => boolean;
  canDoFarmOperations: (farmId: string) => boolean;
  canAccessInventory: (farmId: string) => boolean;
  canCommunicateWith: (targetRole: AppRole) => boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("employee");
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assignedFarmIds, setAssignedFarmIds] = useState<string[]>([]);

  const fetchRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
        setOrganizationId(roleData.organization_id);
      }

      const { data: assignments } = await supabase
        .from("farm_assignments")
        .select("farm_id")
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
  const isSeniorEmployee = role === "senior_employee";
  const isEmployee = role === "employee";

  // Only owner can create farms
  const canCreateFarm = isOwner;

  // Owner can manage managers; managers can manage senior employees & employees
  const canManageEmployees = isOwner || isManager;

  const canEditFarm = (farmId: string) => {
    if (isOwner) return true;
    if (isManager) return assignedFarmIds.includes(farmId);
    return false;
  };

  const canDeleteFarm = (_farmId: string) => isOwner;

  const canViewFarm = (farmId: string) => {
    if (isOwner) return true;
    return assignedFarmIds.includes(farmId);
  };

  // Only owner can manage roles (assign managers)
  // Managers can promote/demote within their farm (senior_employee <-> employee)
  const canManageRoles = isOwner;

  // Finance: owner (view-only) and manager only. No senior employee access
  const canAccessFinance = (farmId?: string) => {
    if (isOwner) return true;
    if (isManager && farmId) return assignedFarmIds.includes(farmId);
    return false;
  };

  // HR: owner (view-only) and manager only
  const canAccessHR = isOwner || isManager;

  const canEditTask = (taskFarmId?: string, assignedTo?: string) => {
    if (isOwner) return false; // owner is view-only on tasks
    if (isManager && taskFarmId) return assignedFarmIds.includes(taskFarmId);
    if (isSeniorEmployee && assignedTo === user?.id) return true;
    return false;
  };

  const canDoFarmOperations = (farmId: string) => {
    if (isOwner) return false; // view-only
    if (isManager) return assignedFarmIds.includes(farmId);
    if (isSeniorEmployee) return assignedFarmIds.includes(farmId);
    return false;
  };

  const canAccessInventory = (farmId: string) => {
    if (isOwner) return true; // view
    if (isManager) return assignedFarmIds.includes(farmId);
    if (isSeniorEmployee) return assignedFarmIds.includes(farmId);
    return false;
  };

  // Communication rules
  const canCommunicateWith = (targetRole: AppRole) => {
    if (isOwner) return targetRole === "manager";
    if (isManager) return targetRole === "owner" || targetRole === "senior_employee" || targetRole === "employee";
    if (isSeniorEmployee) return targetRole === "manager";
    return false;
  };

  return {
    role,
    loading,
    organizationId,
    assignedFarmIds,
    isOwner,
    isManager,
    isSeniorEmployee,
    isEmployee,
    canCreateFarm,
    canManageEmployees,
    canEditFarm,
    canDeleteFarm,
    canViewFarm,
    canManageRoles,
    canAccessFinance,
    canAccessHR,
    canEditTask,
    canDoFarmOperations,
    canAccessInventory,
    canCommunicateWith,
    refetch: fetchRole,
  };
}

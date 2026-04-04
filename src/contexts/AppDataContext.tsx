import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Types matching database schema
export type FarmType = "crops" | "livestock" | "poultry" | "mixed" | "dairy" | "aquaculture";

export interface Farm {
  id: string;
  name: string;
  location: string;
  size: string;
  type: string;
  employees: number;
  farmType: FarmType;
  status: "active" | "maintenance" | "idle";
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  farm_id: string;
  farm: string; // farm name for display
  assignee: string;
  assigned_to?: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  category: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "manager" | "employee";
  farm: string;
  status: "active" | "on-leave" | "inactive";
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: {
    name: string;
    role: string;
    avatar?: string;
    user_id: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export interface Activity {
  id: string;
  type: "crop" | "finance" | "task" | "alert";
  title: string;
  description: string;
  time: string;
  farm: string;
}

interface AppDataContextType {
  // Farms
  farms: Farm[];
  farmsLoading: boolean;
  addFarm: (farm: Omit<Farm, "id">) => Promise<void>;
  updateFarm: (id: string, farm: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  refetchFarms: () => Promise<void>;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  addTask: (task: any) => Promise<void>;
  updateTask: (id: string, task: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refetchTasks: () => Promise<void>;

  // Employees (profiles + roles + assignments)
  employees: Employee[];
  employeesLoading: boolean;
  refetchEmployees: () => Promise<void>;

  // Conversations & Messages
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  sendMessage: (recipientId: string, content: string, farmId?: string) => Promise<void>;
  markConversationAsRead: (recipientId: string) => Promise<void>;
  getTotalUnreadCount: () => number;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteConversation: (partnerId: string) => Promise<void>;
  refetchMessages: () => Promise<void>;

  // Activities (derived from recent actions)
  activities: Activity[];

  // Stats
  getStats: () => {
    totalFarms: number;
    activeEmployees: number;
    cropFarms: number;
    livestockFarms: number;
    poultryFarms: number;
    dairyFarms: number;
    mixedFarms: number;
    aquacultureFarms: number;
    pendingTasks: number;
    monthlyRevenue: string;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Farms
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);

  // Finance stats
  const [totalRevenue, setTotalRevenue] = useState(0);

  // ===================== FETCH FARMS =====================
  const refetchFarms = useCallback(async () => {
    if (!user) return;
    setFarmsLoading(true);
    try {
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setFarms(
          data.map((f) => ({
            id: f.id,
            name: f.name,
            location: f.location || "",
            size: f.size || "",
            type: f.type,
            employees: f.employees,
            farmType: (f.type?.toLowerCase() || "mixed") as FarmType,
            status: (f.status?.toLowerCase() || "active") as "active" | "maintenance" | "idle",
            description: f.description || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    } finally {
      setFarmsLoading(false);
    }
  }, [user]);

  const addFarm = async (farm: Omit<Farm, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("farms").insert({
      name: farm.name,
      location: farm.location,
      size: farm.size,
      type: farm.farmType || farm.type || "Mixed",
      status: farm.status === "active" ? "Active" : farm.status === "maintenance" ? "Maintenance" : "Idle",
      employees: farm.employees,
      description: farm.description || "",
      created_by: user.id,
    });
    if (error) throw error;
    await refetchFarms();
  };

  const updateFarm = async (id: string, farm: Partial<Farm>) => {
    const updateData: any = {};
    if (farm.name !== undefined) updateData.name = farm.name;
    if (farm.location !== undefined) updateData.location = farm.location;
    if (farm.size !== undefined) updateData.size = farm.size;
    if (farm.farmType !== undefined) updateData.type = farm.farmType;
    if (farm.type !== undefined) updateData.type = farm.type;
    if (farm.employees !== undefined) updateData.employees = farm.employees;
    if (farm.status !== undefined) {
      updateData.status = farm.status === "active" ? "Active" : farm.status === "maintenance" ? "Maintenance" : "Idle";
    }
    if (farm.description !== undefined) updateData.description = farm.description;

    const { error } = await supabase.from("farms").update(updateData).eq("id", id);
    if (error) throw error;
    await refetchFarms();
  };

  const deleteFarm = async (id: string) => {
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) throw error;
    await refetchFarms();
  };

  // ===================== FETCH TASKS =====================
  const refetchTasks = useCallback(async () => {
    if (!user) return;
    setTasksLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, farms(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setTasks(
          data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            farm_id: t.farm_id || "",
            farm: t.farms?.name || "Unassigned",
            assignee: "", // Will be resolved from profiles
            assigned_to: t.assigned_to,
            dueDate: t.due_date || "No due date",
            priority: (t.priority || "medium") as "high" | "medium" | "low",
            status: (t.status || "pending") as "pending" | "in-progress" | "completed",
            category: "other",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  }, [user]);

  const addTask = async (task: any) => {
    if (!user) return;
    // Find farm_id from farm name
    const farm = farms.find((f) => f.name === task.farm || f.id === task.farm_id);
    const { error } = await supabase.from("tasks").insert({
      title: task.title,
      description: task.description,
      farm_id: farm?.id || task.farm_id || null,
      priority: task.priority || "medium",
      status: task.status || "pending",
      due_date: task.dueDate && task.dueDate !== "No due date" ? task.dueDate : null,
      assigned_to: task.assigned_to || null,
      created_by: user.id,
    });
    if (error) throw error;
    await refetchTasks();
  };

  const updateTask = async (id: string, task: any) => {
    const updateData: any = {};
    if (task.title !== undefined) updateData.title = task.title;
    if (task.description !== undefined) updateData.description = task.description;
    if (task.priority !== undefined) updateData.priority = task.priority;
    if (task.status !== undefined) updateData.status = task.status;
    if (task.dueDate !== undefined) updateData.due_date = task.dueDate;
    if (task.assigned_to !== undefined) updateData.assigned_to = task.assigned_to;
    if (task.farm_id !== undefined) updateData.farm_id = task.farm_id;

    const { error } = await supabase.from("tasks").update(updateData).eq("id", id);
    if (error) throw error;
    await refetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    await refetchTasks();
  };

  // ===================== FETCH EMPLOYEES =====================
  const refetchEmployees = useCallback(async () => {
    if (!user) return;
    setEmployeesLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("*");

      if (profilesErr) throw profilesErr;

      // Fetch all user roles
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesErr) throw rolesErr;

      // Fetch farm assignments
      const { data: assignments, error: assignErr } = await supabase
        .from("farm_assignments")
        .select("*, farms(name)");

      if (assignErr) throw assignErr;

      if (profiles) {
        const employeesList: Employee[] = profiles.map((p) => {
          const userRole = roles?.find((r) => r.user_id === p.user_id);
          const assignment = assignments?.find((a: any) => a.user_id === p.user_id);
          const farmName = (assignment as any)?.farms?.name || "Unassigned";

          return {
            id: p.id,
            user_id: p.user_id,
            name: p.full_name || "Unknown",
            email: "",
            phone: p.phone || "",
            role: (userRole?.role || "employee") as "owner" | "manager" | "employee",
            farm: farmName,
            status: "active" as const,
            avatar: p.avatar_url || undefined,
          };
        });
        setEmployees(employeesList);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  }, [user]);

  // ===================== MESSAGES =====================
  const refetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!msgs) return;

      // Group messages by conversation partner
      const convMap = new Map<string, { messages: any[]; partnerId: string }>();

      msgs.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!partnerId) return;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, { messages: [], partnerId });
        }
        convMap.get(partnerId)!.messages.push(msg);
      });

      // Build conversations
      const convs: Conversation[] = [];
      for (const [partnerId, data] of convMap) {
        const partner = employees.find((e) => e.user_id === partnerId);
        const lastMsg = data.messages[data.messages.length - 1];
        const unreadCount = data.messages.filter(
          (m) => m.recipient_id === user.id && !m.is_read
        ).length;

        convs.push({
          id: partnerId,
          participant: {
            name: partner?.name || "Unknown",
            role: partner?.role || "employee",
            avatar: partner?.avatar,
            user_id: partnerId,
          },
          lastMessage: lastMsg?.content || "",
          timestamp: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "",
          unread: unreadCount,
          messages: data.messages.map((m) => ({
            id: m.id,
            senderId: m.sender_id === user.id ? "me" : m.sender_id,
            content: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            read: m.is_read,
          })),
        });
      }

      setConversations(convs.sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0)));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [user, employees]);

  const sendMessage = async (recipientId: string, content: string, farmId?: string) => {
    if (!user) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      farm_id: farmId || null,
    });
    if (error) throw error;
    await refetchMessages();
  };

  const markConversationAsRead = async (recipientUserId: string) => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", recipientUserId)
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    await refetchMessages();
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unread, 0);
  };

  // ===================== FINANCE STATS =====================
  const fetchFinanceStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("finance_records")
        .select("type, amount");
      if (error) throw error;
      if (data) {
        const revenue = data
          .filter((r) => r.type === "income")
          .reduce((sum, r) => sum + Number(r.amount), 0);
        setTotalRevenue(revenue);
      }
    } catch (error) {
      console.error("Error fetching finance stats:", error);
    }
  }, [user]);

  // ===================== INITIAL FETCH =====================
  useEffect(() => {
    if (user) {
      refetchFarms();
      refetchTasks();
      refetchEmployees();
      fetchFinanceStats();
    }
  }, [user, refetchFarms, refetchTasks, refetchEmployees, fetchFinanceStats]);

  // Fetch messages after employees are loaded
  useEffect(() => {
    if (user && employees.length > 0) {
      refetchMessages();
    }
  }, [user, employees.length, refetchMessages]);

  // ===================== REALTIME SUBSCRIPTION =====================
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("realtime-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        refetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchMessages]);

  // ===================== STATS =====================
  const getStats = () => {
    const totalEmployeesFromFarms = farms.reduce((sum, farm) => sum + farm.employees, 0);
    const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

    const farmTypeCounts = farms.reduce((acc, farm) => {
      acc[farm.farmType] = (acc[farm.farmType] || 0) + 1;
      return acc;
    }, {} as Record<FarmType, number>);

    return {
      totalFarms: farms.length,
      activeEmployees: totalEmployeesFromFarms || employees.length,
      cropFarms: farmTypeCounts.crops || 0,
      livestockFarms: farmTypeCounts.livestock || 0,
      poultryFarms: farmTypeCounts.poultry || 0,
      dairyFarms: farmTypeCounts.dairy || 0,
      mixedFarms: farmTypeCounts.mixed || 0,
      aquacultureFarms: farmTypeCounts.aquaculture || 0,
      pendingTasks: pendingTaskCount,
      monthlyRevenue: `KSh ${totalRevenue.toLocaleString()}`,
    };
  };

  return (
    <AppDataContext.Provider
      value={{
        farms,
        farmsLoading,
        addFarm,
        updateFarm,
        deleteFarm,
        refetchFarms,
        tasks,
        tasksLoading,
        addTask,
        updateTask,
        deleteTask,
        refetchTasks,
        employees,
        employeesLoading,
        refetchEmployees,
        conversations,
        setConversations,
        sendMessage,
        markConversationAsRead,
        getTotalUnreadCount,
        refetchMessages,
        activities,
        getStats,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}

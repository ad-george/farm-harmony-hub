import React, { createContext, useContext, useState, ReactNode } from "react";

// Types
export type FarmType = "crops" | "livestock" | "poultry" | "mixed" | "dairy" | "aquaculture";

export interface Farm {
  id: string;
  name: string;
  location: string;
  size: string;
  soilType: string;
  employees: number;
  farmType: FarmType;
  status: "active" | "maintenance" | "idle";
  manager: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  farm: string;
  assignee: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  category: "irrigation" | "planting" | "harvest" | "maintenance" | "livestock" | "other";
}

export interface Employee {
  id: string;
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

// Initial data
const initialFarms: Farm[] = [
  {
    id: "1",
    name: "Kilimanjaro Green Farm",
    location: "Arusha, Tanzania",
    size: "450 acres",
    soilType: "Loamy",
    employees: 42,
    farmType: "crops",
    status: "active",
    manager: "John Kimani",
  },
  {
    id: "2",
    name: "Lake Victoria Estates",
    location: "Kisumu, Kenya",
    size: "780 acres",
    soilType: "Clay",
    employees: 58,
    farmType: "mixed",
    status: "active",
    manager: "Sarah Ochieng",
  },
  {
    id: "3",
    name: "Rwenzori Highlands",
    location: "Fort Portal, Uganda",
    size: "1200 acres",
    soilType: "Sandy",
    employees: 35,
    farmType: "livestock",
    status: "maintenance",
    manager: "Michael Mugisha",
  },
  {
    id: "4",
    name: "Nyungwe Valley Farm",
    location: "Butare, Rwanda",
    size: "620 acres",
    soilType: "Silt",
    employees: 28,
    farmType: "poultry",
    status: "active",
    manager: "Emily Uwimana",
  },
];

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Inspect irrigation system",
    description: "Check all sprinkler heads and fix any leaks in the north field",
    farm: "Kilimanjaro Green Farm",
    assignee: "Mike Johnson",
    dueDate: "Today, 2:00 PM",
    priority: "high",
    status: "pending",
    category: "irrigation",
  },
  {
    id: "2",
    title: "Apply fertilizer to maize fields",
    description: "Use NPK fertilizer on sections A-D of the maize field",
    farm: "Lake Victoria Estates",
    assignee: "Sarah Williams",
    dueDate: "Tomorrow, 8:00 AM",
    priority: "medium",
    status: "pending",
    category: "planting",
  },
  {
    id: "3",
    title: "Livestock vaccination",
    description: "Vaccinate cattle herd - annual booster shots",
    farm: "Rwenzori Highlands",
    assignee: "David Brown",
    dueDate: "Feb 2, 10:00 AM",
    priority: "high",
    status: "in-progress",
    category: "livestock",
  },
  {
    id: "4",
    title: "Equipment maintenance check",
    description: "Service tractors and check oil levels on all machinery",
    farm: "Kilimanjaro Green Farm",
    assignee: "Emily Davis",
    dueDate: "Feb 3, 9:00 AM",
    priority: "low",
    status: "pending",
    category: "maintenance",
  },
  {
    id: "5",
    title: "Harvest lettuce crop",
    description: "Complete harvest of romaine lettuce in greenhouse 2",
    farm: "Nyungwe Valley Farm",
    assignee: "John Smith",
    dueDate: "Jan 26, 2025",
    priority: "high",
    status: "completed",
    category: "harvest",
  },
  {
    id: "6",
    title: "Repair barn roof",
    description: "Fix leak in the main barn roof, west section",
    farm: "Rwenzori Highlands",
    assignee: "Mike Johnson",
    dueDate: "Jan 25, 2025",
    priority: "medium",
    status: "completed",
    category: "maintenance",
  },
];

const initialEmployees: Employee[] = [
  {
    id: "1",
    name: "John Kimani",
    email: "john.kimani@farmflow.com",
    phone: "+254 712 345 678",
    role: "owner",
    farm: "All Farms",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Ochieng",
    email: "sarah.o@farmflow.com",
    phone: "+254 723 456 789",
    role: "manager",
    farm: "Lake Victoria Estates",
    status: "active",
  },
  {
    id: "3",
    name: "Michael Mugisha",
    email: "michael.m@farmflow.com",
    phone: "+256 772 345 678",
    role: "manager",
    farm: "Rwenzori Highlands",
    status: "active",
  },
  {
    id: "4",
    name: "Emily Uwimana",
    email: "emily.u@farmflow.com",
    phone: "+250 788 456 789",
    role: "employee",
    farm: "Nyungwe Valley Farm",
    status: "active",
  },
  {
    id: "5",
    name: "David Wafula",
    email: "david.w@farmflow.com",
    phone: "+254 734 567 890",
    role: "employee",
    farm: "Kilimanjaro Green Farm",
    status: "on-leave",
  },
  {
    id: "6",
    name: "Grace Akinyi",
    email: "grace.a@farmflow.com",
    phone: "+255 765 432 109",
    role: "employee",
    farm: "Lake Victoria Estates",
    status: "active",
  },
];

const initialConversations: Conversation[] = [
  {
    id: "1",
    participant: { name: "John Kimani", role: "Owner" },
    lastMessage: "Please review the quarterly report I sent",
    timestamp: "2 min ago",
    unread: 2,
    messages: [
      { id: "1", senderId: "owner", content: "Good morning! How are the operations going?", timestamp: "9:00 AM", read: true },
      { id: "2", senderId: "me", content: "Everything is running smoothly. We completed the wheat harvest yesterday.", timestamp: "9:15 AM", read: true },
      { id: "3", senderId: "owner", content: "That's great news! What's the total yield?", timestamp: "9:20 AM", read: true },
      { id: "4", senderId: "me", content: "We got 450 tons, which is 8% above our projection!", timestamp: "9:25 AM", read: true },
      { id: "5", senderId: "owner", content: "Excellent work! Please review the quarterly report I sent", timestamp: "9:30 AM", read: false },
      { id: "6", senderId: "owner", content: "I need your input on the budget allocation for next quarter", timestamp: "9:31 AM", read: false },
    ],
  },
  {
    id: "2",
    participant: { name: "Sarah Ochieng", role: "Manager - Lake Victoria Estates" },
    lastMessage: "The irrigation system is fixed",
    timestamp: "1 hour ago",
    unread: 0,
    messages: [
      { id: "1", senderId: "sarah", content: "Hi! The irrigation system had some issues this morning", timestamp: "8:00 AM", read: true },
      { id: "2", senderId: "me", content: "What happened? Is it affecting the crops?", timestamp: "8:10 AM", read: true },
      { id: "3", senderId: "sarah", content: "A few sprinkler heads were clogged. We've cleaned them out.", timestamp: "8:30 AM", read: true },
      { id: "4", senderId: "sarah", content: "The irrigation system is fixed", timestamp: "8:45 AM", read: true },
    ],
  },
  {
    id: "3",
    participant: { name: "Michael Mugisha", role: "Manager - Rwenzori Highlands" },
    lastMessage: "Task completed for today",
    timestamp: "3 hours ago",
    unread: 1,
    messages: [
      { id: "1", senderId: "me", content: "Michael, please check the fence in the north pasture", timestamp: "7:00 AM", read: true },
      { id: "2", senderId: "mike", content: "On it! Will report back when done.", timestamp: "7:15 AM", read: true },
      { id: "3", senderId: "mike", content: "Found and fixed two broken sections.", timestamp: "10:00 AM", read: true },
      { id: "4", senderId: "mike", content: "Task completed for today", timestamp: "10:30 AM", read: false },
    ],
  },
];

const initialActivities: Activity[] = [
  {
    id: "1",
    type: "crop",
    title: "Maize Harvest Complete",
    description: "Successfully harvested 450 tons from North Field",
    time: "2 hours ago",
    farm: "Kilimanjaro Green Farm",
  },
  {
    id: "2",
    type: "finance",
    title: "Payment Received",
    description: "KSh 1,250,000 received from AgriTrade EA",
    time: "5 hours ago",
    farm: "Lake Victoria Estates",
  },
  {
    id: "3",
    type: "task",
    title: "Irrigation System Check",
    description: "Scheduled maintenance completed by John",
    time: "Yesterday",
    farm: "Kilimanjaro Green Farm",
  },
  {
    id: "4",
    type: "alert",
    title: "Low Stock Alert",
    description: "Fertilizer stock below minimum threshold",
    time: "Yesterday",
    farm: "Rwenzori Highlands",
  },
];

interface AppDataContextType {
  // Farms
  farms: Farm[];
  setFarms: React.Dispatch<React.SetStateAction<Farm[]>>;
  addFarm: (farm: Omit<Farm, "id">) => void;
  updateFarm: (id: string, farm: Partial<Farm>) => void;
  deleteFarm: (id: string) => void;

  // Tasks
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Employees
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Conversations & Messages
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  markConversationAsRead: (conversationId: string) => void;
  getTotalUnreadCount: () => number;

  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id">) => void;

  // Stats
  getStats: () => {
    totalFarms: number;
    activeEmployees: number;
    cropFarms: number;
    livestockFarms: number;
    pendingTasks: number;
    monthlyRevenue: string;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  // Farm operations
  const addFarm = (farm: Omit<Farm, "id">) => {
    const newFarm: Farm = { ...farm, id: Date.now().toString() };
    setFarms((prev) => [...prev, newFarm]);
    addActivity({
      type: "crop",
      title: "New Farm Added",
      description: `${farm.name} has been added to the system`,
      time: "Just now",
      farm: farm.name,
    });
  };

  const updateFarm = (id: string, farm: Partial<Farm>) => {
    setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, ...farm } : f)));
  };

  const deleteFarm = (id: string) => {
    const farm = farms.find((f) => f.id === id);
    setFarms((prev) => prev.filter((f) => f.id !== id));
    if (farm) {
      addActivity({
        type: "alert",
        title: "Farm Removed",
        description: `${farm.name} has been removed from the system`,
        time: "Just now",
        farm: farm.name,
      });
    }
  };

  // Task operations
  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = { ...task, id: Date.now().toString() };
    setTasks((prev) => [...prev, newTask]);
    addActivity({
      type: "task",
      title: "New Task Created",
      description: task.title,
      time: "Just now",
      farm: task.farm,
    });
  };

  const updateTask = (id: string, task: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...task } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Employee operations
  const addEmployee = (employee: Omit<Employee, "id">) => {
    const newEmployee: Employee = { ...employee, id: Date.now().toString() };
    setEmployees((prev) => [...prev, newEmployee]);
    addActivity({
      type: "task",
      title: "New Employee Added",
      description: `${employee.name} joined as ${employee.role}`,
      time: "Just now",
      farm: employee.farm,
    });
  };

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...employee } : e)));
  };

  const deleteEmployee = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (employee) {
      addActivity({
        type: "alert",
        title: "Employee Removed",
        description: `${employee.name} has been removed from the system`,
        time: "Just now",
        farm: employee.farm,
      });
    }
  };

  // Conversation operations
  const markConversationAsRead = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              unread: 0,
              messages: conv.messages.map((msg) => ({ ...msg, read: true })),
            }
          : conv
      )
    );
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unread, 0);
  };

  // Activity operations
  const addActivity = (activity: Omit<Activity, "id">) => {
    const newActivity: Activity = { ...activity, id: Date.now().toString() };
    setActivities((prev) => [newActivity, ...prev].slice(0, 10)); // Keep only last 10
  };

  // Stats
  const getStats = () => {
    const activeEmployeeCount = employees.filter((e) => e.status === "active").length;
    const cropFarmCount = farms.filter((f) => f.farmType === "crops" || f.farmType === "mixed").length;
    const livestockFarmCount = farms.filter((f) => f.farmType === "livestock" || f.farmType === "dairy").length;
    const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;
    
    // Calculate total employees across all farms
    const totalEmployeesFromFarms = farms.reduce((sum, farm) => sum + farm.employees, 0);

    return {
      totalFarms: farms.length,
      activeEmployees: totalEmployeesFromFarms,
      cropFarms: cropFarmCount,
      livestockFarms: livestockFarmCount,
      pendingTasks: pendingTaskCount,
      monthlyRevenue: "KSh 2,845,000",
    };
  };

  return (
    <AppDataContext.Provider
      value={{
        farms,
        setFarms,
        addFarm,
        updateFarm,
        deleteFarm,
        tasks,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        employees,
        setEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        conversations,
        setConversations,
        markConversationAsRead,
        getTotalUnreadCount,
        activities,
        addActivity,
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

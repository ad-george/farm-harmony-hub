import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Calendar, Clock, User, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
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

const tasks: Task[] = [
  {
    id: "1",
    title: "Inspect irrigation system",
    description: "Check all sprinkler heads and fix any leaks in the north field",
    farm: "Green Valley Farm",
    assignee: "Mike Johnson",
    dueDate: "Today, 2:00 PM",
    priority: "high",
    status: "pending",
    category: "irrigation",
  },
  {
    id: "2",
    title: "Apply fertilizer to corn fields",
    description: "Use NPK fertilizer on sections A-D of the corn field",
    farm: "Sunrise Acres",
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
    farm: "Hillside Ranch",
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
    farm: "Green Valley Farm",
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
    farm: "River Bend Farms",
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
    farm: "Hillside Ranch",
    assignee: "Mike Johnson",
    dueDate: "Jan 25, 2025",
    priority: "medium",
    status: "completed",
    category: "maintenance",
  },
];

const priorityConfig = {
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning" },
  low: { label: "Low", className: "bg-success/10 text-success" },
};

const statusConfig = {
  pending: { label: "Pending", icon: Circle, className: "text-muted-foreground" },
  "in-progress": { label: "In Progress", icon: AlertCircle, className: "text-info" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-success" },
};

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getFilteredTasks = (status: string) => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.farm.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = status === "all" || task.status === status;
      return matchesSearch && matchesStatus;
    });
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="p-4 rounded-xl bg-card shadow-card hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </h4>
              <Badge className={priority.className}>{priority.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-primary">
                <Calendar className="h-3 w-3" />
                {task.farm}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignee}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.dueDate}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout
      title="Tasks & Operations"
      subtitle="Manage and track farm operations"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-muted/30 text-center">
          <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 text-center">
          <p className="text-2xl font-bold text-info">{inProgressTasks.length}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 text-center">
          <p className="text-2xl font-bold text-success">{completedTasks.length}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {getFilteredTasks("all").map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {getFilteredTasks("pending").map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-3">
          {getFilteredTasks("in-progress").map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {getFilteredTasks("completed").map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

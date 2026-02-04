import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Pencil, Trash2, ChevronRight, PlayCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData, Task } from "@/contexts/AppDataContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type TaskStatus = "pending" | "in-progress" | "completed";
type TaskPriority = "high" | "medium" | "low";
type TaskCategory = "irrigation" | "planting" | "harvest" | "maintenance" | "livestock" | "other";

export default function Tasks() {
  const { tasks, farms, employees, addTask, updateTask, deleteTask } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskItem, setDeleteTaskItem] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    farm: "",
    assignee: "",
    dueDate: "",
    priority: "medium" as TaskPriority,
    category: "other" as TaskCategory,
  });

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

  const openAddDialog = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      farm: "",
      assignee: "",
      dueDate: "",
      priority: "medium",
      category: "other",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      farm: task.farm,
      assignee: task.assignee,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
    setIsDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!formData.title || !formData.farm || !formData.assignee) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        farm: formData.farm,
        assignee: formData.assignee,
        dueDate: formData.dueDate,
        priority: formData.priority,
        category: formData.category,
      });
      toast({
        title: "Task Updated",
        description: `"${formData.title}" has been updated`,
      });
    } else {
      addTask({
        title: formData.title,
        description: formData.description,
        farm: formData.farm,
        assignee: formData.assignee,
        dueDate: formData.dueDate || "No due date",
        priority: formData.priority,
        status: "pending",
        category: formData.category,
      });
      toast({
        title: "Task Created",
        description: `"${formData.title}" has been added`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDeleteTask = () => {
    if (deleteTaskItem) {
      deleteTask(deleteTaskItem.id);
      toast({
        title: "Task Deleted",
        description: `"${deleteTaskItem.title}" has been removed`,
      });
      setDeleteTaskItem(null);
    }
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTask(task.id, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `"${task.title}" moved to ${statusConfig[newStatus].label}`,
    });
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTask(task.id, { status: newStatus });
  };

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    if (currentStatus === "pending") return "in-progress";
    if (currentStatus === "in-progress") return "completed";
    return null;
  };

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    const StatusIcon = status.icon;
    const nextStatus = getNextStatus(task.status);

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
            onCheckedChange={() => handleToggleComplete(task)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge className={priority.className}>{priority.label}</Badge>
                <Badge className={`${status.className} bg-opacity-10`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
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
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              {nextStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(task, nextStatus)}
                  className="text-xs"
                >
                  {nextStatus === "in-progress" ? (
                    <>
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Start Task
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Move to
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(task, "pending")}
                    disabled={task.status === "pending"}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(task, "in-progress")}
                    disabled={task.status === "in-progress"}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(task, "completed")}
                    disabled={task.status === "completed"}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEditDialog(task)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteTaskItem(task)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
        <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
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
          <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {getFilteredTasks("all").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks found</div>
          ) : (
            getFilteredTasks("all").map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {getFilteredTasks("pending").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending tasks</div>
          ) : (
            getFilteredTasks("pending").map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-3">
          {getFilteredTasks("in-progress").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks in progress</div>
          ) : (
            getFilteredTasks("in-progress").map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {getFilteredTasks("completed").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed tasks</div>
          ) : (
            getFilteredTasks("completed").map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update task details" : "Add a new task to your operations"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Inspect irrigation system"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="farm">Farm *</Label>
                <Select
                  value={formData.farm}
                  onValueChange={(value) => setFormData({ ...formData, farm: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.name}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee *</Label>
                <Select
                  value={formData.assignee}
                  onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: TaskCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                placeholder="e.g., Tomorrow, 8:00 AM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              {editingTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskItem} onOpenChange={() => setDeleteTaskItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTaskItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

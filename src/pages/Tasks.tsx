import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Pencil, Trash2, ChevronRight, PlayCircle, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

export default function Tasks() {
  const { tasks, farms, employees, tasksLoading, addTask, updateTask, deleteTask } = useAppData();
  const { canCreate, isEmployee, isOwner } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTaskItem, setDeleteTaskItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", farm_id: "", assigned_to: "", dueDate: "", priority: "medium" as TaskPriority });

  const getFilteredTasks = (status: string) => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.farm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (status === "all" || task.status === status);
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const openAddDialog = () => { setEditingTask(null); setFormData({ title: "", description: "", farm_id: "", assigned_to: "", dueDate: "", priority: "medium" }); setIsDialogOpen(true); };
  const openEditDialog = (task: any) => { setEditingTask(task); setFormData({ title: task.title, description: task.description, farm_id: task.farm_id || "", assigned_to: task.assigned_to || "", dueDate: task.dueDate, priority: task.priority }); setIsDialogOpen(true); };

  const handleSaveTask = async () => {
    if (!formData.title) { toast.error("Please fill required fields"); return; }
    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, { title: formData.title, description: formData.description, farm_id: formData.farm_id || null, assigned_to: formData.assigned_to || null, dueDate: formData.dueDate, priority: formData.priority });
        toast.success("Task updated");
      } else {
        await addTask({ title: formData.title, description: formData.description, farm_id: formData.farm_id || null, assigned_to: formData.assigned_to || null, dueDate: formData.dueDate, priority: formData.priority, status: "pending" });
        toast.success("Task created");
      }
      setIsDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskItem) return;
    try { await deleteTask(deleteTaskItem.id); toast.success("Task deleted"); } catch (e: any) { toast.error(e.message); }
    setDeleteTaskItem(null);
  };

  const handleStatusChange = async (task: any, newStatus: TaskStatus) => {
    try { await updateTask(task.id, { status: newStatus }); toast.success(`Status updated to ${statusConfig[newStatus].label}`); } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleComplete = (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    handleStatusChange(task, newStatus);
  };

  const getNextStatus = (s: TaskStatus): TaskStatus | null => {
    if (s === "pending") return "in-progress";
    if (s === "in-progress") return "completed";
    return null;
  };

  const TaskCard = ({ task, index }: { task: any; index: number }) => {
    const priority = priorityConfig[task.priority as TaskPriority] || priorityConfig.medium;
    const status = statusConfig[task.status as TaskStatus] || statusConfig.pending;
    const StatusIcon = status.icon;
    const nextStatus = getNextStatus(task.status as TaskStatus);
    const assigneeName = employees.find((e) => e.user_id === task.assigned_to)?.name || task.assignee || "Unassigned";

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}
        className="p-4 rounded-xl bg-card shadow-card hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-3">
          <Checkbox checked={task.status === "completed"} onCheckedChange={() => handleToggleComplete(task)} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</h4>
              <div className="flex items-center gap-2">
                <Badge className={priority.className}>{priority.label}</Badge>
                <Badge className={`${status.className} bg-opacity-10`}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-primary"><Calendar className="h-3 w-3" />{task.farm}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{assigneeName}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{task.dueDate}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              {nextStatus && <Button variant="outline" size="sm" onClick={() => handleStatusChange(task, nextStatus)} className="text-xs">{nextStatus === "in-progress" ? <><PlayCircle className="h-3 w-3 mr-1" />Start</> : <><CheckCircle2 className="h-3 w-3 mr-1" />Complete</>}</Button>}
              {!isEmployee && <>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(task)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTaskItem(task)}><Trash2 className="h-4 w-4" /></Button>
              </>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (tasksLoading) {
    return <DashboardLayout title="Tasks & Operations" subtitle="Manage and track farm operations"><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Tasks & Operations" subtitle="Manage and track farm operations">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        {canCreate && <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" />Create Task</Button>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-muted/30 text-center"><p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p><p className="text-sm text-muted-foreground">Pending</p></div>
        <div className="p-4 rounded-xl bg-info/10 text-center"><p className="text-2xl font-bold text-info">{inProgressTasks.length}</p><p className="text-sm text-muted-foreground">In Progress</p></div>
        <div className="p-4 rounded-xl bg-success/10 text-center"><p className="text-2xl font-bold text-success">{completedTasks.length}</p><p className="text-sm text-muted-foreground">Completed</p></div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>
        {["all", "pending", "in-progress", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {getFilteredTasks(tab).length === 0 ? <div className="text-center py-8 text-muted-foreground">No tasks</div> : getFilteredTasks(tab).map((task, i) => <TaskCard key={task.id} task={task} index={i} />)}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle><DialogDescription>{editingTask ? "Update task details" : "Add a new task"}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Farm</Label><Select value={formData.farm_id} onValueChange={(v) => setFormData({ ...formData, farm_id: v })}><SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger><SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Assignee</Label><Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Priority</Label><Select value={formData.priority} onValueChange={(v: TaskPriority) => setFormData({ ...formData, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveTask} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingTask ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTaskItem} onOpenChange={() => setDeleteTaskItem(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Task</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deleteTaskItem?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

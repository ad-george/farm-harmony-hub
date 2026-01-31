import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";

const priorityConfig = {
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning" },
  low: { label: "Low", className: "bg-success/10 text-success" },
};

export function UpcomingTasksCard() {
  const navigate = useNavigate();
  const { tasks } = useAppData();

  // Get pending and in-progress tasks, sorted by priority
  const upcomingTasks = tasks
    .filter((t) => t.status === "pending" || t.status === "in-progress")
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="rounded-xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Upcoming Tasks</h3>
        <button 
          onClick={() => navigate("/tasks")}
          className="text-sm text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
        ) : (
          upcomingTasks.map((task, index) => {
            const priority = priorityConfig[task.priority];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => navigate("/tasks")}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-foreground text-sm">{task.title}</h4>
                  <Badge variant="outline" className={cn("text-xs", priority.className)}>
                    {priority.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assignee}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

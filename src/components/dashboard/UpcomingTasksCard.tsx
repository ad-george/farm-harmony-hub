import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  farm: string;
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Inspect irrigation system",
    dueDate: "Today, 2:00 PM",
    assignee: "Mike Johnson",
    priority: "high",
    farm: "Green Valley Farm",
  },
  {
    id: "2",
    title: "Apply fertilizer to corn fields",
    dueDate: "Tomorrow, 8:00 AM",
    assignee: "Sarah Williams",
    priority: "medium",
    farm: "Sunrise Acres",
  },
  {
    id: "3",
    title: "Livestock vaccination schedule",
    dueDate: "Feb 2, 10:00 AM",
    assignee: "David Brown",
    priority: "high",
    farm: "Hillside Ranch",
  },
  {
    id: "4",
    title: "Equipment maintenance check",
    dueDate: "Feb 3, 9:00 AM",
    assignee: "Emily Davis",
    priority: "low",
    farm: "Green Valley Farm",
  },
];

const priorityConfig = {
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning" },
  low: { label: "Low", className: "bg-success/10 text-success" },
};

export function UpcomingTasksCard() {
  const navigate = useNavigate();

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
        {tasks.map((task, index) => {
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
        })}
      </div>
    </motion.div>
  );
}

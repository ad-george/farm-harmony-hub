import { motion } from "framer-motion";
import { Plus, FileText, Send, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Plus, label: "Add Farm", color: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  { icon: FileText, label: "New Report", color: "bg-accent hover:bg-accent/90 text-accent-foreground" },
  { icon: Send, label: "Send Message", color: "bg-info hover:bg-info/90 text-info-foreground" },
  { icon: CalendarPlus, label: "Schedule Task", color: "bg-success hover:bg-success/90 text-success-foreground" },
];

export function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl bg-card p-6 shadow-card"
    >
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            className={`flex items-center justify-center gap-2 h-auto py-4 ${action.color}`}
          >
            <action.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

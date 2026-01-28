import { motion } from "framer-motion";
import { Sprout, DollarSign, ClipboardCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "crop" | "finance" | "task" | "alert";
  title: string;
  description: string;
  time: string;
  farm: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "crop",
    title: "Wheat Harvest Complete",
    description: "Successfully harvested 450 tons from North Field",
    time: "2 hours ago",
    farm: "Green Valley Farm",
  },
  {
    id: "2",
    type: "finance",
    title: "Payment Received",
    description: "$12,500 received from AgriTrade Co.",
    time: "5 hours ago",
    farm: "Sunrise Acres",
  },
  {
    id: "3",
    type: "task",
    title: "Irrigation System Check",
    description: "Scheduled maintenance completed by John",
    time: "Yesterday",
    farm: "Green Valley Farm",
  },
  {
    id: "4",
    type: "alert",
    title: "Low Stock Alert",
    description: "Fertilizer stock below minimum threshold",
    time: "Yesterday",
    farm: "Hillside Ranch",
  },
];

const typeConfig = {
  crop: { icon: Sprout, color: "text-success bg-success/10" },
  finance: { icon: DollarSign, color: "text-accent bg-accent/20" },
  task: { icon: ClipboardCheck, color: "text-info bg-info/10" },
  alert: { icon: AlertTriangle, color: "text-warning bg-warning/10" },
};

export function RecentActivityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex gap-3"
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-primary">{activity.farm}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

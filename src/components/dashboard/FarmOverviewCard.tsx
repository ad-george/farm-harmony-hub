import { motion } from "framer-motion";
import { MapPin, Users, Sprout, Tractor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FarmOverviewCardProps {
  name: string;
  location: string;
  size: string;
  employees: number;
  crops: number;
  livestock: number;
  status: "active" | "maintenance" | "idle";
  delay?: number;
}

const statusConfig = {
  active: { label: "Active", className: "status-badge-success" },
  maintenance: { label: "Maintenance", className: "status-badge-warning" },
  idle: { label: "Idle", className: "status-badge-info" },
};

export function FarmOverviewCard({
  name,
  location,
  size,
  employees,
  crops,
  livestock,
  status,
  delay = 0,
}: FarmOverviewCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group rounded-xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </p>
        </div>
        <span className={`status-badge ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold text-foreground">{employees}</p>
          <p className="text-xs text-muted-foreground">Staff</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <Sprout className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold text-foreground">{crops}</p>
          <p className="text-xs text-muted-foreground">Crops</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <Tractor className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-semibold text-foreground">{livestock}</p>
          <p className="text-xs text-muted-foreground">Livestock</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">{size}</span>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
          View Details →
        </Button>
      </div>
    </motion.div>
  );
}

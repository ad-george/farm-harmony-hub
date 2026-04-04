import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Sprout,
  PiggyBank,
  Warehouse,
  ClipboardList,
  BarChart3,
  Mail,
  Settings,
  ChevronLeft,
  Leaf,
  CircleDollarSign,
  Tractor,
  Brain,
  CloudSun,
  Droplets,
  Shield,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebarState } from "@/contexts/SidebarContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MapPin, label: "Farms", path: "/farms" },
  { icon: Users, label: "Employees", path: "/employees" },
  { icon: Sprout, label: "Farm Operations", path: "/farm-operations" },
  { icon: CircleDollarSign, label: "Finance", path: "/finance" },
  { icon: Wheat, label: "Harvests", path: "/harvests" },
  { icon: Warehouse, label: "Inventory", path: "/inventory" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Brain, label: "Predictions", path: "/predictions" },
  { icon: CloudSun, label: "Weather", path: "/weather" },
  { icon: Droplets, label: "Irrigation", path: "/irrigation" },
  { icon: Shield, label: "Anomalies", path: "/anomaly-detection" },
  { icon: Mail, label: "Messages", path: "/messages" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar() {
  const { collapsed, toggle } = useSidebarState();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Leaf className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-semibold"
            >
              DigiFarm
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-primary"
                )}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border p-3">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-muted" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </motion.aside>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FarmOverviewCard } from "@/components/dashboard/FarmOverviewCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UpcomingTasksCard } from "@/components/dashboard/UpcomingTasksCard";
import { MapPin, Users, Sprout, CircleDollarSign, Tractor, ClipboardList } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";

export default function Dashboard() {
  const { farms, getStats } = useAppData();
  const stats = getStats();

  const statCards = [
    {
      title: "Total Farms",
      value: stats.totalFarms,
      change: { value: 12.5, trend: "up" as const },
      icon: MapPin,
      iconColor: "primary" as const,
    },
    {
      title: "Active Employees",
      value: stats.activeEmployees,
      change: { value: 8.2, trend: "up" as const },
      icon: Users,
      iconColor: "info" as const,
    },
    {
      title: "Crop Farms",
      value: stats.cropFarms,
      change: { value: 4.1, trend: "up" as const },
      icon: Sprout,
      iconColor: "success" as const,
    },
    {
      title: "Monthly Revenue",
      value: stats.monthlyRevenue,
      change: { value: 15.3, trend: "up" as const },
      icon: CircleDollarSign,
      iconColor: "accent" as const,
    },
    {
      title: "Livestock Farms",
      value: stats.livestockFarms,
      change: { value: 3.2, trend: "up" as const },
      icon: Tractor,
      iconColor: "warning" as const,
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      change: { value: 2.8, trend: "down" as const },
      icon: ClipboardList,
      iconColor: "success" as const,
    },
  ];

  // Get active farms for dashboard display (max 4)
  const displayFarms = farms.slice(0, 4).map((farm) => ({
    name: farm.name,
    location: farm.location,
    size: farm.size,
    employees: farm.employees,
    crops: farm.farmType === "crops" || farm.farmType === "mixed" ? 8 : 0,
    livestock: farm.farmType === "livestock" || farm.farmType === "dairy" ? 245 : 0,
    status: farm.status,
  }));

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening across your farms."
    >
      {/* Stats Grid */}
      <div className="dashboard-grid mb-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Farms Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Farms</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {displayFarms.map((farm, index) => (
                <FarmOverviewCard key={farm.name} {...farm} delay={0.2 + index * 0.1} />
              ))}
            </div>
          </div>
          
          <UpcomingTasksCard />
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          <WeatherWidget />
          <QuickActionsCard />
          <RecentActivityCard />
        </div>
      </div>
    </DashboardLayout>
  );
}

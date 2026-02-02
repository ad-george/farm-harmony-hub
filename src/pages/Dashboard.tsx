import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FarmOverviewCard } from "@/components/dashboard/FarmOverviewCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UpcomingTasksCard } from "@/components/dashboard/UpcomingTasksCard";
import { MapPin, Users, Sprout, CircleDollarSign, Tractor, ClipboardList, Bird, Milk, Layers, Fish, LucideIcon } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";

type IconColor = "primary" | "accent" | "success" | "warning" | "info" | "destructive";

interface StatCardData {
  title: string;
  value: string | number;
  change: { value: number; trend: "up" | "down" };
  icon: LucideIcon;
  iconColor: IconColor;
}

const farmTypeLabels = {
  crops: "Crops Farm",
  livestock: "Livestock Farm",
  poultry: "Poultry Farm",
  dairy: "Dairy Farm",
  mixed: "Mixed Farm",
  aquaculture: "Aquaculture Farm",
};

export default function Dashboard() {
  const { farms, getStats } = useAppData();
  const stats = getStats();

  // Build dynamic stat cards based on actual farm types
  const statCards: StatCardData[] = [
    {
      title: "Total Farms",
      value: stats.totalFarms,
      change: { value: 12.5, trend: "up" },
      icon: MapPin,
      iconColor: "primary",
    },
    {
      title: "Total Employees",
      value: stats.activeEmployees,
      change: { value: 8.2, trend: "up" },
      icon: Users,
      iconColor: "info",
    },
  ];

  // Add farm type cards dynamically based on what exists
  if (stats.cropFarms > 0) {
    statCards.push({
      title: "Crop Farms",
      value: stats.cropFarms,
      change: { value: 4.1, trend: "up" },
      icon: Sprout,
      iconColor: "success",
    });
  }

  if (stats.livestockFarms > 0) {
    statCards.push({
      title: "Livestock Farms",
      value: stats.livestockFarms,
      change: { value: 3.2, trend: "up" },
      icon: Tractor,
      iconColor: "warning",
    });
  }

  if (stats.poultryFarms > 0) {
    statCards.push({
      title: "Poultry Farms",
      value: stats.poultryFarms,
      change: { value: 5.0, trend: "up" },
      icon: Bird,
      iconColor: "info",
    });
  }

  if (stats.dairyFarms > 0) {
    statCards.push({
      title: "Dairy Farms",
      value: stats.dairyFarms,
      change: { value: 2.5, trend: "up" },
      icon: Milk,
      iconColor: "accent",
    });
  }

  if (stats.mixedFarms > 0) {
    statCards.push({
      title: "Mixed Farms",
      value: stats.mixedFarms,
      change: { value: 6.0, trend: "up" },
      icon: Layers,
      iconColor: "primary",
    });
  }

  if (stats.aquacultureFarms > 0) {
    statCards.push({
      title: "Aquaculture Farms",
      value: stats.aquacultureFarms,
      change: { value: 4.0, trend: "up" },
      icon: Fish,
      iconColor: "info",
    });
  }

  // Always show pending tasks and revenue
  statCards.push(
    {
      title: "Monthly Revenue",
      value: stats.monthlyRevenue,
      change: { value: 15.3, trend: "up" },
      icon: CircleDollarSign,
      iconColor: "accent",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      change: { value: 2.8, trend: "down" },
      icon: ClipboardList,
      iconColor: "success",
    }
  );

  // Get farms for dashboard display (max 4)
  const displayFarms = farms.slice(0, 4).map((farm) => ({
    name: farm.name,
    location: farm.location,
    size: farm.size,
    employees: farm.employees,
    farmType: farm.farmType,
    farmTypeLabel: farmTypeLabels[farm.farmType],
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

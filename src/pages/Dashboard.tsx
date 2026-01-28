import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FarmOverviewCard } from "@/components/dashboard/FarmOverviewCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UpcomingTasksCard } from "@/components/dashboard/UpcomingTasksCard";
import { MapPin, Users, Sprout, CircleDollarSign, Tractor, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Farms",
    value: 8,
    change: { value: 12.5, trend: "up" as const },
    icon: MapPin,
    iconColor: "primary" as const,
  },
  {
    title: "Active Employees",
    value: 156,
    change: { value: 8.2, trend: "up" as const },
    icon: Users,
    iconColor: "info" as const,
  },
  {
    title: "Crop Varieties",
    value: 24,
    change: { value: 4.1, trend: "up" as const },
    icon: Sprout,
    iconColor: "success" as const,
  },
  {
    title: "Monthly Revenue",
    value: "$284,500",
    change: { value: 15.3, trend: "up" as const },
    icon: CircleDollarSign,
    iconColor: "accent" as const,
  },
  {
    title: "Livestock Count",
    value: 1245,
    change: { value: 3.2, trend: "down" as const },
    icon: Tractor,
    iconColor: "warning" as const,
  },
  {
    title: "Yield Efficiency",
    value: "94.2%",
    change: { value: 2.8, trend: "up" as const },
    icon: TrendingUp,
    iconColor: "success" as const,
  },
];

const farms = [
  {
    name: "Green Valley Farm",
    location: "California, USA",
    size: "450 acres",
    employees: 42,
    crops: 8,
    livestock: 320,
    status: "active" as const,
  },
  {
    name: "Sunrise Acres",
    location: "Texas, USA",
    size: "780 acres",
    employees: 58,
    crops: 12,
    livestock: 580,
    status: "active" as const,
  },
  {
    name: "Hillside Ranch",
    location: "Montana, USA",
    size: "1200 acres",
    employees: 35,
    crops: 4,
    livestock: 245,
    status: "maintenance" as const,
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening across your farms."
    >
      {/* Stats Grid */}
      <div className="dashboard-grid mb-6">
        {stats.map((stat, index) => (
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
              {farms.map((farm, index) => (
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

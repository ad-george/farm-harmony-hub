import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Heart, Activity, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LivestockGroup {
  id: string;
  species: string;
  breed: string;
  count: number;
  farm: string;
  healthStatus: "healthy" | "attention" | "critical";
  avgProductivity: string;
  lastCheckup: string;
  nextVaccination: string;
}

const livestock: LivestockGroup[] = [
  {
    id: "1",
    species: "Cattle",
    breed: "Angus",
    count: 120,
    farm: "Hillside Ranch",
    healthStatus: "healthy",
    avgProductivity: "92%",
    lastCheckup: "Jan 15, 2025",
    nextVaccination: "Mar 1, 2025",
  },
  {
    id: "2",
    species: "Dairy Cows",
    breed: "Holstein",
    count: 85,
    farm: "Green Valley Farm",
    healthStatus: "healthy",
    avgProductivity: "88%",
    lastCheckup: "Jan 20, 2025",
    nextVaccination: "Feb 20, 2025",
  },
  {
    id: "3",
    species: "Sheep",
    breed: "Merino",
    count: 250,
    farm: "Sunrise Acres",
    healthStatus: "attention",
    avgProductivity: "85%",
    lastCheckup: "Jan 10, 2025",
    nextVaccination: "Feb 15, 2025",
  },
  {
    id: "4",
    species: "Pigs",
    breed: "Berkshire",
    count: 180,
    farm: "River Bend Farms",
    healthStatus: "healthy",
    avgProductivity: "90%",
    lastCheckup: "Jan 22, 2025",
    nextVaccination: "Mar 10, 2025",
  },
  {
    id: "5",
    species: "Chickens",
    breed: "Rhode Island Red",
    count: 500,
    farm: "Green Valley Farm",
    healthStatus: "critical",
    avgProductivity: "78%",
    lastCheckup: "Jan 18, 2025",
    nextVaccination: "Feb 5, 2025",
  },
  {
    id: "6",
    species: "Goats",
    breed: "Boer",
    count: 75,
    farm: "Hillside Ranch",
    healthStatus: "healthy",
    avgProductivity: "91%",
    lastCheckup: "Jan 25, 2025",
    nextVaccination: "Mar 15, 2025",
  },
];

const healthConfig = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success", icon: "🟢" },
  attention: { label: "Needs Attention", className: "bg-warning/10 text-warning", icon: "🟡" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive", icon: "🔴" },
};

const speciesEmojis: { [key: string]: string } = {
  Cattle: "🐄",
  "Dairy Cows": "🐮",
  Sheep: "🐑",
  Pigs: "🐷",
  Chickens: "🐔",
  Goats: "🐐",
};

export default function Livestock() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLivestock = livestock.filter(
    (item) =>
      item.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Livestock"
      subtitle="Track and manage your animals"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search livestock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Livestock
        </Button>
      </div>

      {/* Livestock Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLivestock.map((item, index) => {
          const health = healthConfig[item.healthStatus];
          const emoji = speciesEmojis[item.species] || "🐾";
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                    {emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.species}</h3>
                    <p className="text-sm text-muted-foreground">{item.breed}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Record Health Check</DropdownMenuItem>
                    <DropdownMenuItem>Schedule Vaccination</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{item.count}</p>
                  <p className="text-xs text-muted-foreground">Total Count</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{item.avgProductivity}</p>
                  <p className="text-xs text-muted-foreground">Productivity</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Farm</span>
                  <span className="font-medium text-primary">{item.farm}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Checkup:</span>
                  <span className="font-medium">{item.lastCheckup}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Next Vaccination:</span>
                  <span className="font-medium">{item.nextVaccination}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <Badge className={health.className}>
                  {health.icon} {health.label}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

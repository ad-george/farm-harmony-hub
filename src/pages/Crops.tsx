import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Sprout, Calendar, TrendingUp, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Crop {
  id: string;
  name: string;
  variety: string;
  farm: string;
  plantedDate: string;
  expectedHarvest: string;
  stage: "seedling" | "vegetative" | "flowering" | "harvest-ready";
  progress: number;
  area: string;
  expectedYield: string;
}

const crops: Crop[] = [
  {
    id: "1",
    name: "Wheat",
    variety: "Winter Wheat",
    farm: "Green Valley Farm",
    plantedDate: "Oct 15, 2024",
    expectedHarvest: "Jun 20, 2025",
    stage: "vegetative",
    progress: 45,
    area: "120 acres",
    expectedYield: "4,800 bushels",
  },
  {
    id: "2",
    name: "Corn",
    variety: "Sweet Corn",
    farm: "Sunrise Acres",
    plantedDate: "Apr 1, 2025",
    expectedHarvest: "Aug 15, 2025",
    stage: "seedling",
    progress: 15,
    area: "200 acres",
    expectedYield: "28,000 bushels",
  },
  {
    id: "3",
    name: "Soybeans",
    variety: "Roundup Ready",
    farm: "Hillside Ranch",
    plantedDate: "May 10, 2025",
    expectedHarvest: "Oct 1, 2025",
    stage: "seedling",
    progress: 10,
    area: "150 acres",
    expectedYield: "6,750 bushels",
  },
  {
    id: "4",
    name: "Tomatoes",
    variety: "Roma",
    farm: "Green Valley Farm",
    plantedDate: "Mar 15, 2025",
    expectedHarvest: "Jul 30, 2025",
    stage: "flowering",
    progress: 65,
    area: "25 acres",
    expectedYield: "75,000 lbs",
  },
  {
    id: "5",
    name: "Lettuce",
    variety: "Romaine",
    farm: "River Bend Farms",
    plantedDate: "Jan 10, 2025",
    expectedHarvest: "Mar 15, 2025",
    stage: "harvest-ready",
    progress: 95,
    area: "15 acres",
    expectedYield: "22,500 heads",
  },
];

const stageConfig = {
  seedling: { label: "Seedling", className: "bg-info/10 text-info", color: "bg-info" },
  vegetative: { label: "Vegetative", className: "bg-success/10 text-success", color: "bg-success" },
  flowering: { label: "Flowering", className: "bg-accent/20 text-accent-foreground", color: "bg-accent" },
  "harvest-ready": { label: "Harvest Ready", className: "bg-warning/10 text-warning", color: "bg-warning" },
};

export default function Crops() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCrops = crops.filter(
    (crop) =>
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Crops"
      subtitle="Monitor and manage your crop production"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Crop
        </Button>
      </div>

      {/* Crops Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrops.map((crop, index) => {
          const stage = stageConfig[crop.stage];
          return (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <Sprout className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{crop.name}</h3>
                    <p className="text-sm text-muted-foreground">{crop.variety}</p>
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
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Record Harvest</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Farm</span>
                  <span className="font-medium text-primary">{crop.farm}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Area</span>
                  <span className="font-medium">{crop.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Planted:</span>
                  <span className="font-medium">{crop.plantedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Expected:</span>
                  <span className="font-medium">{crop.expectedYield}</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <Badge className={stage.className}>{stage.label}</Badge>
                  <span className="text-sm font-medium">{crop.progress}%</span>
                </div>
                <Progress value={crop.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Expected harvest: {crop.expectedHarvest}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

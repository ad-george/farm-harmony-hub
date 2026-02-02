import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Sprout, Calendar, TrendingUp, MoreHorizontal, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const initialCrops: Crop[] = [
  {
    id: "1",
    name: "Wheat",
    variety: "Winter Wheat",
    farm: "Kilimanjaro Green Farm",
    plantedDate: "Oct 15, 2024",
    expectedHarvest: "Jun 20, 2025",
    stage: "vegetative",
    progress: 45,
    area: "120 acres",
    expectedYield: "4,800 bushels",
  },
  {
    id: "2",
    name: "Maize",
    variety: "Highland Maize",
    farm: "Lake Victoria Estates",
    plantedDate: "Apr 1, 2025",
    expectedHarvest: "Aug 15, 2025",
    stage: "seedling",
    progress: 15,
    area: "200 acres",
    expectedYield: "28,000 bushels",
  },
  {
    id: "3",
    name: "Coffee",
    variety: "Arabica",
    farm: "Rwenzori Highlands",
    plantedDate: "Jan 10, 2025",
    expectedHarvest: "Oct 1, 2025",
    stage: "flowering",
    progress: 65,
    area: "150 acres",
    expectedYield: "6,750 kg",
  },
  {
    id: "4",
    name: "Tea",
    variety: "Black Tea",
    farm: "Nyungwe Valley Farm",
    plantedDate: "Mar 15, 2025",
    expectedHarvest: "Jul 30, 2025",
    stage: "vegetative",
    progress: 40,
    area: "25 acres",
    expectedYield: "75,000 kg",
  },
];

const stageConfig = {
  seedling: { label: "Seedling", className: "bg-info/10 text-info", color: "bg-info" },
  vegetative: { label: "Vegetative", className: "bg-success/10 text-success", color: "bg-success" },
  flowering: { label: "Flowering", className: "bg-accent/20 text-accent-foreground", color: "bg-accent" },
  "harvest-ready": { label: "Harvest Ready", className: "bg-warning/10 text-warning", color: "bg-warning" },
};

type CropStage = "seedling" | "vegetative" | "flowering" | "harvest-ready";

const defaultFormData: {
  name: string;
  variety: string;
  farm: string;
  plantedDate: string;
  expectedHarvest: string;
  stage: CropStage;
  progress: number;
  area: string;
  expectedYield: string;
} = {
  name: "",
  variety: "",
  farm: "",
  plantedDate: "",
  expectedHarvest: "",
  stage: "seedling",
  progress: 0,
  area: "",
  expectedYield: "",
};

export default function Crops() {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHarvestOpen, setIsHarvestOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState<typeof defaultFormData>(defaultFormData);
  const [harvestData, setHarvestData] = useState({ actualYield: "", quality: "good", notes: "" });

  const filteredCrops = crops.filter(
    (crop) =>
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingCrop(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (crop: Crop) => {
    setEditingCrop(crop);
    setFormData({
      name: crop.name,
      variety: crop.variety,
      farm: crop.farm,
      plantedDate: crop.plantedDate,
      expectedHarvest: crop.expectedHarvest,
      stage: crop.stage,
      progress: crop.progress,
      area: crop.area,
      expectedYield: crop.expectedYield,
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (crop: Crop) => {
    setSelectedCrop(crop);
    setIsDetailsOpen(true);
  };

  const handleRecordHarvest = (crop: Crop) => {
    setSelectedCrop(crop);
    setHarvestData({ actualYield: "", quality: "good", notes: "" });
    setIsHarvestOpen(true);
  };

  const handleSaveCrop = () => {
    if (!formData.name || !formData.farm) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingCrop) {
      setCrops((prev) =>
        prev.map((c) =>
          c.id === editingCrop.id ? { ...c, ...formData } : c
        )
      );
      toast.success("Crop updated successfully");
    } else {
      const newCrop: Crop = {
        id: Date.now().toString(),
        ...formData,
      };
      setCrops((prev) => [...prev, newCrop]);
      toast.success("Crop added successfully");
    }
    setIsDialogOpen(false);
    setEditingCrop(null);
    setFormData(defaultFormData);
  };

  const handleDeleteCrop = (crop: Crop) => {
    setCrops((prev) => prev.filter((c) => c.id !== crop.id));
    toast.success(`${crop.name} removed successfully`);
  };

  const handleSaveHarvest = () => {
    if (selectedCrop) {
      setCrops((prev) =>
        prev.map((c) =>
          c.id === selectedCrop.id
            ? { ...c, stage: "harvest-ready" as const, progress: 100 }
            : c
        )
      );
      toast.success(`Harvest recorded for ${selectedCrop.name}`);
      setIsHarvestOpen(false);
      setSelectedCrop(null);
    }
  };

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
        <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
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
                    <DropdownMenuItem onClick={() => handleViewDetails(crop)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(crop)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordHarvest(crop)}>
                      Record Harvest
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteCrop(crop)}
                      className="text-destructive"
                    >
                      Remove
                    </DropdownMenuItem>
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

      {/* Add/Edit Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCrop ? "Edit Crop" : "Add New Crop"}</DialogTitle>
            <DialogDescription>
              {editingCrop ? "Update crop details" : "Enter the details of the new crop"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Crop Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Maize"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety">Variety</Label>
                <Input
                  id="variety"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g., Highland Maize"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm">Farm *</Label>
              <Input
                id="farm"
                value={formData.farm}
                onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                placeholder="e.g., Kilimanjaro Green Farm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plantedDate">Planted Date</Label>
                <Input
                  id="plantedDate"
                  value={formData.plantedDate}
                  onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                  placeholder="e.g., Jan 15, 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedHarvest">Expected Harvest</Label>
                <Input
                  id="expectedHarvest"
                  value={formData.expectedHarvest}
                  onChange={(e) => setFormData({ ...formData, expectedHarvest: e.target.value })}
                  placeholder="e.g., Jun 20, 2025"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g., 50 acres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedYield">Expected Yield</Label>
                <Input
                  id="expectedYield"
                  value={formData.expectedYield}
                  onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
                  placeholder="e.g., 5,000 bushels"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Growth Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value: "seedling" | "vegetative" | "flowering" | "harvest-ready") =>
                    setFormData({ ...formData, stage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seedling">Seedling</SelectItem>
                    <SelectItem value="vegetative">Vegetative</SelectItem>
                    <SelectItem value="flowering">Flowering</SelectItem>
                    <SelectItem value="harvest-ready">Harvest Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCrop}>
              {editingCrop ? "Save Changes" : "Add Crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCrop?.name} Details</DialogTitle>
          </DialogHeader>
          {selectedCrop && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Variety</p>
                  <p className="font-medium">{selectedCrop.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Farm</p>
                  <p className="font-medium">{selectedCrop.farm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{selectedCrop.area}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stage</p>
                  <Badge className={stageConfig[selectedCrop.stage].className}>
                    {stageConfig[selectedCrop.stage].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planted Date</p>
                  <p className="font-medium">{selectedCrop.plantedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Harvest</p>
                  <p className="font-medium">{selectedCrop.expectedHarvest}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Yield</p>
                  <p className="font-medium">{selectedCrop.expectedYield}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-medium">{selectedCrop.progress}%</p>
                </div>
              </div>
              <Progress value={selectedCrop.progress} className="h-3" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Harvest Dialog */}
      <Dialog open={isHarvestOpen} onOpenChange={setIsHarvestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Harvest - {selectedCrop?.name}</DialogTitle>
            <DialogDescription>
              Enter the harvest details for this crop
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actualYield">Actual Yield</Label>
              <Input
                id="actualYield"
                value={harvestData.actualYield}
                onChange={(e) => setHarvestData({ ...harvestData, actualYield: e.target.value })}
                placeholder="e.g., 4,500 bushels"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                value={harvestData.quality}
                onValueChange={(value) => setHarvestData({ ...harvestData, quality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={harvestData.notes}
                onChange={(e) => setHarvestData({ ...harvestData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHarvestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHarvest}>Record Harvest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

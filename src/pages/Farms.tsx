import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Users, Sprout, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Farm {
  id: string;
  name: string;
  location: string;
  size: string;
  soilType: string;
  employees: number;
  crops: number;
  status: "active" | "maintenance" | "idle";
  manager: string;
}

const initialFarms: Farm[] = [
  {
    id: "1",
    name: "Kilimanjaro Green Farm",
    location: "Arusha, Tanzania",
    size: "450 acres",
    soilType: "Loamy",
    employees: 42,
    crops: 8,
    status: "active",
    manager: "John Kimani",
  },
  {
    id: "2",
    name: "Lake Victoria Estates",
    location: "Kisumu, Kenya",
    size: "780 acres",
    soilType: "Clay",
    employees: 58,
    crops: 12,
    status: "active",
    manager: "Sarah Ochieng",
  },
  {
    id: "3",
    name: "Rwenzori Highlands",
    location: "Fort Portal, Uganda",
    size: "1200 acres",
    soilType: "Sandy",
    employees: 35,
    crops: 4,
    status: "maintenance",
    manager: "Michael Mugisha",
  },
  {
    id: "4",
    name: "Nyungwe Valley Farm",
    location: "Butare, Rwanda",
    size: "620 acres",
    soilType: "Silt",
    employees: 28,
    crops: 6,
    status: "active",
    manager: "Emily Uwimana",
  },
];

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success" },
  maintenance: { label: "Maintenance", className: "bg-warning/10 text-warning" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
};

export default function Farms() {
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    size: "",
    soilType: "",
    manager: "",
  });

  const filteredFarms = farms.filter(
    (farm) =>
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveFarm = () => {
    if (!formData.name || !formData.location || !formData.size || !formData.soilType || !formData.manager) {
      toast.error("Please fill in all fields");
      return;
    }

    const newFarm: Farm = {
      id: Date.now().toString(),
      name: formData.name,
      location: formData.location,
      size: `${formData.size} acres`,
      soilType: formData.soilType,
      employees: 0,
      crops: 0,
      status: "active",
      manager: formData.manager,
    };

    setFarms((prev) => [...prev, newFarm]);
    setFormData({ name: "", location: "", size: "", soilType: "", manager: "" });
    setIsDialogOpen(false);
    toast.success("Farm added successfully!");
  };

  const handleDeleteFarm = (id: string) => {
    setFarms((prev) => prev.filter((farm) => farm.id !== id));
    toast.success("Farm deleted successfully!");
  };

  return (
    <DashboardLayout
      title="Farms"
      subtitle="Manage all your farms and their details"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Farm</DialogTitle>
              <DialogDescription>
                Enter the details for your new farm. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Farm Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter farm name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="City, Country (e.g., Nairobi, Kenya)" 
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="size">Size (acres)</Label>
                  <Input 
                    id="size" 
                    type="number" 
                    placeholder="0" 
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Select 
                    value={formData.soilType} 
                    onValueChange={(value) => handleInputChange("soilType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Loamy">Loamy</SelectItem>
                      <SelectItem value="Clay">Clay</SelectItem>
                      <SelectItem value="Sandy">Sandy</SelectItem>
                      <SelectItem value="Silt">Silt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manager">Farm Manager</Label>
                <Input 
                  id="manager" 
                  placeholder="Enter manager name" 
                  value={formData.manager}
                  onChange={(e) => handleInputChange("manager", e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFarm}>Save Farm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Farms Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFarms.map((farm, index) => {
          const status = statusConfig[farm.status];
          return (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{farm.name}</h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {farm.location}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteFarm(farm.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{farm.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Soil Type</span>
                  <span className="font-medium">{farm.soilType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Manager</span>
                  <span className="font-medium">{farm.manager}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{farm.employees}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sprout className="h-4 w-4" />
                  <span>{farm.crops} crops</span>
                </div>
                <Badge className={`ml-auto ${status.className}`}>
                  {status.label}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

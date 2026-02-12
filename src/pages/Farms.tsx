import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Users, MoreHorizontal, Edit, Trash2, Factory, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAppData, FarmType, Farm } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success" },
  maintenance: { label: "Maintenance", className: "bg-warning/10 text-warning" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
};

const farmTypeLabels: Record<FarmType, string> = {
  crops: "Crops Farm",
  livestock: "Livestock Farm",
  poultry: "Poultry Farm",
  mixed: "Mixed Farm",
  dairy: "Dairy Farm",
  aquaculture: "Aquaculture",
};

export default function Farms() {
  const { farms, farmsLoading, addFarm, updateFarm, deleteFarm } = useAppData();
  const { isOwner, isManager, canEditFarm, canDeleteFarm, canCreate } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    size: "",
    employees: "",
    farmType: "" as FarmType | "",
    isActive: true,
  });

  const filteredFarms = farms.filter(
    (farm) =>
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", location: "", size: "", employees: "", farmType: "", isActive: true });
    setEditingFarm(null);
  };

  const openEditDialog = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      location: farm.location,
      size: farm.size.replace(" acres", ""),
      employees: farm.employees.toString(),
      farmType: farm.farmType,
      isActive: farm.status === "active",
    });
    setIsDialogOpen(true);
  };

  const handleSaveFarm = async () => {
    if (!formData.name || !formData.location || !formData.size || !formData.farmType || !formData.employees) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      if (editingFarm) {
        await updateFarm(editingFarm.id, {
          name: formData.name,
          location: formData.location,
          size: `${formData.size} acres`,
          employees: parseInt(formData.employees) || 0,
          farmType: formData.farmType as FarmType,
          status: formData.isActive ? "active" : "idle",
        });
        toast.success("Farm updated successfully!");
      } else {
        await addFarm({
          name: formData.name,
          location: formData.location,
          size: `${formData.size} acres`,
          employees: parseInt(formData.employees) || 0,
          farmType: formData.farmType as FarmType,
          status: formData.isActive ? "active" : "idle",
          type: formData.farmType as string,
        });
        toast.success("Farm added successfully!");
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save farm");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarm = async (id: string) => {
    try {
      await deleteFarm(id);
      toast.success("Farm deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete farm");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm();
    setIsDialogOpen(open);
  };

  if (farmsLoading) {
    return (
      <DashboardLayout title="Farms" subtitle="Manage all your farms and their details">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Farms" subtitle="Manage all your farms and their details">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search farms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> Add Farm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingFarm ? "Edit Farm" : "Add New Farm"}</DialogTitle>
                <DialogDescription>
                  {editingFarm ? "Update the farm details below." : "Enter the details for your new farm."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Farm Name</Label>
                  <Input id="name" placeholder="Enter farm name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="City, Country" value={formData.location} onChange={(e) => handleInputChange("location", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="size">Size (acres)</Label>
                    <Input id="size" type="number" placeholder="0" value={formData.size} onChange={(e) => handleInputChange("size", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employees">Employees</Label>
                    <Input id="employees" type="number" placeholder="0" value={formData.employees} onChange={(e) => handleInputChange("employees", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="farmType">Farm Type</Label>
                  <Select value={formData.farmType} onValueChange={(value) => handleInputChange("farmType", value)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crops">Crops Farm</SelectItem>
                      <SelectItem value="livestock">Livestock Farm</SelectItem>
                      <SelectItem value="poultry">Poultry Farm</SelectItem>
                      <SelectItem value="dairy">Dairy Farm</SelectItem>
                      <SelectItem value="mixed">Mixed Farm</SelectItem>
                      <SelectItem value="aquaculture">Aquaculture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Farm Status (Active)</Label>
                  <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleInputChange("isActive", checked)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                <Button onClick={handleSaveFarm} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingFarm ? "Update Farm" : "Save Farm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {farms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No farms yet</p>
          <p className="text-sm">Create your first farm to get started</p>
        </div>
      ) : (
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
                      <MapPin className="h-3.5 w-3.5" /> {farm.location}
                    </p>
                  </div>
                  {(canEditFarm(farm.id) || canDeleteFarm(farm.id)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditFarm(farm.id) && (
                          <DropdownMenuItem onClick={() => openEditDialog(farm)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canDeleteFarm(farm.id) && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFarm(farm.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{farm.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{farmTypeLabels[farm.farmType] || farm.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" /> <span>{farm.employees}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Factory className="h-4 w-4" /> <span>{farmTypeLabels[farm.farmType]}</span>
                  </div>
                  <Badge className={`ml-auto ${status.className}`}>{status.label}</Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

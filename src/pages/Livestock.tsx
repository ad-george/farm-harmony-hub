import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Heart, Activity, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const initialLivestock: LivestockGroup[] = [
  {
    id: "1",
    species: "Cattle",
    breed: "Ankole",
    count: 120,
    farm: "Rwenzori Highlands",
    healthStatus: "healthy",
    avgProductivity: "92%",
    lastCheckup: "Jan 15, 2025",
    nextVaccination: "Mar 1, 2025",
  },
  {
    id: "2",
    species: "Dairy Cows",
    breed: "Friesian",
    count: 85,
    farm: "Kilimanjaro Green Farm",
    healthStatus: "healthy",
    avgProductivity: "88%",
    lastCheckup: "Jan 20, 2025",
    nextVaccination: "Feb 20, 2025",
  },
  {
    id: "3",
    species: "Sheep",
    breed: "Dorper",
    count: 250,
    farm: "Lake Victoria Estates",
    healthStatus: "attention",
    avgProductivity: "85%",
    lastCheckup: "Jan 10, 2025",
    nextVaccination: "Feb 15, 2025",
  },
  {
    id: "4",
    species: "Goats",
    breed: "Boer",
    count: 180,
    farm: "Nyungwe Valley Farm",
    healthStatus: "healthy",
    avgProductivity: "90%",
    lastCheckup: "Jan 22, 2025",
    nextVaccination: "Mar 10, 2025",
  },
  {
    id: "5",
    species: "Chickens",
    breed: "Kuroiler",
    count: 500,
    farm: "Nyungwe Valley Farm",
    healthStatus: "critical",
    avgProductivity: "78%",
    lastCheckup: "Jan 18, 2025",
    nextVaccination: "Feb 5, 2025",
  },
  {
    id: "6",
    species: "Pigs",
    breed: "Large White",
    count: 75,
    farm: "Rwenzori Highlands",
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

type HealthStatus = "healthy" | "attention" | "critical";

const defaultFormData: {
  species: string;
  breed: string;
  count: number;
  farm: string;
  healthStatus: HealthStatus;
  avgProductivity: string;
  lastCheckup: string;
  nextVaccination: string;
} = {
  species: "",
  breed: "",
  count: 0,
  farm: "",
  healthStatus: "healthy",
  avgProductivity: "",
  lastCheckup: "",
  nextVaccination: "",
};

export default function Livestock() {
  const [livestock, setLivestock] = useState<LivestockGroup[]>(initialLivestock);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const [isVaccinationOpen, setIsVaccinationOpen] = useState(false);
  const [editingLivestock, setEditingLivestock] = useState<LivestockGroup | null>(null);
  const [selectedLivestock, setSelectedLivestock] = useState<LivestockGroup | null>(null);
  const [formData, setFormData] = useState<typeof defaultFormData>(defaultFormData);
  const [healthCheckData, setHealthCheckData] = useState<{ date: string; notes: string; status: HealthStatus }>({ date: "", notes: "", status: "healthy" });
  const [vaccinationData, setVaccinationData] = useState({ date: "", vaccine: "", notes: "" });

  const filteredLivestock = livestock.filter(
    (item) =>
      item.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingLivestock(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: LivestockGroup) => {
    setEditingLivestock(item);
    setFormData({
      species: item.species,
      breed: item.breed,
      count: item.count,
      farm: item.farm,
      healthStatus: item.healthStatus,
      avgProductivity: item.avgProductivity,
      lastCheckup: item.lastCheckup,
      nextVaccination: item.nextVaccination,
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (item: LivestockGroup) => {
    setSelectedLivestock(item);
    setIsDetailsOpen(true);
  };

  const handleRecordHealthCheck = (item: LivestockGroup) => {
    setSelectedLivestock(item);
    setHealthCheckData({ date: "", notes: "", status: item.healthStatus });
    setIsHealthCheckOpen(true);
  };

  const handleScheduleVaccination = (item: LivestockGroup) => {
    setSelectedLivestock(item);
    setVaccinationData({ date: "", vaccine: "", notes: "" });
    setIsVaccinationOpen(true);
  };

  const handleSaveLivestock = () => {
    if (!formData.species || !formData.farm) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingLivestock) {
      setLivestock((prev) =>
        prev.map((l) =>
          l.id === editingLivestock.id ? { ...l, ...formData } : l
        )
      );
      toast.success("Livestock updated successfully");
    } else {
      const newLivestock: LivestockGroup = {
        id: Date.now().toString(),
        ...formData,
      };
      setLivestock((prev) => [...prev, newLivestock]);
      toast.success("Livestock added successfully");
    }
    setIsDialogOpen(false);
    setEditingLivestock(null);
    setFormData(defaultFormData);
  };

  const handleDeleteLivestock = (item: LivestockGroup) => {
    setLivestock((prev) => prev.filter((l) => l.id !== item.id));
    toast.success(`${item.species} removed successfully`);
  };

  const handleSaveHealthCheck = () => {
    if (selectedLivestock && healthCheckData.date) {
      setLivestock((prev) =>
        prev.map((l) =>
          l.id === selectedLivestock.id
            ? { 
                ...l, 
                lastCheckup: healthCheckData.date,
                healthStatus: healthCheckData.status as "healthy" | "attention" | "critical"
              }
            : l
        )
      );
      toast.success(`Health check recorded for ${selectedLivestock.species}`);
      setIsHealthCheckOpen(false);
      setSelectedLivestock(null);
    } else {
      toast.error("Please enter the checkup date");
    }
  };

  const handleSaveVaccination = () => {
    if (selectedLivestock && vaccinationData.date) {
      setLivestock((prev) =>
        prev.map((l) =>
          l.id === selectedLivestock.id
            ? { ...l, nextVaccination: vaccinationData.date }
            : l
        )
      );
      toast.success(`Vaccination scheduled for ${selectedLivestock.species}`);
      setIsVaccinationOpen(false);
      setSelectedLivestock(null);
    } else {
      toast.error("Please enter the vaccination date");
    }
  };

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
        <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
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
                    <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordHealthCheck(item)}>
                      Record Health Check
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleScheduleVaccination(item)}>
                      Schedule Vaccination
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteLivestock(item)}
                      className="text-destructive"
                    >
                      Remove
                    </DropdownMenuItem>
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

      {/* Add/Edit Livestock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLivestock ? "Edit Livestock" : "Add New Livestock"}</DialogTitle>
            <DialogDescription>
              {editingLivestock ? "Update livestock details" : "Enter the details of the new livestock"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  placeholder="e.g., Cattle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Ankole"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgProductivity">Productivity</Label>
                <Input
                  id="avgProductivity"
                  value={formData.avgProductivity}
                  onChange={(e) => setFormData({ ...formData, avgProductivity: e.target.value })}
                  placeholder="e.g., 90%"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm">Farm *</Label>
              <Input
                id="farm"
                value={formData.farm}
                onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                placeholder="e.g., Rwenzori Highlands"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastCheckup">Last Checkup</Label>
                <Input
                  id="lastCheckup"
                  value={formData.lastCheckup}
                  onChange={(e) => setFormData({ ...formData, lastCheckup: e.target.value })}
                  placeholder="e.g., Jan 15, 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextVaccination">Next Vaccination</Label>
                <Input
                  id="nextVaccination"
                  value={formData.nextVaccination}
                  onChange={(e) => setFormData({ ...formData, nextVaccination: e.target.value })}
                  placeholder="e.g., Mar 1, 2025"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthStatus">Health Status</Label>
              <Select
                value={formData.healthStatus}
                onValueChange={(value: "healthy" | "attention" | "critical") =>
                  setFormData({ ...formData, healthStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="attention">Needs Attention</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLivestock}>
              {editingLivestock ? "Save Changes" : "Add Livestock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedLivestock?.species} Details</DialogTitle>
          </DialogHeader>
          {selectedLivestock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Breed</p>
                  <p className="font-medium">{selectedLivestock.breed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="font-medium">{selectedLivestock.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Farm</p>
                  <p className="font-medium">{selectedLivestock.farm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Productivity</p>
                  <p className="font-medium">{selectedLivestock.avgProductivity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Health Status</p>
                  <Badge className={healthConfig[selectedLivestock.healthStatus].className}>
                    {healthConfig[selectedLivestock.healthStatus].icon} {healthConfig[selectedLivestock.healthStatus].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Checkup</p>
                  <p className="font-medium">{selectedLivestock.lastCheckup}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Vaccination</p>
                  <p className="font-medium">{selectedLivestock.nextVaccination}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Health Check Dialog */}
      <Dialog open={isHealthCheckOpen} onOpenChange={setIsHealthCheckOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Health Check - {selectedLivestock?.species}</DialogTitle>
            <DialogDescription>
              Enter the health check details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="checkupDate">Checkup Date *</Label>
              <Input
                id="checkupDate"
                value={healthCheckData.date}
                onChange={(e) => setHealthCheckData({ ...healthCheckData, date: e.target.value })}
                placeholder="e.g., Feb 1, 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthStatus">Health Status</Label>
              <Select
                value={healthCheckData.status}
                onValueChange={(value: HealthStatus) => setHealthCheckData({ ...healthCheckData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="attention">Needs Attention</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthNotes">Notes</Label>
              <Textarea
                id="healthNotes"
                value={healthCheckData.notes}
                onChange={(e) => setHealthCheckData({ ...healthCheckData, notes: e.target.value })}
                placeholder="Any observations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHealthCheckOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHealthCheck}>Record Check</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Vaccination Dialog */}
      <Dialog open={isVaccinationOpen} onOpenChange={setIsVaccinationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Vaccination - {selectedLivestock?.species}</DialogTitle>
            <DialogDescription>
              Enter the vaccination details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vaccinationDate">Vaccination Date *</Label>
              <Input
                id="vaccinationDate"
                value={vaccinationData.date}
                onChange={(e) => setVaccinationData({ ...vaccinationData, date: e.target.value })}
                placeholder="e.g., Mar 15, 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaccine">Vaccine Type</Label>
              <Input
                id="vaccine"
                value={vaccinationData.vaccine}
                onChange={(e) => setVaccinationData({ ...vaccinationData, vaccine: e.target.value })}
                placeholder="e.g., FMD Vaccine"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaccinationNotes">Notes</Label>
              <Textarea
                id="vaccinationNotes"
                value={vaccinationData.notes}
                onChange={(e) => setVaccinationData({ ...vaccinationData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVaccinationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVaccination}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

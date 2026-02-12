import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Sprout, Calendar, TrendingUp, MoreHorizontal, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
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
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Crop {
  id: string;
  name: string;
  variety: string;
  farm_id: string;
  farm: string;
  plantedDate: string;
  expectedHarvest: string;
  stage: "seedling" | "vegetative" | "flowering" | "harvest-ready";
  progress: number;
  area: string;
  expectedYield: string;
}

const stageConfig = {
  seedling: { label: "Seedling", className: "bg-info/10 text-info" },
  vegetative: { label: "Vegetative", className: "bg-success/10 text-success" },
  flowering: { label: "Flowering", className: "bg-accent/20 text-accent-foreground" },
  "harvest-ready": { label: "Harvest Ready", className: "bg-warning/10 text-warning" },
};

type CropStage = "seedling" | "vegetative" | "flowering" | "harvest-ready";

export default function Crops() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const { canCreate, isEmployee } = useUserRole();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", variety: "", farm_id: "", plantedDate: "", expectedHarvest: "",
    stage: "seedling" as CropStage, area: "", expectedYield: "",
  });

  const fetchCrops = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crops").select("*, farms(name)").order("created_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setCrops((data || []).map((c: any) => ({
      id: c.id, name: c.name, variety: c.variety || "", farm_id: c.farm_id,
      farm: c.farms?.name || "", plantedDate: c.planted_date || "",
      expectedHarvest: c.expected_harvest || "", stage: (c.status?.toLowerCase() || "seedling") as CropStage,
      progress: c.status === "harvest-ready" ? 100 : c.status === "flowering" ? 65 : c.status === "vegetative" ? 40 : 15,
      area: c.area || "", expectedYield: c.yield_estimate?.toString() || "",
    })));
    setLoading(false);
  };

  useEffect(() => { if (user) fetchCrops(); }, [user]);

  const filteredCrops = crops.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name || !formData.farm_id) { toast.error("Please fill required fields"); return; }
    setSaving(true);
    try {
      if (editingCrop) {
        await supabase.from("crops").update({
          name: formData.name, variety: formData.variety, farm_id: formData.farm_id,
          planted_date: formData.plantedDate || null, expected_harvest: formData.expectedHarvest || null,
          status: formData.stage, area: formData.area, yield_estimate: parseFloat(formData.expectedYield) || null,
        }).eq("id", editingCrop.id);
        toast.success("Crop updated");
      } else {
        await supabase.from("crops").insert({
          name: formData.name, variety: formData.variety, farm_id: formData.farm_id,
          planted_date: formData.plantedDate || null, expected_harvest: formData.expectedHarvest || null,
          status: formData.stage, area: formData.area, yield_estimate: parseFloat(formData.expectedYield) || null,
          created_by: user?.id,
        });
        toast.success("Crop added");
      }
      setIsDialogOpen(false);
      await fetchCrops();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("crops").delete().eq("id", id);
    toast.success("Crop removed");
    fetchCrops();
  };

  const openEdit = (crop: Crop) => {
    setEditingCrop(crop);
    setFormData({
      name: crop.name, variety: crop.variety, farm_id: crop.farm_id, plantedDate: crop.plantedDate,
      expectedHarvest: crop.expectedHarvest, stage: crop.stage, area: crop.area, expectedYield: crop.expectedYield,
    });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingCrop(null);
    setFormData({ name: "", variety: "", farm_id: "", plantedDate: "", expectedHarvest: "", stage: "seedling", area: "", expectedYield: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <DashboardLayout title="Crops" subtitle="Monitor and manage your crop production"><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Crops" subtitle="Monitor and manage your crop production">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search crops..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {canCreate && (
          <Button className="bg-primary hover:bg-primary/90" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Crop
          </Button>
        )}
      </div>

      {crops.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground"><p>No crops yet. Add your first crop to get started.</p></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCrops.map((crop, index) => {
            const stage = stageConfig[crop.stage] || stageConfig.seedling;
            return (
              <motion.div key={crop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><Sprout className="h-6 w-6 text-success" /></div>
                    <div><h3 className="font-semibold text-foreground">{crop.name}</h3><p className="text-sm text-muted-foreground">{crop.variety}</p></div>
                  </div>
                  {!isEmployee && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(crop)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(crop.id)} className="text-destructive">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Farm</span><span className="font-medium text-primary">{crop.farm}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Area</span><span className="font-medium">{crop.area}</span></div>
                  {crop.plantedDate && <div className="flex items-center gap-2 text-sm"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Planted:</span><span className="font-medium">{crop.plantedDate}</span></div>}
                  {crop.expectedYield && <div className="flex items-center gap-2 text-sm"><TrendingUp className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Expected:</span><span className="font-medium">{crop.expectedYield}</span></div>}
                </div>
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between"><Badge className={stage.className}>{stage.label}</Badge><span className="text-sm font-medium">{crop.progress}%</span></div>
                  <Progress value={crop.progress} className="h-2" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCrop ? "Edit Crop" : "Add New Crop"}</DialogTitle>
            <DialogDescription>{editingCrop ? "Update crop details" : "Enter the details of the new crop"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Crop Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Maize" /></div>
              <div className="space-y-2"><Label>Variety</Label><Input value={formData.variety} onChange={(e) => setFormData({ ...formData, variety: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Farm *</Label>
              <Select value={formData.farm_id} onValueChange={(v) => setFormData({ ...formData, farm_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Planted Date</Label><Input type="date" value={formData.plantedDate} onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Expected Harvest</Label><Input type="date" value={formData.expectedHarvest} onChange={(e) => setFormData({ ...formData, expectedHarvest: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Area</Label><Input value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="e.g., 50 acres" /></div>
              <div className="space-y-2"><Label>Expected Yield</Label><Input value={formData.expectedYield} onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Growth Stage</Label>
              <Select value={formData.stage} onValueChange={(v: CropStage) => setFormData({ ...formData, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seedling">Seedling</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="harvest-ready">Harvest Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingCrop ? "Save Changes" : "Add Crop"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Sprout, Calendar, TrendingUp, MoreHorizontal, Loader2,
  Heart, Activity, Egg, Fish, Milk, Wheat, Bug, PlusCircle, X, Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

// ── Category definitions ──
interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  dataSource: "crops" | "livestock";
  filter?: string; // livestock type filter
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "crops", label: "Crops", icon: <Sprout className="h-5 w-5" />, color: "bg-success/10 text-success", dataSource: "crops" },
  { id: "livestock", label: "Livestock", icon: <Heart className="h-5 w-5" />, color: "bg-primary/10 text-primary", dataSource: "livestock", filter: "Cattle" },
  { id: "poultry", label: "Poultry", icon: <Egg className="h-5 w-5" />, color: "bg-warning/10 text-warning", dataSource: "livestock", filter: "Poultry" },
  { id: "dairy", label: "Dairy", icon: <Milk className="h-5 w-5" />, color: "bg-info/10 text-info", dataSource: "livestock", filter: "Dairy" },
  { id: "aquaculture", label: "Aquaculture", icon: <Fish className="h-5 w-5" />, color: "bg-accent/20 text-accent-foreground", dataSource: "livestock", filter: "Aquaculture" },
];

// ── Status configs ──
const cropStageConfig: Record<string, { label: string; className: string }> = {
  seedling: { label: "Seedling", className: "bg-info/10 text-info" },
  vegetative: { label: "Vegetative", className: "bg-success/10 text-success" },
  flowering: { label: "Flowering", className: "bg-accent/20 text-accent-foreground" },
  "harvest-ready": { label: "Harvest Ready", className: "bg-warning/10 text-warning" },
};

const healthConfig: Record<string, { label: string; className: string; icon: string }> = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success", icon: "🟢" },
  attention: { label: "Needs Attention", className: "bg-warning/10 text-warning", icon: "🟡" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive", icon: "🔴" },
};

const speciesEmojis: Record<string, string> = {
  Cattle: "🐄", "Dairy Cows": "🐮", Sheep: "🐑", Pigs: "🐷", Chickens: "🐔",
  Goats: "🐐", Poultry: "🐔", Ducks: "🦆", Fish: "🐟", Tilapia: "🐠",
};

export default function FarmOperations() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const orgId = useOrganization();
  const { canCreate, isEmployee } = useUserRole();

  // Data
  const [crops, setCrops] = useState<any[]>([]);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("farmflow-custom-categories");
    if (saved) {
      try {
        const custom = JSON.parse(saved) as Category[];
        return [...DEFAULT_CATEGORIES, ...custom.map(c => ({ ...c, icon: <Bug className="h-5 w-5" /> }))];
      } catch { return DEFAULT_CATEGORIES; }
    }
    return DEFAULT_CATEGORIES;
  });
  const [activeCategory, setActiveCategory] = useState<string>("crops");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Add category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"crops" | "livestock">("livestock");

  // Crop form
  const [cropForm, setCropForm] = useState({
    name: "", variety: "", farm_id: "", plantedDate: "", expectedHarvest: "",
    stage: "seedling", area: "", expectedYield: "", notes: "",
  });

  // Livestock form
  const [livestockForm, setLivestockForm] = useState({
    type: "", breed: "", count: 0, farm_id: "", healthStatus: "healthy", location: "", notes: "",
  });

  const activeCat = categories.find(c => c.id === activeCategory) || categories[0];

  // ── Fetch data ──
  const fetchData = async () => {
    setLoading(true);
    const [cropsRes, livestockRes] = await Promise.all([
      supabase.from("crops").select("*, farms(name)").order("created_at", { ascending: false }),
      supabase.from("livestock").select("*, farms(name)").order("created_at", { ascending: false }),
    ]);
    if (cropsRes.data) setCrops(cropsRes.data);
    if (livestockRes.data) setLivestock(livestockRes.data);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    if (activeCat.dataSource === "crops") {
      return crops.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.farms?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      let items = livestock;
      if (activeCat.filter) {
        items = items.filter(l => l.type?.toLowerCase() === activeCat.filter!.toLowerCase());
      }
      // For custom categories, filter by type matching category label
      if (!DEFAULT_CATEGORIES.find(d => d.id === activeCat.id) && activeCat.dataSource === "livestock") {
        items = livestock.filter(l => l.type?.toLowerCase() === activeCat.label.toLowerCase());
      }
      return items.filter(i =>
        (i.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.farms?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }, [activeCat, crops, livestock, searchQuery]);

  // ── Category counts ──
  const getCategoryCount = (cat: Category) => {
    if (cat.dataSource === "crops") return crops.length;
    if (cat.filter) return livestock.filter(l => l.type?.toLowerCase() === cat.filter!.toLowerCase()).length;
    if (!DEFAULT_CATEGORIES.find(d => d.id === cat.id)) {
      return livestock.filter(l => l.type?.toLowerCase() === cat.label.toLowerCase()).length;
    }
    // "livestock" default: count all that aren't in other categories
    const otherFilters = categories.filter(c => c.id !== "livestock" && c.dataSource === "livestock").map(c => (c.filter || c.label).toLowerCase());
    return livestock.filter(l => !otherFilters.includes(l.type?.toLowerCase())).length;
  };

  // ── CRUD ──
  const handleSaveCrop = async () => {
    if (!cropForm.name || !cropForm.farm_id) { toast.error("Name and farm are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: cropForm.name, variety: cropForm.variety, farm_id: cropForm.farm_id,
        planted_date: cropForm.plantedDate || null, expected_harvest: cropForm.expectedHarvest || null,
        status: cropForm.stage, area: cropForm.area, yield_estimate: parseFloat(cropForm.expectedYield) || null,
        notes: cropForm.notes || null,
      };
      if (editingItem) {
        await supabase.from("crops").update(payload).eq("id", editingItem.id);
        toast.success("Crop updated");
      } else {
        await supabase.from("crops").insert({ ...payload, created_by: user?.id, organization_id: orgId });
        toast.success("Crop added");
      }
      setIsAddDialogOpen(false);
      await fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleSaveLivestock = async () => {
    if (!livestockForm.type || !livestockForm.farm_id) { toast.error("Type and farm are required"); return; }
    setSaving(true);
    try {
      const payload = {
        type: livestockForm.type, breed: livestockForm.breed, count: livestockForm.count,
        farm_id: livestockForm.farm_id,
        health_status: livestockForm.healthStatus.charAt(0).toUpperCase() + livestockForm.healthStatus.slice(1),
        location: livestockForm.location, notes: livestockForm.notes || null,
      };
      if (editingItem) {
        await supabase.from("livestock").update(payload).eq("id", editingItem.id);
        toast.success("Record updated");
      } else {
        await supabase.from("livestock").insert({ ...payload, created_by: user?.id, organization_id: orgId });
        toast.success("Record added");
      }
      setIsAddDialogOpen(false);
      await fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const table = activeCat.dataSource === "crops" ? "crops" : "livestock";
    await supabase.from(table).delete().eq("id", id);
    toast.success("Record removed");
    fetchData();
  };

  const openAdd = () => {
    setEditingItem(null);
    if (activeCat.dataSource === "crops") {
      setCropForm({ name: "", variety: "", farm_id: "", plantedDate: "", expectedHarvest: "", stage: "seedling", area: "", expectedYield: "", notes: "" });
    } else {
      const defaultType = activeCat.filter || (DEFAULT_CATEGORIES.find(d => d.id === activeCat.id) ? "" : activeCat.label);
      setLivestockForm({ type: defaultType, breed: "", count: 0, farm_id: "", healthStatus: "healthy", location: "", notes: "" });
    }
    setIsAddDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeCat.dataSource === "crops") {
      setCropForm({
        name: item.name, variety: item.variety || "", farm_id: item.farm_id,
        plantedDate: item.planted_date || "", expectedHarvest: item.expected_harvest || "",
        stage: item.status?.toLowerCase() || "seedling", area: item.area || "",
        expectedYield: item.yield_estimate?.toString() || "", notes: item.notes || "",
      });
    } else {
      setLivestockForm({
        type: item.type, breed: item.breed || "", count: item.count,
        farm_id: item.farm_id, healthStatus: (item.health_status?.toLowerCase() || "healthy"),
        location: item.location || "", notes: item.notes || "",
      });
    }
    setIsAddDialogOpen(true);
  };

  // ── Add custom category ──
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) { toast.error("Category name is required"); return; }
    const id = newCategoryName.toLowerCase().replace(/\s+/g, "-");
    if (categories.find(c => c.id === id)) { toast.error("Category already exists"); return; }
    const newCat: Category = {
      id, label: newCategoryName.trim(),
      icon: <Bug className="h-5 w-5" />,
      color: "bg-muted text-foreground",
      dataSource: newCategoryType,
      filter: newCategoryType === "livestock" ? newCategoryName.trim() : undefined,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    // Save custom categories to localStorage
    const customCats = updated.filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.id)).map(c => ({
      id: c.id, label: c.label, color: c.color, dataSource: c.dataSource, filter: c.filter,
    }));
    localStorage.setItem("farmflow-custom-categories", JSON.stringify(customCats));
    setIsAddCategoryOpen(false);
    setNewCategoryName("");
    setActiveCategory(id);
    toast.success(`"${newCategoryName.trim()}" category added`);
  };

  const removeCustomCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    const customCats = updated.filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.id)).map(c => ({
      id: c.id, label: c.label, color: c.color, dataSource: c.dataSource, filter: c.filter,
    }));
    localStorage.setItem("farmflow-custom-categories", JSON.stringify(customCats));
    if (activeCategory === catId) setActiveCategory("crops");
    toast.success("Category removed");
  };

  if (loading) {
    return (
      <DashboardLayout title="Farm Operations" subtitle="Manage all your farming activities in one place">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Farm Operations" subtitle="Manage all your farming activities in one place">
      {/* ── Category tabs ── */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map(cat => {
            const count = getCategoryCount(cat);
            const isActive = activeCategory === cat.id;
            const isCustom = !DEFAULT_CATEGORIES.find(d => d.id === cat.id);
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <Badge variant="secondary" className={cn("ml-1 text-xs h-5 px-1.5", isActive && "bg-primary-foreground/20 text-primary-foreground")}>
                  {count}
                </Badge>
                {isCustom && isActive && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomCategory(cat.id); }}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddCategoryOpen(true)}
            className="rounded-xl border-dashed"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {/* ── Search + Add ── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`Search ${activeCat.label.toLowerCase()}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {canCreate && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add {activeCat.label}
          </Button>
        )}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 rounded-xl bg-card border border-dashed border-border">
              <div className="flex justify-center mb-4 text-4xl">
                {activeCat.dataSource === "crops" ? "🌾" : (speciesEmojis[activeCat.filter || ""] || "🐾")}
              </div>
              <p className="text-muted-foreground mb-2">No {activeCat.label.toLowerCase()} records yet.</p>
              {canCreate && (
                <Button variant="outline" onClick={openAdd} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add your first {activeCat.label.toLowerCase()} record
                </Button>
              )}
            </div>
          ) : activeCat.dataSource === "crops" ? (
            /* ── Crops Grid ── */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((crop, index) => {
                const stage = cropStageConfig[crop.status?.toLowerCase()] || cropStageConfig.seedling;
                const progress = crop.status === "harvest-ready" ? 100 : crop.status === "flowering" ? 65 : crop.status === "vegetative" ? 40 : 15;
                return (
                  <motion.div key={crop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300 border border-border">
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
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Farm</span><span className="font-medium text-primary">{crop.farms?.name}</span></div>
                      {crop.area && <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-medium">{crop.area}</span></div>}
                      {crop.planted_date && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Planted:</span><span className="font-medium">{crop.planted_date}</span></div>}
                      {crop.yield_estimate && <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Yield:</span><span className="font-medium">{crop.yield_estimate}</span></div>}
                    </div>
                    <div className="space-y-2 pt-3 border-t border-border">
                      <div className="flex items-center justify-between"><Badge className={stage.className}>{stage.label}</Badge><span className="text-sm font-medium">{progress}%</span></div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ── Livestock Grid ── */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => {
                const health = healthConfig[item.health_status?.toLowerCase()] || healthConfig.healthy;
                const emoji = speciesEmojis[item.type] || "🐾";
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300 border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">{emoji}</div>
                        <div><h3 className="font-semibold text-foreground">{item.type}</h3><p className="text-sm text-muted-foreground">{item.breed}</p></div>
                      </div>
                      {!isEmployee && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30">
                      <div className="text-center w-full"><p className="text-2xl font-bold text-foreground">{item.count}</p><p className="text-xs text-muted-foreground">Total Count</p></div>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-muted-foreground">Farm</span><span className="font-medium text-primary">{item.farms?.name}</span></div>
                      {item.location && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{item.location}</span></div>}
                    </div>
                    <div className="pt-3 border-t border-border"><Badge className={health.className}>{health.icon} {health.label}</Badge></div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Add"} {activeCat.label}</DialogTitle>
            <DialogDescription>{editingItem ? "Update the details" : `Add a new ${activeCat.label.toLowerCase()} record`}</DialogDescription>
          </DialogHeader>

          {activeCat.dataSource === "crops" ? (
            <div className="grid gap-3 py-2 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={cropForm.name} onChange={e => setCropForm({ ...cropForm, name: e.target.value })} placeholder="e.g., Maize" /></div>
                <div className="space-y-2"><Label>Variety</Label><Input value={cropForm.variety} onChange={e => setCropForm({ ...cropForm, variety: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={cropForm.farm_id} onValueChange={v => setCropForm({ ...cropForm, farm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Planted Date</Label><Input type="date" value={cropForm.plantedDate} onChange={e => setCropForm({ ...cropForm, plantedDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>Expected Harvest</Label><Input type="date" value={cropForm.expectedHarvest} onChange={e => setCropForm({ ...cropForm, expectedHarvest: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Area</Label><Input value={cropForm.area} onChange={e => setCropForm({ ...cropForm, area: e.target.value })} placeholder="e.g., 50 acres" /></div>
                <div className="space-y-2"><Label>Expected Yield</Label><Input value={cropForm.expectedYield} onChange={e => setCropForm({ ...cropForm, expectedYield: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Growth Stage</Label>
                <Select value={cropForm.stage} onValueChange={v => setCropForm({ ...cropForm, stage: v })}>
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
          ) : (
            <div className="grid gap-3 py-2 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type *</Label><Input value={livestockForm.type} onChange={e => setLivestockForm({ ...livestockForm, type: e.target.value })} placeholder={`e.g., ${activeCat.filter || "Cattle"}`} /></div>
                <div className="space-y-2"><Label>Breed</Label><Input value={livestockForm.breed} onChange={e => setLivestockForm({ ...livestockForm, breed: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Count</Label><Input type="number" value={livestockForm.count} onChange={e => setLivestockForm({ ...livestockForm, count: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Health</Label>
                  <Select value={livestockForm.healthStatus} onValueChange={v => setLivestockForm({ ...livestockForm, healthStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="attention">Needs Attention</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={livestockForm.farm_id} onValueChange={v => setLivestockForm({ ...livestockForm, farm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Location</Label><Input value={livestockForm.location} onChange={e => setLivestockForm({ ...livestockForm, location: e.target.value })} placeholder="e.g., Barn A" /></div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={activeCat.dataSource === "crops" ? handleSaveCrop : handleSaveLivestock} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? "Save Changes" : `Add ${activeCat.label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Category Dialog ── */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Farming Category</DialogTitle>
            <DialogDescription>Add a custom farming category like Bee Keeping, Rabbit Farming, etc.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g., Bee Keeping" />
            </div>
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={newCategoryType} onValueChange={(v: "crops" | "livestock") => setNewCategoryType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="livestock">Animal / Livestock based</SelectItem>
                  <SelectItem value="crops">Crop / Plant based</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This determines the fields available when adding records.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

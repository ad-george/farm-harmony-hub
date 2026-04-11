import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Loader2, MoreHorizontal, Wheat, Egg, Heart, Milk, Fish,
  TrendingUp, Calendar, Filter, Package,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Harvest {
  id: string;
  farm_id: string;
  category: string;
  item_name: string;
  quantity: number;
  unit: string;
  quality_grade: string;
  harvest_date: string;
  revenue: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

const CATEGORIES = [
  { id: "crops", label: "Crops", icon: <Wheat className="h-4 w-4" />, color: "bg-success/10 text-success" },
  { id: "livestock", label: "Livestock", icon: <Heart className="h-4 w-4" />, color: "bg-primary/10 text-primary" },
  { id: "poultry", label: "Poultry", icon: <Egg className="h-4 w-4" />, color: "bg-warning/10 text-warning" },
  { id: "dairy", label: "Dairy", icon: <Milk className="h-4 w-4" />, color: "bg-info/10 text-info" },
  { id: "aquaculture", label: "Aquaculture", icon: <Fish className="h-4 w-4" />, color: "bg-accent/20 text-accent-foreground" },
];

const UNITS = ["kg", "tonnes", "litres", "pieces", "crates", "bags", "trays", "heads"];
const GRADES = ["A", "B", "C", "Premium", "Standard"];

export default function Harvests() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const orgId = useOrganization();
  const { canCreate } = useUserRole();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFarm, setFilterFarm] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formFarmId, setFormFarmId] = useState("");
  const [formCategory, setFormCategory] = useState("crops");
  const [formItemName, setFormItemName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("kg");
  const [formGrade, setFormGrade] = useState("A");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formRevenue, setFormRevenue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchHarvests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("harvests")
      .select("*")
      .order("harvest_date", { ascending: false });
    if (!error && data) setHarvests(data as Harvest[]);
    setLoading(false);
  };

  useEffect(() => { fetchHarvests(); }, []);

  const resetForm = () => {
    setFormFarmId(farms[0]?.id || "");
    setFormCategory("crops");
    setFormItemName("");
    setFormQuantity("");
    setFormUnit("kg");
    setFormGrade("A");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormRevenue("");
    setFormNotes("");
    setEditingHarvest(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (h: Harvest) => {
    setEditingHarvest(h);
    setFormFarmId(h.farm_id);
    setFormCategory(h.category);
    setFormItemName(h.item_name);
    setFormQuantity(String(h.quantity));
    setFormUnit(h.unit);
    setFormGrade(h.quality_grade);
    setFormDate(h.harvest_date);
    setFormRevenue(String(h.revenue || 0));
    setFormNotes(h.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formItemName.trim() || !formFarmId) {
      toast.error("Item name and farm are required");
      return;
    }
    setSaving(true);
    const payload = {
      farm_id: formFarmId,
      category: formCategory,
      item_name: formItemName.trim(),
      quantity: Number(formQuantity) || 0,
      unit: formUnit,
      quality_grade: formGrade,
      harvest_date: formDate,
      revenue: Number(formRevenue) || 0,
      notes: formNotes.trim() || null,
      created_by: user?.id || null,
      organization_id: orgId,
    };

    if (editingHarvest) {
      const { error } = await supabase.from("harvests").update(payload).eq("id", editingHarvest.id);
      if (error) toast.error("Failed to update record");
      else toast.success("Harvest record updated");
    } else {
      const { error } = await supabase.from("harvests").insert(payload);
      if (error) toast.error("Failed to record harvest");
      else toast.success("Harvest recorded successfully");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchHarvests();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("harvests").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Record deleted"); fetchHarvests(); }
  };

  const farmMap = useMemo(() => {
    const m: Record<string, string> = {};
    farms.forEach((f) => (m[f.id] = f.name));
    return m;
  }, [farms]);

  const filtered = useMemo(() => {
    return harvests.filter((h) => {
      if (filterFarm !== "all" && h.farm_id !== filterFarm) return false;
      if (filterCategory !== "all" && h.category !== filterCategory) return false;
      if (search && !h.item_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [harvests, filterFarm, filterCategory, search]);

  // Stats
  const totalQuantity = filtered.reduce((s, h) => s + h.quantity, 0);
  const totalRevenue = filtered.reduce((s, h) => s + (h.revenue || 0), 0);
  const uniqueItems = new Set(filtered.map((h) => h.item_name)).size;

  const getCatInfo = (id: string) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

  return (
    <DashboardLayout title="Harvests & Yields" subtitle="Record and track farm outputs across all categories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end">
          {canCreate && (
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Record Harvest
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Yield</p>
                <p className="text-xl font-bold text-foreground">{totalQuantity.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">KSh {totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Wheat className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Items</p>
                <p className="text-xl font-bold text-foreground">{uniqueItems}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterFarm} onValueChange={setFilterFarm}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Farms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Wheat className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No harvest records yet</p>
                <p className="text-sm text-muted-foreground/70">Record your first harvest to start tracking yields</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Farm</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filtered.map((h) => {
                        const cat = getCatInfo(h.category);
                        return (
                          <motion.tr
                            key={h.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{h.item_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn("gap-1", cat.color)}>
                                {cat.icon} {cat.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{farmMap[h.farm_id] || "—"}</TableCell>
                            <TableCell className="text-right font-mono">
                              {h.quantity.toLocaleString()} {h.unit}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{h.quality_grade}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(h.harvest_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {h.revenue ? `KSh ${h.revenue.toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(h)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(h.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHarvest ? "Edit Harvest Record" : "Record Harvest"}</DialogTitle>
            <DialogDescription>
              {editingHarvest ? "Update the harvest details below." : "Enter details about the harvested yield."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={formFarmId} onValueChange={setFormFarmId}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input placeholder="e.g. Maize, Eggs, Milk" value={formItemName} onChange={(e) => setFormItemName(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" placeholder="0" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={formGrade} onValueChange={setFormGrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harvest Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Revenue (KSh)</Label>
                <Input type="number" placeholder="0" value={formRevenue} onChange={(e) => setFormRevenue(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional details..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingHarvest ? "Update" : "Record Harvest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

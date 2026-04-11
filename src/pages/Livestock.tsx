import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Heart, Activity, MoreHorizontal, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

interface LivestockGroup {
  id: string;
  type: string;
  breed: string;
  count: number;
  farm_id: string;
  farm: string;
  healthStatus: "healthy" | "attention" | "critical";
  location: string;
}

const healthConfig = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success", icon: "🟢" },
  attention: { label: "Needs Attention", className: "bg-warning/10 text-warning", icon: "🟡" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive", icon: "🔴" },
};

const speciesEmojis: Record<string, string> = { Cattle: "🐄", "Dairy Cows": "🐮", Sheep: "🐑", Pigs: "🐷", Chickens: "🐔", Goats: "🐐" };

type HealthStatus = "healthy" | "attention" | "critical";

export default function Livestock() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const orgId = useOrganization();
  const { canCreate, isEmployee } = useUserRole();
  const [livestock, setLivestock] = useState<LivestockGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LivestockGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ type: "", breed: "", count: 0, farm_id: "", healthStatus: "healthy" as HealthStatus, location: "" });

  const fetchLivestock = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("livestock").select("*, farms(name)").order("created_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setLivestock((data || []).map((l: any) => ({
      id: l.id, type: l.type, breed: l.breed || "", count: l.count, farm_id: l.farm_id,
      farm: l.farms?.name || "", healthStatus: (l.health_status?.toLowerCase() || "healthy") as HealthStatus,
      location: l.location || "",
    })));
    setLoading(false);
  };

  useEffect(() => { if (user) fetchLivestock(); }, [user]);

  const filteredLivestock = livestock.filter((i) =>
    i.type.toLowerCase().includes(searchQuery.toLowerCase()) || i.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.type || !formData.farm_id) { toast.error("Please fill required fields"); return; }
    setSaving(true);
    try {
      if (editingItem) {
        await supabase.from("livestock").update({
          type: formData.type, breed: formData.breed, count: formData.count, farm_id: formData.farm_id,
          health_status: formData.healthStatus.charAt(0).toUpperCase() + formData.healthStatus.slice(1),
          location: formData.location,
        }).eq("id", editingItem.id);
        toast.success("Livestock updated");
      } else {
        await supabase.from("livestock").insert({
          type: formData.type, breed: formData.breed, count: formData.count, farm_id: formData.farm_id,
          health_status: formData.healthStatus.charAt(0).toUpperCase() + formData.healthStatus.slice(1),
          location: formData.location, created_by: user?.id, organization_id: orgId,
        });
        toast.success("Livestock added");
      }
      setIsDialogOpen(false);
      await fetchLivestock();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("livestock").delete().eq("id", id);
    toast.success("Livestock removed");
    fetchLivestock();
  };

  const openEdit = (item: LivestockGroup) => {
    setEditingItem(item);
    setFormData({ type: item.type, breed: item.breed, count: item.count, farm_id: item.farm_id, healthStatus: item.healthStatus, location: item.location });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ type: "", breed: "", count: 0, farm_id: "", healthStatus: "healthy", location: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <DashboardLayout title="Livestock" subtitle="Track and manage your animals"><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Livestock" subtitle="Track and manage your animals">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search livestock..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {canCreate && <Button className="bg-primary hover:bg-primary/90" onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Livestock</Button>}
      </div>

      {livestock.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground"><p>No livestock records yet.</p></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLivestock.map((item, index) => {
            const health = healthConfig[item.healthStatus];
            const emoji = speciesEmojis[item.type] || "🐾";
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-xl bg-card p-5 shadow-card hover:shadow-lg transition-all duration-300">
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
                  <div className="text-center"><p className="text-2xl font-bold text-foreground">{item.count}</p><p className="text-xs text-muted-foreground">Total Count</p></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Farm</span><span className="font-medium text-primary">{item.farm}</span></div>
                </div>
                <div className="pt-3 border-t border-border"><Badge className={health.className}>{health.icon} {health.label}</Badge></div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? "Edit Livestock" : "Add New Livestock"}</DialogTitle><DialogDescription>{editingItem ? "Update livestock details" : "Enter the details"}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Species *</Label><Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., Cattle" /></div>
              <div className="space-y-2"><Label>Breed</Label><Input value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Count</Label><Input type="number" value={formData.count} onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Health Status</Label>
                <Select value={formData.healthStatus} onValueChange={(v: HealthStatus) => setFormData({ ...formData, healthStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="healthy">Healthy</SelectItem><SelectItem value="attention">Needs Attention</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Farm *</Label>
              <Select value={formData.farm_id} onValueChange={(v) => setFormData({ ...formData, farm_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingItem ? "Save Changes" : "Add Livestock"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

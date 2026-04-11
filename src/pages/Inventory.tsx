import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Package, AlertTriangle, CheckCircle2, Pencil, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

type ItemCategory = "seeds" | "fertilizer" | "pesticide" | "machinery" | "feed" | "supplies";

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  minStock: number;
  farm_id: string | null;
  farm: string;
}

const categoryConfig = {
  seeds: { label: "Seeds", className: "bg-success/10 text-success" },
  fertilizer: { label: "Fertilizer", className: "bg-info/10 text-info" },
  pesticide: { label: "Pesticide", className: "bg-warning/10 text-warning" },
  machinery: { label: "Machinery", className: "bg-primary/10 text-primary" },
  feed: { label: "Feed", className: "bg-accent/20 text-accent-foreground" },
  supplies: { label: "Supplies", className: "bg-muted text-muted-foreground" },
};

export default function Inventory() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const orgId = useOrganization();
  const { canCreate, isEmployee } = useUserRole();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "seeds" as ItemCategory, quantity: "", unit: "", minStock: "", farm_id: "" });

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("inventory").select("*, farms(name)").order("created_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setInventory((data || []).map((i: any) => ({
      id: i.id, name: i.name, category: (i.category?.toLowerCase() || "supplies") as ItemCategory,
      quantity: Number(i.quantity), unit: i.unit || "", minStock: Number(i.min_stock || 0),
      farm_id: i.farm_id, farm: i.farms?.name || "All Farms",
    })));
    setLoading(false);
  };

  useEffect(() => { if (user) fetchInventory(); }, [user]);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.quantity < item.minStock);

  const handleSave = async () => {
    if (!formData.name || !formData.quantity || !formData.unit) { toast.error("Please fill required fields"); return; }
    setSaving(true);
    try {
      if (editingItem) {
        await supabase.from("inventory").update({
          name: formData.name, category: formData.category, quantity: parseFloat(formData.quantity),
          unit: formData.unit, min_stock: parseFloat(formData.minStock) || 0, farm_id: formData.farm_id || null,
        }).eq("id", editingItem.id);
        toast.success("Item updated");
      } else {
        await supabase.from("inventory").insert({
          name: formData.name, category: formData.category, quantity: parseFloat(formData.quantity),
          unit: formData.unit, min_stock: parseFloat(formData.minStock) || 0, farm_id: formData.farm_id || null,
          created_by: user?.id, organization_id: orgId,
        });
        toast.success("Item added");
      }
      setIsDialogOpen(false);
      await fetchInventory();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    await supabase.from("inventory").delete().eq("id", deleteItem.id);
    toast.success("Item removed");
    setDeleteItem(null);
    fetchInventory();
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, category: item.category, quantity: item.quantity.toString(), unit: item.unit, minStock: item.minStock.toString(), farm_id: item.farm_id || "" });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", category: "seeds", quantity: "", unit: "", minStock: "", farm_id: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <DashboardLayout title="Inventory" subtitle="Monitor seeds, fertilizers, equipment, and supplies"><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Inventory" subtitle="Monitor seeds, fertilizers, equipment, and supplies">
      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <div><p className="font-medium text-warning">Low Stock Alert</p><p className="text-sm text-muted-foreground">{lowStockItems.length} item(s) below minimum: {lowStockItems.map((i) => i.name).join(", ")}</p></div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search inventory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="seeds">Seeds</SelectItem><SelectItem value="fertilizer">Fertilizer</SelectItem>
              <SelectItem value="pesticide">Pesticide</SelectItem><SelectItem value="machinery">Machinery</SelectItem>
              <SelectItem value="feed">Feed</SelectItem><SelectItem value="supplies">Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && <Button className="bg-primary hover:bg-primary/90" onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/30"><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Quantity</TableHead><TableHead>Stock Level</TableHead><TableHead>Farm</TableHead><TableHead>Status</TableHead>{!isEmployee && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
          <TableBody>
            {filteredInventory.map((item) => {
              const category = categoryConfig[item.category] || categoryConfig.supplies;
              const stockPercentage = Math.min((item.quantity / (item.minStock * 2)) * 100, 100);
              const isLowStock = item.quantity < item.minStock;
              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Package className="h-5 w-5 text-muted-foreground" /></div><span className="font-medium">{item.name}</span></div></TableCell>
                  <TableCell><Badge className={category.className}>{category.label}</Badge></TableCell>
                  <TableCell><span className="font-semibold">{item.quantity}</span><span className="text-muted-foreground ml-1">{item.unit}</span></TableCell>
                  <TableCell className="w-40"><div className="space-y-1"><Progress value={stockPercentage} className={`h-2 ${isLowStock ? "[&>div]:bg-destructive" : ""}`} /><p className="text-xs text-muted-foreground">Min: {item.minStock} {item.unit}</p></div></TableCell>
                  <TableCell className="text-primary">{item.farm}</TableCell>
                  <TableCell>{isLowStock ? <Badge className="bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge> : <Badge className="bg-success/10 text-success"><CheckCircle2 className="h-3 w-3 mr-1" />In Stock</Badge>}</TableCell>
                  {!isEmployee && <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle><DialogDescription>{editingItem ? "Update details" : "Add a new item"}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Item Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Wheat Seeds" /></div>
            <div className="grid gap-2"><Label>Category</Label><Select value={formData.category} onValueChange={(v: ItemCategory) => setFormData({ ...formData, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="seeds">Seeds</SelectItem><SelectItem value="fertilizer">Fertilizer</SelectItem><SelectItem value="pesticide">Pesticide</SelectItem><SelectItem value="machinery">Machinery</SelectItem><SelectItem value="feed">Feed</SelectItem><SelectItem value="supplies">Supplies</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Unit</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="kg, liters" /></div>
            </div>
            <div className="grid gap-2"><Label>Min Stock Level</Label><Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Farm</Label><Select value={formData.farm_id} onValueChange={(v) => setFormData({ ...formData, farm_id: v })}><SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger><SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingItem ? "Update" : "Add Item"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Item</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove "{deleteItem?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteItem}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

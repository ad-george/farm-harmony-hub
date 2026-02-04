import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Package, AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";

type ItemCategory = "seeds" | "fertilizer" | "pesticide" | "machinery" | "feed" | "supplies";

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  minStock: number;
  farm: string;
  lastUpdated: string;
}

const categoryConfig = {
  seeds: { label: "Seeds", className: "bg-success/10 text-success" },
  fertilizer: { label: "Fertilizer", className: "bg-info/10 text-info" },
  pesticide: { label: "Pesticide", className: "bg-warning/10 text-warning" },
  machinery: { label: "Machinery", className: "bg-primary/10 text-primary" },
  feed: { label: "Feed", className: "bg-accent/20 text-accent-foreground" },
  supplies: { label: "Supplies", className: "bg-muted text-muted-foreground" },
};

const initialInventory: InventoryItem[] = [
  { id: "1", name: "Wheat Seeds", category: "seeds", quantity: 850, unit: "kg", minStock: 200, farm: "Green Valley", lastUpdated: "Jan 25, 2025" },
  { id: "2", name: "Corn Seeds", category: "seeds", quantity: 620, unit: "kg", minStock: 300, farm: "Sunrise Acres", lastUpdated: "Jan 24, 2025" },
  { id: "3", name: "NPK Fertilizer", category: "fertilizer", quantity: 45, unit: "tons", minStock: 20, farm: "All Farms", lastUpdated: "Jan 26, 2025" },
  { id: "4", name: "Organic Compost", category: "fertilizer", quantity: 12, unit: "tons", minStock: 15, farm: "Green Valley", lastUpdated: "Jan 22, 2025" },
  { id: "5", name: "Herbicide", category: "pesticide", quantity: 180, unit: "liters", minStock: 100, farm: "All Farms", lastUpdated: "Jan 27, 2025" },
  { id: "6", name: "John Deere Tractor", category: "machinery", quantity: 4, unit: "units", minStock: 2, farm: "All Farms", lastUpdated: "Jan 20, 2025" },
  { id: "7", name: "Cattle Feed", category: "feed", quantity: 8, unit: "tons", minStock: 10, farm: "Hillside Ranch", lastUpdated: "Jan 26, 2025" },
  { id: "8", name: "Poultry Feed", category: "feed", quantity: 3.5, unit: "tons", minStock: 5, farm: "Green Valley", lastUpdated: "Jan 25, 2025" },
];

export default function Inventory() {
  const { farms } = useAppData();
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "seeds" as ItemCategory,
    quantity: "",
    unit: "",
    minStock: "",
    farm: "",
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.quantity < item.minStock);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "seeds",
      quantity: "",
      unit: "",
      minStock: "",
      farm: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minStock: item.minStock.toString(),
      farm: item.farm,
    });
    setIsDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.quantity || !formData.unit || !formData.minStock || !formData.farm) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (editingItem) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                category: formData.category,
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                minStock: parseFloat(formData.minStock),
                farm: formData.farm,
                lastUpdated: today,
              }
            : item
        )
      );
      toast({
        title: "Item Updated",
        description: `${formData.name} has been updated successfully`,
      });
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        minStock: parseFloat(formData.minStock),
        farm: formData.farm,
        lastUpdated: today,
      };
      setInventory((prev) => [...prev, newItem]);
      toast({
        title: "Item Added",
        description: `${formData.name} has been added to inventory`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDeleteItem = () => {
    if (deleteItem) {
      setInventory((prev) => prev.filter((item) => item.id !== deleteItem.id));
      toast({
        title: "Item Removed",
        description: `${deleteItem.name} has been removed from inventory`,
      });
      setDeleteItem(null);
    }
  };

  return (
    <DashboardLayout
      title="Inventory"
      subtitle="Monitor seeds, fertilizers, equipment, and supplies"
    >
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <div>
            <p className="font-medium text-warning">Low Stock Alert</p>
            <p className="text-sm text-muted-foreground">
              {lowStockItems.length} item(s) below minimum stock level:{" "}
              {lowStockItems.map((item) => item.name).join(", ")}
            </p>
          </div>
        </motion.div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="seeds">Seeds</SelectItem>
              <SelectItem value="fertilizer">Fertilizer</SelectItem>
              <SelectItem value="pesticide">Pesticide</SelectItem>
              <SelectItem value="machinery">Machinery</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl bg-card shadow-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => {
              const category = categoryConfig[item.category];
              const stockPercentage = Math.min((item.quantity / (item.minStock * 2)) * 100, 100);
              const isLowStock = item.quantity < item.minStock;

              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={category.className}>{category.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{item.quantity}</span>
                    <span className="text-muted-foreground ml-1">{item.unit}</span>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="space-y-1">
                      <Progress
                        value={stockPercentage}
                        className={`h-2 ${isLowStock ? "[&>div]:bg-destructive" : ""}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minStock} {item.unit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-primary">{item.farm}</TableCell>
                  <TableCell className="text-muted-foreground">{item.lastUpdated}</TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <Badge className="bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-success/10 text-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the inventory item details" : "Add a new item to your inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wheat Seeds"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ItemCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeds">Seeds</SelectItem>
                  <SelectItem value="fertilizer">Fertilizer</SelectItem>
                  <SelectItem value="pesticide">Pesticide</SelectItem>
                  <SelectItem value="machinery">Machinery</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., kg, liters"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minStock">Minimum Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="Alerts when stock falls below this"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farm">Farm</Label>
              <Select
                value={formData.farm}
                onValueChange={(value) => setFormData({ ...formData, farm: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Farms">All Farms</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.name}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteItem?.name}" from inventory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

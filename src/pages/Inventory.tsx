import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
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

interface InventoryItem {
  id: string;
  name: string;
  category: "seeds" | "fertilizer" | "pesticide" | "machinery" | "feed" | "supplies";
  quantity: number;
  unit: string;
  minStock: number;
  farm: string;
  lastUpdated: string;
}

const inventory: InventoryItem[] = [
  { id: "1", name: "Wheat Seeds", category: "seeds", quantity: 850, unit: "kg", minStock: 200, farm: "Green Valley", lastUpdated: "Jan 25, 2025" },
  { id: "2", name: "Corn Seeds", category: "seeds", quantity: 620, unit: "kg", minStock: 300, farm: "Sunrise Acres", lastUpdated: "Jan 24, 2025" },
  { id: "3", name: "NPK Fertilizer", category: "fertilizer", quantity: 45, unit: "tons", minStock: 20, farm: "All Farms", lastUpdated: "Jan 26, 2025" },
  { id: "4", name: "Organic Compost", category: "fertilizer", quantity: 12, unit: "tons", minStock: 15, farm: "Green Valley", lastUpdated: "Jan 22, 2025" },
  { id: "5", name: "Herbicide", category: "pesticide", quantity: 180, unit: "liters", minStock: 100, farm: "All Farms", lastUpdated: "Jan 27, 2025" },
  { id: "6", name: "John Deere Tractor", category: "machinery", quantity: 4, unit: "units", minStock: 2, farm: "All Farms", lastUpdated: "Jan 20, 2025" },
  { id: "7", name: "Cattle Feed", category: "feed", quantity: 8, unit: "tons", minStock: 10, farm: "Hillside Ranch", lastUpdated: "Jan 26, 2025" },
  { id: "8", name: "Poultry Feed", category: "feed", quantity: 3.5, unit: "tons", minStock: 5, farm: "Green Valley", lastUpdated: "Jan 25, 2025" },
];

const categoryConfig = {
  seeds: { label: "Seeds", className: "bg-success/10 text-success" },
  fertilizer: { label: "Fertilizer", className: "bg-info/10 text-info" },
  pesticide: { label: "Pesticide", className: "bg-warning/10 text-warning" },
  machinery: { label: "Machinery", className: "bg-primary/10 text-primary" },
  feed: { label: "Feed", className: "bg-accent/20 text-accent-foreground" },
  supplies: { label: "Supplies", className: "bg-muted text-muted-foreground" },
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.quantity < item.minStock);

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
        <Button className="bg-primary hover:bg-primary/90">
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </DashboardLayout>
  );
}

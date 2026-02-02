import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, BarChart3, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  farm: string;
  category: string;
}

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  investments: number;
}

const initialTransactions: Transaction[] = [
  { id: "1", date: "Jan 28, 2025", description: "Maize Sale - AgriTrade EA", type: "income", amount: 125000, farm: "Kilimanjaro Green Farm", category: "Crop Sales" },
  { id: "2", date: "Jan 27, 2025", description: "Equipment Maintenance", type: "expense", amount: 28000, farm: "All Farms", category: "Equipment" },
  { id: "3", date: "Jan 26, 2025", description: "Livestock Feed Purchase", type: "expense", amount: 45000, farm: "Rwenzori Highlands", category: "Feed" },
  { id: "4", date: "Jan 25, 2025", description: "Dairy Products Sale", type: "income", amount: 82000, farm: "Kilimanjaro Green Farm", category: "Dairy Sales" },
  { id: "5", date: "Jan 24, 2025", description: "Fertilizer Purchase", type: "expense", amount: 32000, farm: "Lake Victoria Estates", category: "Inputs" },
  { id: "6", date: "Jan 23, 2025", description: "Coffee Export", type: "income", amount: 350000, farm: "Rwenzori Highlands", category: "Crop Sales" },
  { id: "7", date: "Jan 22, 2025", description: "Labor Wages", type: "expense", amount: 180000, farm: "All Farms", category: "Labor" },
];

const revenueData = [
  { month: "Jan", revenue: 850000, expenses: 420000 },
  { month: "Feb", revenue: 920000, expenses: 380000 },
  { month: "Mar", revenue: 780000, expenses: 450000 },
  { month: "Apr", revenue: 1050000, expenses: 520000 },
  { month: "May", revenue: 1180000, expenses: 480000 },
  { month: "Jun", revenue: 1320000, expenses: 550000 },
];

const expenseCategories = [
  { name: "Labor", value: 35, color: "hsl(var(--primary))" },
  { name: "Equipment", value: 25, color: "hsl(var(--warning))" },
  { name: "Seeds & Feed", value: 20, color: "hsl(var(--info))" },
  { name: "Utilities", value: 12, color: "hsl(var(--accent))" },
  { name: "Other", value: 8, color: "hsl(var(--muted-foreground))" },
];

const defaultFormData = {
  date: "",
  description: "",
  type: "income" as "income" | "expense",
  amount: 0,
  farm: "",
  category: "",
};

const defaultStatsForm = {
  totalRevenue: 12845000,
  totalExpenses: 4562000,
  investments: 1250000,
};

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalRevenue: 12845000,
    totalExpenses: 4562000,
    netProfit: 8283000,
    investments: 1250000,
  });
  const [selectedFarm, setSelectedFarm] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [statsForm, setStatsForm] = useState(defaultStatsForm);

  const filteredTransactions = selectedFarm === "all"
    ? transactions
    : transactions.filter((t) => t.farm === selectedFarm || t.farm === "All Farms");

  const openAddDialog = () => {
    setEditingTransaction(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      type: transaction.type,
      amount: transaction.amount,
      farm: transaction.farm,
      category: transaction.category,
    });
    setIsDialogOpen(true);
  };

  const openStatsDialog = () => {
    setStatsForm({
      totalRevenue: financeStats.totalRevenue,
      totalExpenses: financeStats.totalExpenses,
      investments: financeStats.investments,
    });
    setIsStatsDialogOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!formData.description || !formData.amount || !formData.farm) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id ? { ...t, ...formData } : t
        )
      );
      toast.success("Transaction updated successfully");
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...formData,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      toast.success("Transaction added successfully");
    }
    setIsDialogOpen(false);
    setEditingTransaction(null);
    setFormData(defaultFormData);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    toast.success("Transaction deleted successfully");
  };

  const handleSaveStats = () => {
    setFinanceStats({
      totalRevenue: statsForm.totalRevenue,
      totalExpenses: statsForm.totalExpenses,
      netProfit: statsForm.totalRevenue - statsForm.totalExpenses,
      investments: statsForm.investments,
    });
    toast.success("Financial stats updated successfully");
    setIsStatsDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(financeStats.totalRevenue),
      change: { value: 12.5, trend: "up" as const },
      icon: DollarSign,
      iconColor: "success" as const,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(financeStats.totalExpenses),
      change: { value: 3.2, trend: "down" as const },
      icon: CreditCard,
      iconColor: "destructive" as const,
    },
    {
      title: "Net Profit",
      value: formatCurrency(financeStats.netProfit),
      change: { value: 18.7, trend: "up" as const },
      icon: TrendingUp,
      iconColor: "primary" as const,
    },
    {
      title: "Investments",
      value: formatCurrency(financeStats.investments),
      change: { value: 5.4, trend: "up" as const },
      icon: PiggyBank,
      iconColor: "accent" as const,
    },
  ];

  return (
    <DashboardLayout
      title="Finance"
      subtitle="Track revenues, expenses, and financial reports"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Select value={selectedFarm} onValueChange={setSelectedFarm}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select farm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Farms</SelectItem>
            <SelectItem value="Kilimanjaro Green Farm">Kilimanjaro Green Farm</SelectItem>
            <SelectItem value="Lake Victoria Estates">Lake Victoria Estates</SelectItem>
            <SelectItem value="Rwenzori Highlands">Rwenzori Highlands</SelectItem>
            <SelectItem value="Nyungwe Valley Farm">Nyungwe Valley Farm</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openStatsDialog}>
            <Pencil className="h-4 w-4 mr-2" />
            Update Stats
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid mb-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Revenue vs Expenses Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`KSh ${value.toLocaleString()}`, ""]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--success))" }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))" }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {expenseCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium">{cat.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl bg-card shadow-card overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-muted/30">
                <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                <TableCell className="text-primary">{tx.farm}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      tx.type === "income"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {tx.type === "income" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    tx.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}KSh {tx.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(tx)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTransaction(tx)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? "Update transaction details" : "Enter the transaction details"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., Feb 1, 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "income" | "expense") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Maize Sale"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KSh) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Crop Sales"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm">Farm *</Label>
              <Select
                value={formData.farm}
                onValueChange={(value) => setFormData({ ...formData, farm: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Farms">All Farms</SelectItem>
                  <SelectItem value="Kilimanjaro Green Farm">Kilimanjaro Green Farm</SelectItem>
                  <SelectItem value="Lake Victoria Estates">Lake Victoria Estates</SelectItem>
                  <SelectItem value="Rwenzori Highlands">Rwenzori Highlands</SelectItem>
                  <SelectItem value="Nyungwe Valley Farm">Nyungwe Valley Farm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTransaction}>
              {editingTransaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Financial Stats</DialogTitle>
            <DialogDescription>
              Update the main financial statistics
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="totalRevenue">Total Revenue (KSh)</Label>
              <Input
                id="totalRevenue"
                type="number"
                value={statsForm.totalRevenue}
                onChange={(e) => setStatsForm({ ...statsForm, totalRevenue: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalExpenses">Total Expenses (KSh)</Label>
              <Input
                id="totalExpenses"
                type="number"
                value={statsForm.totalExpenses}
                onChange={(e) => setStatsForm({ ...statsForm, totalExpenses: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investments">Investments (KSh)</Label>
              <Input
                id="investments"
                type="number"
                value={statsForm.investments}
                onChange={(e) => setStatsForm({ ...statsForm, investments: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Net Profit (calculated)</p>
              <p className="text-lg font-semibold text-foreground">
                KSh {(statsForm.totalRevenue - statsForm.totalExpenses).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStats}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

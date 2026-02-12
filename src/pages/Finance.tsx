import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, BarChart3, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAppData } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  farm_id: string | null;
  farm: string;
  category: string;
}

const expenseCategories = [
  { name: "Labor", value: 35, color: "hsl(var(--primary))" },
  { name: "Equipment", value: 25, color: "hsl(var(--warning))" },
  { name: "Seeds & Feed", value: 20, color: "hsl(var(--info))" },
  { name: "Utilities", value: 12, color: "hsl(var(--accent))" },
  { name: "Other", value: 8, color: "hsl(var(--muted-foreground))" },
];

export default function Finance() {
  const { farms } = useAppData();
  const { user } = useAuth();
  const { canCreate, isEmployee } = useUserRole();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ date: "", description: "", type: "income" as "income" | "expense", amount: 0, farm_id: "", category: "" });

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("finance_records").select("*, farms(name)").order("date", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setTransactions((data || []).map((t: any) => ({
      id: t.id, date: t.date, description: t.description || "", type: t.type as "income" | "expense",
      amount: Number(t.amount), farm_id: t.farm_id, farm: t.farms?.name || "All Farms", category: t.category,
    })));
    setLoading(false);
  };

  useEffect(() => { if (user) fetchTransactions(); }, [user]);

  const filteredTransactions = selectedFarm === "all" ? transactions : transactions.filter((t) => t.farm_id === selectedFarm);

  const totalRevenue = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const handleSave = async () => {
    if (!formData.description || !formData.amount || !formData.category) { toast.error("Please fill required fields"); return; }
    setSaving(true);
    try {
      if (editingTransaction) {
        await supabase.from("finance_records").update({
          date: formData.date || new Date().toISOString().split("T")[0],
          description: formData.description, type: formData.type, amount: formData.amount,
          farm_id: formData.farm_id || null, category: formData.category,
        }).eq("id", editingTransaction.id);
        toast.success("Transaction updated");
      } else {
        await supabase.from("finance_records").insert({
          date: formData.date || new Date().toISOString().split("T")[0],
          description: formData.description, type: formData.type, amount: formData.amount,
          farm_id: formData.farm_id || null, category: formData.category, created_by: user?.id,
        });
        toast.success("Transaction added");
      }
      setIsDialogOpen(false);
      await fetchTransactions();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("finance_records").delete().eq("id", id);
    toast.success("Transaction deleted");
    fetchTransactions();
  };

  const openAdd = () => { setEditingTransaction(null); setFormData({ date: "", description: "", type: "income", amount: 0, farm_id: "", category: "" }); setIsDialogOpen(true); };
  const openEdit = (t: Transaction) => { setEditingTransaction(t); setFormData({ date: t.date, description: t.description, type: t.type, amount: t.amount, farm_id: t.farm_id || "", category: t.category }); setIsDialogOpen(true); };

  const stats = [
    { title: "Total Revenue", value: formatCurrency(totalRevenue), change: { value: 12.5, trend: "up" as const }, icon: DollarSign, iconColor: "success" as const },
    { title: "Total Expenses", value: formatCurrency(totalExpenses), change: { value: 3.2, trend: "down" as const }, icon: CreditCard, iconColor: "destructive" as const },
    { title: "Net Profit", value: formatCurrency(netProfit), change: { value: 18.7, trend: "up" as const }, icon: TrendingUp, iconColor: "primary" as const },
  ];

  if (loading) {
    return <DashboardLayout title="Finance" subtitle="Track revenues, expenses, and financial reports"><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Finance" subtitle="Track revenues, expenses, and financial reports">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Select value={selectedFarm} onValueChange={setSelectedFarm}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select farm" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Farms</SelectItem>
            {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {canCreate && (
          <Button className="bg-primary hover:bg-primary/90" onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Transaction</Button>
        )}
      </div>

      <div className="dashboard-grid mb-6">
        {stats.map((stat, index) => <StatCard key={stat.title} {...stat} delay={index * 0.1} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-2 rounded-xl bg-card p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">{expenseCategories.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}</Pie></PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">{expenseCategories.map((cat) => (<div key={cat.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-muted-foreground">{cat.name}</span></div><span className="font-medium">{cat.value}%</span></div>))}</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-border"><h3 className="font-semibold text-foreground">Recent Transactions</h3></div>
        <Table>
          <TableHeader><TableRow className="bg-muted/30"><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Farm</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead>{!isEmployee && <TableHead className="w-12">Actions</TableHead>}</TableRow></TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-muted/30">
                <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                <TableCell className="text-primary">{tx.farm}</TableCell>
                <TableCell><Badge className={tx.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>{tx.type === "income" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}{tx.type}</Badge></TableCell>
                <TableCell className={`text-right font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>{tx.type === "income" ? "+" : "-"}KSh {tx.amount.toLocaleString()}</TableCell>
                {!isEmployee && (
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(tx)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(tx.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle><DialogDescription>Enter transaction details</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={formData.type} onValueChange={(v: "income" | "expense") => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Description *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (KSh) *</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Category *</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Crop Sales" /></div>
            </div>
            <div className="space-y-2"><Label>Farm</Label><Select value={formData.farm_id} onValueChange={(v) => setFormData({ ...formData, farm_id: v })}><SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger><SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingTransaction ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

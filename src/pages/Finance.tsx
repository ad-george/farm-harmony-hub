import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, BarChart3 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stats = [
  {
    title: "Total Revenue",
    value: "$1,284,500",
    change: { value: 12.5, trend: "up" as const },
    icon: DollarSign,
    iconColor: "success" as const,
  },
  {
    title: "Total Expenses",
    value: "$456,200",
    change: { value: 3.2, trend: "down" as const },
    icon: CreditCard,
    iconColor: "destructive" as const,
  },
  {
    title: "Net Profit",
    value: "$828,300",
    change: { value: 18.7, trend: "up" as const },
    icon: TrendingUp,
    iconColor: "primary" as const,
  },
  {
    title: "Investments",
    value: "$125,000",
    change: { value: 5.4, trend: "up" as const },
    icon: PiggyBank,
    iconColor: "accent" as const,
  },
];

const revenueData = [
  { month: "Jan", revenue: 85000, expenses: 42000 },
  { month: "Feb", revenue: 92000, expenses: 38000 },
  { month: "Mar", revenue: 78000, expenses: 45000 },
  { month: "Apr", revenue: 105000, expenses: 52000 },
  { month: "May", revenue: 118000, expenses: 48000 },
  { month: "Jun", revenue: 132000, expenses: 55000 },
];

const expenseCategories = [
  { name: "Labor", value: 35, color: "#1a5f2a" },
  { name: "Equipment", value: 25, color: "#d4a017" },
  { name: "Seeds & Feed", value: 20, color: "#2196f3" },
  { name: "Utilities", value: 12, color: "#ff9800" },
  { name: "Other", value: 8, color: "#9e9e9e" },
];

const transactions = [
  { id: "1", date: "Jan 28, 2025", description: "Wheat Sale - AgriTrade Co.", type: "income", amount: 12500, farm: "Green Valley" },
  { id: "2", date: "Jan 27, 2025", description: "Equipment Maintenance", type: "expense", amount: 2800, farm: "All Farms" },
  { id: "3", date: "Jan 26, 2025", description: "Livestock Feed Purchase", type: "expense", amount: 4500, farm: "Hillside Ranch" },
  { id: "4", date: "Jan 25, 2025", description: "Dairy Products Sale", type: "income", amount: 8200, farm: "Green Valley" },
  { id: "5", date: "Jan 24, 2025", description: "Fertilizer Purchase", type: "expense", amount: 3200, farm: "Sunrise Acres" },
];

export default function Finance() {
  return (
    <DashboardLayout
      title="Finance"
      subtitle="Track revenues, expenses, and financial reports"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select farm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Farms</SelectItem>
            <SelectItem value="green-valley">Green Valley Farm</SelectItem>
            <SelectItem value="sunrise">Sunrise Acres</SelectItem>
            <SelectItem value="hillside">Hillside Ranch</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
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
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--success))" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))" }}
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
              <TableHead>Farm</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-muted/30">
                <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
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
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </DashboardLayout>
  );
}

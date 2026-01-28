import { motion } from "framer-motion";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const yieldData = [
  { month: "Jan", wheat: 120, corn: 0, soybeans: 0 },
  { month: "Feb", wheat: 0, corn: 0, soybeans: 0 },
  { month: "Mar", wheat: 0, corn: 0, soybeans: 0 },
  { month: "Apr", wheat: 0, corn: 45, soybeans: 0 },
  { month: "May", wheat: 0, corn: 85, soybeans: 30 },
  { month: "Jun", wheat: 450, corn: 120, soybeans: 65 },
  { month: "Jul", wheat: 0, corn: 280, soybeans: 95 },
  { month: "Aug", wheat: 0, corn: 350, soybeans: 140 },
  { month: "Sep", wheat: 0, corn: 0, soybeans: 180 },
  { month: "Oct", wheat: 0, corn: 0, soybeans: 0 },
];

const farmProductivity = [
  { name: "Green Valley", productivity: 94 },
  { name: "Sunrise Acres", productivity: 88 },
  { name: "Hillside Ranch", productivity: 82 },
  { name: "River Bend", productivity: 91 },
];

const livestockDistribution = [
  { name: "Cattle", value: 320, color: "#1a5f2a" },
  { name: "Sheep", value: 250, color: "#d4a017" },
  { name: "Pigs", value: 180, color: "#2196f3" },
  { name: "Poultry", value: 500, color: "#ff9800" },
  { name: "Goats", value: 75, color: "#9e9e9e" },
];

const reportTypes = [
  { id: "yield", title: "Crop Yield Report", description: "Detailed analysis of crop production and yields", icon: TrendingUp },
  { id: "finance", title: "Financial Summary", description: "Revenue, expenses, and profit margins", icon: BarChart3 },
  { id: "livestock", title: "Livestock Report", description: "Health, productivity, and breeding data", icon: PieChart },
  { id: "inventory", title: "Inventory Status", description: "Stock levels and reorder recommendations", icon: FileText },
];

export default function Reports() {
  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="View insights and generate reports"
    >
      {/* Report Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4">
          <Select defaultValue="2025">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
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
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Quick Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <report.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crop Yield Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Crop Yield Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yieldData}>
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
              <Legend />
              <Area
                type="monotone"
                dataKey="wheat"
                stackId="1"
                stroke="#1a5f2a"
                fill="#1a5f2a"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="corn"
                stackId="1"
                stroke="#d4a017"
                fill="#d4a017"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="soybeans"
                stackId="1"
                stroke="#2196f3"
                fill="#2196f3"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Farm Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Farm Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={farmProductivity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, "Productivity"]}
              />
              <Bar dataKey="productivity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Livestock Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Livestock Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={livestockDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {livestockDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {[
              { name: "Q4 2024 Financial Summary", date: "Jan 15, 2025", size: "2.4 MB" },
              { name: "Annual Crop Yield Report 2024", date: "Jan 10, 2025", size: "4.1 MB" },
              { name: "Livestock Health Assessment", date: "Jan 5, 2025", size: "1.8 MB" },
              { name: "Equipment Maintenance Log", date: "Dec 28, 2024", size: "890 KB" },
            ].map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {report.date}
                      <span>•</span>
                      {report.size}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

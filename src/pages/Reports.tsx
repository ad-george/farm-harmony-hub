import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart, RefreshCw, Info, CheckCircle2, Clock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  status: "ready" | "generating";
}

export default function Reports() {
  const { farms, tasks, employees, activities } = useAppData();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedFarm, setSelectedFarm] = useState("all");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    { id: "1", name: "Q4 2024 Financial Summary", type: "finance", date: "Jan 15, 2025", size: "2.4 MB", status: "ready" },
    { id: "2", name: "Annual Crop Yield Report 2024", type: "yield", date: "Jan 10, 2025", size: "4.1 MB", status: "ready" },
    { id: "3", name: "Livestock Health Assessment", type: "livestock", date: "Jan 5, 2025", size: "1.8 MB", status: "ready" },
    { id: "4", name: "Equipment Maintenance Log", type: "inventory", date: "Dec 28, 2024", size: "890 KB", status: "ready" },
  ]);

  // Dynamic data based on context
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

  const farmProductivity = farms.map((farm) => ({
    name: farm.name.length > 15 ? farm.name.substring(0, 15) + "..." : farm.name,
    productivity: Math.floor(Math.random() * 20) + 75, // Simulated productivity
  }));

  const farmTypeDistribution = [
    { name: "Crops", value: farms.filter((f) => f.farmType === "crops").length, color: "#1a5f2a" },
    { name: "Livestock", value: farms.filter((f) => f.farmType === "livestock").length, color: "#d4a017" },
    { name: "Poultry", value: farms.filter((f) => f.farmType === "poultry").length, color: "#2196f3" },
    { name: "Mixed", value: farms.filter((f) => f.farmType === "mixed").length, color: "#ff9800" },
    { name: "Dairy", value: farms.filter((f) => f.farmType === "dairy").length, color: "#9c27b0" },
    { name: "Aquaculture", value: farms.filter((f) => f.farmType === "aquaculture").length, color: "#00bcd4" },
  ].filter((item) => item.value > 0);

  const reportTypes = [
    { id: "yield", title: "Crop Yield Report", description: "Detailed analysis of crop production and yields", icon: TrendingUp },
    { id: "finance", title: "Financial Summary", description: "Revenue, expenses, and profit margins", icon: BarChart3 },
    { id: "livestock", title: "Livestock Report", description: "Health, productivity, and breeding data", icon: PieChart },
    { id: "inventory", title: "Inventory Status", description: "Stock levels and reorder recommendations", icon: FileText },
  ];

  const handleGenerateReport = (reportType: string) => {
    setIsGenerating(true);
    const reportName = reportTypes.find((r) => r.id === reportType)?.title || "Report";
    const farmName = selectedFarm === "all" ? "All Farms" : farms.find((f) => f.id === selectedFarm)?.name || "";
    
    toast({
      title: "Generating Report",
      description: `${reportName} for ${farmName} is being generated...`,
    });

    // Simulate report generation
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `${reportName} - ${selectedYear}${selectedFarm !== "all" ? ` (${farmName})` : ""}`,
        type: reportType,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
        status: "ready",
      };
      setGeneratedReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
      toast({
        title: "Report Ready",
        description: `${reportName} has been generated successfully`,
      });
    }, 2000);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    toast({
      title: "Downloading",
      description: `${report.name} is being downloaded...`,
    });
    // In a real app, this would trigger actual file download
  };

  const handleExportAll = () => {
    toast({
      title: "Exporting All Reports",
      description: `${generatedReports.length} reports are being packaged for download...`,
    });
    // In a real app, this would create a zip file
  };

  const handleRefreshData = () => {
    toast({
      title: "Refreshing Data",
      description: "Fetching latest data from all farms...",
    });
    // Simulate data refresh
  };

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="View insights and generate reports"
    >
      {/* Report Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select farm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsHelpOpen(true)}>
            <Info className="h-4 w-4 mr-2" />
            How Reports Work
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All Reports
          </Button>
        </div>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {report.description}
                </CardDescription>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-primary"
                  onClick={() => handleGenerateReport(report.id)}
                >
                  Generate Report →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-primary/10 text-center">
          <p className="text-2xl font-bold text-primary">{farms.length}</p>
          <p className="text-sm text-muted-foreground">Total Farms</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 text-center">
          <p className="text-2xl font-bold text-success">{tasks.filter((t) => t.status === "completed").length}</p>
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 text-center">
          <p className="text-2xl font-bold text-info">{employees.length}</p>
          <p className="text-sm text-muted-foreground">Active Employees</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 text-center">
          <p className="text-2xl font-bold text-warning">{activities.length}</p>
          <p className="text-sm text-muted-foreground">Recent Activities</p>
        </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Crop Yield Trends</h3>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport("yield")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Farm Productivity</h3>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport("finance")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
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

        {/* Farm Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Farm Type Distribution</h3>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport("livestock")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={farmTypeDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {farmTypeDistribution.map((entry, index) => (
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

        {/* Generated Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Generated Reports</h3>
            <Badge variant="secondary">{generatedReports.length} reports</Badge>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {generatedReports.map((report) => (
              <div
                key={report.id}
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
                <div className="flex items-center gap-2">
                  {report.status === "generating" ? (
                    <Badge variant="secondary" className="animate-pulse">
                      <Clock className="h-3 w-3 mr-1" />
                      Generating
                    </Badge>
                  ) : (
                    <Badge className="bg-success/10 text-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownloadReport(report)}
                    disabled={report.status === "generating"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Reports Are Generated</DialogTitle>
            <DialogDescription>
              Understanding the report generation process in Farm Flow
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what">
                <AccordionTrigger>What data is used for reports?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Reports are generated from data collected across your farm operations:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li><strong>Crop Yield Reports:</strong> Data from harvest records, crop management entries, and production logs</li>
                    <li><strong>Financial Summaries:</strong> Revenue from sales, expense records, and transaction history</li>
                    <li><strong>Livestock Reports:</strong> Health check records, vaccination schedules, and breeding data</li>
                    <li><strong>Inventory Status:</strong> Stock levels, purchase orders, and usage patterns</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how">
                <AccordionTrigger>How to get accurate reports?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-2">For the most accurate reports, ensure you:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li><strong>Record harvests:</strong> Log each crop harvest in the Crops page using "Record Harvest"</li>
                    <li><strong>Track finances:</strong> Add all income and expenses in the Finance page</li>
                    <li><strong>Update livestock:</strong> Record health checks and vaccinations regularly</li>
                    <li><strong>Maintain inventory:</strong> Keep stock levels updated as items are used or purchased</li>
                    <li><strong>Complete tasks:</strong> Mark tasks as completed to track productivity</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="when">
                <AccordionTrigger>When should I generate reports?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    You can generate reports at any time. Common schedules include:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li><strong>Weekly:</strong> Task completion and activity summaries</li>
                    <li><strong>Monthly:</strong> Financial summaries and inventory status</li>
                    <li><strong>Quarterly:</strong> Comprehensive farm performance reviews</li>
                    <li><strong>Annually:</strong> Full yield reports and year-end financial statements</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="export">
                <AccordionTrigger>How to export and share reports?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Click the download button next to any report card or generated report to download it as a PDF.
                    Use "Export All Reports" to download all generated reports as a ZIP file.
                    Reports can be shared via email or printed for record-keeping.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

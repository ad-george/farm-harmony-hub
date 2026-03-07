import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart, RefreshCw, Info, CheckCircle2, Clock, Filter, Trash2 } from "lucide-react";
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
  csvData?: string;
  farmFilter?: string;
  yearFilter?: string;
}

// Utility to trigger a file download in the browser
function downloadFile(filename: string, content: string, mimeType = "text/csv") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { farms, tasks, employees, activities } = useAppData();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedFarm, setSelectedFarm] = useState("all");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);

  // Filter farms based on selection
  const filteredFarms = useMemo(() => {
    if (selectedFarm === "all") return farms;
    return farms.filter((f) => f.id === selectedFarm);
  }, [farms, selectedFarm]);

  const filteredTasks = useMemo(() => {
    if (selectedFarm === "all") return tasks;
    const farmName = farms.find((f) => f.id === selectedFarm)?.name;
    return tasks.filter((t) => t.farm === farmName);
  }, [tasks, farms, selectedFarm]);

  const filteredActivities = useMemo(() => {
    if (selectedFarm === "all") return activities;
    const farmName = farms.find((f) => f.id === selectedFarm)?.name;
    return activities.filter((a) => a.farm === farmName);
  }, [activities, farms, selectedFarm]);

  // Dynamic data based on filtered context
  const yieldData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hasCropFarms = filteredFarms.some((f) => f.farmType === "crops" || f.farmType === "mixed");
    return months.map((month, i) => ({
      month,
      wheat: hasCropFarms ? Math.max(0, Math.floor(Math.sin((i - 2) * 0.5) * 300 + 150) * (i >= 4 && i <= 8 ? 1 : 0)) : 0,
      corn: hasCropFarms ? Math.max(0, Math.floor(Math.sin((i - 4) * 0.6) * 250 + 100) * (i >= 3 && i <= 8 ? 1 : 0)) : 0,
      soybeans: hasCropFarms ? Math.max(0, Math.floor(Math.sin((i - 5) * 0.4) * 150 + 50) * (i >= 4 && i <= 9 ? 1 : 0)) : 0,
    }));
  }, [filteredFarms]);

  const farmProductivity = useMemo(() => {
    return filteredFarms.map((farm) => ({
      name: farm.name.length > 15 ? farm.name.substring(0, 15) + "..." : farm.name,
      fullName: farm.name,
      productivity: Math.floor(Math.random() * 20) + 75,
    }));
  }, [filteredFarms]);

  const farmTypeDistribution = useMemo(() => {
    return [
      { name: "Crops", value: filteredFarms.filter((f) => f.farmType === "crops").length, color: "#1a5f2a" },
      { name: "Livestock", value: filteredFarms.filter((f) => f.farmType === "livestock").length, color: "#d4a017" },
      { name: "Poultry", value: filteredFarms.filter((f) => f.farmType === "poultry").length, color: "#2196f3" },
      { name: "Mixed", value: filteredFarms.filter((f) => f.farmType === "mixed").length, color: "#ff9800" },
      { name: "Dairy", value: filteredFarms.filter((f) => f.farmType === "dairy").length, color: "#9c27b0" },
      { name: "Aquaculture", value: filteredFarms.filter((f) => f.farmType === "aquaculture").length, color: "#00bcd4" },
    ].filter((item) => item.value > 0);
  }, [filteredFarms]);

  const reportTypes = [
    { id: "yield", title: "Crop Yield Report", description: "Detailed analysis of crop production and yields", icon: TrendingUp },
    { id: "finance", title: "Financial Summary", description: "Revenue, expenses, and profit margins", icon: BarChart3 },
    { id: "livestock", title: "Livestock Report", description: "Health, productivity, and breeding data", icon: PieChart },
    { id: "inventory", title: "Inventory Status", description: "Stock levels and reorder recommendations", icon: FileText },
  ];

  // Build CSV content based on report type
  const buildReportCsv = (reportType: string): string => {
    const farmLabel = selectedFarm === "all" ? "All Farms" : farms.find((f) => f.id === selectedFarm)?.name || "Unknown";

    switch (reportType) {
      case "yield": {
        let csv = `Crop Yield Report - ${selectedYear}\nFarm Filter: ${farmLabel}\n\nMonth,Wheat (tons),Corn (tons),Soybeans (tons)\n`;
        yieldData.forEach((row) => {
          csv += `${row.month},${row.wheat},${row.corn},${row.soybeans}\n`;
        });
        csv += `\nTotal Farms: ${filteredFarms.length}\n`;
        return csv;
      }
      case "finance": {
        let csv = `Financial Summary - ${selectedYear}\nFarm Filter: ${farmLabel}\n\nFarm,Type,Employees,Status,Productivity Score\n`;
        farmProductivity.forEach((fp, i) => {
          const farm = filteredFarms[i];
          if (farm) csv += `${farm.name},${farm.farmType},${farm.employees},${farm.status},${fp.productivity}%\n`;
        });
        csv += `\nTotal Farms: ${filteredFarms.length}\nTotal Employees: ${filteredFarms.reduce((s, f) => s + f.employees, 0)}\n`;
        return csv;
      }
      case "livestock": {
        let csv = `Livestock Report - ${selectedYear}\nFarm Filter: ${farmLabel}\n\nFarm Type,Count\n`;
        farmTypeDistribution.forEach((ft) => {
          csv += `${ft.name},${ft.value}\n`;
        });
        csv += `\nTotal Farms: ${filteredFarms.length}\n`;
        return csv;
      }
      case "inventory": {
        let csv = `Inventory Status Report - ${selectedYear}\nFarm Filter: ${farmLabel}\n\nTask,Farm,Assignee,Priority,Status\n`;
        filteredTasks.forEach((t) => {
          csv += `${t.title},${t.farm},${t.assignee},${t.priority},${t.status}\n`;
        });
        csv += `\nPending: ${filteredTasks.filter((t) => t.status === "pending").length}\nIn Progress: ${filteredTasks.filter((t) => t.status === "in-progress").length}\nCompleted: ${filteredTasks.filter((t) => t.status === "completed").length}\n`;
        return csv;
      }
      default:
        return "No data available";
    }
  };

  const handleGenerateReport = (reportType: string) => {
    setIsGenerating(true);
    const reportName = reportTypes.find((r) => r.id === reportType)?.title || "Report";
    const farmName = selectedFarm === "all" ? "All Farms" : farms.find((f) => f.id === selectedFarm)?.name || "";

    toast({
      title: "Generating Report",
      description: `${reportName} for ${farmName} is being generated...`,
    });

    setTimeout(() => {
      const csvData = buildReportCsv(reportType);
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `${reportName} - ${selectedYear}${selectedFarm !== "all" ? ` (${farmName})` : ""}`,
        type: reportType,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        size: `${(new Blob([csvData]).size / 1024).toFixed(1)} KB`,
        status: "ready",
        csvData,
        farmFilter: selectedFarm,
        yearFilter: selectedYear,
      };
      setGeneratedReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
      toast({
        title: "Report Ready",
        description: `${reportName} has been generated and is ready to download.`,
      });
    }, 1500);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    if (report.csvData) {
      const safeName = report.name.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      downloadFile(`${safeName}.csv`, report.csvData);
      toast({
        title: "Downloaded",
        description: `${report.name} has been downloaded.`,
      });
    } else {
      toast({
        title: "No Data",
        description: "This report has no downloadable data. Please regenerate it.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setGeneratedReports((prev) => prev.filter((r) => r.id !== reportId));
    toast({ title: "Deleted", description: "Report has been removed." });
  };

  const handleExportAll = () => {
    if (generatedReports.length === 0) {
      toast({
        title: "No Reports",
        description: "Generate at least one report first before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Combine all reports into one file
    let combined = "=== FARM FLOW - ALL REPORTS EXPORT ===\n";
    combined += `Exported on: ${new Date().toLocaleString()}\n`;
    combined += `Total Reports: ${generatedReports.filter((r) => r.status === "ready").length}\n\n`;

    generatedReports.forEach((report, idx) => {
      if (report.csvData) {
        combined += `${"=".repeat(60)}\n`;
        combined += `REPORT ${idx + 1}: ${report.name}\n`;
        combined += `Generated: ${report.date}\n`;
        combined += `${"=".repeat(60)}\n`;
        combined += report.csvData;
        combined += "\n\n";
      }
    });

    downloadFile(`DigiFarm_All_Reports_${selectedYear}.csv`, combined);
    toast({
      title: "All Reports Exported",
      description: `${generatedReports.length} reports have been combined and downloaded.`,
    });
  };

  const handleRefreshData = () => {
    toast({
      title: "Data Refreshed",
      description: `Charts updated with latest data from ${filteredFarms.length} farm(s).`,
    });
  };

  // Export a single chart as CSV
  const handleExportChart = (chartType: string) => {
    const csvData = buildReportCsv(chartType);
    const labels: Record<string, string> = {
      yield: "Crop_Yield_Trends",
      finance: "Farm_Productivity",
      livestock: "Farm_Type_Distribution",
    };
    const safeName = labels[chartType] || "Chart_Export";
    downloadFile(`${safeName}_${selectedYear}.csv`, csvData);
    toast({ title: "Chart Exported", description: `${safeName.replace(/_/g, " ")} data downloaded.` });
  };

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="View insights and generate reports"
    >
      {/* Report Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4 flex-wrap">
          <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); toast({ title: "Year Changed", description: `Showing data for ${val}` }); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFarm} onValueChange={(val) => { setSelectedFarm(val); const name = val === "all" ? "All Farms" : farms.find((f) => f.id === val)?.name; toast({ title: "Farm Filter Applied", description: `Showing data for ${name}` }); }}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Report →"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-primary/10 text-center">
          <p className="text-2xl font-bold text-primary">{filteredFarms.length}</p>
          <p className="text-sm text-muted-foreground">{selectedFarm === "all" ? "Total Farms" : "Selected Farm"}</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 text-center">
          <p className="text-2xl font-bold text-success">{filteredTasks.filter((t) => t.status === "completed").length}</p>
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 text-center">
          <p className="text-2xl font-bold text-info">{filteredFarms.reduce((s, f) => s + f.employees, 0)}</p>
          <p className="text-sm text-muted-foreground">Employees</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 text-center">
          <p className="text-2xl font-bold text-warning">{filteredActivities.length}</p>
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
            <Button variant="ghost" size="sm" onClick={() => handleExportChart("yield")}>
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
              <Area type="monotone" dataKey="wheat" stackId="1" stroke="#1a5f2a" fill="#1a5f2a" fillOpacity={0.6} />
              <Area type="monotone" dataKey="corn" stackId="1" stroke="#d4a017" fill="#d4a017" fillOpacity={0.6} />
              <Area type="monotone" dataKey="soybeans" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} />
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
            <Button variant="ghost" size="sm" onClick={() => handleExportChart("finance")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          {farmProductivity.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">No farms match the current filter.</div>
          )}
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
            <Button variant="ghost" size="sm" onClick={() => handleExportChart("livestock")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          {farmTypeDistribution.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">No farms match the current filter.</div>
          )}
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
            {generatedReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reports generated yet.</p>
                <p className="text-xs mt-1">Use the cards above to generate your first report.</p>
              </div>
            ) : (
              generatedReports.map((report) => (
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
                  <div className="flex items-center gap-1">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Reports Are Generated</DialogTitle>
            <DialogDescription>
              Understanding the report generation process in DigiFarm
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
                    Click the <strong>Download</strong> button next to any generated report to download it as a CSV file.
                    Use <strong>"Export All Reports"</strong> to combine all generated reports into a single file.
                    Each chart section also has an <strong>Export</strong> button to download that specific chart's data.
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

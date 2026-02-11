import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Shield, TrendingUp, TrendingDown, Activity, Search, CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar, AreaChart, Area } from "recharts";

const severityConfig: Record<string, { color: string; icon: typeof AlertTriangle; bg: string }> = {
  critical: { color: "text-destructive", icon: XCircle, bg: "bg-destructive/10 border-destructive/20" },
  high: { color: "text-warning", icon: AlertTriangle, bg: "bg-warning/10 border-warning/20" },
  medium: { color: "text-info", icon: AlertCircle, bg: "bg-info/10 border-info/20" },
  low: { color: "text-muted-foreground", icon: Activity, bg: "bg-muted border-border" },
};

const PIE_COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--muted-foreground))"];

interface Anomaly {
  id: string; type: string; severity: string; title: string; description: string;
  farm: string; metric: string; expectedValue: string; actualValue: string;
  deviationPercent: number; detectedAt: string; recommendation: string; status: string;
}

interface RiskScore { overall: number; production: number; financial: number; operational: number; breakdown: { category: string; score: number; trend: string }[] }
interface TrendAnalysis { monthlyAnomalyCounts: { month: string; critical: number; high: number; medium: number; low: number }[]; topRiskAreas: { area: string; anomalyCount: number; avgSeverity: string }[] }
interface Summary { totalAnomalies: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; resolvedThisMonth: number; newThisWeek: number; insights: string[] }

export default function AnomalyDetection() {
  const { farms, tasks, activities } = useAppData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const runDetection = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anomaly-detection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ farms, tasks, activities }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      setAnomalies(data.anomalies);
      setRiskScore(data.riskScore);
      setTrendAnalysis(data.trendAnalysis);
      setSummary(data.summary);
      toast({ title: "Anomaly Detection Complete", description: `Found ${data.summary.totalAnomalies} anomalies across your farm system.` });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = anomalies?.filter(a =>
    (filterSeverity === "all" || a.severity === filterSeverity) &&
    (filterType === "all" || a.type === filterType)
  ) || [];

  return (
    <DashboardLayout title="Anomaly Detection" subtitle="AI-powered statistical analysis to detect unusual patterns in production, finance & operations.">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button onClick={runDetection} disabled={loading} className="bg-primary text-primary-foreground">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : anomalies ? "Re-scan System" : "Run Anomaly Detection"}
        </Button>
        {anomalies && (
          <>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {loading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}

      {!loading && !anomalies && (
        <Card className="text-center py-16">
          <CardContent><Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Anomaly Detection Engine</h3><p className="text-muted-foreground">Click "Run Anomaly Detection" to scan your entire farm system for unusual patterns and risks.</p></CardContent>
        </Card>
      )}

      {!loading && anomalies && summary && riskScore && trendAnalysis && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: AlertTriangle, label: "Total Anomalies", value: summary.totalAnomalies, color: "text-warning" },
              { icon: XCircle, label: "Critical", value: summary.criticalCount, color: "text-destructive" },
              { icon: AlertCircle, label: "High", value: summary.highCount, color: "text-warning" },
              { icon: CheckCircle2, label: "Resolved (Month)", value: summary.resolvedThisMonth, color: "text-success" },
              { icon: Zap, label: "New (Week)", value: summary.newThisWeek, color: "text-info" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card><CardContent className="flex items-center gap-4 p-5">
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                  <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-2xl font-bold">{item.value}</p></div>
                </CardContent></Card>
              </motion.div>
            ))}
          </div>

          {/* Risk Score & Distribution */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Overall Risk Score</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className={`text-5xl font-bold ${riskScore.overall > 70 ? "text-destructive" : riskScore.overall > 40 ? "text-warning" : "text-success"}`}>{riskScore.overall}</p>
                  <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                </div>
                <div className="space-y-3">
                  {riskScore.breakdown.map(b => (
                    <div key={b.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{b.category}</span>
                        <span className="flex items-center gap-1">
                          {b.score}
                          {b.trend === "improving" ? <TrendingDown className="h-3 w-3 text-success" /> : b.trend === "declining" ? <TrendingUp className="h-3 w-3 text-destructive" /> : <Activity className="h-3 w-3 text-muted-foreground" />}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${b.score > 70 ? "bg-destructive" : b.score > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${b.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Severity Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: "Critical", value: summary.criticalCount },
                      { name: "High", value: summary.highCount },
                      { name: "Medium", value: summary.mediumCount },
                      { name: "Low", value: summary.lowCount },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Top Risk Areas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendAnalysis.topRiskAreas.map((area, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{area.area}</p>
                        <p className="text-xs text-muted-foreground">{area.anomalyCount} anomalies</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${area.avgSeverity === "high" || area.avgSeverity === "critical" ? "text-destructive" : "text-warning"}`}>{area.avgSeverity}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader><CardTitle>Monthly Anomaly Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendAnalysis.monthlyAnomalyCounts}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" />
                  <Bar dataKey="high" stackId="a" fill="hsl(var(--warning))" name="High" />
                  <Bar dataKey="medium" stackId="a" fill="hsl(var(--info))" name="Medium" />
                  <Bar dataKey="low" stackId="a" fill="hsl(var(--muted-foreground))" name="Low" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Anomaly List */}
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between">
              <span>Detected Anomalies ({filtered.length})</span>
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {filtered.map((anomaly, i) => {
                const config = severityConfig[anomaly.severity] || severityConfig.low;
                const Icon = config.icon;
                return (
                  <motion.div key={anomaly.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`p-4 rounded-lg border ${config.bg}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{anomaly.title}</h4>
                          <Badge variant="outline" className="text-xs">{anomaly.type}</Badge>
                          <Badge variant="outline" className={`text-xs ${config.color}`}>{anomaly.severity}</Badge>
                          <Badge variant="outline" className="text-xs">{anomaly.farm}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Expected: <strong>{anomaly.expectedValue}</strong></span>
                          <span>Actual: <strong>{anomaly.actualValue}</strong></span>
                          <span>Deviation: <strong className={anomaly.deviationPercent > 0 ? "text-destructive" : "text-success"}>{anomaly.deviationPercent > 0 ? "+" : ""}{anomaly.deviationPercent}%</strong></span>
                        </div>
                        <div className="mt-2 p-2 rounded bg-card border">
                          <p className="text-xs"><strong>Recommendation:</strong> {anomaly.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-accent" />AI Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {summary.insights.map((ins, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                    <p className="text-sm">{ins}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

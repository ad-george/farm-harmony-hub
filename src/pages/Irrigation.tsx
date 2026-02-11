import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Droplets, RefreshCw, AlertTriangle, TrendingDown, Clock, Gauge, Sprout, DollarSign, CalendarDays, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell } from "recharts";

const statusColors: Record<string, string> = {
  optimal: "bg-success/10 text-success border-success/20",
  "needs-attention": "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  "over-watered": "bg-info/10 text-info border-info/20",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

interface FarmIrrigation {
  farmName: string; farmLocation: string; soilType: string;
  overallStatus: string; soilMoisture: number; optimalMoisture: number;
  waterUsageEfficiency: number; nextIrrigationIn: string;
  dailyWaterNeeded: number;
  weeklySchedule: { day: string; startTime: string; duration: string; zone: string; waterAmount: string; priority: string }[];
  recommendations: string[];
  waterSavings: { currentUsage: string; optimizedUsage: string; savingsPercent: number; costSavings: string };
  riskFactors: { factor: string; level: string; description: string }[];
}

interface SystemSummary {
  totalFarmsMonitored: number; farmsNeedingAttention: number;
  totalDailyWater: string; overallEfficiency: number;
  totalMonthlySavings: string; insights: string[];
}

export default function Irrigation() {
  const { farms } = useAppData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [farmRecs, setFarmRecs] = useState<FarmIrrigation[] | null>(null);
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<number>(0);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ farms, weatherData: { note: "Use realistic seasonal weather patterns for the farm locations" } }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      setFarmRecs(data.farmRecommendations);
      setSummary(data.systemSummary);
      toast({ title: "Irrigation Analysis Complete", description: "AI-generated irrigation recommendations are ready." });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selected = farmRecs?.[selectedFarm];

  return (
    <DashboardLayout title="Smart Irrigation" subtitle="AI-powered irrigation scheduling, water optimization & soil moisture monitoring.">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={fetchRecommendations} disabled={loading} className="bg-primary text-primary-foreground">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : farmRecs ? "Refresh Analysis" : "Generate Recommendations"}
        </Button>
      </div>

      {loading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}

      {!loading && !farmRecs && (
        <Card className="text-center py-16">
          <CardContent><Droplets className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Smart Irrigation</h3><p className="text-muted-foreground">Click "Generate Recommendations" to get AI-powered irrigation schedules for all farms.</p></CardContent>
        </Card>
      )}

      {!loading && farmRecs && summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sprout, label: "Farms Monitored", value: summary.totalFarmsMonitored, color: "text-primary" },
              { icon: AlertTriangle, label: "Need Attention", value: summary.farmsNeedingAttention, color: "text-warning" },
              { icon: Gauge, label: "Overall Efficiency", value: `${summary.overallEfficiency}%`, color: "text-success" },
              { icon: DollarSign, label: "Monthly Savings", value: summary.totalMonthlySavings, color: "text-accent" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card><CardContent className="flex items-center gap-4 p-6">
                  <div className="stat-card-icon bg-muted"><item.icon className={`h-6 w-6 ${item.color}`} /></div>
                  <div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-2xl font-bold">{item.value}</p></div>
                </CardContent></Card>
              </motion.div>
            ))}
          </div>

          {/* Farm Selector Tabs */}
          <div className="flex gap-2 flex-wrap">
            {farmRecs.map((farm, i) => (
              <Button key={farm.farmName} variant={selectedFarm === i ? "default" : "outline"} size="sm" onClick={() => setSelectedFarm(i)}>
                <Droplets className="h-4 w-4 mr-1" />{farm.farmName}
                <Badge variant="outline" className={`ml-2 text-xs ${statusColors[farm.overallStatus] || ""}`}>{farm.overallStatus}</Badge>
              </Button>
            ))}
          </div>

          {selected && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: Status & Moisture */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Soil Moisture Status</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{selected.soilMoisture}%</p>
                      <p className="text-sm text-muted-foreground">Current / {selected.optimalMoisture}% optimal</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-4 relative">
                      <div className="bg-info h-4 rounded-full transition-all" style={{ width: `${selected.soilMoisture}%` }} />
                      <div className="absolute top-0 h-4 w-0.5 bg-destructive" style={{ left: `${selected.optimalMoisture}%` }} title="Optimal" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Next: {selected.nextIrrigationIn}</span>
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{selected.waterUsageEfficiency}% efficient</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-success" />Water Savings</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Current Usage</span><span>{selected.waterSavings.currentUsage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Optimized</span><span className="text-success font-medium">{selected.waterSavings.optimizedUsage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Savings</span><span className="text-success font-bold">{selected.waterSavings.savingsPercent}%</span></div>
                    <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Cost Savings</span><span className="text-accent font-bold">{selected.waterSavings.costSavings}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">Risk Factors</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selected.riskFactors.map((r, i) => (
                      <div key={i} className="p-2 rounded-lg bg-muted">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{r.factor}</span>
                          <Badge variant="outline" className={`text-xs ${r.level === "high" ? "text-destructive" : r.level === "medium" ? "text-warning" : "text-success"}`}>{r.level}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Center: Weekly Schedule */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" />Weekly Irrigation Schedule</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selected.weeklySchedule.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                          <div className="w-10 text-center">
                            <p className="text-xs font-bold text-primary">{s.day}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.startTime} — {s.duration} min</p>
                            <p className="text-xs text-muted-foreground">{s.zone} • {s.waterAmount}</p>
                          </div>
                          <Badge className={`text-xs ${priorityColors[s.priority] || ""}`}>{s.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Water Usage Chart */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Daily Water Allocation</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={selected.weeklySchedule.map(s => ({ day: s.day, water: parseInt(s.waterAmount.replace(/[^0-9]/g, "")) || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="day" /><YAxis /><Tooltip />
                        <Bar dataKey="water" fill="hsl(var(--info))" radius={[4,4,0,0]} name="Water (L)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Recommendations */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">AI Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selected.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                          <p className="text-sm">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">System-wide Insights</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {summary.insights.map((ins, i) => (
                        <li key={i} className="text-sm flex gap-2 items-start">
                          <Zap className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

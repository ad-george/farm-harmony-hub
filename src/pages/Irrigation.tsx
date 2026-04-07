import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Droplets, RefreshCw, AlertTriangle, TrendingDown, Clock, Gauge, Sprout, DollarSign, CalendarDays, Zap, CloudRain, Leaf } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell } from "recharts";

const CACHE_KEY = "irrigation_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
    localStorage.removeItem(CACHE_KEY);
  } catch { /* ignore */ }
  return null;
}

function saveCache(data: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

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
  skip: "bg-muted text-muted-foreground",
};

interface FarmIrrigation {
  farmName: string; farmLocation: string; soilType: string;
  overallStatus: string; soilMoisture: number; optimalMoisture: number;
  waterUsageEfficiency: number; nextIrrigationIn: string;
  dailyWaterNeeded: number; irrigationNeeded?: boolean; irrigationReason?: string;
  rainfallStatus?: string; recentRainfall?: string;
  weeklySchedule: { day: string; startTime: string; duration: string; zone: string; waterAmount: string; priority: string; note?: string }[];
  cropWaterAnalysis?: { cropName: string; waterNeedLevel: string; dailyRequirement: string; currentStatus: string; recommendation: string }[];
  livestockWaterNeeds?: { totalDailyLiters: number; breakdown: { type: string; count: number; perAnimalLiters: number; totalLiters: number }[] };
  recommendations: string[];
  waterSavings: { currentUsage: string; optimizedUsage: string; savingsPercent: number; costSavings: string; rainfallContribution?: string };
  riskFactors: { factor: string; level: string; description: string }[];
}

interface SystemSummary {
  totalFarmsMonitored: number; farmsNeedingAttention: number;
  farmsWithAdequateRainfall?: number;
  totalDailyWater: string; overallEfficiency: number;
  totalMonthlySavings: string; insights: string[];
}

// Kenyan town coordinates for weather lookup
const KENYA_COORDS: Record<string, { lat: number; lon: number }> = {
  nairobi: { lat: -1.2921, lon: 36.8219 },
  mombasa: { lat: -4.0435, lon: 39.6682 },
  kisumu: { lat: -0.1022, lon: 34.7617 },
  nakuru: { lat: -0.3031, lon: 36.0800 },
  eldoret: { lat: 0.5143, lon: 35.2698 },
  thika: { lat: -1.0396, lon: 37.0900 },
  nanyuki: { lat: 0.0000, lon: 37.0722 },
  nyeri: { lat: -0.4197, lon: 36.9511 },
  meru: { lat: 0.0480, lon: 37.6559 },
  embu: { lat: -0.5389, lon: 37.4596 },
  machakos: { lat: -1.5177, lon: 37.2634 },
  kitale: { lat: 1.0187, lon: 35.0020 },
  kericho: { lat: -0.3692, lon: 35.2863 },
  naivasha: { lat: -0.7172, lon: 36.4310 },
  nyandarua: { lat: -0.1800, lon: 36.5200 },
  kiambu: { lat: -1.1714, lon: 36.8356 },
  muranga: { lat: -0.7210, lon: 37.1526 },
  laikipia: { lat: 0.2000, lon: 36.8000 },
  kajiado: { lat: -1.8500, lon: 36.7833 },
  bungoma: { lat: 0.5635, lon: 34.5607 },
};

async function fetchWeatherForFarm(location: string): Promise<any> {
  try {
    const locLower = (location || "").toLowerCase().trim();
    let coords = null;
    for (const [town, c] of Object.entries(KENYA_COORDS)) {
      if (locLower.includes(town)) { coords = c; break; }
    }
    if (!coords) {
      // Fallback: try geocoding
      const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location + ", Kenya")}&count=1`);
      const geoData = await geoResp.json();
      if (geoData.results?.[0]) {
        coords = { lat: geoData.results[0].latitude, lon: geoData.results[0].longitude };
      }
    }
    if (!coords) return { location, error: "Could not geocode", rainfall: "unknown" };

    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=precipitation_sum,rain_sum&current=precipitation,rain,temperature_2m,relative_humidity_2m&past_days=7&forecast_days=7&timezone=Africa/Nairobi`
    );
    const data = await resp.json();
    
    const pastDays = data.daily?.precipitation_sum?.slice(0, 7) || [];
    const futureDays = data.daily?.precipitation_sum?.slice(7) || [];
    const totalPast7 = pastDays.reduce((s: number, v: number) => s + (v || 0), 0);
    const totalNext7 = futureDays.reduce((s: number, v: number) => s + (v || 0), 0);
    const currentRain = data.current?.rain || 0;
    const currentPrecip = data.current?.precipitation || 0;

    return {
      location,
      coordinates: coords,
      currentlyRaining: currentRain > 0 || currentPrecip > 0,
      currentRainMm: currentRain,
      currentTemp: data.current?.temperature_2m,
      currentHumidity: data.current?.relative_humidity_2m,
      past7DaysRainfallMm: Math.round(totalPast7 * 10) / 10,
      next7DaysForecastMm: Math.round(totalNext7 * 10) / 10,
      dailyRainfallHistory: data.daily?.time?.slice(0, 7)?.map((d: string, i: number) => ({
        date: d,
        rainfallMm: pastDays[i] || 0,
      })),
      dailyRainfallForecast: data.daily?.time?.slice(7)?.map((d: string, i: number) => ({
        date: d,
        rainfallMm: futureDays[i] || 0,
      })),
      rainfallAssessment: totalPast7 > 50 ? "Heavy rainfall - irrigation likely unnecessary"
        : totalPast7 > 25 ? "Moderate rainfall - reduce irrigation"
        : totalPast7 > 10 ? "Light rainfall - supplemental irrigation may be needed"
        : "Minimal/no rainfall - irrigation recommended",
    };
  } catch (err) {
    console.error("Weather fetch error for", location, err);
    return { location, error: "Failed to fetch weather", rainfall: "unknown" };
  }
}

export default function Irrigation() {
  const { farms } = useAppData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [farmRecs, setFarmRecs] = useState<FarmIrrigation[] | null>(null);
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<number>(0);
  const [cacheAge, setCacheAge] = useState<string | null>(null);

  const hasData = farms.length > 0;

  // Load cached data on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setFarmRecs(cached.farmRecommendations);
      setSummary(cached.systemSummary);
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY)!);
      const mins = Math.round((Date.now() - raw.timestamp) / 60000);
      setCacheAge(mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`);
    }
  }, []);

  const fetchRecommendations = async (forceRefresh = false) => {
    if (!hasData) return;
    
    if (!forceRefresh) {
      const cached = loadCache();
      if (cached) {
        setFarmRecs(cached.farmRecommendations);
        setSummary(cached.systemSummary);
        toast({ title: "Loaded from cache", description: "Showing cached results. Click refresh for fresh analysis." });
        return;
      }
    }
    
    setLoading(true);
    try {
      // Fetch real weather data for each unique farm location
      const uniqueLocations = [...new Set(farms.map(f => f.location).filter(Boolean))];
      const weatherPromises = uniqueLocations.map(loc => fetchWeatherForFarm(loc!));
      const weatherResults = await Promise.all(weatherPromises);
      const weatherByLocation: Record<string, any> = {};
      weatherResults.forEach(w => { weatherByLocation[w.location] = w; });
      
      const farmWeatherData = farms.map(f => ({
        farmName: f.name,
        location: f.location,
        weather: weatherByLocation[f.location || ""] || { rainfall: "unknown" },
      }));

      // Fetch crops and livestock
      const [cropsRes, livestockRes] = await Promise.all([
        supabase.from("crops").select("*, farms(name)"),
        supabase.from("livestock").select("*, farms(name)"),
      ]);

      const cropsData = (cropsRes.data || []).map((c: any) => ({
        farmName: c.farms?.name || "Unknown",
        cropName: c.name,
        variety: c.variety,
        area: c.area,
        status: c.status,
        plantedDate: c.planted_date,
        expectedHarvest: c.expected_harvest,
      }));

      const livestockData = (livestockRes.data || []).map((l: any) => ({
        farmName: l.farms?.name || "Unknown",
        type: l.type,
        breed: l.breed,
        count: l.count,
        healthStatus: l.health_status,
      }));

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          farms: farms.map(f => ({
            name: f.name,
            location: f.location,
            size: f.size,
            farmType: f.farmType,
            soilPh: f.soilPh,
            soilStructure: f.soilStructure,
            soilTexture: f.soilTexture,
          })),
          weatherData: farmWeatherData,
          crops: cropsData,
          livestock: livestockData,
        }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      setFarmRecs(data.farmRecommendations);
      setSummary(data.systemSummary);
      saveCache(data);
      setCacheAge("just now");
      toast({ title: "Irrigation Analysis Complete", description: "AI-generated irrigation recommendations are ready." });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selected = farmRecs?.[selectedFarm];

  return (
    <DashboardLayout title="Smart Irrigation" subtitle="AI-powered irrigation scheduling with real rainfall awareness & crop/livestock water needs.">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Button onClick={() => fetchRecommendations(true)} disabled={loading || !hasData} className="bg-primary text-primary-foreground">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : farmRecs ? "Refresh Analysis" : "Generate Recommendations"}
        </Button>
        {cacheAge && farmRecs && (
          <span className="text-xs text-muted-foreground">Last updated: {cacheAge} • Cached for 24hrs</span>
        )}
      </div>

      {loading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}

      {!loading && !farmRecs && (
        <Card className="text-center py-16">
          <CardContent>
            <Droplets className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{hasData ? "Smart Irrigation" : "No Farms Available"}</h3>
            <p className="text-muted-foreground">
              {hasData
                ? 'Click "Generate Recommendations" to get AI-powered irrigation schedules that account for real rainfall, crop needs, and livestock water requirements.'
                : "You need to create at least one farm before irrigation analysis can run. Go to the Farms page to add a farm."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && farmRecs && summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Sprout, label: "Farms Monitored", value: summary.totalFarmsMonitored, color: "text-primary" },
              { icon: AlertTriangle, label: "Need Attention", value: summary.farmsNeedingAttention, color: "text-warning" },
              { icon: CloudRain, label: "Adequate Rainfall", value: summary.farmsWithAdequateRainfall ?? 0, color: "text-info" },
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
                {farm.irrigationNeeded === false ? <CloudRain className="h-4 w-4 mr-1" /> : <Droplets className="h-4 w-4 mr-1" />}
                {farm.farmName}
                <Badge variant="outline" className={`ml-2 text-xs ${statusColors[farm.overallStatus] || ""}`}>{farm.overallStatus}</Badge>
              </Button>
            ))}
          </div>

          {selected && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: Status & Moisture */}
              <div className="space-y-6">
                {/* Rainfall Status Banner */}
                {selected.rainfallStatus && (
                  <Card className={selected.irrigationNeeded === false ? "border-info/30 bg-info/5" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CloudRain className={`h-5 w-5 ${selected.irrigationNeeded === false ? "text-info" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-medium">{selected.rainfallStatus?.replace(/-/g, " ")}</p>
                          {selected.recentRainfall && <p className="text-xs text-muted-foreground">{selected.recentRainfall}</p>}
                          {selected.irrigationReason && <p className="text-xs text-muted-foreground mt-1">{selected.irrigationReason}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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

                {/* Crop Water Analysis */}
                {selected.cropWaterAnalysis && selected.cropWaterAnalysis.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Leaf className="h-4 w-4 text-success" />Crop Water Needs</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {selected.cropWaterAnalysis.map((crop, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/50 border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{crop.cropName}</span>
                            <Badge variant="outline" className={`text-xs ${crop.waterNeedLevel === "high" ? "text-destructive" : crop.waterNeedLevel === "medium" ? "text-warning" : "text-success"}`}>{crop.waterNeedLevel} water</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{crop.recommendation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Livestock Water Needs */}
                {selected.livestockWaterNeeds && selected.livestockWaterNeeds.totalDailyLiters > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Livestock Water Needs</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-lg font-bold text-primary">{selected.livestockWaterNeeds.totalDailyLiters.toLocaleString()} L/day</p>
                      {selected.livestockWaterNeeds.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{b.type} ({b.count})</span>
                          <span>{b.totalLiters} L</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-success" />Water Savings</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Current Usage</span><span>{selected.waterSavings.currentUsage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Optimized</span><span className="text-success font-medium">{selected.waterSavings.optimizedUsage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Savings</span><span className="text-success font-bold">{selected.waterSavings.savingsPercent}%</span></div>
                    {selected.waterSavings.rainfallContribution && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Rainfall Covers</span><span className="text-info font-medium">{selected.waterSavings.rainfallContribution}</span></div>
                    )}
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
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.priority === "skip" ? "bg-muted/30 opacity-60" : "bg-muted/50"}`}>
                          <div className="w-10 text-center">
                            <p className="text-xs font-bold text-primary">{s.day}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.priority === "skip" ? "Skipped" : `${s.startTime} — ${s.duration} min`}</p>
                            <p className="text-xs text-muted-foreground">{s.note || `${s.zone} • ${s.waterAmount}`}</p>
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

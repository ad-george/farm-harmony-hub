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
import {
  Sun, Cloud, CloudRain, CloudSun, Wind, Droplets, Thermometer, Eye,
  AlertTriangle, RefreshCw, MapPin, Gauge, Sprout, CloudLightning, CloudFog,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const conditionIcons: Record<string, typeof Sun> = {
  Sunny: Sun, Cloudy: Cloud, Rainy: CloudRain, "Partly Cloudy": CloudSun,
  Thunderstorm: CloudLightning, Overcast: Cloud, Foggy: CloudFog,
};

const severityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

interface WeatherLocation {
  name: string;
  current: {
    temperature: number; feelsLike: number; humidity: number; windSpeed: number;
    windDirection: string; pressure: number; uvIndex: number; visibility: number;
    condition: string; rainChance: number; rainfall: number;
  };
  hourlyForecast: { hour: string; temp: number; condition: string; rainChance: number }[];
  weeklyForecast: { day: string; high: number; low: number; condition: string; rainChance: number; rainfall: number }[];
  alerts: { type: string; severity: string; message: string }[];
  agriculturalMetrics: {
    soilMoisture: number; evapotranspiration: number; growingDegreeDays: number;
    frostRisk: string; irrigationNeed: string;
  };
}

const CACHE_KEY = "weather_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for more accurate data

function getCachedWeather(): { data: WeatherLocation[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch { return null; }
}

function setCachedWeather(data: WeatherLocation[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

export default function Weather() {
  const { farms } = useAppData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherLocation[] | null>(() => getCachedWeather()?.data ?? null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = getCachedWeather();
    return cached ? new Date(cached.timestamp) : null;
  });
  const [selectedFarm, setSelectedFarm] = useState<string>("all");

  const hasData = farms.length > 0;

  const fetchWeather = async (isRefresh = false) => {
    if (!hasData) return;
    setLoading(true);
    try {
      const locations = farms.map(f => ({ name: f.name, location: f.location, soilType: f.type || f.farmType, farmType: f.farmType }));
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ locations }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed to fetch weather"); }
      const data = await resp.json();
      setWeatherData(data.locations);
      setCachedWeather(data.locations);
      const now = new Date();
      setLastUpdated(now);
      toast({ title: isRefresh ? "Weather Refreshed" : "Weather Updated", description: "Real-time weather data loaded for all farm locations." });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load weather", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = weatherData ? (selectedFarm === "all" ? weatherData : weatherData.filter(w => w.name === selectedFarm)) : [];

  return (
    <DashboardLayout title="Weather Station" subtitle="Real-time weather monitoring & agricultural climate insights for all farm locations.">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button onClick={() => fetchWeather(!weatherData)} disabled={loading || !hasData} className="bg-primary text-primary-foreground">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Fetching..." : weatherData ? "Refresh Data" : "Load Weather Data"}
        </Button>
        {weatherData && (
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by farm" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {weatherData.map(w => <SelectItem key={w.name} value={w.name}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()} · Cached for 12 hours
          </p>
        )}
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      )}

      {!loading && !weatherData && (
        <Card className="text-center py-16">
          <CardContent>
            <Cloud className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{hasData ? "No Weather Data" : "No Farms Available"}</h3>
            <p className="text-muted-foreground">
              {hasData
                ? 'Click "Load Weather Data" to fetch real-time weather for all your farm locations.'
                : "You need to create at least one farm before weather data can be loaded. Go to the Farms page to add a farm."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && weatherData && (
        <div className="space-y-6">
          {/* Current Conditions Cards */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filtered.map((loc, i) => {
              const Icon = conditionIcons[loc.current.condition] || CloudSun;
              return (
                <motion.div key={loc.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs opacity-80 flex items-center gap-1"><MapPin className="h-3 w-3" />{loc.name}</p>
                          <p className="text-3xl font-bold mt-1">{loc.current.temperature}°C</p>
                          <p className="text-sm opacity-80">{loc.current.condition}</p>
                        </div>
                        <Icon className="h-10 w-10 text-accent" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-primary-foreground/20 text-center">
                        <div><Droplets className="h-3 w-3 mx-auto opacity-80" /><p className="text-xs font-medium">{loc.current.humidity}%</p></div>
                        <div><Wind className="h-3 w-3 mx-auto opacity-80" /><p className="text-xs font-medium">{loc.current.windSpeed} km/h</p></div>
                        <div><CloudRain className="h-3 w-3 mx-auto opacity-80" /><p className="text-xs font-medium">{loc.current.rainChance}%</p></div>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2"><Thermometer className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Feels</span><span className="ml-auto font-medium">{loc.current.feelsLike}°C</span></div>
                        <div className="flex items-center gap-2"><Gauge className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Press.</span><span className="ml-auto font-medium">{loc.current.pressure} hPa</span></div>
                        <div className="flex items-center gap-2"><Eye className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Vis.</span><span className="ml-auto font-medium">{loc.current.visibility} km</span></div>
                        <div className="flex items-center gap-2"><Sun className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">UV</span><span className="ml-auto font-medium">{loc.current.uvIndex}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Agricultural Metrics */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filtered.map(loc => (
              <Card key={`agri-${loc.name}`}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sprout className="h-4 w-4 text-success" />{loc.name} - Agri Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Soil Moisture</span><span className="font-medium">{loc.agriculturalMetrics.soilMoisture}%</span></div>
                  <div className="w-full bg-muted rounded-full h-2"><div className="bg-info h-2 rounded-full" style={{ width: `${loc.agriculturalMetrics.soilMoisture}%` }} /></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Evapotranspiration</span><span className="font-medium">{loc.agriculturalMetrics.evapotranspiration} mm/day</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Growing Degree Days</span><span className="font-medium">{loc.agriculturalMetrics.growingDegreeDays}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frost Risk</span><Badge variant="outline" className="text-xs">{loc.agriculturalMetrics.frostRisk}</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Irrigation Need</span><Badge variant="outline" className="text-xs">{loc.agriculturalMetrics.irrigationNeed}</Badge></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts */}
          {filtered.some(l => l.alerts.length > 0 && l.alerts[0].type !== "none") && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Weather Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {filtered.flatMap(loc => loc.alerts.filter(a => a.type !== "none").map((alert, i) => (
                  <div key={`${loc.name}-alert-${i}`} className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[alert.severity] || ""}`}>
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div><p className="font-medium text-sm">{loc.name}: {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}</p><p className="text-sm opacity-80">{alert.message}</p></div>
                  </div>
                )))}
              </CardContent>
            </Card>
          )}

          {/* Hourly Forecast Chart */}
          {filtered.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Hourly Temperature Forecast</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filtered[0].hourlyForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="hour" /><YAxis unit="°C" />
                    <Tooltip />
                    <Area type="monotone" dataKey="temp" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Temperature (°C)" />
                    <Area type="monotone" dataKey="rainChance" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.1)" name="Rain Chance (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Weekly Forecast */}
          {filtered.length > 0 && (
            <Card>
              <CardHeader><CardTitle>7-Day Forecast — {filtered[0].name}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filtered[0].weeklyForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="high" fill="hsl(var(--warning))" name="High °C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="low" fill="hsl(var(--info))" name="Low °C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rainfall" fill="hsl(var(--primary))" name="Rainfall (mm)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

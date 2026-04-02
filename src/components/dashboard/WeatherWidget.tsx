import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Cloud, Droplets, Wind, CloudRain, CloudSun, CloudLightning, CloudFog, RefreshCw, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";

const conditionIcons: Record<string, typeof Sun> = {
  Sunny: Sun, Cloudy: Cloud, Rainy: CloudRain, "Partly Cloudy": CloudSun,
  Thunderstorm: CloudLightning, Drizzle: CloudRain, Foggy: CloudFog,
};

const WIDGET_CACHE_KEY = "dashboard_weather_cache";
const WIDGET_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  rainChance: number;
  farmName: string;
}

function getCached(): { data: WeatherData; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(WIDGET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < WIDGET_CACHE_TTL) return parsed;
    localStorage.removeItem(WIDGET_CACHE_KEY);
    return null;
  } catch { return null; }
}

export function WeatherWidget() {
  const { farms } = useAppData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(() => getCached()?.data ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-fetch weather for first farm
  useEffect(() => {
    if (farms.length > 0 && !weather && !loading) {
      fetchWeather();
    }
  }, [farms]);

  const fetchWeather = async () => {
    if (farms.length === 0) return;
    setLoading(true);
    try {
      const farm = farms[0];
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ locations: [{ name: farm.name, location: farm.location }] }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      if (data.locations?.[0]) {
        const loc = data.locations[0];
        const w: WeatherData = {
          temperature: loc.current.temperature,
          feelsLike: loc.current.feelsLike,
          humidity: loc.current.humidity,
          windSpeed: loc.current.windSpeed,
          condition: loc.current.condition,
          rainChance: loc.current.rainChance,
          farmName: farm.name,
        };
        setWeather(w);
        localStorage.setItem(WIDGET_CACHE_KEY, JSON.stringify({ data: w, timestamp: Date.now() }));
      }
    } catch (e) {
      console.error("Weather widget error:", e);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = format(currentTime, "EEEE, MMMM d, yyyy");
  const formattedTime = format(currentTime, "h:mm a");
  const Icon = weather ? (conditionIcons[weather.condition] || CloudSun) : CloudSun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">{formattedDate}</p>
          <p className="text-xs opacity-70 mt-0.5">{formattedTime} EAT</p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm opacity-80">Loading...</span>
            </div>
          ) : weather ? (
            <>
              <p className="text-4xl font-bold mt-2">{weather.temperature}°C</p>
              <p className="text-sm opacity-80 mt-1">{weather.condition}</p>
              <p className="text-xs opacity-60 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {weather.farmName}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm opacity-70 mt-2">No weather data</p>
              {farms.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 px-2 text-xs"
                  onClick={fetchWeather}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Load Weather
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <Icon className="h-12 w-12 text-accent" />
          {weather && !loading && (
            <button
              onClick={fetchWeather}
              className="text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors"
              title="Refresh weather"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-primary-foreground/20">
        <div className="text-center">
          <Droplets className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">{weather?.humidity ?? "--"}%</p>
          <p className="text-xs opacity-70">Humidity</p>
        </div>
        <div className="text-center">
          <Wind className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">{weather?.windSpeed ?? "--"} km/h</p>
          <p className="text-xs opacity-70">Wind</p>
        </div>
        <div className="text-center">
          <CloudRain className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">{weather?.rainChance ?? "--"}%</p>
          <p className="text-xs opacity-70">Rain</p>
        </div>
      </div>
    </motion.div>
  );
}

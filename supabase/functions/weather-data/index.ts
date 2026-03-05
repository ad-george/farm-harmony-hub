import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FarmLocation {
  name: string;
  location: string;
  soilType?: string;
  farmType?: string;
}

function mapOwmCondition(main: string): string {
  const map: Record<string, string> = {
    Clear: "Sunny",
    Clouds: "Cloudy",
    Rain: "Rainy",
    Drizzle: "Rainy",
    Thunderstorm: "Thunderstorm",
    Mist: "Foggy",
    Fog: "Foggy",
    Haze: "Foggy",
    Snow: "Cloudy",
  };
  return map[main] || "Partly Cloudy";
}

function getDayAbbr(dt: number): string {
  return new Date(dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
}

function getHourLabel(dt: number): string {
  return new Date(dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json() as { locations: FarmLocation[] };
    const OWM_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!OWM_KEY) throw new Error("OPENWEATHERMAP_API_KEY is not configured");

    const weatherLocations = await Promise.all(
      locations.map(async (farm) => {
        const locQuery = farm.location || farm.name;

        // 1. Get current weather
        const currentRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locQuery)}&units=metric&appid=${OWM_KEY}`
        );
        if (!currentRes.ok) {
          const errText = await currentRes.text();
          console.error(`OWM current error for ${locQuery}:`, currentRes.status, errText);
          throw new Error(`Could not fetch weather for "${locQuery}". Make sure the location name is a valid city/town.`);
        }
        const currentData = await currentRes.json();

        const { coord } = currentData;

        // 2. Get 5-day / 3-hour forecast
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${coord.lat}&lon=${coord.lon}&units=metric&appid=${OWM_KEY}`
        );
        const forecastData = await forecastRes.json();

        // Build hourly forecast (next 6 entries = ~18 hours)
        const hourlyForecast = forecastData.list.slice(0, 6).map((entry: any) => ({
          hour: getHourLabel(entry.dt),
          temp: Math.round(entry.main.temp),
          condition: mapOwmCondition(entry.weather[0].main),
          rainChance: Math.round((entry.pop || 0) * 100),
        }));

        // Build weekly forecast (aggregate by day)
        const dayMap: Record<string, { highs: number[]; lows: number[]; conditions: string[]; pops: number[]; rain: number }> = {};
        for (const entry of forecastData.list) {
          const day = getDayAbbr(entry.dt);
          if (!dayMap[day]) dayMap[day] = { highs: [], lows: [], conditions: [], pops: [], rain: 0 };
          dayMap[day].highs.push(entry.main.temp_max);
          dayMap[day].lows.push(entry.main.temp_min);
          dayMap[day].conditions.push(entry.weather[0].main);
          dayMap[day].pops.push(entry.pop || 0);
          dayMap[day].rain += entry.rain?.["3h"] || 0;
        }

        const weeklyForecast = Object.entries(dayMap).slice(0, 7).map(([day, data]) => ({
          day,
          high: Math.round(Math.max(...data.highs)),
          low: Math.round(Math.min(...data.lows)),
          condition: mapOwmCondition(
            data.conditions.sort((a, b) =>
              data.conditions.filter(v => v === b).length - data.conditions.filter(v => v === a).length
            )[0]
          ),
          rainChance: Math.round(Math.max(...data.pops) * 100),
          rainfall: Math.round(data.rain * 10) / 10,
        }));

        // Weather alerts (simple heuristic-based)
        const alerts: { type: string; severity: string; message: string }[] = [];
        const temp = currentData.main.temp;
        const humidity = currentData.main.humidity;
        const windSpeed = (currentData.wind?.speed || 0) * 3.6; // m/s -> km/h

        if (temp > 35) alerts.push({ type: "heatwave", severity: "high", message: `Extreme heat at ${Math.round(temp)}°C. Ensure livestock shade and crop irrigation.` });
        if (temp < 5) alerts.push({ type: "frost", severity: "medium", message: `Low temperature risk at ${Math.round(temp)}°C. Protect frost-sensitive crops.` });
        if (humidity > 90) alerts.push({ type: "flood", severity: "medium", message: `Very high humidity (${humidity}%). Monitor for waterlogging.` });
        if (windSpeed > 50) alerts.push({ type: "storm", severity: "high", message: `Strong winds at ${Math.round(windSpeed)} km/h. Secure structures.` });
        if (humidity < 30 && temp > 30) alerts.push({ type: "drought", severity: "medium", message: `Hot and dry conditions. Increase irrigation.` });
        if (alerts.length === 0) alerts.push({ type: "none", severity: "low", message: "No weather alerts. Conditions are favorable." });

        // Agricultural metrics (estimated from real weather)
        const rainMm = currentData.rain?.["1h"] || currentData.rain?.["3h"] || 0;
        const soilMoisture = Math.min(100, Math.round(humidity * 0.7 + rainMm * 5));
        const evapotranspiration = Math.round((0.0023 * (temp + 17.8) * Math.sqrt(Math.max(1, currentData.main.temp_max - currentData.main.temp_min)) * 10) * 10) / 10;

        let irrigationNeed = "none";
        if (soilMoisture < 30) irrigationNeed = "critical";
        else if (soilMoisture < 45) irrigationNeed = "high";
        else if (soilMoisture < 60) irrigationNeed = "moderate";
        else if (soilMoisture < 75) irrigationNeed = "low";

        let frostRisk = "none";
        if (temp < 2) frostRisk = "high";
        else if (temp < 5) frostRisk = "medium";
        else if (temp < 10) frostRisk = "low";

        return {
          name: farm.name,
          current: {
            temperature: Math.round(currentData.main.temp),
            feelsLike: Math.round(currentData.main.feels_like),
            humidity: currentData.main.humidity,
            windSpeed: Math.round(windSpeed),
            windDirection: getWindDirection(currentData.wind?.deg || 0),
            pressure: currentData.main.pressure,
            uvIndex: 0, // Not available in free tier
            visibility: Math.round((currentData.visibility || 10000) / 1000),
            condition: mapOwmCondition(currentData.weather[0].main),
            rainChance: Math.round((forecastData.list[0]?.pop || 0) * 100),
            rainfall: rainMm,
          },
          hourlyForecast,
          weeklyForecast,
          alerts,
          agriculturalMetrics: {
            soilMoisture,
            evapotranspiration,
            growingDegreeDays: Math.max(0, Math.round(((currentData.main.temp_max + currentData.main.temp_min) / 2) - 10)),
            frostRisk,
            irrigationNeed,
          },
        };
      })
    );

    return new Response(
      JSON.stringify({ locations: weatherLocations, lastUpdated: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Weather error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getWindDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

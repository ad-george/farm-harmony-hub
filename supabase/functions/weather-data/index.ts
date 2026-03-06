import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FarmLocation {
  name: string;
  location: string;
}

function mapCondition(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("sunny") || t.includes("clear")) return "Sunny";
  if (t.includes("thunder") || t.includes("lightning")) return "Thunderstorm";
  if (t.includes("rain") || t.includes("drizzle") || t.includes("shower")) return "Rainy";
  if (t.includes("fog") || t.includes("mist") || t.includes("haze")) return "Foggy";
  if (t.includes("partly") || t.includes("patchy")) return "Partly Cloudy";
  if (t.includes("overcast") || t.includes("cloudy")) return "Cloudy";
  return "Partly Cloudy";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json() as { locations: FarmLocation[] };
    const API_KEY = Deno.env.get("WEATHERAPI_KEY");
    if (!API_KEY) throw new Error("WEATHERAPI_KEY is not configured");

    const weatherLocations = await Promise.all(
      locations.map(async (farm) => {
        const query = farm.location || farm.name;

        const res = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=yes`
        );
        if (!res.ok) {
          const err = await res.text();
          console.error(`WeatherAPI error for ${query}:`, res.status, err);
          throw new Error(`Could not fetch weather for "${query}". Please check the location name.`);
        }
        const data = await res.json();
        const current = data.current;
        const forecast = data.forecast.forecastday;

        // Hourly forecast — pick 6 spread-out hours from today
        const todayHours = forecast[0]?.hour || [];
        const hourIndices = [6, 9, 12, 15, 18, 21];
        const hourlyForecast = hourIndices.map((h) => {
          const entry = todayHours[h];
          if (!entry) return { hour: `${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : "AM"}`, temp: 0, condition: "Cloudy", rainChance: 0 };
          return {
            hour: new Date(entry.time).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
            temp: Math.round(entry.temp_c),
            condition: mapCondition(entry.condition.text),
            rainChance: entry.chance_of_rain,
          };
        });

        // Weekly forecast
        const weeklyForecast = forecast.map((day: any) => ({
          day: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
          high: Math.round(day.day.maxtemp_c),
          low: Math.round(day.day.mintemp_c),
          condition: mapCondition(day.day.condition.text),
          rainChance: day.day.daily_chance_of_rain,
          rainfall: day.day.totalprecip_mm,
        }));

        // Alerts
        const alerts: { type: string; severity: string; message: string }[] = [];
        const temp_c = current.temp_c;
        const humidity = current.humidity;
        const wind_kph = current.wind_kph;

        if (data.alerts?.alert?.length) {
          for (const a of data.alerts.alert) {
            alerts.push({
              type: a.event?.toLowerCase().includes("flood") ? "flood" : a.event?.toLowerCase().includes("heat") ? "heatwave" : "storm",
              severity: a.severity === "Extreme" ? "high" : a.severity === "Severe" ? "high" : "medium",
              message: a.headline || a.desc || a.event,
            });
          }
        }

        if (temp_c > 35) alerts.push({ type: "heatwave", severity: "high", message: `Extreme heat at ${Math.round(temp_c)}°C. Ensure livestock shade and crop irrigation.` });
        if (temp_c < 5) alerts.push({ type: "frost", severity: "medium", message: `Low temperature risk at ${Math.round(temp_c)}°C. Protect frost-sensitive crops.` });
        if (humidity > 90) alerts.push({ type: "flood", severity: "medium", message: `Very high humidity (${humidity}%). Monitor for waterlogging.` });
        if (wind_kph > 50) alerts.push({ type: "storm", severity: "high", message: `Strong winds at ${Math.round(wind_kph)} km/h. Secure structures.` });
        if (alerts.length === 0) alerts.push({ type: "none", severity: "low", message: "No weather alerts. Conditions are favorable for farming." });

        // Agricultural metrics
        const precip = current.precip_mm || 0;
        const soilMoisture = Math.min(100, Math.round(humidity * 0.7 + precip * 5));
        const tempRange = (forecast[0]?.day?.maxtemp_c || temp_c) - (forecast[0]?.day?.mintemp_c || temp_c);
        const evapotranspiration = Math.round((0.0023 * (temp_c + 17.8) * Math.sqrt(Math.max(1, tempRange)) * 10) * 10) / 10;

        let irrigationNeed = "none";
        if (soilMoisture < 30) irrigationNeed = "critical";
        else if (soilMoisture < 45) irrigationNeed = "high";
        else if (soilMoisture < 60) irrigationNeed = "moderate";
        else if (soilMoisture < 75) irrigationNeed = "low";

        let frostRisk = "none";
        if (temp_c < 2) frostRisk = "high";
        else if (temp_c < 5) frostRisk = "medium";
        else if (temp_c < 10) frostRisk = "low";

        return {
          name: farm.name,
          current: {
            temperature: Math.round(current.temp_c),
            feelsLike: Math.round(current.feelslike_c),
            humidity: current.humidity,
            windSpeed: Math.round(current.wind_kph),
            windDirection: current.wind_dir,
            pressure: current.pressure_mb,
            uvIndex: current.uv,
            visibility: current.vis_km,
            condition: mapCondition(current.condition.text),
            rainChance: forecast[0]?.day?.daily_chance_of_rain || 0,
            rainfall: current.precip_mm,
          },
          hourlyForecast,
          weeklyForecast,
          alerts,
          agriculturalMetrics: {
            soilMoisture,
            evapotranspiration,
            growingDegreeDays: Math.max(0, Math.round(((forecast[0]?.day?.maxtemp_c || temp_c) + (forecast[0]?.day?.mintemp_c || temp_c)) / 2 - 10)),
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

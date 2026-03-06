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

// WMO weather codes to condition strings
function wmoToCondition(code: number): string {
  if (code === 0) return "Sunny";
  if (code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Rainy";
  if (code >= 61 && code <= 67) return "Rainy";
  if (code >= 71 && code <= 77) return "Cloudy";
  if (code >= 80 && code <= 82) return "Rainy";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

function getWindDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json() as { locations: FarmLocation[] };

    const weatherLocations = await Promise.all(
      locations.map(async (farm) => {
        const query = farm.location || farm.name;

        // Step 1: Geocode the location using Open-Meteo geocoding
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) {
          const errText = await geoRes.text();
          console.error(`Geocoding error for ${query}:`, geoRes.status, errText);
          throw new Error(`Could not find location "${query}".`);
        }
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`Location "${query}" not found. Try a different city name.`);
        }

        const { latitude, longitude, name: geoName } = geoData.results[0];

        // Step 2: Get current weather + forecast from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max` +
          `&timezone=auto&forecast_days=7`
        );
        if (!weatherRes.ok) {
          const errText = await weatherRes.text();
          console.error(`Weather error for ${query}:`, weatherRes.status, errText);
          throw new Error(`Could not fetch weather for "${query}".`);
        }
        const w = await weatherRes.json();
        const cur = w.current;

        // Build hourly forecast (6AM, 9AM, 12PM, 3PM, 6PM, 9PM)
        const hourIndices = [6, 9, 12, 15, 18, 21];
        const hourlyForecast = hourIndices.map((h) => ({
          hour: `${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : h === 12 ? "PM" : "AM"}`,
          temp: Math.round(w.hourly.temperature_2m[h] ?? 0),
          condition: wmoToCondition(w.hourly.weather_code[h] ?? 0),
          rainChance: w.hourly.precipitation_probability[h] ?? 0,
        }));

        // Build weekly forecast
        const weeklyForecast = w.daily.time.map((date: string, i: number) => ({
          day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          high: Math.round(w.daily.temperature_2m_max[i]),
          low: Math.round(w.daily.temperature_2m_min[i]),
          condition: wmoToCondition(w.daily.weather_code[i]),
          rainChance: w.daily.precipitation_probability_max[i] ?? 0,
          rainfall: w.daily.precipitation_sum[i] ?? 0,
        }));

        // Alerts
        const alerts: { type: string; severity: string; message: string }[] = [];
        const temp = cur.temperature_2m;
        const humidity = cur.relative_humidity_2m;
        const windSpeed = cur.wind_speed_10m;
        const precip = cur.precipitation;

        if (temp > 35) alerts.push({ type: "heatwave", severity: "high", message: `Extreme heat at ${Math.round(temp)}°C. Ensure livestock shade and crop irrigation.` });
        if (temp < 5) alerts.push({ type: "frost", severity: "medium", message: `Low temperature risk at ${Math.round(temp)}°C. Protect frost-sensitive crops.` });
        if (humidity > 90) alerts.push({ type: "flood", severity: "medium", message: `Very high humidity (${humidity}%). Monitor for waterlogging.` });
        if (windSpeed > 50) alerts.push({ type: "storm", severity: "high", message: `Strong winds at ${Math.round(windSpeed)} km/h. Secure structures.` });
        if (humidity < 30 && temp > 30) alerts.push({ type: "drought", severity: "medium", message: "Hot and dry conditions. Increase irrigation." });
        if (alerts.length === 0) alerts.push({ type: "none", severity: "low", message: "No weather alerts. Conditions are favorable for farming." });

        // Agricultural metrics
        const soilMoisture = Math.min(100, Math.round(humidity * 0.7 + precip * 5));
        const tempRange = (w.daily.temperature_2m_max[0] ?? temp) - (w.daily.temperature_2m_min[0] ?? temp);
        const evapotranspiration = Math.round((0.0023 * (temp + 17.8) * Math.sqrt(Math.max(1, tempRange)) * 10) * 10) / 10;

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
            temperature: Math.round(cur.temperature_2m),
            feelsLike: Math.round(cur.apparent_temperature),
            humidity: cur.relative_humidity_2m,
            windSpeed: Math.round(cur.wind_speed_10m),
            windDirection: getWindDirection(cur.wind_direction_10m),
            pressure: Math.round(cur.surface_pressure),
            uvIndex: Math.round(cur.uv_index ?? 0),
            visibility: 10, // Open-Meteo doesn't provide visibility in free tier
            condition: wmoToCondition(cur.weather_code),
            rainChance: w.daily.precipitation_probability_max[0] ?? 0,
            rainfall: cur.precipitation ?? 0,
          },
          hourlyForecast,
          weeklyForecast,
          alerts,
          agriculturalMetrics: {
            soilMoisture,
            evapotranspiration,
            growingDegreeDays: Math.max(0, Math.round(((w.daily.temperature_2m_max[0] ?? temp) + (w.daily.temperature_2m_min[0] ?? temp)) / 2 - 10)),
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

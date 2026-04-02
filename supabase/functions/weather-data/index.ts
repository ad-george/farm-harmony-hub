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
  if (code >= 51 && code <= 57) return "Drizzle";
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

// Known Kenyan locations with coordinates for common farm areas
// This provides instant, accurate geocoding for well-known areas
const KNOWN_LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  "kayole": { lat: 0.0436, lon: 37.6500, name: "Kayole, Meru" },
  "meru": { lat: 0.0480, lon: 37.6500, name: "Meru" },
  "nairobi": { lat: -1.2921, lon: 36.8219, name: "Nairobi" },
  "nakuru": { lat: -0.3031, lon: 36.0800, name: "Nakuru" },
  "eldoret": { lat: 0.5143, lon: 35.2698, name: "Eldoret" },
  "kisumu": { lat: -0.0917, lon: 34.7680, name: "Kisumu" },
  "mombasa": { lat: -4.0435, lon: 39.6682, name: "Mombasa" },
  "thika": { lat: -1.0396, lon: 37.0900, name: "Thika" },
  "nyeri": { lat: -0.4197, lon: 36.9511, name: "Nyeri" },
  "nanyuki": { lat: 0.0067, lon: 37.0722, name: "Nanyuki" },
  "machakos": { lat: -1.5177, lon: 37.2634, name: "Machakos" },
  "embu": { lat: -0.5389, lon: 37.4596, name: "Embu" },
  "kitale": { lat: 1.0187, lon: 35.0020, name: "Kitale" },
  "kericho": { lat: -0.3692, lon: 35.2863, name: "Kericho" },
  "naivasha": { lat: -0.7170, lon: 36.4310, name: "Naivasha" },
  "nyandarua": { lat: -0.1833, lon: 36.5000, name: "Nyandarua" },
  "kiambu": { lat: -1.1714, lon: 36.8356, name: "Kiambu" },
  "murang'a": { lat: -0.7210, lon: 37.1526, name: "Murang'a" },
  "muranga": { lat: -0.7210, lon: 37.1526, name: "Murang'a" },
  "laikipia": { lat: 0.3000, lon: 36.8000, name: "Laikipia" },
  "bungoma": { lat: 0.5635, lon: 34.5607, name: "Bungoma" },
  "kakamega": { lat: 0.2827, lon: 34.7519, name: "Kakamega" },
  "uasin gishu": { lat: 0.5500, lon: 35.3000, name: "Uasin Gishu" },
  "trans nzoia": { lat: 1.0500, lon: 35.0000, name: "Trans Nzoia" },
  "kajiado": { lat: -2.0981, lon: 36.7820, name: "Kajiado" },
  "garissa": { lat: -0.4532, lon: 39.6461, name: "Garissa" },
  "isiolo": { lat: 0.3546, lon: 37.5822, name: "Isiolo" },
  "tharaka nithi": { lat: -0.3000, lon: 37.8000, name: "Tharaka Nithi" },
};

// Try to find coordinates from known locations
function findKnownLocation(query: string): { lat: number; lon: number; name: string } | null {
  const normalized = query.toLowerCase().replace(/[,\s]+kenya$/i, "").trim();
  
  // Direct match
  if (KNOWN_LOCATIONS[normalized]) return KNOWN_LOCATIONS[normalized];
  
  // Check if any known location is contained in the query
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  
  // Check individual words
  const words = normalized.split(/[\s,]+/);
  for (const word of words) {
    if (word.length >= 3 && KNOWN_LOCATIONS[word]) return KNOWN_LOCATIONS[word];
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json() as { locations: FarmLocation[] };

    const weatherLocations = await Promise.all(
      locations.map(async (farm) => {
        const rawQuery = farm.location || farm.name;
        let latitude: number;
        let longitude: number;
        let resolvedName: string;

        // Step 1: Check known locations first (fastest, most accurate)
        const known = findKnownLocation(rawQuery);
        if (known) {
          latitude = known.lat;
          longitude = known.lon;
          resolvedName = known.name;
          console.log(`Known location "${rawQuery}" → ${resolvedName} at ${latitude}, ${longitude}`);
        } else {
          // Step 2: Geocode using Open-Meteo with Kenya preference
          let matchedResult: any = null;

          for (const query of [`${rawQuery}, Kenya`, rawQuery]) {
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
            );
            if (!geoRes.ok) {
              const errText = await geoRes.text();
              console.error(`Geocoding error for ${query}:`, geoRes.status, errText);
              continue;
            }
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              // Strongly prefer results in Kenya (country_code: KE)
              const kenyanResults = geoData.results.filter((r: any) => r.country_code === "KE");
              if (kenyanResults.length > 0) {
                // Among Kenyan results, prefer lower elevation (towns, not mountains)
                matchedResult = kenyanResults.sort((a: any, b: any) => (a.elevation || 0) - (b.elevation || 0))[0];
              } else {
                matchedResult = geoData.results[0];
              }
              break;
            }
          }

          if (!matchedResult) {
            throw new Error(`Location "${rawQuery}" not found. Try a more specific name like "Meru, Kenya".`);
          }

          latitude = matchedResult.latitude;
          longitude = matchedResult.longitude;
          resolvedName = `${matchedResult.name}${matchedResult.admin1 ? `, ${matchedResult.admin1}` : ""} (${matchedResult.country_code})`;
          console.log(`Geocoded "${rawQuery}" → ${resolvedName} at ${latitude}, ${longitude} (elev: ${matchedResult.elevation}m)`);
        }

        // Step 3: Get current weather + forecast from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max` +
          `&timezone=Africa%2FNairobi&forecast_days=7`
        );
        if (!weatherRes.ok) {
          const errText = await weatherRes.text();
          console.error(`Weather error:`, weatherRes.status, errText);
          throw new Error(`Could not fetch weather for "${rawQuery}".`);
        }
        const w = await weatherRes.json();
        const cur = w.current;

        // Get current hour index for hourly data
        const nowHour = new Date().getUTCHours() + 3; // EAT = UTC+3
        
        // Build hourly forecast - next 6 intervals from current hour
        const hourSlots = [0, 3, 6, 9, 12, 15].map(offset => {
          const h = (Math.floor(nowHour) + offset) % 24;
          return h;
        });
        
        const hourlyForecast = hourSlots.map((h) => {
          const idx = h; // hourly data index for today
          return {
            hour: `${h > 12 ? h - 12 : h === 0 ? 12 : h}${h >= 12 ? "PM" : "AM"}`,
            temp: Math.round(w.hourly.temperature_2m[idx] ?? cur.temperature_2m),
            condition: wmoToCondition(w.hourly.weather_code[idx] ?? cur.weather_code),
            rainChance: w.hourly.precipitation_probability[idx] ?? 0,
          };
        });

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
        if (humidity > 90) alerts.push({ type: "humidity", severity: "medium", message: `Very high humidity (${humidity}%). Monitor for fungal diseases and waterlogging.` });
        if (windSpeed > 50) alerts.push({ type: "storm", severity: "high", message: `Strong winds at ${Math.round(windSpeed)} km/h. Secure structures.` });
        if (humidity < 30 && temp > 30) alerts.push({ type: "drought", severity: "medium", message: "Hot and dry conditions. Increase irrigation." });
        if (precip > 20) alerts.push({ type: "heavy-rain", severity: "medium", message: `Heavy rainfall (${precip}mm). Watch for flooding and erosion.` });
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
            visibility: 10,
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

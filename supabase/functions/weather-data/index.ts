import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a weather data simulation engine for East African agricultural regions. Generate realistic weather data based on actual climate patterns for the given locations.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.

Generate weather data in this exact structure:
{
  "locations": [
    {
      "name": "location name",
      "current": {
        "temperature": number (Celsius),
        "feelsLike": number,
        "humidity": number (0-100),
        "windSpeed": number (km/h),
        "windDirection": "string (e.g. NE, SW)",
        "pressure": number (hPa),
        "uvIndex": number (0-11),
        "visibility": number (km),
        "condition": "string (Sunny/Cloudy/Rainy/Partly Cloudy/Thunderstorm/Overcast/Foggy)",
        "rainChance": number (0-100),
        "rainfall": number (mm)
      },
      "hourlyForecast": [
        { "hour": "6AM", "temp": number, "condition": "string", "rainChance": number },
        { "hour": "9AM", "temp": number, "condition": "string", "rainChance": number },
        { "hour": "12PM", "temp": number, "condition": "string", "rainChance": number },
        { "hour": "3PM", "temp": number, "condition": "string", "rainChance": number },
        { "hour": "6PM", "temp": number, "condition": "string", "rainChance": number },
        { "hour": "9PM", "temp": number, "condition": "string", "rainChance": number }
      ],
      "weeklyForecast": [
        { "day": "Mon", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Tue", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Wed", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Thu", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Fri", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Sat", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number },
        { "day": "Sun", "high": number, "low": number, "condition": "string", "rainChance": number, "rainfall": number }
      ],
      "alerts": [
        { "type": "string (drought/flood/frost/heatwave/storm/none)", "severity": "string (low/medium/high)", "message": "string" }
      ],
      "agriculturalMetrics": {
        "soilMoisture": number (0-100),
        "evapotranspiration": number (mm/day),
        "growingDegreeDays": number,
        "frostRisk": "string (none/low/medium/high)",
        "irrigationNeed": "string (none/low/moderate/high/critical)"
      }
    }
  ],
  "lastUpdated": "ISO timestamp string"
}

Use realistic seasonal patterns for East Africa. Current month patterns should reflect the actual climate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate current weather data for these farm locations: ${JSON.stringify(locations)}. Today's date is ${new Date().toISOString().split("T")[0]}.` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from AI");

    let clean = content.trim();
    if (clean.startsWith("```")) clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const weatherData = JSON.parse(clean);
    return new Response(JSON.stringify(weatherData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Weather error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

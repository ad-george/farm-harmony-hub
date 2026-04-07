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
    const { farms, weatherData, crops, livestock } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI-powered smart irrigation advisor for agricultural farms. You MUST analyze ACTUAL rainfall data, crop water requirements, and livestock water needs before making any irrigation recommendation.

CRITICAL RULES:
1. **CHECK RAINFALL FIRST**: If a farm's region is currently receiving adequate rainfall (based on the weather data provided), DO NOT recommend additional irrigation. Instead, recommend monitoring and natural rainfall utilization.
2. **Rainfall History**: Consider recent rainfall amounts. If the area received significant rain in the past 7 days, reduce or skip irrigation recommendations accordingly.
3. **Crop-Specific Water Needs**: Different crops need different amounts of water. For example:
   - Maize/Corn: High water demand especially during tasseling
   - Tea: Moderate, consistent moisture needed
   - Coffee: Moderate, can tolerate short dry spells
   - Vegetables: High and frequent watering
   - Wheat/Barley: Moderate, less during maturity
   - Fruit trees: Deep but infrequent watering
4. **Livestock Water Needs**: If the farm has livestock, factor in:
   - Cattle: 40-80 liters/day each
   - Goats/Sheep: 5-15 liters/day each
   - Poultry: 0.2-0.5 liters/day each
   - Dairy cows need more water than beef cattle
5. **Soil Type Interaction**: Sandy soils drain fast (need more frequent irrigation), clay retains water (risk of waterlogging in rainy periods), loam is balanced.
6. **Do NOT recommend irrigation when rainfall is sufficient**. Instead provide advice on drainage, water harvesting, or monitoring.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.

Generate irrigation recommendations in this exact structure:
{
  "farmRecommendations": [
    {
      "farmName": "string",
      "farmLocation": "string",
      "soilType": "string",
      "overallStatus": "string (optimal/needs-attention/critical/over-watered)",
      "rainfallStatus": "string (receiving-rainfall/light-rain/dry/drought)",
      "recentRainfall": "string (e.g. '45mm in last 7 days')",
      "soilMoisture": number (0-100, current estimated %),
      "optimalMoisture": number (0-100, target %),
      "waterUsageEfficiency": number (0-100, %),
      "nextIrrigationIn": "string (e.g. '2 hours', '3 days', 'Not needed - adequate rainfall', 'Immediately')",
      "dailyWaterNeeded": number (liters per acre, can be 0 if rainfall sufficient),
      "irrigationNeeded": boolean,
      "irrigationReason": "string (why irrigation is or isn't needed)",
      "weeklySchedule": [
        { "day": "Mon", "startTime": "string", "duration": "string (mins)", "zone": "string", "waterAmount": "string (liters)", "priority": "string (high/medium/low/skip)", "note": "string (e.g. 'Rain expected - skip' or 'Supplement light rain')" },
        { "day": "Tue", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" },
        { "day": "Wed", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" },
        { "day": "Thu", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" },
        { "day": "Fri", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" },
        { "day": "Sat", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" },
        { "day": "Sun", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string", "note": "string" }
      ],
      "cropWaterAnalysis": [
        { "cropName": "string", "waterNeedLevel": "string (high/medium/low)", "dailyRequirement": "string (liters/acre)", "currentStatus": "string", "recommendation": "string" }
      ],
      "livestockWaterNeeds": {
        "totalDailyLiters": number,
        "breakdown": [
          { "type": "string", "count": number, "perAnimalLiters": number, "totalLiters": number }
        ]
      },
      "recommendations": ["string array of 3-5 specific actionable tips considering rainfall"],
      "waterSavings": {
        "currentUsage": "string (liters/week)",
        "optimizedUsage": "string (liters/week)",
        "savingsPercent": number,
        "costSavings": "string (e.g. 'KSh 15,000/month')",
        "rainfallContribution": "string (e.g. 'Rainfall covers 60% of water needs')"
      },
      "riskFactors": [
        { "factor": "string", "level": "string (low/medium/high)", "description": "string" }
      ]
    }
  ],
  "systemSummary": {
    "totalFarmsMonitored": number,
    "farmsNeedingAttention": number,
    "farmsWithAdequateRainfall": number,
    "totalDailyWater": "string (liters)",
    "overallEfficiency": number (0-100),
    "totalMonthlySavings": "string",
    "insights": ["string array of 3-4 system-wide insights including rainfall impact"]
  }
}

Consider soil type water retention (Clay > Loam > Silt > Sandy), crop water requirements, current weather AND RAINFALL DATA, livestock needs, and seasonal patterns. If a farm is receiving enough rain, mark irrigationNeeded as false and set daily water to 0 or minimal supplemental amounts.`;

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
          {
            role: "user",
            content: `Analyze these farms and generate smart irrigation recommendations. CRITICALLY: check the rainfall data first before recommending any irrigation.

FARMS (with soil conditions):
${JSON.stringify(farms, null, 2)}

CURRENT WEATHER & RAINFALL DATA (per farm location):
${JSON.stringify(weatherData, null, 2)}

CROPS BEING GROWN (check water needs per crop type):
${JSON.stringify(crops, null, 2)}

LIVESTOCK (factor in drinking water needs):
${JSON.stringify(livestock, null, 2)}

Today: ${new Date().toISOString().split("T")[0]}

REMEMBER: Do NOT recommend irrigation for farms receiving adequate rainfall. Adjust recommendations based on each crop's specific water needs and each livestock type's drinking requirements.`,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from AI");

    let clean = content.trim();
    if (clean.startsWith("```")) clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const data = JSON.parse(clean);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Irrigation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

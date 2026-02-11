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
    const { farms, weatherData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI-powered smart irrigation advisor for agricultural farms. Analyze farm data, soil types, crop types, and weather conditions to generate precise irrigation recommendations.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.

Generate irrigation recommendations in this exact structure:
{
  "farmRecommendations": [
    {
      "farmName": "string",
      "farmLocation": "string",
      "soilType": "string",
      "overallStatus": "string (optimal/needs-attention/critical/over-watered)",
      "soilMoisture": number (0-100, current estimated %),
      "optimalMoisture": number (0-100, target %),
      "waterUsageEfficiency": number (0-100, %),
      "nextIrrigationIn": "string (e.g. '2 hours', '1 day', 'Immediately')",
      "dailyWaterNeeded": number (liters per acre),
      "weeklySchedule": [
        { "day": "Mon", "startTime": "string", "duration": "string (mins)", "zone": "string", "waterAmount": "string (liters)", "priority": "string (high/medium/low)" },
        { "day": "Tue", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" },
        { "day": "Wed", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" },
        { "day": "Thu", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" },
        { "day": "Fri", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" },
        { "day": "Sat", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" },
        { "day": "Sun", "startTime": "string", "duration": "string", "zone": "string", "waterAmount": "string", "priority": "string" }
      ],
      "recommendations": ["string array of 3-4 specific actionable tips"],
      "waterSavings": {
        "currentUsage": "string (liters/week)",
        "optimizedUsage": "string (liters/week)",
        "savingsPercent": number,
        "costSavings": "string (e.g. 'KSh 15,000/month')"
      },
      "riskFactors": [
        { "factor": "string", "level": "string (low/medium/high)", "description": "string" }
      ]
    }
  ],
  "systemSummary": {
    "totalFarmsMonitored": number,
    "farmsNeedingAttention": number,
    "totalDailyWater": "string (liters)",
    "overallEfficiency": number (0-100),
    "totalMonthlySavings": "string",
    "insights": ["string array of 3-4 system-wide insights"]
  }
}

Consider soil type water retention (Clay > Loam > Silt > Sandy), crop water requirements, current weather, and seasonal patterns.`;

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
          { role: "user", content: `Analyze these farms and generate smart irrigation recommendations:\n\nFARMS:\n${JSON.stringify(farms, null, 2)}\n\nWEATHER CONDITIONS:\n${JSON.stringify(weatherData, null, 2)}\n\nToday: ${new Date().toISOString().split("T")[0]}` },
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

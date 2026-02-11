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
    const { farms, tasks, activities } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a statistical anomaly detection engine for agricultural farm management. Analyze farm operations, production data, financial patterns, and task performance to identify anomalies and unusual patterns.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.

Generate anomaly detection results in this exact structure:
{
  "anomalies": [
    {
      "id": "string (unique)",
      "type": "string (production/financial/operational/weather/resource)",
      "severity": "string (low/medium/high/critical)",
      "title": "string",
      "description": "string (detailed explanation)",
      "farm": "string (farm name or 'System-wide')",
      "metric": "string (the metric that triggered the anomaly)",
      "expectedValue": "string",
      "actualValue": "string",
      "deviationPercent": number,
      "detectedAt": "string (ISO date)",
      "recommendation": "string (actionable fix)",
      "status": "string (new/investigating/resolved)"
    }
  ],
  "riskScore": {
    "overall": number (0-100),
    "production": number (0-100),
    "financial": number (0-100),
    "operational": number (0-100),
    "breakdown": [
      { "category": "string", "score": number, "trend": "string (improving/stable/declining)" }
    ]
  },
  "trendAnalysis": {
    "monthlyAnomalyCounts": [
      { "month": "Jan", "critical": number, "high": number, "medium": number, "low": number },
      { "month": "Feb", "critical": number, "high": number, "medium": number, "low": number },
      { "month": "Mar", "critical": number, "high": number, "medium": number, "low": number },
      { "month": "Apr", "critical": number, "high": number, "medium": number, "low": number },
      { "month": "May", "critical": number, "high": number, "medium": number, "low": number },
      { "month": "Jun", "critical": number, "high": number, "medium": number, "low": number }
    ],
    "topRiskAreas": [
      { "area": "string", "anomalyCount": number, "avgSeverity": "string" }
    ]
  },
  "summary": {
    "totalAnomalies": number,
    "criticalCount": number,
    "highCount": number,
    "mediumCount": number,
    "lowCount": number,
    "resolvedThisMonth": number,
    "newThisWeek": number,
    "insights": ["string array of 3-5 key insights"]
  }
}

Generate realistic anomalies based on the actual farm data provided. Include a mix of production drops, financial irregularities, task delays, resource issues, and weather-related impacts. Generate 8-15 anomalies of varying severity.`;

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
          { role: "user", content: `Analyze this farm system for anomalies:\n\nFARMS:\n${JSON.stringify(farms, null, 2)}\n\nTASKS:\n${JSON.stringify(tasks, null, 2)}\n\nRECENT ACTIVITIES:\n${JSON.stringify(activities, null, 2)}\n\nToday: ${new Date().toISOString().split("T")[0]}` },
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
    console.error("Anomaly detection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

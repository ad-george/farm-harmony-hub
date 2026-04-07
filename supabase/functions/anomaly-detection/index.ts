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
    const { farms, tasks, activities, harvests, financeRecords, crops, livestock, inventory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const farmNames = (farms || []).map((f: any) => f.name);

    const systemPrompt = `You are a statistical anomaly detection engine for agricultural farm management.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. **ONLY reference farms that exist in the data provided**. The ONLY farm names you can use are: ${JSON.stringify(farmNames)}. Do NOT invent or hallucinate farm names.
2. **ONLY flag anomalies based on ACTUAL data patterns** you can observe in the provided records. Do NOT make up metrics, values, or events that aren't supported by the data.
3. **Use real numbers from the data**. If a harvest record shows 500kg, reference 500kg. Don't invent numbers.
4. **If there is insufficient data to detect anomalies in a category, say so** in the insights rather than fabricating anomalies.
5. **Farm field must match exactly** one of the provided farm names or "System-wide" for cross-farm issues.
6. **Be conservative**: Only flag genuine statistical outliers or concerning patterns. Quality over quantity.

Analyze the ACTUAL data for:
- Task completion delays (overdue tasks, status patterns)
- Harvest quantity variations between periods
- Financial irregularities (unusual expenses, revenue drops)
- Inventory levels below minimum stock
- Crop health status issues
- Livestock health concerns
- Operational bottlenecks

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.

Generate anomaly detection results in this exact structure:
{
  "anomalies": [
    {
      "id": "string (unique)",
      "type": "string (production/financial/operational/weather/resource)",
      "severity": "string (low/medium/high/critical)",
      "title": "string",
      "description": "string (detailed explanation referencing ACTUAL data)",
      "farm": "string (MUST be one of: ${JSON.stringify(farmNames)} or 'System-wide')",
      "metric": "string (the metric that triggered the anomaly)",
      "expectedValue": "string",
      "actualValue": "string (from actual data)",
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
    "insights": ["string array of 3-5 key insights BASED ON ACTUAL DATA. If data is sparse, acknowledge it."]
  }
}

Generate ONLY anomalies you can justify from the provided data. If the data is limited, generate fewer anomalies rather than fabricating them. Every anomaly MUST reference real farm names and real data points.`;

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
            content: `Analyze this farm system for anomalies. ONLY use the exact farm names and data provided. Do NOT invent any farms or data points.

FARMS (these are the ONLY farms that exist):
${JSON.stringify(farms, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

RECENT ACTIVITIES:
${JSON.stringify(activities, null, 2)}

HARVEST RECORDS:
${JSON.stringify(harvests, null, 2)}

FINANCE RECORDS:
${JSON.stringify(financeRecords, null, 2)}

CROPS:
${JSON.stringify(crops, null, 2)}

LIVESTOCK:
${JSON.stringify(livestock, null, 2)}

INVENTORY:
${JSON.stringify(inventory, null, 2)}

Today: ${new Date().toISOString().split("T")[0]}

REMINDER: Only use farm names from: ${JSON.stringify(farmNames)}. Only reference data that actually exists above.`,
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
    
    // Post-process: filter out any anomalies referencing non-existent farms
    if (data.anomalies && Array.isArray(data.anomalies)) {
      data.anomalies = data.anomalies.filter((a: any) => 
        a.farm === "System-wide" || farmNames.includes(a.farm)
      );
      // Update summary counts
      if (data.summary) {
        data.summary.totalAnomalies = data.anomalies.length;
        data.summary.criticalCount = data.anomalies.filter((a: any) => a.severity === "critical").length;
        data.summary.highCount = data.anomalies.filter((a: any) => a.severity === "high").length;
        data.summary.mediumCount = data.anomalies.filter((a: any) => a.severity === "medium").length;
        data.summary.lowCount = data.anomalies.filter((a: any) => a.severity === "low").length;
      }
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Anomaly detection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

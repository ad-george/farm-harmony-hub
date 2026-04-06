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
    const { farms, crops, historicalData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received prediction request for farms:", farms?.length, "crops:", crops?.length);

    const systemPrompt = `You are an agricultural production analyst AI. You analyze farm data, soil conditions, crop records, and historical harvest data to generate realistic yield predictions.

IMPORTANT: You MUST respond ONLY with valid JSON. No markdown, no explanations, no code blocks. Just raw JSON.

Given the farm and crop data, generate predictions in this exact JSON structure:
{
  "farmPredictions": [
    {
      "farmName": "string",
      "farmType": "string",
      "currentOutput": "string (e.g. '450 tons')",
      "predictedOutput": "string (e.g. '520 tons')",
      "changePercent": number (positive or negative),
      "confidence": number (0-100),
      "factors": ["string array of key factors affecting prediction"],
      "quarterlyTrend": [
        { "quarter": "Q1", "actual": number, "predicted": number },
        { "quarter": "Q2", "actual": number, "predicted": number },
        { "quarter": "Q3", "actual": number, "predicted": number },
        { "quarter": "Q4", "actual": number, "predicted": number }
      ]
    }
  ],
  "overallPrediction": {
    "totalCurrentOutput": "string",
    "totalPredictedOutput": "string",
    "overallChangePercent": number,
    "overallConfidence": number,
    "summary": "string (2-3 sentence summary)",
    "recommendations": ["string array of 3-5 recommendations"],
    "monthlyTrend": [
      { "month": "Jan", "current": number, "predicted": number },
      { "month": "Feb", "current": number, "predicted": number },
      { "month": "Mar", "current": number, "predicted": number },
      { "month": "Apr", "current": number, "predicted": number },
      { "month": "May", "current": number, "predicted": number },
      { "month": "Jun", "current": number, "predicted": number },
      { "month": "Jul", "current": number, "predicted": number },
      { "month": "Aug", "current": number, "predicted": number },
      { "month": "Sep", "current": number, "predicted": number },
      { "month": "Oct", "current": number, "predicted": number },
      { "month": "Nov", "current": number, "predicted": number },
      { "month": "Dec", "current": number, "predicted": number }
    ]
  }
}

Use realistic agricultural data. CRITICAL factors to consider:
- Soil pH: affects nutrient availability. Optimal range varies by crop (most crops prefer 6.0-7.0). Flag farms with extreme pH.
- Soil Structure & Aggregation: granular structure is ideal for root growth and water infiltration; blocky/platy/massive structures can impede drainage and root penetration. Affects yield significantly.
- Soil Texture: sandy soils drain fast but lack nutrients, clay retains water but can waterlog, loamy is ideal for most crops. Texture determines water-holding capacity and nutrient availability.
- Historical Harvest Data: use past yields, quantities, quality grades, and revenue to establish baselines and trends. If harvest history is available, base predictions on actual recorded data rather than estimates.
- Farm size, type, location, crop stages, and seasonal patterns in East Africa.

Generate numbers in tons for consistency. The monthly/quarterly trend numbers should be in tons and represent production volume.`;

    const userPrompt = `Analyze this farm system data and predict the next season's production yield:

FARMS (with soil conditions & irrigation):
${JSON.stringify(farms, null, 2)}

CURRENT CROPS:
${JSON.stringify(crops, null, 2)}

HISTORICAL HARVEST RECORDS (previous yields & revenue):
${JSON.stringify(historicalData, null, 2)}

Generate detailed, realistic predictions for each farm and an overall prediction. Pay special attention to:
1. Soil pH and soil type — flag any that are suboptimal for their crop types
2. Irrigation method — factor in water efficiency and drought risk
3. Historical harvest data — use actual recorded quantities as baselines for trend analysis
4. Farm types, sizes, locations, current crop stages, and seasonal patterns in East Africa.`;

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("AI response received, parsing...");

    // Clean response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const predictions = JSON.parse(cleanContent);
    console.log("Predictions parsed successfully");

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Prediction error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error generating predictions",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

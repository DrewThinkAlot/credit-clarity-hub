import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  reportId: string;
  fileContents: {
    experian?: string;
    equifax?: string;
    transunion?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { reportId, fileContents }: AnalysisRequest = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Update report status to processing
    await supabase
      .from("reports")
      .update({ status: "processing" })
      .eq("id", reportId)
      .eq("user_id", user.id);

    // Build the prompt for credit report analysis
    const bureauData = [];
    if (fileContents.experian) bureauData.push(`EXPERIAN REPORT:\n${fileContents.experian}`);
    if (fileContents.equifax) bureauData.push(`EQUIFAX REPORT:\n${fileContents.equifax}`);
    if (fileContents.transunion) bureauData.push(`TRANSUNION REPORT:\n${fileContents.transunion}`);

    const systemPrompt = `You are a professional credit repair analyst. Analyze the provided credit report data and identify:
1. Discrepancies between bureaus (different statuses, balances, dates for the same account)
2. Potential FCRA violations (inaccurate information, outdated negative items, etc.)
3. Pay-for-delete opportunities (small collection accounts)
4. Debt validation opportunities (unverified debts)

For each issue found, provide:
- Account name
- Status at each bureau (if different)
- Whether it's a conflict
- Severity (high, medium, low)
- Recommended action
- Type (dispute, pay-for-delete, validation)
- Success probability percentage
- Amount if applicable

Also estimate the potential credit score increase if all issues are resolved.

Respond ONLY with valid JSON in this exact format:
{
  "potential_score_increase": number,
  "discrepancies": [
    {
      "account_name": "string",
      "equifax_status": "string or null",
      "experian_status": "string or null", 
      "transunion_status": "string or null",
      "has_conflict": boolean,
      "severity": "high" | "medium" | "low",
      "recommended_action": "string",
      "discrepancy_type": "dispute" | "pay-for-delete" | "validation",
      "success_probability": number,
      "amount": number or null
    }
  ]
}`;

    if (bureauData.length === 0) {
      throw new Error("No credit report data provided. Please upload at least one credit report.");
    }

    const userPrompt = `Analyze the following credit report data and identify all discrepancies and opportunities:\n\n${bureauData.join("\n\n---\n\n")}`;

    console.log("Calling Lovable AI for credit analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add more credits.");
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response - handle potential markdown code blocks
    let analysisResult;
    try {
      let jsonContent = content;
      // Remove markdown code blocks if present
      if (jsonContent.includes("```json")) {
        jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonContent.includes("```")) {
        jsonContent = jsonContent.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse analysis results");
    }

    // Store discrepancies in the database
    const discrepancies = analysisResult.discrepancies || [];
    
    if (discrepancies.length > 0) {
      const discrepancyRecords = discrepancies.map((d: any) => ({
        report_id: reportId,
        user_id: user.id,
        account_name: d.account_name,
        equifax_status: d.equifax_status,
        experian_status: d.experian_status,
        transunion_status: d.transunion_status,
        has_conflict: d.has_conflict,
        severity: d.severity,
        recommended_action: d.recommended_action,
        discrepancy_type: d.discrepancy_type,
        success_probability: d.success_probability,
        amount: d.amount,
      }));

      const { error: discError } = await supabase
        .from("discrepancies")
        .insert(discrepancyRecords);

      if (discError) {
        console.error("Error inserting discrepancies:", discError);
      }
    }

    // Update report with results
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "completed",
        potential_score_increase: analysisResult.potential_score_increase || 0,
        total_discrepancies: discrepancies.filter((d: any) => d.has_conflict).length,
        total_letters: discrepancies.length,
        raw_analysis: analysisResult,
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating report:", updateError);
      throw new Error("Failed to save analysis results");
    }

    console.log("Analysis complete, returning results");

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        potential_score_increase: analysisResult.potential_score_increase,
        discrepancies_count: discrepancies.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("analyze-report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

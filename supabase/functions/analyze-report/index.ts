import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  reportId: string;
  texts: {
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
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { reportId, texts }: AnalysisRequest = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    await supabase
      .from("reports")
      .update({ status: "processing" })
      .eq("id", reportId)
      .eq("user_id", user.id);

    // Build bureau data from pre-extracted text (parsed client-side)
    const bureauData: string[] = [];
    
    if (texts.experian && !texts.experian.startsWith("[Error")) {
      console.log(`Received Experian text: ${texts.experian.length} chars`);
      bureauData.push(`EXPERIAN REPORT:\n${texts.experian}`);
    }
    if (texts.equifax && !texts.equifax.startsWith("[Error")) {
      console.log(`Received Equifax text: ${texts.equifax.length} chars`);
      bureauData.push(`EQUIFAX REPORT:\n${texts.equifax}`);
    }
    if (texts.transunion && !texts.transunion.startsWith("[Error")) {
      console.log(`Received TransUnion text: ${texts.transunion.length} chars`);
      bureauData.push(`TRANSUNION REPORT:\n${texts.transunion}`);
    }

    if (bureauData.length === 0) {
      throw new Error("No valid credit report data provided. Please ensure you're uploading readable PDF credit reports.");
    }

    console.log(`Processing ${bureauData.length} bureau report(s), total data length: ${bureauData.join("").length} chars`);

    const systemPrompt = `ROLE & EXPERTISE
You are an expert credit repair analyst with 15+ years of experience in FCRA compliance, Metro 2 data furnishing standards, and consumer credit law. You have successfully helped thousands of consumers improve their credit scores by identifying inaccurate, incomplete, and unverifiable information.

FCRA KNOWLEDGE BASE
- Section 605: Information must be removed after 7 years (10 years for bankruptcy, Chapter 7). Calculate from Date of First Delinquency (DOFD), not date opened or last activity.
- Section 609: Consumers have the right to request complete file disclosure including sources of information.
- Section 611: Credit bureaus must conduct a "reasonable investigation" within 30 days and remove unverifiable information.
- Section 623: Data furnishers must report accurate information and investigate disputes forwarded by bureaus.
- Section 605B: Enhanced protections for identity theft victims - fraudulent accounts must be blocked within 4 business days.

VIOLATION TYPES TO DETECT
1. RE-AGING: Date of First Delinquency (DOFD) has been changed to extend the 7-year reporting period. Look for accounts where the delinquency date doesn't match original records.
2. MIXED FILE: Accounts that may belong to someone with a similar name or SSN. Look for unfamiliar creditors, addresses, or employers.
3. DUPLICATE REPORTING: Same original debt reported by multiple collection agencies or the original creditor AND a collector.
4. BALANCE INFLATION: Current balance reported higher than original debt amount, especially with excessive fees or interest.
5. STATUS CONFLICT: Different payment status reported across bureaus for the same account (e.g., "Current" on one, "30 days late" on another).
6. OUTDATED INFORMATION: Negative items past the 7-year reporting limit that should have been automatically removed.
7. UNAUTHORIZED INQUIRIES: Hard credit pulls without permissible purpose under FCRA Section 604.
8. INCOMPLETE DATA: Missing required fields like date opened, credit limit, or payment history.

ACCOUNT MATCHING RULES
- Match accounts across bureaus by: partial account number, creditor name (accounting for abbreviations), balance range (within 10%), and account type.
- Flag as CONFLICT when the same account shows materially different information across bureaus.
- Note when an account appears on one bureau but not others - this could indicate reporting errors or mixed files.
- For collections, trace back to original creditor to identify duplicate reporting.

DISPUTE STRATEGY FRAMEWORK
PRIORITY 1 (High Impact - Address First):
- Late payments on otherwise perfect accounts (single 30-day late can drop score 50-100 points)
- Collections under $500 (excellent pay-for-delete candidates - creditors often accept 30-50% settlement)
- Accounts with clear FCRA violations (re-aging, outdated, duplicate)
- Any account with status conflicts between bureaus

PRIORITY 2 (Medium Impact):
- Hard inquiries over 6 months old (especially if unauthorized)
- Accounts with balance discrepancies over $100
- Charge-offs where the debt has been sold multiple times (harder to verify)

PRIORITY 3 (Lower Impact - Address Last):
- Minor date discrepancies (open date, last payment date)
- Address or employer variations
- Soft inquiries (no score impact but may indicate mixed file)

SUCCESS PROBABILITY FACTORS
- Age of account: Older negative items (5+ years) have higher removal rates (60-80%) due to documentation deterioration
- Debt sold multiple times: Each sale reduces documentation quality, increasing dispute success
- Small balances: Collectors often delete rather than spend resources verifying small debts
- Clear factual errors: Obvious mistakes (wrong name spelling, incorrect balance) have 80-95% success rates
- Status conflicts: When bureaus disagree, at least one is wrong - high success rate
- Original creditor still holding: Lower success rate (30-40%) as they have better records

OUTPUT REQUIREMENTS
CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown code blocks, no additional text before or after the JSON.
Analyze ALL accounts found in the reports. If the PDF text is limited, make reasonable inferences based on available data.

Response format:
{
  "potential_score_increase": number,
  "analysis_summary": "Brief summary of findings",
  "discrepancies": [
    {
      "account_name": "Creditor Name",
      "account_number_partial": "****1234 or null",
      "equifax_status": "status or null",
      "experian_status": "status or null", 
      "transunion_status": "status or null",
      "has_conflict": boolean,
      "violation_type": "re_aging|mixed_file|duplicate|balance_inflation|status_conflict|outdated|unauthorized_inquiry|incomplete|none",
      "fcra_section": "605|609|611|623|605B|604|null",
      "severity": "high|medium|low",
      "priority_rank": 1-3,
      "recommended_action": "Specific action to take",
      "discrepancy_type": "dispute|pay-for-delete|validation",
      "success_probability": number 1-100,
      "amount": number or null,
      "date_of_first_delinquency": "YYYY-MM-DD or null"
    }
  ]
}`;

    const userPrompt = `Analyze the following credit report data and identify all discrepancies and opportunities. Respond with JSON only:\n\n${bureauData.join("\n\n---\n\n")}`;

    console.log("Calling Lovable AI for credit analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
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

    let analysisResult;
    try {
      let jsonContent = content;
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

    const discrepancies = analysisResult.discrepancies || [];
    
    const safeValue = (val: any) => (val === null || val === undefined || val === "null" || val === "") ? null : val;
    const safeDateValue = (val: any) => {
      if (val === null || val === undefined || val === "null" || val === "") return null;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(val) ? val : null;
    };

    if (discrepancies.length > 0) {
      const discrepancyRecords = discrepancies.map((d: any) => ({
        report_id: reportId,
        user_id: user.id,
        account_name: d.account_name || "Unknown Account",
        account_number_partial: safeValue(d.account_number_partial),
        equifax_status: safeValue(d.equifax_status),
        experian_status: safeValue(d.experian_status),
        transunion_status: safeValue(d.transunion_status),
        has_conflict: d.has_conflict ?? false,
        violation_type: safeValue(d.violation_type),
        fcra_section: safeValue(d.fcra_section),
        severity: d.severity || "medium",
        priority_rank: typeof d.priority_rank === "number" ? d.priority_rank : null,
        recommended_action: safeValue(d.recommended_action),
        discrepancy_type: safeValue(d.discrepancy_type),
        success_probability: typeof d.success_probability === "number" ? d.success_probability : null,
        amount: typeof d.amount === "number" ? d.amount : null,
        date_of_first_delinquency: safeDateValue(d.date_of_first_delinquency),
      }));

      console.log("Inserting discrepancies:", JSON.stringify(discrepancyRecords, null, 2));

      const { error: discError } = await supabase
        .from("discrepancies")
        .insert(discrepancyRecords);

      if (discError) {
        console.error("Error inserting discrepancies:", discError);
      }
    }

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

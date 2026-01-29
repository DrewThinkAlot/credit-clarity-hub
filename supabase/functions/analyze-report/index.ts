import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  reportId: string;
  files: {
    experian?: string; // base64 encoded PDF
    equifax?: string;
    transunion?: string;
  };
}

// Simple text extraction from PDF using regex patterns for common credit report formats
function extractTextFromPDFBuffer(buffer: Uint8Array): string {
  // Convert buffer to string to extract readable text
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = decoder.decode(buffer);
  
  // Extract text between stream and endstream markers (PDF text streams)
  const streamMatches = text.match(/stream\s*([\s\S]*?)\s*endstream/g) || [];
  const extractedTexts: string[] = [];
  
  for (const match of streamMatches) {
    // Try to extract readable text from streams
    const content = match.replace(/stream\s*/, "").replace(/\s*endstream/, "");
    // Look for text within parentheses (common PDF text format) and extract
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    for (const textMatch of textMatches) {
      const cleanText = textMatch.slice(1, -1); // Remove parentheses
      if (cleanText.length > 1 && /[a-zA-Z0-9]/.test(cleanText)) {
        extractedTexts.push(cleanText);
      }
    }
  }
  
  // Also try to find literal strings in the PDF
  const literalMatches = text.match(/\/T\s*\(([^)]+)\)/g) || [];
  for (const match of literalMatches) {
    const cleanText = match.replace(/\/T\s*\(/, "").replace(/\)$/, "");
    if (cleanText.length > 1) {
      extractedTexts.push(cleanText);
    }
  }
  
  // Try BT...ET text blocks
  const btMatches = text.match(/BT\s*([\s\S]*?)\s*ET/g) || [];
  for (const match of btMatches) {
    const tjMatches = match.match(/\[([^\]]+)\]\s*TJ/g) || [];
    for (const tj of tjMatches) {
      const parts = tj.match(/\(([^)]+)\)/g) || [];
      for (const part of parts) {
        const cleanText = part.slice(1, -1);
        if (cleanText.length > 0 && /[a-zA-Z0-9]/.test(cleanText)) {
          extractedTexts.push(cleanText);
        }
      }
    }
  }
  
  // Combine extracted text
  let result = extractedTexts.join(" ").replace(/\s+/g, " ").trim();
  
  // If we couldn't extract much text, return a message indicating the PDF format
  if (result.length < 100) {
    // Try to extract any visible ASCII text from the buffer
    const asciiText = Array.from(buffer)
      .filter(b => (b >= 32 && b <= 126) || b === 10 || b === 13)
      .map(b => String.fromCharCode(b))
      .join("");
    
    // Look for account-related keywords and surrounding text
    const keywords = ["account", "balance", "payment", "collection", "experian", "equifax", "transunion", "credit", "inquiry", "late"];
    const lines = asciiText.split(/[\n\r]+/);
    const relevantLines: string[] = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(k => lowerLine.includes(k)) && line.trim().length > 5) {
        relevantLines.push(line.trim());
      }
    }
    
    if (relevantLines.length > 0) {
      result = relevantLines.join("\n");
    }
  }
  
  // Truncate to avoid token limits
  if (result.length > 15000) {
    result = result.substring(0, 15000) + "\n[... content truncated for analysis ...]";
  }
  
  return result;
}

async function extractTextFromBase64PDF(base64Data: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, "");
    
    // Decode base64 to Uint8Array
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Extract text from PDF buffer
    const text = extractTextFromPDFBuffer(bytes);
    
    if (text.length < 50) {
      console.log("Limited text extraction from PDF, file may be image-based or encrypted");
      return "[PDF content could not be fully extracted - file may be image-based or protected]";
    }
    
    return text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
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

    const { reportId, files }: AnalysisRequest = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Update report status to processing
    await supabase
      .from("reports")
      .update({ status: "processing" })
      .eq("id", reportId)
      .eq("user_id", user.id);

    // Parse PDFs server-side
    const fileContents: Record<string, string> = {};
    
    console.log("Parsing uploaded PDFs...");
    
    if (files.experian) {
      try {
        fileContents.experian = await extractTextFromBase64PDF(files.experian);
        console.log(`Parsed Experian PDF: ${fileContents.experian.length} chars`);
      } catch (e) {
        console.error("Failed to parse Experian PDF:", e);
        fileContents.experian = `[Error parsing PDF: ${e instanceof Error ? e.message : "Unknown error"}]`;
      }
    }
    
    if (files.equifax) {
      try {
        fileContents.equifax = await extractTextFromBase64PDF(files.equifax);
        console.log(`Parsed Equifax PDF: ${fileContents.equifax.length} chars`);
      } catch (e) {
        console.error("Failed to parse Equifax PDF:", e);
        fileContents.equifax = `[Error parsing PDF: ${e instanceof Error ? e.message : "Unknown error"}]`;
      }
    }
    
    if (files.transunion) {
      try {
        fileContents.transunion = await extractTextFromBase64PDF(files.transunion);
        console.log(`Parsed TransUnion PDF: ${fileContents.transunion.length} chars`);
      } catch (e) {
        console.error("Failed to parse TransUnion PDF:", e);
        fileContents.transunion = `[Error parsing PDF: ${e instanceof Error ? e.message : "Unknown error"}]`;
      }
    }

    // Build the prompt for credit report analysis
    const bureauData = [];
    if (fileContents.experian && !fileContents.experian.startsWith("[Error")) {
      bureauData.push(`EXPERIAN REPORT:\n${fileContents.experian}`);
    }
    if (fileContents.equifax && !fileContents.equifax.startsWith("[Error")) {
      bureauData.push(`EQUIFAX REPORT:\n${fileContents.equifax}`);
    }
    if (fileContents.transunion && !fileContents.transunion.startsWith("[Error")) {
      bureauData.push(`TRANSUNION REPORT:\n${fileContents.transunion}`);
    }

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

    if (bureauData.length === 0) {
      throw new Error("No valid credit report data could be extracted. Please ensure you're uploading readable PDF credit reports.");
    }

    console.log(`Processing ${bureauData.length} bureau report(s), total data length: ${bureauData.join("").length} chars`);

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
        account_number_partial: d.account_number_partial || null,
        equifax_status: d.equifax_status,
        experian_status: d.experian_status,
        transunion_status: d.transunion_status,
        has_conflict: d.has_conflict,
        violation_type: d.violation_type || null,
        fcra_section: d.fcra_section || null,
        severity: d.severity,
        priority_rank: d.priority_rank || null,
        recommended_action: d.recommended_action,
        discrepancy_type: d.discrepancy_type,
        success_probability: d.success_probability,
        amount: d.amount,
        date_of_first_delinquency: d.date_of_first_delinquency || null,
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

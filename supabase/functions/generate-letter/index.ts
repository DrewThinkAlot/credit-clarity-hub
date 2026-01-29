import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateLetterRequest {
  discrepancyId: string;
  reportId?: string;
  bureau: "experian" | "equifax" | "transunion";
  userInfo?: {
    name?: string;
    address?: string;
    ssn_last_four?: string;
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

    const { discrepancyId, reportId, bureau, userInfo }: GenerateLetterRequest = await req.json();

    if (!discrepancyId || !bureau) {
      throw new Error("Discrepancy ID and bureau are required");
    }

    // Get the discrepancy details
    const { data: discrepancy, error: discError } = await supabase
      .from("discrepancies")
      .select("*")
      .eq("id", discrepancyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (discError || !discrepancy) {
      throw new Error("Discrepancy not found");
    }

    const bureauAddresses: Record<string, string> = {
      experian: "Experian\nP.O. Box 4500\nAllen, TX 75013",
      equifax: "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374",
      transunion: "TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016",
    };

    const systemPrompt = `ROLE & EXPERTISE
You are a consumer rights attorney specializing in Fair Credit Reporting Act (FCRA) disputes with 20+ years of experience. You have successfully removed thousands of inaccurate items from consumer credit reports. Your letters are legally precise, professionally assertive, and highly effective.

LETTER TYPES & LEGAL STRATEGIES

TYPE 1: FCRA 611 STANDARD DISPUTE
Use for: Status conflicts, incorrect balances, wrong dates, general inaccuracies
Legal basis: "Under Section 611(a)(1)(A) of the Fair Credit Reporting Act, 15 U.S.C. § 1681i, you are required to conduct a reasonable investigation of this disputed information within 30 days."
Key elements:
- Specifically identify the inaccurate information
- State what is incorrect and why
- Demand deletion if not verifiable
- Request method of verification used

TYPE 2: FCRA 609 DISCLOSURE REQUEST
Use for: When you need documentation before disputing
Legal basis: "Under Section 609 of the FCRA, 15 U.S.C. § 1681g, I am entitled to a complete and accurate disclosure of all information in my consumer file."
Key elements:
- Request all furnisher information
- Ask for investigation procedures
- Demand complete account documentation

TYPE 3: DEBT VALIDATION (FDCPA 809)
Use for: Collection accounts, especially recently acquired
Legal basis: "Under Section 809(b) of the Fair Debt Collection Practices Act, 15 U.S.C. § 1692g, I am exercising my right to request validation of this alleged debt."
Key elements:
- Request original signed contract/agreement
- Demand complete chain of custody/assignment
- Ask for payment history from original creditor
- Request license to collect in consumer's state

TYPE 4: PAY-FOR-DELETE NEGOTIATION
Use for: Small collection accounts where deletion is goal
Approach: Settlement offer contingent on complete deletion
Key elements:
- Offer specific settlement amount (typically 30-50% of balance)
- Condition payment on written deletion agreement
- Request deletion within 30 days of payment
- Never admit the debt is valid

TYPE 5: FCRA 605 OBSOLETE DATA REMOVAL
Use for: Accounts past 7-year reporting period
Legal basis: "Under Section 605(a) of the FCRA, 15 U.S.C. § 1681c, this item has exceeded the maximum reporting period and must be immediately deleted."
Key elements:
- Calculate exact reporting period from DOFD
- Cite the 7-year rule (10 for bankruptcy)
- Demand immediate deletion
- Warn of statutory damages for non-compliance

REQUIRED LETTER COMPONENTS
1. HEADER: Consumer's full name, address, SSN last 4, DOB, current and previous addresses (past 2 years)
2. DATE: Current date prominently displayed
3. BUREAU ADDRESS: Correct dispute department address
4. RE LINE: Account name, account number (if known), specific dispute type
5. DISPUTE BODY: 
   - Clear identification of disputed item
   - Specific reason for dispute with facts
   - What is incorrect and what is accurate
   - FCRA section citation with quoted legal text
6. DEMAND: Specific remedy requested (deletion, correction, investigation)
7. DEADLINE: 30-day investigation requirement reminder
8. WARNING: FTC/CFPB complaint and statutory damages if ignored
9. ENCLOSURES: List recommended documents (ID, utility bill, dispute evidence)
10. SIGNATURE LINE: Space for signature and printed name

BUREAU MAILING ADDRESSES
Experian Dispute Department: P.O. Box 4500, Allen, TX 75013
Equifax Information Services LLC: P.O. Box 740256, Atlanta, GA 30374-0256
TransUnion Consumer Dispute Center: P.O. Box 2000, Chester, PA 19016

FORMATTING REQUIREMENTS
- Formal business letter format
- Professional but assertive tone
- Send via Certified Mail with Return Receipt Requested
- Keep copies of everything
- Single-spaced with double space between paragraphs
- Include "DISPUTE - DO NOT IGNORE" in subject line

Generate ONLY the complete letter content ready to print and mail. No commentary or instructions outside the letter.`;

    const userPrompt = `Generate a professional FCRA dispute letter with the following details:

BUREAU INFORMATION:
Target Bureau: ${bureau.toUpperCase()}
Bureau Address: ${bureauAddresses[bureau]}

DISPUTED ACCOUNT:
Account/Creditor Name: ${discrepancy.account_name}
Dispute Category: ${discrepancy.discrepancy_type === "dispute" ? "FCRA 611 Standard Dispute" : discrepancy.discrepancy_type === "validation" ? "Debt Validation (FDCPA 809)" : "Pay-for-Delete Negotiation"}
Recommended Strategy: ${discrepancy.recommended_action}

BUREAU REPORTING STATUS:
- Equifax reports: ${discrepancy.equifax_status || "Not reporting this account"}
- Experian reports: ${discrepancy.experian_status || "Not reporting this account"}
- TransUnion reports: ${discrepancy.transunion_status || "Not reporting this account"}

CONSUMER INFORMATION:
Full Name: ${userInfo?.name || "[CONSUMER FULL LEGAL NAME]"}
Mailing Address: ${userInfo?.address || "[CONSUMER CURRENT ADDRESS]"}
SSN (Last 4 digits): ${userInfo?.ssn_last_four || "[XXXX]"}

Generate a complete, ready-to-mail dispute letter to ${bureau.toUpperCase()} that:
1. Uses the appropriate dispute strategy based on the dispute category
2. Cites relevant FCRA sections with proper legal language
3. Clearly identifies the disputed information and why it's inaccurate
4. Demands appropriate action (investigation, correction, or deletion)
5. Includes the 30-day deadline and consequences for non-compliance
6. Lists recommended enclosures (copies of ID, proof of address, etc.)

The letter should be assertive, legally precise, and ready to print and mail via Certified Mail.`;

    console.log("Calling Lovable AI for letter generation...");

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
        temperature: 0.4,
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
      throw new Error(`Letter generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const letterContent = aiData.choices?.[0]?.message?.content;
    
    if (!letterContent) {
      throw new Error("No response from AI");
    }

    console.log("Letter generated, saving to database...");

    // Create the letter title
    const letterTitle = `${discrepancy.discrepancy_type === "dispute" ? "Dispute" : discrepancy.discrepancy_type === "validation" ? "Debt Validation Request" : "Pay for Delete Request"} - ${discrepancy.account_name}`;

    // Save the letter to the database
    const { data: letter, error: insertError } = await supabase
      .from("letters")
      .insert({
        report_id: reportId || discrepancy.report_id,
        discrepancy_id: discrepancyId,
        user_id: user.id,
        title: letterTitle,
        bureau,
        status: "draft",
        content: letterContent,
        account_name: discrepancy.account_name,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving letter:", insertError);
      throw new Error("Failed to save letter");
    }

    console.log("Letter saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        letter: {
          id: letter.id,
          title: letter.title,
          bureau: letter.bureau,
          content: letter.content,
          status: letter.status,
          created_at: letter.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-letter error:", error);
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

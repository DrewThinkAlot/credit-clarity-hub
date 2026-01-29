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

    const systemPrompt = `You are a professional credit repair specialist who writes effective FCRA dispute letters. Generate a formal, professional dispute letter that:

1. Follows FCRA guidelines and references relevant sections
2. Is assertive but professional
3. Clearly states the dispute and what action is requested
4. Includes all necessary identifying information
5. Requests investigation within 30 days per FCRA requirements

The letter should be ready to print and mail. Use formal business letter format with today's date.

Generate ONLY the letter content, no additional commentary.`;

    const userPrompt = `Generate a dispute letter for the following:

Bureau: ${bureau.toUpperCase()}
Bureau Address: ${bureauAddresses[bureau]}

Account: ${discrepancy.account_name}
Issue Type: ${discrepancy.discrepancy_type}
Recommended Action: ${discrepancy.recommended_action}

Bureau Status:
- Equifax: ${discrepancy.equifax_status || "Not Listed"}
- Experian: ${discrepancy.experian_status || "Not Listed"}
- TransUnion: ${discrepancy.transunion_status || "Not Listed"}

Consumer Information:
Name: ${userInfo?.name || "[YOUR FULL NAME]"}
Address: ${userInfo?.address || "[YOUR ADDRESS]"}
SSN Last 4: ${userInfo?.ssn_last_four || "[XXXX]"}

Generate a formal dispute letter addressing this issue to ${bureau}. The letter should request investigation and correction/removal of the inaccurate information.`;

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

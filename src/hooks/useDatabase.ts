import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Report, Discrepancy, Letter, UploadedFile, AnalysisResult, GenerateLetterResult, Profile } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parsePdfText } from "@/lib/pdf-parser";

// Reports hooks
export function useReports() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["reports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Report[];
    },
    enabled: !!user,
  });
}

export function useReport(reportId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!user || !reportId) return null;
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Report | null;
    },
    enabled: !!user && !!reportId,
  });
}

export function useLatestReport() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["latest-report", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Report | null;
    },
    enabled: !!user,
  });
}

// Discrepancies hooks
export function useDiscrepancies(reportId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["discrepancies", reportId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("discrepancies")
        .select("*")
        .eq("user_id", user.id)
        .order("severity", { ascending: false });
      
      if (reportId) {
        query = query.eq("report_id", reportId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Discrepancy[];
    },
    enabled: !!user,
  });
}

// Letters hooks
export function useLetters(reportId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["letters", reportId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("letters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (reportId) {
        query = query.eq("report_id", reportId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Letter[];
    },
    enabled: !!user,
  });
}

export function useLetter(letterId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["letter", letterId],
    queryFn: async () => {
      if (!user || !letterId) return null;
      
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .eq("id", letterId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Letter | null;
    },
    enabled: !!user && !!letterId,
  });
}

// Profile hooks
export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
}

// Mutations
export function useCreateReport() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (files: UploadedFile[]): Promise<AnalysisResult> => {
      if (!user || !session) {
        throw new Error("Not authenticated");
      }

      // Create a new report
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Upload files to storage and parse PDFs in parallel
      const validFiles = files.filter(f => f.bureau !== "unknown");
      
      // Parallel file uploads
      const uploadPromises = validFiles.map(async (uploadedFile) => {
        const filePath = `${user.id}/${report.id}/${uploadedFile.bureau}.pdf`;
        const { error } = await supabase.storage
          .from("credit-reports")
          .upload(filePath, uploadedFile.file);

        if (error) {
          console.error(`Upload error for ${uploadedFile.bureau}:`, error);
          return null;
        }
        return { bureau: uploadedFile.bureau, path: filePath };
      });

      // Parallel PDF parsing (client-side to avoid server timeouts)
      console.log("Parsing PDFs client-side...");
      const parsePromises = validFiles.map(async (uploadedFile) => {
        try {
          console.log(`Parsing ${uploadedFile.bureau} PDF...`);
          const text = await parsePdfText(uploadedFile.file);
          console.log(`Extracted ${text.length} chars from ${uploadedFile.bureau}`);
          return { bureau: uploadedFile.bureau, text };
        } catch (e) {
          console.error(`Error parsing ${uploadedFile.bureau} PDF:`, e);
          return { bureau: uploadedFile.bureau, text: `[Error parsing PDF: ${e instanceof Error ? e.message : "Unknown error"}]` };
        }
      });

      // Wait for both uploads and parsing to complete in parallel
      const [uploadResults, parseResults] = await Promise.all([
        Promise.all(uploadPromises),
        Promise.all(parsePromises),
      ]);

      // Construct filePaths and extractedTexts from results
      const filePaths: Record<string, string> = {};
      uploadResults.forEach(result => {
        if (result) filePaths[result.bureau] = result.path;
      });

      const extractedTexts: Record<string, string> = {};
      parseResults.forEach(result => {
        extractedTexts[result.bureau] = result.text;
      });

      // Update report with file paths

      // Call the analyze-report edge function with pre-extracted text
      const response = await supabase.functions.invoke("analyze-report", {
        body: {
          reportId: report.id,
          texts: extractedTexts,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Analysis failed");
      }

      return response.data as AnalysisResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["latest-report"] });
      queryClient.invalidateQueries({ queryKey: ["discrepancies"] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useGenerateLetter() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      discrepancyId,
      reportId,
      bureau,
      userInfo,
    }: {
      discrepancyId: string;
      reportId?: string;
      bureau: "experian" | "equifax" | "transunion";
      userInfo?: {
        name?: string;
        address?: string;
        ssn_last_four?: string;
      };
    }): Promise<GenerateLetterResult> => {
      if (!user || !session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("generate-letter", {
        body: {
          discrepancyId,
          reportId,
          bureau,
          userInfo,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Letter generation failed");
      }

      return response.data as GenerateLetterResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({
        title: "Letter Generated",
        description: `Your dispute letter "${data.letter?.title}" has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Letter Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLetterStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      letterId,
      status,
    }: {
      letterId: string;
      status: "draft" | "sent" | "response";
    }) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, any> = { status };
      
      // Auto-set sent_date and response_due_date when marking as sent
      if (status === "sent") {
        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + 30); // 30-day FCRA investigation period
        
        updateData.sent_date = now.toISOString();
        updateData.response_due_date = dueDate.toISOString();
      }

      const { error } = await supabase
        .from("letters")
        .update(updateData)
        .eq("id", letterId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({
        title: "Status Updated",
        description: "Letter status has been updated.",
      });
    },
  });
}

export function useUpdateLetterContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      letterId,
      content,
    }: {
      letterId: string;
      content: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("letters")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", letterId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({
        title: "Letter Saved",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
}

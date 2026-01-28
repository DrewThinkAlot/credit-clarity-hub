import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { ProcessingAnimation } from "@/components/upload/ProcessingAnimation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useCreateReport } from "@/hooks/useDatabase";
import { UploadedFile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

type UploadState = "upload" | "processing" | "complete";

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [state, setState] = useState<UploadState>("upload");
  const navigate = useNavigate();
  const { toast } = useToast();
  const createReport = useCreateReport();

  const handleAnalyze = async () => {
    setState("processing");
    
    try {
      const result = await createReport.mutateAsync(files);
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: `Found ${result.discrepancies_count} potential issues. Estimated score improvement: +${result.potential_score_increase} points.`,
        });
        setState("complete");
        // Navigate to dashboard after a brief delay
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      setState("upload");
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    }
  };

  const handleProcessingComplete = () => {
    // This is now handled by the mutation
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl mx-auto">
          {state === "upload" && (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Upload your <span className="gradient-text">3 Bureau Reports</span>
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Upload your credit reports from Experian, Equifax, and TransUnion. 
                  Our AI will analyze them for discrepancies and FCRA violations.
                </p>
              </div>

              {/* Dropzone */}
              <FileDropzone files={files} onFilesChange={setFiles} />

              {/* Analyze button */}
              <div className="mt-8">
                <Button
                  size="lg"
                  className="w-full py-6 text-lg font-medium glow-md disabled:opacity-50 disabled:glow-none"
                  disabled={files.length === 0 || createReport.isPending}
                  onClick={handleAnalyze}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {createReport.isPending ? "Analyzing..." : "Analyze My Credit"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                {files.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Upload at least one credit report to begin analysis
                  </p>
                )}
              </div>
            </div>
          )}

          {state === "processing" && (
            <ProcessingAnimation onComplete={handleProcessingComplete} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

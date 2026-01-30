import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Letter } from "@/types/database";
import { cn } from "@/lib/utils";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  FileSearch,
  X
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";

interface ResponseInterpreterProps {
  letter: Letter | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (letterId: string, resolutionStatus: string) => void;
}

type ProcessingState = "idle" | "uploading" | "processing" | "complete";
type DecisionType = "deleted" | "verified" | "investigating" | "unknown";

interface ProcessingResult {
  decision: DecisionType;
  confidence: number;
  summary: string;
  nextAction: string;
}

const decisionConfig: Record<DecisionType, { 
  label: string; 
  color: string; 
  icon: typeof CheckCircle2;
  isGoodNews: boolean;
}> = {
  deleted: {
    label: "Item Deleted",
    color: "bg-success/10 text-success border-success/30",
    icon: CheckCircle2,
    isGoodNews: true,
  },
  verified: {
    label: "Item Verified",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
    isGoodNews: false,
  },
  investigating: {
    label: "Under Investigation",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: AlertTriangle,
    isGoodNews: true,
  },
  unknown: {
    label: "Unable to Determine",
    color: "bg-muted text-muted-foreground border-border",
    icon: FileSearch,
    isGoodNews: false,
  },
};

export function ResponseInterpreter({ 
  letter, 
  open, 
  onClose,
  onStatusUpdate 
}: ResponseInterpreterProps) {
  const [state, setState] = useState<ProcessingState>("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setUploadedFile(acceptedFiles[0]);
        setState("uploading");
        
        // Simulate processing
        setTimeout(() => {
          setState("processing");
          
          // Mock AI analysis with random result
          setTimeout(() => {
            const decisions: DecisionType[] = ["deleted", "verified", "investigating"];
            const randomDecision = decisions[Math.floor(Math.random() * decisions.length)];
            
            const mockResults: Record<DecisionType, ProcessingResult> = {
              deleted: {
                decision: "deleted",
                confidence: 95,
                summary: "The bureau has confirmed that the disputed item has been removed from your credit report. This is a successful outcome!",
                nextAction: "Verify the deletion on your next credit report pull. If the item reappears, we can escalate.",
              },
              verified: {
                decision: "verified",
                confidence: 88,
                summary: "The bureau has verified the accuracy of this account with the creditor. The item will remain on your report.",
                nextAction: "Request the Method of Verification (MOV) to see exactly how they verified this information.",
              },
              investigating: {
                decision: "investigating",
                confidence: 72,
                summary: "The bureau is still investigating your dispute. They should respond within 30 days from the original dispute date.",
                nextAction: "Wait for the final determination. If no response after 30 days, file a CFPB complaint.",
              },
              unknown: {
                decision: "unknown",
                confidence: 45,
                summary: "We couldn't clearly determine the outcome from this letter. Please review manually.",
                nextAction: "Contact the bureau directly for clarification on your dispute status.",
              },
            };
            
            setResult(mockResults[randomDecision]);
            setState("complete");
          }, 2000);
        }, 1000);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 1,
  });

  const handleGenerateNextLetter = () => {
    toast({
      title: "Generating Method of Verification Letter",
      description: "Creating a follow-up letter to request verification details...",
    });
    onClose();
  };

  const handleMarkComplete = () => {
    if (letter && result) {
      onStatusUpdate(letter.id, result.decision);
      toast({
        title: "Status Updated",
        description: `Letter marked as ${result.decision}.`,
      });
      onClose();
    }
  };

  const resetState = () => {
    setState("idle");
    setUploadedFile(null);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!letter) return null;

  const config = result ? decisionConfig[result.decision] : null;
  const DecisionIcon = config?.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Response Interpreter
          </DialogTitle>
          <DialogDescription>
            Upload the bureau's response letter to analyze the outcome
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Letter context */}
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Analyzing response for:</p>
              <p className="font-medium">{letter.title}</p>
              <p className="text-sm text-muted-foreground">{letter.account_name}</p>
            </CardContent>
          </Card>

          {/* Upload / Processing states */}
          {state === "idle" && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the response letter here..." : "Upload Bureau Response"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF or Image of the bureau's letter
              </p>
            </div>
          )}

          {state === "uploading" && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
              <p className="font-medium">Uploading...</p>
              <p className="text-sm text-muted-foreground">{uploadedFile?.name}</p>
            </div>
          )}

          {state === "processing" && (
            <div className="text-center py-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <FileSearch className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="font-medium">Analyzing Response...</p>
              <p className="text-sm text-muted-foreground">
                AI is reading the bureau's letter
              </p>
            </div>
          )}

          {state === "complete" && result && config && (
            <div className="space-y-4">
              {/* Decision Card */}
              <Card className={cn("border-2", config.color)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      config.isGoodNews ? "bg-success/20" : "bg-destructive/20"
                    )}>
                      <DecisionIcon className={cn(
                        "w-6 h-6",
                        config.isGoodNews ? "text-success" : "text-destructive"
                      )} />
                    </div>
                    <div>
                      <Badge className={config.color}>
                        {config.isGoodNews ? "✓ Good News" : "✗ Bad News"}
                      </Badge>
                      <CardTitle className="text-lg mt-1">{config.label}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{result.summary}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence:</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span>{result.confidence}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Next Action */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Recommended Next Step
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {result.nextAction}
                  </p>
                  
                  {result.decision === "verified" && (
                    <Button 
                      className="w-full"
                      onClick={handleGenerateNextLetter}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Draft Method of Verification Letter
                    </Button>
                  )}
                  
                  {result.decision === "deleted" && (
                    <Button 
                      className="w-full"
                      variant="secondary"
                      onClick={handleMarkComplete}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                  
                  {result.decision === "investigating" && (
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Set Reminder for Follow-up
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Reset option */}
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={resetState}
              >
                <X className="w-4 h-4 mr-2" />
                Upload Different Response
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

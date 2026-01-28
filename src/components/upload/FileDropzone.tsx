import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCheck, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UploadedFile } from "@/types/database";

// Bureau icons as simple components
const ExperianIcon = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
      <span className="text-blue-400 font-bold text-lg">E</span>
    </div>
    <span className="text-xs text-muted-foreground">Experian</span>
  </div>
);

const EquifaxIcon = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
      <span className="text-red-400 font-bold text-lg">EQ</span>
    </div>
    <span className="text-xs text-muted-foreground">Equifax</span>
  </div>
);

const TransUnionIcon = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
      <span className="text-cyan-400 font-bold text-lg">TU</span>
    </div>
    <span className="text-xs text-muted-foreground">TransUnion</span>
  </div>
);

interface FileDropzoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

export function FileDropzone({ onFilesChange, files }: FileDropzoneProps) {
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);

  const detectBureau = (fileName: string): UploadedFile["bureau"] => {
    const lower = fileName.toLowerCase();
    if (lower.includes("experian")) return "experian";
    if (lower.includes("equifax")) return "equifax";
    if (lower.includes("transunion") || lower.includes("trans union")) return "transunion";
    return "unknown";
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: "Invalid file",
        description: "Please upload PDF files only (max 10MB each).",
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      bureau: detectBureau(file.name),
    }));

    // Prevent duplicates
    const existingNames = files.map((f) => f.file.name);
    const uniqueNewFiles = newFiles.filter((f) => !existingNames.includes(f.file.name));

    if (uniqueNewFiles.length < newFiles.length) {
      toast({
        title: "Duplicate file",
        description: "Some files were already added.",
      });
    }

    onFilesChange([...files, ...uniqueNewFiles]);
  }, [files, onFilesChange, toast]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const getBureauColor = (bureau: UploadedFile["bureau"]) => {
    switch (bureau) {
      case "experian": return "border-blue-500/30 bg-blue-500/5";
      case "equifax": return "border-red-500/30 bg-red-500/5";
      case "transunion": return "border-cyan-500/30 bg-cyan-500/5";
      default: return "border-border bg-secondary/30";
    }
  };

  const getBureauLabel = (bureau: UploadedFile["bureau"]) => {
    switch (bureau) {
      case "experian": return "Experian";
      case "equifax": return "Equifax";
      case "transunion": return "TransUnion";
      default: return "Credit Report";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-300 cursor-pointer group",
          isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.02]",
          isDragReject && "border-destructive bg-destructive/5",
          !isDragActive && !isDragReject && "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-6">
          {/* Upload icon */}
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragActive 
              ? "bg-primary/20 scale-110" 
              : "bg-secondary group-hover:bg-primary/10"
          )}>
            <Upload className={cn(
              "w-10 h-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {isDragActive ? "Drop your files here" : "Drag & drop your credit reports"}
            </p>
            <p className="text-muted-foreground text-sm">
              or <span className="text-primary hover:underline">browse files</span> • PDF only, max 10MB
            </p>
          </div>

          {/* Bureau icons */}
          <div className="flex items-center gap-6 pt-4">
            <ExperianIcon />
            <EquifaxIcon />
            <TransUnionIcon />
          </div>
        </div>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Uploaded Reports ({files.length})</p>
          <div className="grid gap-3">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all animate-fade-in",
                  getBureauColor(uploadedFile.bureau)
                )}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px] md:max-w-none">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getBureauLabel(uploadedFile.bureau)} • {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 text-primary" />
        <span>Your data is encrypted and secure</span>
      </div>
    </div>
  );
}

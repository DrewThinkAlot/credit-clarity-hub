import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUpdateLetterContent } from "@/hooks/useDatabase";
import { Letter } from "@/types/database";
import { 
  Save, 
  Copy, 
  Check, 
  Loader2, 
  RotateCcw, 
  FileText, 
  FolderOpen, 
  Eye,
  Upload,
  Shield,
  Scale,
  Heart,
  AlertCircle,
  X,
  FileCheck,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { jsPDF } from "jspdf";

interface PacketBuilderProps {
  letter: Letter;
  onClose?: () => void;
}

type ToneType = "polite" | "firm" | "legal";

interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

// Coaching checklist based on dispute type
const getCoachingChecklist = (disputeType: string) => {
  const baseItems = [
    { id: "id", label: "Government-issued ID (Driver's License or Passport)", required: true },
    { id: "utility", label: "Proof of Address (Utility Bill, dated within 60 days)", required: true },
  ];

  const typeSpecificItems: Record<string, { id: string; label: string; required: boolean }[]> = {
    collections: [
      { id: "validation", label: "Original Debt Validation Letter", required: false },
      { id: "payment", label: "Payment Records or Bank Statements", required: false },
    ],
    identity: [
      { id: "police", label: "Police Report (for identity theft)", required: true },
      { id: "affidavit", label: "FTC Identity Theft Affidavit", required: true },
    ],
    inaccurate: [
      { id: "statements", label: "Account Statements showing correct info", required: false },
      { id: "correspondence", label: "Correspondence with Creditor", required: false },
    ],
    late_payment: [
      { id: "payment_proof", label: "Proof of On-Time Payment", required: true },
      { id: "bank", label: "Bank Statement showing payment date", required: false },
    ],
  };

  return [...baseItems, ...(typeSpecificItems[disputeType] || typeSpecificItems.inaccurate)];
};

export function PacketBuilder({ letter, onClose }: PacketBuilderProps) {
  const [content, setContent] = useState(letter.content);
  const [tone, setTone] = useState<ToneType>("firm");
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("letter");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const updateContent = useUpdateLetterContent();
  const { toast } = useToast();

  // Get dispute type from letter title or default
  const disputeType = letter.title.toLowerCase().includes("collection") ? "collections" 
    : letter.title.toLowerCase().includes("identity") ? "identity"
    : letter.title.toLowerCase().includes("late") ? "late_payment"
    : "inaccurate";

  const coachingChecklist = getCoachingChecklist(disputeType);

  useEffect(() => {
    setContent(letter.content);
    setHasChanges(false);
  }, [letter.content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== letter.content);
  };

  const handleToneChange = (newTone: ToneType) => {
    if (!newTone) return;
    setTone(newTone);
    // Apply tone adjustments to content
    let adjustedContent = content;
    
    if (newTone === "polite") {
      adjustedContent = content
        .replace(/demand/gi, "kindly request")
        .replace(/require/gi, "would appreciate")
        .replace(/must/gi, "should");
    } else if (newTone === "legal") {
      adjustedContent = content
        .replace(/please/gi, "pursuant to applicable law,")
        .replace(/would appreciate/gi, "hereby demand");
    }
    
    if (adjustedContent !== content) {
      setContent(adjustedContent);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    await updateContent.mutateAsync({
      letterId: letter.id,
      content,
    });
    setHasChanges(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Letter content has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setContent(letter.content);
    setHasChanges(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles: EvidenceFile[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        file,
      }));
      setEvidenceFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files Added",
        description: `${acceptedFiles.length} file(s) added to evidence locker.`,
      });
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  const removeEvidence = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
  };

  const toggleCheckItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const generateFinalPacket = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Cover Sheet
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129);
    doc.text("DISPUTE PACKET", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Credit Repair AI - Official Dispute Documentation", pageWidth / 2, 50, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Bureau: ${letter.bureau.charAt(0).toUpperCase() + letter.bureau.slice(1)}`, margin, 80);
    doc.text(`Account: ${letter.account_name || "N/A"}`, margin, 90);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 100);
    
    doc.setFontSize(12);
    doc.text("Contents:", margin, 120);
    doc.text("1. Dispute Letter", margin + 10, 130);
    doc.text(`2. Supporting Evidence (${evidenceFiles.length} files)`, margin + 10, 140);
    
    // Letter page
    doc.addPage();
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, maxWidth);
    let yPos = 20;
    
    lines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    const fileName = `dispute-packet-${letter.bureau}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "Packet Downloaded",
      description: "Your complete dispute packet has been saved.",
    });
  };

  const toneIcons = {
    polite: Heart,
    firm: Shield,
    legal: Scale,
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="letter" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          The Letter
        </TabsTrigger>
        <TabsTrigger value="evidence" className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Evidence Locker
          {evidenceFiles.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {evidenceFiles.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Final Preview
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: The Letter */}
      <TabsContent value="letter" className="space-y-4 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Choose your letter's tone</p>
            <ToggleGroup type="single" value={tone} onValueChange={(v) => v && handleToneChange(v as ToneType)}>
              {(["polite", "firm", "legal"] as ToneType[]).map((t) => {
                const Icon = toneIcons[t];
                return (
                  <ToggleGroupItem key={t} value={t} className="gap-2">
                    <Icon className="w-4 h-4" />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateContent.isPending}
            >
              {updateContent.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="min-h-[350px] font-mono text-sm bg-secondary/30"
          placeholder="Letter content..."
        />
        
        {hasChanges && (
          <p className="text-xs text-warning">You have unsaved changes</p>
        )}
      </TabsContent>

      {/* Tab 2: Evidence Locker */}
      <TabsContent value="evidence" className="space-y-4 mt-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Required Documents</CardTitle>
            <CardDescription>
              Check off documents as you gather them for your dispute packet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachingChecklist.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Checkbox
                  id={item.id}
                  checked={checkedItems.has(item.id)}
                  onCheckedChange={() => toggleCheckItem(item.id)}
                />
                <Label 
                  htmlFor={item.id} 
                  className={cn(
                    "text-sm cursor-pointer",
                    checkedItems.has(item.id) && "line-through text-muted-foreground"
                  )}
                >
                  {item.label}
                  {item.required && (
                    <Badge variant="outline" className="ml-2 text-xs border-destructive/30 text-destructive">
                      Required
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Dropzone */}
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
            {isDragActive ? "Drop files here..." : "Drag & drop evidence files"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, PNG, JPG • ID, Utility Bills, Statements
          </p>
        </div>

        {/* Uploaded files */}
        {evidenceFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploaded Evidence ({evidenceFiles.length})</p>
            {evidenceFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeEvidence(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab 3: Final Preview */}
      <TabsContent value="preview" className="space-y-4 mt-4">
        <Card className="glass-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className="mb-2">Cover Sheet Preview</Badge>
                <CardTitle>DISPUTE PACKET</CardTitle>
                <CardDescription>Credit Repair AI - Official Documentation</CardDescription>
              </div>
              <div className="text-right text-sm">
                <p><span className="text-muted-foreground">Bureau:</span> {letter.bureau.charAt(0).toUpperCase() + letter.bureau.slice(1)}</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Packet Contents:</p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Dispute Letter ({tone} tone)</li>
                  <li>Supporting Evidence ({evidenceFiles.length} files attached)</li>
                </ol>
              </div>

              {evidenceFiles.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <p className="text-sm text-warning">
                    No evidence files attached. Add documents in the Evidence Locker tab.
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">Letter Preview:</p>
                <div className="bg-secondary/30 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {content.substring(0, 500)}...
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full glow-sm" size="lg" onClick={generateFinalPacket}>
          <Download className="w-5 h-5 mr-2" />
          Download Complete Packet (PDF)
        </Button>
      </TabsContent>
    </Tabs>
  );
}

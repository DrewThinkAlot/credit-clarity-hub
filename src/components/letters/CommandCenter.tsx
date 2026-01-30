import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Letter } from "@/types/database";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle,
  LayoutGrid,
  Calendar,
  AlertTriangle,
  Edit,
  Download,
  Copy,
  Check,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface CommandCenterProps {
  letters: Letter[];
  onEditLetter: (letter: Letter) => void;
  onStatusChange: (letterId: string, status: "draft" | "sent" | "response") => void;
  onUploadResponse: (letter: Letter) => void;
}

type ViewMode = "kanban" | "timeline";

const statusColumns = [
  { id: "draft", label: "Draft", icon: Clock, color: "bg-muted" },
  { id: "ready", label: "Ready to Send", icon: FileText, color: "bg-warning/20" },
  { id: "sent", label: "Sent (30-Day Clock)", icon: Send, color: "bg-primary/20" },
  { id: "response", label: "Response Received", icon: CheckCircle, color: "bg-success/20" },
  { id: "closed", label: "Closed", icon: XCircle, color: "bg-secondary" },
];

const bureauColors: Record<string, string> = {
  experian: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  equifax: "bg-red-500/10 text-red-400 border-red-500/20",
  transunion: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export function CommandCenter({ 
  letters, 
  onEditLetter, 
  onStatusChange,
  onUploadResponse 
}: CommandCenterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  // Group letters by status
  const getLetterStatus = (letter: Letter): string => {
    if (letter.resolution_status === "deleted" || letter.resolution_status === "verified") {
      return "closed";
    }
    if (letter.status === "response") return "response";
    if (letter.status === "sent") return "sent";
    if (letter.status === "draft") {
      // Check if it's ready to send (has content)
      return letter.content && letter.content.length > 100 ? "ready" : "draft";
    }
    return "draft";
  };

  const lettersByStatus = statusColumns.reduce((acc, col) => {
    acc[col.id] = letters.filter(l => getLetterStatus(l) === col.id);
    return acc;
  }, {} as Record<string, Letter[]>);

  const getDaysInfo = (letter: Letter) => {
    if (!letter.sent_date) return null;
    const sentDate = new Date(letter.sent_date);
    const today = new Date();
    const daysSinceSent = differenceInDays(today, sentDate);
    const daysRemaining = 30 - daysSinceSent;
    const isOverdue = daysRemaining < 0;
    return { daysSinceSent, daysRemaining, isOverdue };
  };

  const handleCopy = async (letter: Letter) => {
    try {
      await navigator.clipboard.writeText(letter.content);
      setCopied(letter.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (letter: Letter) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(letter.content, maxWidth);
    let yPos = 20;
    
    lines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    
    const fileName = `${letter.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    doc.save(fileName);
  };

  const handleGenerateComplaint = (letter: Letter) => {
    toast({
      title: "Generating CFPB Complaint",
      description: "Preparing complaint for Consumer Financial Protection Bureau...",
    });
    // This would trigger a complaint generation flow
  };

  const renderLetterCard = (letter: Letter, showDaysClock = false) => {
    const daysInfo = getDaysInfo(letter);
    const isOverdue = daysInfo?.isOverdue;

    return (
      <Card 
        key={letter.id}
        className={cn(
          "glass-card transition-all hover:border-primary/30",
          isOverdue && "border-destructive/50 bg-destructive/5"
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="outline" className={bureauColors[letter.bureau]}>
                {letter.bureau.charAt(0).toUpperCase() + letter.bureau.slice(1)}
              </Badge>
              <h4 className="font-medium mt-2 text-sm line-clamp-2">{letter.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {letter.account_name}
              </p>
            </div>
          </div>

          {/* Days clock for sent letters */}
          {showDaysClock && daysInfo && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-sm",
              isOverdue ? "bg-destructive/10" : "bg-primary/10"
            )}>
              {isOverdue ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-destructive font-medium">
                    {Math.abs(daysInfo.daysRemaining)} days overdue!
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-primary">
                    {daysInfo.daysRemaining} days remaining
                  </span>
                </>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {format(new Date(letter.created_at), "MMM d, yyyy")}</p>
            {letter.sent_date && (
              <p>Sent: {format(new Date(letter.sent_date), "MMM d, yyyy")}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEditLetter(letter)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleCopy(letter)}
            >
              {copied === letter.id ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDownload(letter)}
            >
              <Download className="w-3 h-3" />
            </Button>
            
            {/* Special actions based on status */}
            {getLetterStatus(letter) === "sent" && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onUploadResponse(letter)}
                className="text-primary"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Response
              </Button>
            )}
            
            {isOverdue && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleGenerateComplaint(letter)}
                className="ml-auto"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                File Complaint
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Command Center</h2>
          <p className="text-sm text-muted-foreground">
            Track your disputes from draft to resolution
          </p>
        </div>
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="kanban">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="timeline">
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const StatusIcon = column.icon;
            const columnLetters = lettersByStatus[column.id] || [];
            const hasOverdue = column.id === "sent" && 
              columnLetters.some(l => getDaysInfo(l)?.isOverdue);

            return (
              <div key={column.id} className="min-w-[250px]">
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-t-lg",
                  column.color,
                  hasOverdue && "bg-destructive/20"
                )}>
                  <StatusIcon className={cn(
                    "w-4 h-4",
                    hasOverdue && "text-destructive"
                  )} />
                  <span className="font-medium text-sm">{column.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {columnLetters.length}
                  </Badge>
                </div>
                <div className="space-y-3 p-3 rounded-b-lg bg-secondary/20 min-h-[200px]">
                  {columnLetters.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No letters
                    </p>
                  ) : (
                    columnLetters.map(letter => 
                      renderLetterCard(letter, column.id === "sent")
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {letters
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((letter) => {
                const status = getLetterStatus(letter);
                const column = statusColumns.find(c => c.id === status);
                const StatusIcon = column?.icon || FileText;
                const daysInfo = getDaysInfo(letter);

                return (
                  <div key={letter.id} className="relative pl-12">
                    <div className={cn(
                      "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center",
                      column?.color || "bg-muted"
                    )}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={bureauColors[letter.bureau]}>
                                {letter.bureau}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {column?.label}
                              </Badge>
                              {daysInfo?.isOverdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                            </div>
                            <h4 className="font-medium mt-2">{letter.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {letter.account_name} • {format(new Date(letter.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onEditLetter(letter)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            {status === "sent" && (
                              <Button 
                                size="sm"
                                onClick={() => onUploadResponse(letter)}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Response
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

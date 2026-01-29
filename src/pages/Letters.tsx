import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Edit, 
  Clock, 
  CheckCircle, 
  Send, 
  Loader2,
  Calendar,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLetters, useUpdateLetterStatus, useProfile } from "@/hooks/useDatabase";
import { Letter } from "@/types/database";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LetterEditor } from "@/components/letters/LetterEditor";
import { format, differenceInDays } from "date-fns";

const bureauColors: Record<string, string> = {
  experian: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  equifax: "bg-red-500/10 text-red-400 border-red-500/20",
  transunion: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "bg-primary/10 text-primary" },
  response: { label: "Response Received", icon: CheckCircle, color: "bg-success/10 text-success" },
};

export default function Letters() {
  const { data: letters, isLoading } = useLetters();
  const { data: profile } = useProfile();
  const updateStatus = useUpdateLetterStatus();
  const { toast } = useToast();
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleDownload = (letter: Letter) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    
    doc.setFontSize(12);
    
    // Split content into lines that fit the page width
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
    
    toast({
      title: "Letter Downloaded",
      description: "Your dispute letter has been saved as PDF.",
    });
  };

  const handleCopy = async (letter: Letter) => {
    try {
      await navigator.clipboard.writeText(letter.content);
      setCopied(letter.id);
      toast({
        title: "Copied to Clipboard",
        description: "Letter content has been copied.",
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (letterId: string, newStatus: "draft" | "sent" | "response") => {
    await updateStatus.mutateAsync({ letterId, status: newStatus });
  };

  const getDaysRemaining = (letter: Letter) => {
    if (!letter.response_due_date) return null;
    const dueDate = new Date(letter.response_due_date);
    const today = new Date();
    const days = differenceInDays(dueDate, today);
    return days;
  };

  const draftCount = letters?.filter(l => l.status === "draft").length || 0;
  const sentCount = letters?.filter(l => l.status === "sent").length || 0;
  const responseCount = letters?.filter(l => l.status === "response").length || 0;

  // Check if profile is incomplete
  const profileIncomplete = !profile?.full_name || !profile?.address;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 lg:p-12 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Generated Letters</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated dispute letters ready to send
            </p>
          </div>
        </div>

        {/* Profile Warning */}
        {profileIncomplete && (
          <Card className="glass-card border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-amber-400">
                <strong>Tip:</strong> Complete your profile in Settings to have your name and address automatically filled in new letters.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftCount}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sentCount}</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{responseCount}</p>
                <p className="text-sm text-muted-foreground">Responses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Letters list */}
        {letters && letters.length > 0 ? (
          <div className="space-y-4">
            {letters.map((letter) => {
              const status = statusConfig[letter.status];
              const StatusIcon = status.icon;
              const daysRemaining = getDaysRemaining(letter);
              
              return (
                <Card key={letter.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{letter.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {letter.account_name} • Created {format(new Date(letter.created_at), "MMM d, yyyy")}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className={bureauColors[letter.bureau]}>
                              {letter.bureau.charAt(0).toUpperCase() + letter.bureau.slice(1)}
                            </Badge>
                            <Select
                              value={letter.status}
                              onValueChange={(value) => handleStatusChange(letter.id, value as "draft" | "sent" | "response")}
                            >
                              <SelectTrigger className={cn("w-auto h-7 gap-1 px-2", status.color)}>
                                <StatusIcon className="w-3 h-3" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="response">Response Received</SelectItem>
                              </SelectContent>
                            </Select>
                            {letter.status === "sent" && daysRemaining !== null && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "gap-1",
                                  daysRemaining <= 5 ? "border-amber-500/50 text-amber-400" : "border-muted"
                                )}
                              >
                                <Calendar className="w-3 h-3" />
                                {daysRemaining > 0 
                                  ? `${daysRemaining} days to respond`
                                  : daysRemaining === 0
                                  ? "Response due today"
                                  : `${Math.abs(daysRemaining)} days overdue`
                                }
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-16 md:ml-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(letter)}
                        >
                          {copied === letter.id ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-success" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingLetter(letter)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(letter)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Letters Yet</h3>
              <p className="text-muted-foreground">
                Generate dispute letters from your dashboard to see them here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Letter Editor Dialog */}
        <Dialog open={!!editingLetter} onOpenChange={() => setEditingLetter(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLetter?.title}</DialogTitle>
            </DialogHeader>
            {editingLetter && (
              <LetterEditor 
                letter={editingLetter} 
                onClose={() => setEditingLetter(null)}
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingLetter(null)}>
                Close
              </Button>
              <Button onClick={() => editingLetter && handleDownload(editingLetter)}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

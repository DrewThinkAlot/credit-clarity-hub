import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Clock, 
  CheckCircle, 
  Send, 
  Loader2,
} from "lucide-react";
import { useLetters, useUpdateLetterStatus, useProfile } from "@/hooks/useDatabase";
import { Letter } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PacketBuilder } from "@/components/letters/PacketBuilder";
import { CommandCenter } from "@/components/letters/CommandCenter";
import { ResponseInterpreter } from "@/components/letters/ResponseInterpreter";
import { jsPDF } from "jspdf";

export default function Letters() {
  const { data: letters, isLoading } = useLetters();
  const { data: profile } = useProfile();
  const updateStatus = useUpdateLetterStatus();
  const { toast } = useToast();
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [responseLetterTarget, setResponseLetterTarget] = useState<Letter | null>(null);

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

  const handleStatusChange = async (letterId: string, newStatus: "draft" | "sent" | "response") => {
    await updateStatus.mutateAsync({ letterId, status: newStatus });
  };

  const handleResolutionStatusUpdate = async (letterId: string, resolutionStatus: string) => {
    // This would update the resolution_status field
    // For now, just mark as response received
    await updateStatus.mutateAsync({ letterId, status: "response" });
    toast({
      title: "Status Updated",
      description: `Letter marked as ${resolutionStatus}.`,
    });
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
            <h1 className="text-2xl md:text-3xl font-bold">Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your dispute lifecycle
            </p>
          </div>
        </div>

        {/* Profile Warning */}
        {profileIncomplete && (
          <Card className="glass-card border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <p className="text-sm text-warning">
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

        {/* Command Center (Kanban/Timeline View) */}
        {letters && letters.length > 0 ? (
          <CommandCenter
            letters={letters}
            onEditLetter={setEditingLetter}
            onStatusChange={handleStatusChange}
            onUploadResponse={setResponseLetterTarget}
          />
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

        {/* Packet Builder Dialog (replaces simple LetterEditor) */}
        <Dialog open={!!editingLetter} onOpenChange={() => setEditingLetter(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLetter?.title}</DialogTitle>
            </DialogHeader>
            {editingLetter && (
              <PacketBuilder 
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
                Quick Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Response Interpreter Modal */}
        <ResponseInterpreter
          letter={responseLetterTarget}
          open={!!responseLetterTarget}
          onClose={() => setResponseLetterTarget(null)}
          onStatusUpdate={handleResolutionStatusUpdate}
        />
      </div>
    </MainLayout>
  );
}
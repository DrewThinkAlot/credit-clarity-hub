import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Clock, CheckCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Letter {
  id: string;
  title: string;
  bureau: "experian" | "equifax" | "transunion";
  status: "draft" | "sent" | "response";
  createdAt: string;
  accountName: string;
}

const MOCK_LETTERS: Letter[] = [
  {
    id: "1",
    title: "Dispute - Inaccurate Account Status",
    bureau: "experian",
    status: "draft",
    createdAt: "2024-01-15",
    accountName: "Atlas Credit Co",
  },
  {
    id: "2",
    title: "Balance Discrepancy Dispute",
    bureau: "transunion",
    status: "sent",
    createdAt: "2024-01-10",
    accountName: "Meridian Bank",
  },
  {
    id: "3",
    title: "Debt Validation Request",
    bureau: "equifax",
    status: "response",
    createdAt: "2024-01-05",
    accountName: "Credence Resource",
  },
];

const bureauColors = {
  experian: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  equifax: "bg-red-500/10 text-red-400 border-red-500/20",
  transunion: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "bg-primary/10 text-primary" },
  response: { label: "Response Received", icon: CheckCircle, color: "bg-success/10 text-success" },
};

export default function Letters() {
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
          <Button className="glow-sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate New Letter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
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
                <p className="text-2xl font-bold">1</p>
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
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Responses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Letters list */}
        <div className="space-y-4">
          {MOCK_LETTERS.map((letter) => {
            const status = statusConfig[letter.status];
            const StatusIcon = status.icon;
            
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
                          {letter.accountName} • Created {letter.createdAt}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={bureauColors[letter.bureau]}>
                            {letter.bureau.charAt(0).toUpperCase() + letter.bureau.slice(1)}
                          </Badge>
                          <Badge className={cn("gap-1", status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-16 md:ml-0">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

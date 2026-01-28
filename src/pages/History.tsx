import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, FileText, Eye, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  date: string;
  reportsAnalyzed: number;
  discrepanciesFound: number;
  potentialScoreIncrease: number;
  lettersGenerated: number;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    date: "January 15, 2024",
    reportsAnalyzed: 3,
    discrepanciesFound: 4,
    potentialScoreIncrease: 45,
    lettersGenerated: 5,
  },
  {
    id: "2",
    date: "December 28, 2023",
    reportsAnalyzed: 3,
    discrepanciesFound: 6,
    potentialScoreIncrease: 62,
    lettersGenerated: 7,
  },
  {
    id: "3",
    date: "November 15, 2023",
    reportsAnalyzed: 2,
    discrepanciesFound: 3,
    potentialScoreIncrease: 28,
    lettersGenerated: 4,
  },
];

export default function History() {
  return (
    <MainLayout>
      <div className="p-6 md:p-8 lg:p-12 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My History</h1>
          <p className="text-muted-foreground mt-1">
            Track your credit repair progress over time
          </p>
        </div>

        {/* Progress summary */}
        <Card className="glass-card border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score Improvement</p>
                  <p className="text-4xl font-bold gradient-text">+135 Points</p>
                  <p className="text-sm text-muted-foreground mt-1">Across 3 analyses</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">13</p>
                  <p className="text-xs text-muted-foreground">Discrepancies Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">16</p>
                  <p className="text-xs text-muted-foreground">Letters Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">Reports Analyzed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past Analyses</h2>
          {MOCK_HISTORY.map((item) => (
            <Card key={item.id} className="glass-card hover:border-primary/30 transition-colors group">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.date}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.reportsAnalyzed} reports analyzed
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{item.potentialScoreIncrease} pts
                        </Badge>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {item.discrepanciesFound} issues
                        </Badge>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                          <FileText className="w-3 h-3 mr-1" />
                          {item.lettersGenerated} letters
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="shrink-0 group-hover:border-primary group-hover:text-primary">
                    <Eye className="w-4 h-4 mr-2" />
                    View Report
                    <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

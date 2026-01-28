import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, FileText, Eye, ArrowUpRight, Loader2 } from "lucide-react";
import { useReports, useDiscrepancies, useLetters } from "@/hooks/useDatabase";
import { useNavigate } from "react-router-dom";

export default function History() {
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: allDiscrepancies } = useDiscrepancies();
  const { data: allLetters } = useLetters();
  const navigate = useNavigate();

  const completedReports = reports?.filter(r => r.status === "completed") || [];
  
  // Calculate totals
  const totalScoreImprovement = completedReports.reduce((sum, r) => sum + (r.potential_score_increase || 0), 0);
  const totalDiscrepancies = allDiscrepancies?.length || 0;
  const totalLetters = allLetters?.length || 0;
  const totalReports = completedReports.length;

  if (reportsLoading) {
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
                  <p className="text-sm text-muted-foreground">Total Score Improvement Potential</p>
                  <p className="text-4xl font-bold gradient-text">+{totalScoreImprovement} Points</p>
                  <p className="text-sm text-muted-foreground mt-1">Across {totalReports} analyses</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{totalDiscrepancies}</p>
                  <p className="text-xs text-muted-foreground">Discrepancies Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLetters}</p>
                  <p className="text-xs text-muted-foreground">Letters Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-xs text-muted-foreground">Reports Analyzed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past Analyses</h2>
          
          {completedReports.length > 0 ? (
            completedReports.map((report) => (
              <Card key={report.id} className="glass-card hover:border-primary/30 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {new Date(report.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {[
                            report.experian_file_path && "Experian",
                            report.equifax_file_path && "Equifax",
                            report.transunion_file_path && "TransUnion",
                          ].filter(Boolean).join(", ") || "Credit reports"} analyzed
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{report.potential_score_increase} pts
                          </Badge>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {report.total_discrepancies} issues
                          </Badge>
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                            <FileText className="w-3 h-3 mr-1" />
                            {report.total_letters} letters
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="shrink-0 group-hover:border-primary group-hover:text-primary"
                      onClick={() => navigate("/")}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                      <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No History Yet</h3>
                <p className="text-muted-foreground">
                  Upload and analyze your credit reports to start tracking your progress.
                </p>
                <Button className="mt-4" onClick={() => navigate("/upload")}>
                  Upload Reports
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

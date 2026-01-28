import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SummaryHeader } from "@/components/dashboard/SummaryHeader";
import { DiscrepancyMatrix } from "@/components/dashboard/DiscrepancyMatrix";
import { StrategyCards } from "@/components/dashboard/StrategyCards";
import { useToast } from "@/hooks/use-toast";
import { useLatestReport, useDiscrepancies, useGenerateLetter } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { jsPDF } from "jspdf";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: latestReport, isLoading: reportLoading } = useLatestReport();
  const { data: discrepancies, isLoading: discrepanciesLoading } = useDiscrepancies(latestReport?.id);
  const generateLetter = useGenerateLetter();

  const handleExportReport = () => {
    if (!latestReport || !discrepancies) {
      toast({
        title: "No Data",
        description: "No report data available to export.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text("Credit Repair AI", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Credit Analysis Report", pageWidth / 2, 30, { align: "center" });
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(latestReport.created_at).toLocaleDateString()}`, 20, 45);
    doc.text(`Potential Score Increase: +${latestReport.potential_score_increase} points`, 20, 55);
    doc.text(`Discrepancies Found: ${latestReport.total_discrepancies}`, 20, 65);
    doc.text(`Letters to Generate: ${latestReport.total_letters}`, 20, 75);
    
    // Discrepancies
    doc.setFontSize(14);
    doc.text("Discrepancies Found:", 20, 95);
    
    let yPos = 105;
    discrepancies.forEach((d, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${d.account_name}`, 25, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`   Equifax: ${d.equifax_status || "N/A"} | Experian: ${d.experian_status || "N/A"} | TransUnion: ${d.transunion_status || "N/A"}`, 25, yPos);
      yPos += 7;
      doc.text(`   Action: ${d.recommended_action || "Review required"}`, 25, yPos);
      yPos += 12;
    });
    
    doc.save(`credit-report-${new Date().toISOString().split("T")[0]}.pdf`);
    
    toast({
      title: "Report Exported",
      description: "Your credit analysis report has been downloaded.",
    });
  };

  const handleGenerateLetter = async (discrepancyId: string) => {
    const discrepancy = discrepancies?.find(d => d.id === discrepancyId);
    if (!discrepancy) return;

    // Determine which bureau to target based on the discrepancy
    let targetBureau: "experian" | "equifax" | "transunion" = "experian";
    
    if (discrepancy.experian_status && discrepancy.experian_status !== discrepancy.equifax_status) {
      targetBureau = "experian";
    } else if (discrepancy.equifax_status) {
      targetBureau = "equifax";
    } else if (discrepancy.transunion_status) {
      targetBureau = "transunion";
    }

    try {
      await generateLetter.mutateAsync({
        discrepancyId,
        reportId: latestReport?.id,
        bureau: targetBureau,
      });
      
      navigate("/letters");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = reportLoading || discrepanciesLoading;

  // Show empty state if no report
  if (!isLoading && !latestReport) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
          <Card className="glass-card max-w-md text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Reports Yet</h2>
              <p className="text-muted-foreground mb-6">
                Upload your credit reports to get started with your credit repair journey.
              </p>
              <Button onClick={() => navigate("/upload")} className="glow-sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Convert discrepancies to the format expected by components
  const formattedDiscrepancies = discrepancies?.map(d => ({
    id: d.id,
    accountName: d.account_name,
    equifaxStatus: d.equifax_status || "N/A",
    experianStatus: d.experian_status || "N/A",
    transUnionStatus: d.transunion_status || "N/A",
    hasConflict: d.has_conflict,
    recommendedAction: d.recommended_action || "Review required",
    severity: d.severity,
  })) || [];

  const formattedStrategies = discrepancies?.map(d => ({
    id: d.id,
    type: d.discrepancy_type || "dispute" as "dispute" | "pay-for-delete" | "validation",
    title: `${d.discrepancy_type === "dispute" ? "Dispute" : d.discrepancy_type === "validation" ? "Validate" : "Pay for Delete"} ${d.account_name}`,
    description: d.recommended_action || "Take action on this account",
    successProbability: d.success_probability || undefined,
    amount: d.amount ? Number(d.amount) : undefined,
    priority: d.severity,
    accountName: d.account_name,
  })) || [];

  return (
    <MainLayout>
      <div className="p-6 md:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto">
        {/* Summary Header */}
        <SummaryHeader 
          stats={{
            potentialScoreIncrease: latestReport?.potential_score_increase || 0,
            discrepanciesFound: latestReport?.total_discrepancies || 0,
            lettersToGenerate: latestReport?.total_letters || 0,
          }}
          onExportReport={handleExportReport} 
        />

        {/* Discrepancy Matrix */}
        <DiscrepancyMatrix discrepancies={formattedDiscrepancies} />

        {/* Strategy Cards */}
        <StrategyCards 
          strategies={formattedStrategies} 
          onGenerateLetter={handleGenerateLetter}
          isGenerating={generateLetter.isPending}
        />
      </div>
    </MainLayout>
  );
}

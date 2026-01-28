import { MainLayout } from "@/components/layout/MainLayout";
import { SummaryHeader } from "@/components/dashboard/SummaryHeader";
import { DiscrepancyMatrix } from "@/components/dashboard/DiscrepancyMatrix";
import { StrategyCards } from "@/components/dashboard/StrategyCards";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated. It will download shortly.",
    });
    // TODO: Implement actual PDF export in Phase 2
  };

  const handleGenerateLetter = (strategyId: string) => {
    toast({
      title: "Generating Letter",
      description: "AI is generating your dispute letter...",
    });
    // TODO: Navigate to letter generation in Phase 2
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto">
        {/* Summary Header */}
        <SummaryHeader onExportReport={handleExportReport} />

        {/* Discrepancy Matrix */}
        <DiscrepancyMatrix />

        {/* Strategy Cards */}
        <StrategyCards onGenerateLetter={handleGenerateLetter} />
      </div>
    </MainLayout>
  );
}

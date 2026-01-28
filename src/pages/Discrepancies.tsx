import { MainLayout } from "@/components/layout/MainLayout";
import { DiscrepancyMatrix } from "@/components/dashboard/DiscrepancyMatrix";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Filter, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDiscrepancies, useLatestReport } from "@/hooks/useDatabase";
import { useState } from "react";

export default function Discrepancies() {
  const { data: latestReport } = useLatestReport();
  const { data: discrepancies, isLoading } = useDiscrepancies(latestReport?.id);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDiscrepancies = discrepancies?.filter(d => 
    d.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeConflicts = filteredDiscrepancies.filter(d => d.has_conflict && !d.resolved).length;
  const pendingReview = filteredDiscrepancies.filter(d => d.severity === "medium").length;
  const resolved = filteredDiscrepancies.filter(d => d.resolved).length;

  // Convert to display format
  const formattedDiscrepancies = filteredDiscrepancies.map(d => ({
    id: d.id,
    accountName: d.account_name,
    equifaxStatus: d.equifax_status || "N/A",
    experianStatus: d.experian_status || "N/A",
    transUnionStatus: d.transunion_status || "N/A",
    hasConflict: d.has_conflict,
    recommendedAction: d.recommended_action || "Review required",
    severity: d.severity,
  }));

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
            <h1 className="text-2xl md:text-3xl font-bold">Discrepancy Center</h1>
            <p className="text-muted-foreground mt-1">
              All credit report discrepancies in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                className="pl-10 w-[200px] bg-secondary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-destructive/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{activeConflicts}</p>
                <p className="text-sm text-muted-foreground">Active Conflicts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-warning/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{pendingReview}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matrix */}
        {formattedDiscrepancies.length > 0 ? (
          <DiscrepancyMatrix discrepancies={formattedDiscrepancies} />
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Discrepancies Found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No accounts match your search. Try a different term."
                  : "Upload and analyze your credit reports to find discrepancies."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

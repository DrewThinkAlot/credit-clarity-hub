import { TrendingUp, AlertTriangle, FileText, Download, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SummaryStats {
  potentialScoreIncrease: number;
  discrepanciesFound: number;
  lettersToGenerate: number;
}

interface SummaryHeaderProps {
  stats?: SummaryStats;
  onExportReport?: () => void;
}

export function SummaryHeader({ stats, onExportReport }: SummaryHeaderProps) {
  // Show zeros if no stats provided
  const displayStats = stats ?? {
    potentialScoreIncrease: 0,
    discrepanciesFound: 0,
    lettersToGenerate: 0,
  };
  const statCards = [
    {
      label: "Score Potential",
      value: `+${displayStats.potentialScoreIncrease}`,
      suffix: "Points",
      icon: TrendingUp,
      color: "primary",
      description: "Estimated improvement",
    },
    {
      label: "Discrepancies",
      value: displayStats.discrepanciesFound,
      suffix: "Found",
      icon: AlertTriangle,
      color: "warning",
      description: "Cross-bureau conflicts",
    },
    {
      label: "Dispute Letters",
      value: displayStats.lettersToGenerate,
      suffix: "Ready",
      icon: FileText,
      color: "cyan",
      description: "AI-generated letters",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Analysis Complete</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Credit Score Potential:{" "}
            <span className="gradient-text">+{displayStats.potentialScoreIncrease} Points</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            We've analyzed your credit reports and identified opportunities to improve your score. 
            Review the discrepancies below and take action.
          </p>
        </div>
        <Button 
          className="shrink-0 glow-sm"
          onClick={onExportReport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="glass-card border-border/50 overflow-hidden group hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    stat.color === "primary" && "bg-primary/10",
                    stat.color === "warning" && "bg-warning/10",
                    stat.color === "cyan" && "bg-cyan-500/10"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      stat.color === "primary" && "text-primary",
                      stat.color === "warning" && "text-warning",
                      stat.color === "cyan" && "text-cyan-400"
                    )} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={cn(
                      "text-3xl font-bold",
                      stat.color === "primary" && "text-primary",
                      stat.color === "warning" && "text-warning",
                      stat.color === "cyan" && "text-cyan-400"
                    )}>
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground text-sm">{stat.suffix}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Target, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ActionItem {
  id: string;
  accountName: string;
  type: "dispute" | "pay-for-delete" | "validation";
  priority: "high" | "medium" | "low";
  impact: "High Impact" | "Quick Win" | "Complex";
  description: string;
  successProbability?: number;
  amount?: number;
  fcraSection?: string;
  violationType?: string;
}

interface ActionPlanProps {
  potentialScoreIncrease: number;
  items: ActionItem[];
  onGenerateLetter: (itemId: string) => void;
  isGenerating?: boolean;
}

const impactConfig = {
  "High Impact": {
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: Target,
  },
  "Quick Win": {
    color: "bg-warning/10 text-warning border-warning/30",
    icon: Zap,
  },
  "Complex": {
    color: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

export function ActionPlan({ 
  potentialScoreIncrease, 
  items, 
  onGenerateLetter,
  isGenerating 
}: ActionPlanProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Sort items by priority
  const sortedItems = [...items].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const topPriorityItem = sortedItems[0];

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getImpactFromPriority = (priority: string): "High Impact" | "Quick Win" | "Complex" => {
    if (priority === "high") return "High Impact";
    if (priority === "medium") return "Quick Win";
    return "Complex";
  };

  if (items.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">You're in Great Shape!</h3>
          <p className="text-muted-foreground">
            No discrepancies found in your credit reports. Keep monitoring!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with potential score increase */}
      <Card className="glass-card overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Your Path to</h2>
                  <span className="text-2xl font-bold text-primary">
                    +{potentialScoreIncrease} Points
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {sortedItems.length} actionable steps identified • Follow in order for best results
                </p>
              </div>
              
              {/* Big Start Button */}
              {topPriorityItem && (
                <Button 
                  size="lg"
                  className="glow-md animate-pulse-slow relative overflow-hidden group"
                  onClick={() => onGenerateLetter(topPriorityItem.id)}
                  disabled={isGenerating}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Start Step 1
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stepper/Roadmap */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {sortedItems.map((item, index) => {
            const impact = getImpactFromPriority(item.priority);
            const config = impactConfig[impact];
            const ImpactIcon = config.icon;
            const isExpanded = expandedItems.has(item.id);
            const isCompleted = completedItems.has(item.id);

            return (
              <div key={item.id} className="relative pl-14">
                {/* Step number circle */}
                <div 
                  className={cn(
                    "absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 z-10",
                    isCompleted 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : index === 0 
                        ? "bg-primary/20 text-primary border-primary animate-pulse-slow" 
                        : "bg-card text-muted-foreground border-border"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>

                <Card 
                  className={cn(
                    "glass-card transition-all duration-200",
                    index === 0 && "border-primary/50 glow-sm",
                    isCompleted && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div 
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className={config.color}>
                            <ImpactIcon className="w-3 h-3 mr-1" />
                            {impact}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.type === "dispute" ? "Dispute" : 
                             item.type === "pay-for-delete" ? "Pay for Delete" : "Validation"}
                          </Badge>
                          {item.successProbability && (
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {item.successProbability}% success
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{item.accountName}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        
                        {(item.fcraSection || item.violationType || item.amount) && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {item.fcraSection && (
                              <div>
                                <span className="text-muted-foreground">FCRA Section:</span>
                                <span className="ml-2 font-medium">{item.fcraSection}</span>
                              </div>
                            )}
                            {item.violationType && (
                              <div>
                                <span className="text-muted-foreground">Violation:</span>
                                <span className="ml-2 font-medium">{item.violationType}</span>
                              </div>
                            )}
                            {item.amount && (
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="ml-2 font-medium text-warning">${item.amount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGenerateLetter(item.id);
                            }}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            Build Dispute Packet
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

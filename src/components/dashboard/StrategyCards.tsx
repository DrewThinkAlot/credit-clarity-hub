import { FileText, DollarSign, Search, ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StrategyCard {
  id: string;
  type: "dispute" | "pay-for-delete" | "validation";
  title: string;
  description: string;
  successProbability?: number;
  amount?: number;
  priority: "high" | "medium" | "low";
  accountName?: string;
}

// Mock data for Phase 1
const MOCK_STRATEGIES: StrategyCard[] = [
  {
    id: "1",
    type: "dispute",
    title: "Dispute Atlas Account",
    description: "Inaccurate status reporting across bureaus. High likelihood of removal.",
    successProbability: 87,
    priority: "high",
    accountName: "Atlas Credit Co",
  },
  {
    id: "2",
    type: "dispute",
    title: "Dispute Balance Discrepancy",
    description: "TransUnion reporting $650 higher balance than other bureaus.",
    successProbability: 92,
    priority: "high",
    accountName: "Meridian Bank",
  },
  {
    id: "3",
    type: "pay-for-delete",
    title: "Pay for Delete Opportunity",
    description: "3 small collection accounts under $100. Negotiate removal upon payment.",
    amount: 287,
    priority: "medium",
  },
  {
    id: "4",
    type: "validation",
    title: "Request Debt Validation",
    description: "Collection account missing required documentation. Request proof of debt.",
    successProbability: 65,
    priority: "medium",
    accountName: "Credence Resource",
  },
  {
    id: "5",
    type: "dispute",
    title: "Dispute Late Payment",
    description: "Equifax showing 30-day late while others show current. Easy win.",
    successProbability: 94,
    priority: "high",
    accountName: "Pinnacle Lending",
  },
];

const typeConfig = {
  dispute: {
    icon: FileText,
    color: "primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    iconBg: "bg-primary/20",
    label: "Dispute",
  },
  "pay-for-delete": {
    icon: DollarSign,
    color: "warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    iconBg: "bg-warning/20",
    label: "Quick Win",
  },
  validation: {
    icon: Search,
    color: "cyan",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconBg: "bg-cyan-500/20",
    label: "Validation",
  },
};

interface StrategyCardsProps {
  strategies?: StrategyCard[];
  onGenerateLetter?: (strategyId: string) => void;
}

export function StrategyCards({ strategies = MOCK_STRATEGIES, onGenerateLetter }: StrategyCardsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Action Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated strategies to improve your credit score
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Zap className="w-3 h-3 mr-1" />
          {strategies.length} Actions
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => {
          const config = typeConfig[strategy.type];
          const Icon = config.icon;

          return (
            <Card
              key={strategy.id}
              className={cn(
                "glass-card border transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                config.borderColor
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    config.iconBg
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      strategy.type === "dispute" && "text-primary",
                      strategy.type === "pay-for-delete" && "text-warning",
                      strategy.type === "validation" && "text-cyan-400"
                    )} />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      strategy.priority === "high" && "border-destructive/50 text-destructive",
                      strategy.priority === "medium" && "border-warning/50 text-warning",
                      strategy.priority === "low" && "border-muted-foreground/50 text-muted-foreground"
                    )}
                  >
                    {strategy.priority} priority
                  </Badge>
                </div>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs mb-2">
                    {config.label}
                  </Badge>
                  <CardTitle className="text-base leading-tight">
                    {strategy.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {strategy.description}
                </p>

                {/* Success probability or amount */}
                {strategy.successProbability && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      <span className="text-primary font-semibold">{strategy.successProbability}%</span>
                      {" "}success probability
                    </span>
                  </div>
                )}

                {strategy.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-warning" />
                    <span className="text-sm">
                      Total: <span className="text-warning font-semibold">${strategy.amount}</span>
                    </span>
                  </div>
                )}

                {/* Action button */}
                <Button
                  className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground"
                  variant="secondary"
                  size="sm"
                  onClick={() => onGenerateLetter?.(strategy.id)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Letter
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

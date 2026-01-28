import { AlertTriangle, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Discrepancy {
  id: string;
  accountName: string;
  equifaxStatus: string;
  experianStatus: string;
  transUnionStatus: string;
  hasConflict: boolean;
  recommendedAction: string;
  severity: "high" | "medium" | "low";
}

// Mock data for Phase 1
const MOCK_DISCREPANCIES: Discrepancy[] = [
  {
    id: "1",
    accountName: "Atlas Credit Co",
    equifaxStatus: "Open",
    experianStatus: "Closed",
    transUnionStatus: "Open",
    hasConflict: true,
    recommendedAction: "Dispute inaccurate status",
    severity: "high",
  },
  {
    id: "2",
    accountName: "Meridian Bank",
    equifaxStatus: "$2,450",
    experianStatus: "$2,450",
    transUnionStatus: "$3,100",
    hasConflict: true,
    recommendedAction: "Dispute balance discrepancy",
    severity: "high",
  },
  {
    id: "3",
    accountName: "Credence Resource",
    equifaxStatus: "Collection",
    experianStatus: "Not Listed",
    transUnionStatus: "Collection",
    hasConflict: true,
    recommendedAction: "Request debt validation",
    severity: "medium",
  },
  {
    id: "4",
    accountName: "Pinnacle Lending",
    equifaxStatus: "30 Days Late",
    experianStatus: "Current",
    transUnionStatus: "Current",
    hasConflict: true,
    recommendedAction: "Dispute late payment",
    severity: "medium",
  },
  {
    id: "5",
    accountName: "National Auto",
    equifaxStatus: "Closed",
    experianStatus: "Closed",
    transUnionStatus: "Closed",
    hasConflict: false,
    recommendedAction: "No action needed",
    severity: "low",
  },
];

interface DiscrepancyMatrixProps {
  discrepancies?: Discrepancy[];
}

export function DiscrepancyMatrix({ discrepancies = MOCK_DISCREPANCIES }: DiscrepancyMatrixProps) {
  const StatusCell = ({ status, hasConflict }: { status: string; hasConflict: boolean }) => {
    const isNegative = status.toLowerCase().includes("late") || 
                       status.toLowerCase().includes("collection") ||
                       status === "Not Listed";
    
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
        hasConflict && isNegative && "bg-destructive/10 text-destructive",
        hasConflict && !isNegative && "bg-warning/10 text-warning",
        !hasConflict && "bg-primary/10 text-primary"
      )}>
        {status}
      </div>
    );
  };

  const SeverityBadge = ({ severity }: { severity: Discrepancy["severity"] }) => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "capitalize",
          severity === "high" && "border-destructive/50 text-destructive bg-destructive/5",
          severity === "medium" && "border-warning/50 text-warning bg-warning/5",
          severity === "low" && "border-primary/50 text-primary bg-primary/5"
        )}
      >
        {severity === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
        {severity}
      </Badge>
    );
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Discrepancy Matrix</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cross-bureau comparison of your credit accounts
            </p>
          </div>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            {discrepancies.filter(d => d.hasConflict).length} Conflicts Found
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground">Account</TableHead>
              <TableHead className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-xs">EQ</span>
                  </div>
                  <span className="text-xs">Equifax</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-xs">E</span>
                  </div>
                  <span className="text-xs">Experian</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-xs">TU</span>
                  </div>
                  <span className="text-xs">TransUnion</span>
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">Priority</TableHead>
              <TableHead className="text-muted-foreground">Recommended Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discrepancies.map((discrepancy) => (
              <TableRow 
                key={discrepancy.id} 
                className={cn(
                  "border-border transition-colors",
                  discrepancy.hasConflict && "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <TableCell className="font-medium">{discrepancy.accountName}</TableCell>
                <TableCell className="text-center">
                  <StatusCell status={discrepancy.equifaxStatus} hasConflict={discrepancy.hasConflict} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusCell status={discrepancy.experianStatus} hasConflict={discrepancy.hasConflict} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusCell status={discrepancy.transUnionStatus} hasConflict={discrepancy.hasConflict} />
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={discrepancy.severity} />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {discrepancy.recommendedAction}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const PROCESSING_STEPS = [
  { id: 1, label: "Parsing PDF Data", duration: 2000 },
  { id: 2, label: "Cross-referencing Bureaus", duration: 2500 },
  { id: 3, label: "Identifying FCRA Violations", duration: 2000 },
  { id: 4, label: "Generating Dispute Strategy", duration: 1500 },
];

interface ProcessingAnimationProps {
  onComplete: () => void;
}

export function ProcessingAnimation({ onComplete }: ProcessingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= PROCESSING_STEPS.length) {
      onComplete();
      return;
    }

    const step = PROCESSING_STEPS[currentStep];
    const interval = step.duration / 100;
    let localProgress = 0;

    const timer = setInterval(() => {
      localProgress += 1;
      setStepProgress(localProgress);
      
      // Update overall progress
      const overallProgress = ((currentStep * 100) + localProgress) / PROCESSING_STEPS.length;
      setProgress(overallProgress);

      if (localProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
          setStepProgress(0);
        }, 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 animate-fade-in">
      {/* Animated logo */}
      <div className="relative mb-12">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse-glow">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-primary/5 animate-ping" />
      </div>

      {/* Overall progress */}
      <div className="w-full max-w-md mb-8">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 w-full max-w-md">
        {PROCESSING_STEPS.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                isComplete && "bg-primary/10 border border-primary/20",
                isCurrent && "bg-secondary border border-border",
                isPending && "opacity-40"
              )}
            >
              {/* Status icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                isComplete && "bg-primary",
                isCurrent && "bg-secondary border-2 border-primary",
                isPending && "bg-muted"
              )}>
                {isComplete ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <span className="text-sm text-muted-foreground">{step.id}</span>
                )}
              </div>

              {/* Label and progress */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium transition-colors",
                  isComplete && "text-primary",
                  isCurrent && "text-foreground",
                  isPending && "text-muted-foreground"
                )}>
                  {step.label}
                  {isCurrent && <span className="text-primary">...</span>}
                </p>
                {isCurrent && (
                  <div className="mt-2">
                    <Progress value={stepProgress} className="h-1" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

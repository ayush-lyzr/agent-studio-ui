import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { EvaluationStep } from "../pages/WorldModelDetails";

interface EvaluationTabsProps {
  currentStep: number;
  steps: EvaluationStep[];
  onStepClick: (stepId: number) => void;
}

export const EvaluationTabs: React.FC<EvaluationTabsProps> = ({
  steps,
  onStepClick,
}) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex">
        {steps.map((step) => (
          <button
            key={step.id}
            disabled={step?.disabled}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 px-4 py-3",
              "text-sm font-medium transition-colors duration-200",
              step.status === "current"
                ? "border-blue-600 text-blue-600"
                : step.status === "completed"
                  ? "border-green-600 text-green-600 hover:text-green-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              step?.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {step.status === "completed" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                {step.id}
              </span>
            )}
            <span>{step.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

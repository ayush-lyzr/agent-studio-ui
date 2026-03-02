import React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Play } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Agent } from "../../agent-eval/types/agent";
import { MetricCategory } from "../hooks/useEvaluationMetrics";
import { cn } from "@/lib/utils";

interface MetricsSelectionStepProps {
  agent: Agent | null;
  categories: MetricCategory[];
  expandedCategories: Set<string>;
  getEnabledMetricsCount: () => number;
  toggleCategory: (categoryId: string) => void;
  toggleMetric: (categoryId: string, metricId: string) => void;
  toggleCategoryExpansion: (categoryId: string) => void;
  onRunEvaluation: () => void;
  selectedTestCasesCount: number;
}

export const MetricsSelectionStep: React.FC<MetricsSelectionStepProps> = ({
  agent,
  categories,
  expandedCategories,
  getEnabledMetricsCount,
  toggleCategory,
  toggleMetric,
  toggleCategoryExpansion,
  onRunEvaluation,
  selectedTestCasesCount,
}) => {
  console.log({ agent });
  return (
    <div className="space-y-6">
      {/* Step 2: Metrics Selection */}
      <div>
        <h2 className="text-lg font-semibold">Select Evaluation Metrics</h2>
        <p className="text-sm text-muted-foreground">
          Choose the metrics to evaluate your agent's performance
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">Agent: {agent?.name}</p>
          <p className="text-sm text-muted-foreground">
            {getEnabledMetricsCount()} metrics selected across{" "}
            {categories.filter((c) => c.enabled).length} modules
          </p>
        </div>

        {/* Run Evaluation Button */}
        <div className="flex justify-end gap-2">
          <Badge variant="secondary">
            {categories.length} categories available
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onRunEvaluation}
                    disabled={
                      getEnabledMetricsCount() === 0 ||
                      selectedTestCasesCount === 0
                    }
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Run Evaluation
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select Simulation to configure & run the cases</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-lg border">
            <Collapsible
              open={expandedCategories.has(category.id) ?? false}
              onOpenChange={() => {
                if (category?.disabled) {
                  return;
                }

                toggleCategoryExpansion(category.id);
              }}
            >
              <CollapsibleTrigger
                asChild
                className={cn(category?.disabled && "opacity-50")}
              >
                <div className="flex cursor-pointer items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.name}</h3>
                        {category.moduleType && (
                          <Badge variant="outline" className="text-xs">
                            {category.moduleType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.enabled ? "default" : "secondary"}>
                      {category.metrics.filter((m) => m.enabled).length}/
                      {category.metrics.length} enabled
                    </Badge>
                    <Switch
                      checked={category.enabled}
                      onCheckedChange={() => {
                        if (category?.disabled) return;
                        toggleCategory(category.id);

                        if (!expandedCategories.has(category.id)) {
                          toggleCategoryExpansion(category.id);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Separator />
                <div className="space-y-3 p-4">
                  {category.metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{metric.name}</Label>
                          {metric.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                      <Switch
                        checked={metric.enabled}
                        onCheckedChange={() =>
                          toggleMetric(category.id, metric.id)
                        }
                        disabled={!category.enabled || metric.required}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>
    </div>
  );
};

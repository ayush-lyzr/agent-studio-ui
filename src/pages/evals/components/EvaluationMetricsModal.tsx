import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/custom/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Settings, Play } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { IAgent } from "@/lib/types";
import { Agent } from "../../agent-eval/types/agent";
import { Input } from "@/components/ui/input";

interface EvaluationMetric {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required?: boolean;
}

interface MetricCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metrics: EvaluationMetric[];
  moduleType?: string;
}

interface EvaluationMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEvaluation: (selectedMetrics: string[], runName: string) => void;
  agent: IAgent | Agent;
}

const EvaluationMetricsModal: React.FC<EvaluationMetricsModalProps> = ({
  isOpen,
  onClose,
  onStartEvaluation,
  agent,
}) => {
  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [runName, setRunName] = useState("");

  // Base metrics that are always available
  const baseMetrics: MetricCategory = {
    id: "base",
    name: "Agent Metrics",
    description: "Core evaluation metrics for all agents",
    enabled: true,
    metrics: [
      {
        id: "task_completion",
        name: "Task Completions",
        description: "Measures how well the agent completes assigned tasks",
        enabled: true,
        required: true,
      },
      {
        id: "hallucinations",
        name: "Hallucinations",
        description: "Detects when agent generates false information",
        enabled: true,
        required: true,
      },
      {
        id: "bias",
        name: "Bias",
        description: "Evaluates potential biases in agent responses",
        enabled: true,
      },
      {
        id: "toxicity",
        name: "Toxicity",
        description: "Measures harmful or inappropriate content",
        enabled: true,
      },
    ],
  };

  // Tool module metrics
  const toolMetrics: MetricCategory = {
    id: "tools",
    name: "Tool Module Metrics",
    description: "Metrics for agents with tool capabilities",
    enabled: false,
    moduleType: "tools",
    metrics: [
      {
        id: "tool_correctness",
        name: "Tool Correctness",
        description: "Evaluates if the right tools are selected",
        enabled: true,
      },
      {
        id: "argument_correctness",
        name: "Argument Correctness",
        description: "Checks if tool arguments are correct",
        enabled: true,
      },
    ],
  };

  // Knowledge module metrics
  const knowledgeMetrics: MetricCategory = {
    id: "knowledge",
    name: "Knowledge Module Metrics",
    description: "Metrics for agents with knowledge base/RAG capabilities",
    enabled: false,
    moduleType: "KNOWLEDGE_BASE",
    metrics: [
      {
        id: "contextual_relevancy",
        name: "Contextual Relevancy",
        description: "Measures relevance of retrieved context",
        enabled: true,
      },
      {
        id: "answer_relevancy",
        name: "Answer Relevancy",
        description: "Evaluates how relevant answers are to questions",
        enabled: true,
      },
      {
        id: "knowledge_retention",
        name: "Knowledge Retention",
        description: "Tests retention of knowledge across conversations",
        enabled: true,
      },
    ],
  };

  // Initialize metrics based on agent features
  useEffect(() => {
    const initialCategories = [baseMetrics];

    // Check if agent has tools
    const agentTools = (agent as any).tools || (agent as any).tool || [];
    const hasTools = agentTools && agentTools.length > 0;
    if (hasTools) {
      initialCategories.push({ ...toolMetrics, enabled: true });
    } else {
      initialCategories.push(toolMetrics);
    }

    // Check if agent has knowledge base feature
    const agentFeatures = (agent as any).features || [];
    const hasKnowledgeBase = agentFeatures.some(
      (feature: any) => feature.type === "KNOWLEDGE_BASE",
    );
    if (hasKnowledgeBase) {
      initialCategories.push({ ...knowledgeMetrics, enabled: true });
    } else {
      initialCategories.push(knowledgeMetrics);
    }

    // Auto-enable reflection metric if agent has REFLECTION feature
    const hasReflection = agentFeatures.some(
      (feature: any) => feature.type === "REFLECTION",
    );
    if (hasReflection) {
      initialCategories[0].metrics = initialCategories[0].metrics.map(
        (metric) =>
          metric.id === "reflection" ? { ...metric, enabled: true } : metric,
      );
    }

    // Auto-enable LLM-as-judge if agent has UQLM_LLM_JUDGE feature
    const hasLLMJudge = agentFeatures.some(
      (feature: any) => feature.type === "UQLM_LLM_JUDGE",
    );
    if (hasLLMJudge) {
      initialCategories[0].metrics = initialCategories[0].metrics.map(
        (metric) =>
          metric.id === "llm_as_judge" ? { ...metric, enabled: true } : metric,
      );
    }

    setCategories(initialCategories);

    // Keep all modules closed by default
    setExpandedCategories(new Set());
  }, [agent]);

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              enabled: !category.enabled,
              metrics: category.metrics.map((metric) => ({
                ...metric,
                enabled:
                  !category.enabled && !metric.required
                    ? false
                    : metric.enabled,
              })),
            }
          : category,
      ),
    );
  };

  const toggleMetric = (categoryId: string, metricId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              metrics: category.metrics.map((metric) =>
                metric.id === metricId && !metric.required
                  ? { ...metric, enabled: !metric.enabled }
                  : metric,
              ),
            }
          : category,
      ),
    );
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getSelectedMetrics = () => {
    const selected: string[] = [];
    categories.forEach((category) => {
      if (category.enabled) {
        category.metrics.forEach((metric) => {
          if (metric.enabled) {
            selected.push(metric.id);
          }
        });
      }
    });
    return selected;
  };

  const handleStartEvaluation = () => {
    const selectedMetrics = getSelectedMetrics();
    const finalRunName =
      runName.trim() || `Evaluation ${new Date().toLocaleDateString()}`;
    onStartEvaluation(selectedMetrics, finalRunName);
    onClose();
  };

  const getEnabledMetricsCount = () => {
    return categories.reduce((total, category) => {
      if (!category.enabled) return total;
      return total + category.metrics.filter((metric) => metric.enabled).length;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Evaluation Metrics
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select the metrics to evaluate your agent performance. Metrics are
            automatically enabled based on your agent's features.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div>
              <p className="font-medium">Agent: {agent.name}</p>
              <p className="text-sm text-muted-foreground">
                {getEnabledMetricsCount()} metrics selected across{" "}
                {categories.filter((c) => c.enabled).length} modules
              </p>
            </div>
            <Badge variant="secondary">
              {((agent as any).features || []).length || 0} features enabled
            </Badge>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border">
                <Collapsible
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategoryExpansion(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50">
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
                        <Badge
                          variant={category.enabled ? "default" : "secondary"}
                        >
                          {category.metrics.filter((m) => m.enabled).length}/
                          {category.metrics.length} enabled
                        </Badge>
                        <Switch
                          checked={category.enabled}
                          onCheckedChange={() => toggleCategory(category.id)}
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
                              <Label className="font-medium">
                                {metric.name}
                              </Label>
                              {metric.required && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
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

        {/* Run Name Input */}
        <div className="space-y-2">
          <Label htmlFor="runName">Run Name (Optional)</Label>
          <Input
            id="runName"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            placeholder={`Evaluation ${new Date().toLocaleDateString()}`}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Give this evaluation run a name to easily identify it later
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStartEvaluation}
            disabled={getEnabledMetricsCount() === 0}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Evaluation ({getEnabledMetricsCount()} metrics)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationMetricsModal;

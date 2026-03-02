import { useState, useEffect } from "react";
import { Agent } from "../../agent-eval/types/agent";

export interface EvaluationMetric {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required?: boolean;
}

export interface MetricCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  metrics: EvaluationMetric[];
  moduleType?: string;
}

export const useEvaluationMetrics = (agent: Agent | null) => {
  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Initialize metrics based on agent features
  useEffect(() => {
    if (!agent) return;

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
      ],
    };

    // Tool module metrics
    const toolMetrics: MetricCategory = {
      id: "tools",
      name: "Tool Module Metrics",
      description: "Metrics for agents with tool capabilities",
      enabled: false,
      disabled: !Boolean(agent?.tool_configs?.length),
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
      disabled: !Boolean(
        agent?.features?.map((f) => f?.type)?.includes("KNOWLEDGE_BASE"),
      ),
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

    const initialCategories = [baseMetrics];

    // Check if agent has tools (simplified check since we don't have all IAgent properties)
    // This is a placeholder - you might need to adjust based on actual agent data structure
    initialCategories.push(toolMetrics);
    initialCategories.push(knowledgeMetrics);

    setCategories(initialCategories);
    setExpandedCategories(new Set());
  }, [agent]);

  // Helper: Check if at least one metric is enabled
  const isAnyMetricEnabled = (metrics: EvaluationMetric[]) =>
    metrics.some((m) => m.enabled);

  // Helper: Enable only the first non-required metric, disable all others
  const enableFirstMetricOnly = (metrics: EvaluationMetric[]) =>
    metrics.map((metric, index) => ({
      ...metric,
      enabled: metric.required || index === 0,
    }));

  // Helper: Disable all non-required metrics
  const disableAllMetrics = (metrics: EvaluationMetric[]) =>
    metrics.map((metric) => ({
      ...metric,
      enabled: metric.required ? metric.enabled : false,
    }));

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        const isCurrentlyEnabled = category.enabled;

        // Determine new state based on current state
        let newMetrics: EvaluationMetric[];
        let newEnabled: boolean;

        if (isCurrentlyEnabled) {
          // Category is enabled → disable it and all metrics
          newMetrics = disableAllMetrics(category.metrics);
          newEnabled = false;
        } else {
          // Category is disabled → enable it and only first metric
          newMetrics = enableFirstMetricOnly(category.metrics);
          newEnabled = true;
        }

        return {
          ...category,
          enabled: newEnabled,
          metrics: newMetrics,
        };
      }),
    );
  };

  const toggleMetric = (categoryId: string, metricId: string) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        // Toggle the specific metric
        const updatedMetrics = category.metrics.map((metric) =>
          metric.id === metricId && !metric.required
            ? { ...metric, enabled: !metric.enabled }
            : metric,
        );

        // Category is enabled if at least one metric is enabled
        const newEnabled = isAnyMetricEnabled(updatedMetrics);

        return {
          ...category,
          metrics: updatedMetrics,
          enabled: newEnabled,
        };
      }),
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

  const getEnabledMetricsCount = () => {
    return categories.reduce((total, category) => {
      if (!category.enabled) return total;
      return total + category.metrics.filter((metric) => metric.enabled).length;
    }, 0);
  };

  return {
    categories,
    expandedCategories,
    toggleCategory,
    toggleMetric,
    toggleCategoryExpansion,
    getSelectedMetrics,
    getEnabledMetricsCount,
  };
};

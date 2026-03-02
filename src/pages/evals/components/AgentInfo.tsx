import React from "react";
import { Agent } from "../../agent-eval/types/agent";
import { Users, Sparkles } from "lucide-react";

interface AgentInfoProps {
  agent: Agent;
}

// Map feature types to display names - only show Memory and Knowledge Base
const getFeatureDisplayName = (feature: any): string | null => {
  if (typeof feature === "string") {
    return null; // Filter out string features
  }

  const featureType = feature.type || feature.name;

  // Only show Memory and Knowledge Base
  const featureTypeMap: Record<string, string> = {
    MEMORY: "Memory",
    KNOWLEDGE_BASE: "Knowledge Base",
    RAG: "Knowledge Base",
  };

  return featureTypeMap[featureType] || null;
};

export const AgentInfo: React.FC<AgentInfoProps> = ({ agent }) => {
  const hasFeatures = agent.features && agent.features.length > 0;
  const hasManagedAgents =
    agent.managed_agents && agent.managed_agents.length > 0;

  // Collect all items to display as horizontal tiles
  const allItems: {
    type: "feature" | "tool" | "agent";
    name: string;
    icon: any;
    color: string;
  }[] = [];

  // Do not show tools

  if (hasFeatures) {
    agent.features.forEach((feature: any) => {
      const displayName = getFeatureDisplayName(feature);
      if (displayName) {
        allItems.push({
          type: "feature",
          name: displayName,
          icon: Sparkles,
          color: "text-blue-600",
        });
      }
    });
  }

  if (hasManagedAgents) {
    agent.managed_agents.forEach((managedAgent: any) => {
      allItems.push({
        type: "agent",
        name:
          typeof managedAgent === "string"
            ? managedAgent
            : managedAgent.name || "Agent",
        icon: Users,
        color: "text-purple-600",
      });
    });
  }

  return (
    <div className="col-span-7 flex flex-col items-center pt-8">
      {/* Agent Name Card */}
      <div className="mb-8 w-full max-w-lg rounded-xl border-2 border-gray-300 bg-card p-10">
        <h2 className="text-center text-2xl font-bold">{agent.name}</h2>
      </div>

      {/* Horizontal tiles at bottom */}
      {allItems.length > 0 && (
        <div className="flex max-w-3xl flex-wrap justify-center gap-4">
          {allItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white px-6 py-3"
              >
                <Icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-base font-medium">{item.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {allItems.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No features, tools, or managed agents configured
        </p>
      )}
    </div>
  );
};

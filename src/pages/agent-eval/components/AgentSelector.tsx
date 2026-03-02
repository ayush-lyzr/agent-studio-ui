import React, { useEffect, useState } from "react";
import { Agent } from "@/pages/agent-eval/types/agent";
import { fetchAgents } from "@/pages/agent-eval/utils/api";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectorDropdownProps {
  onAgentSelect: (agent: Agent) => void;
  selectedAgent: Agent | null;
}

const AgentSelectorDropdown: React.FC<AgentSelectorDropdownProps> = ({
  onAgentSelect,
  selectedAgent,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);

  useEffect(() => {
    const loadAgents = async () => {
      if (!apiKey) {
        toast({
          title: "Error",
          description: "API key not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        const data = await fetchAgents(apiKey);
        setAgents(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [apiKey, toast]);

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">Select Agent</label>
      <Select
        disabled={loading}
        value={selectedAgent?._id || ""}
        onValueChange={(value) => {
          const agent = agents.find((a) => a._id === value);
          if (agent) onAgentSelect(agent);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading agents..." : "Select an agent"} />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent._id} value={agent._id}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{agent.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {agent.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AgentSelectorDropdown;

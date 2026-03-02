import { StatCard } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatsColProps {
  agents: number;
  knowledgeBases: number;
  tools: number;
  isLoading: boolean;
}

export const StatsCol = ({
  agents,
  knowledgeBases,
  tools,
  isLoading,
}: StatsColProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      <StatCard
        title="Agents"
        value={agents}
        isLoading={isLoading}
        onClick={() => navigate("/agent-builder")}
      />
      <StatCard
        title="Knowledge Bases"
        value={knowledgeBases}
        isLoading={isLoading}
        onClick={() => navigate("/knowledge-base")}
      />
      <StatCard
        title="Tools"
        value={tools}
        isLoading={isLoading}
        onClick={() => navigate("/configure/tools")}
      />
      <Button
        onClick={() => navigate("/agent-create")}
        className="mx-auto mt-4 pb-3"
      >
        <Plus className="mr-2 size-4" />
        Build Agent
      </Button>
    </div>
  );
};

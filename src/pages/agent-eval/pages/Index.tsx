import { useState } from "react";
import { Agent } from "../types/agent";
import AgentSelector from "../components/AgentSelector";
import TestCaseAndResults from "../components/TestCaseAndResults";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { Info } from "lucide-react";
import { LimitationsModal } from "./LimitationsModal";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showLimitations, setShowLimitations] = useState(false);

  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
    mixpanel.track("Agent eval page visited");

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  return (
    <div className="flex h-screen flex-col relative">
      {/* Header */}
      <div className="flex-shrink-0 border-b px-6 py-4 backdrop-blur-sm flex items-center justify-between relative">
        <div>
          <h1 className="text-2xl font-bold">Agent Eval</h1>
          <p className="mt-1 text-sm">Automated testing suite for AI agents</p>
        </div>
        <div className="absolute right-6 top-4">
          <button
            type="button"
            aria-label="Limitations"
            className="flex items-center px-3 py-1 bg-yellow-100 rounded-md text-yellow-800 text-xs gap-1 shadow hover:bg-yellow-200 border border-yellow-300"
            onClick={() => setShowLimitations(true)}
            onMouseOver={e => e.currentTarget.classList.add("ring-2", "ring-yellow-300")}
            onMouseOut={e => e.currentTarget.classList.remove("ring-2", "ring-yellow-300")}
          >
            <Info className="h-4 w-4" />
            <span className="font-medium">Limitations</span>
          </button>
        </div>
      </div>

      {/* Dropdown and content: dropdown is 20% width at top, content below */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* AgentSelector row */}
        <div className="flex flex-row items-center p-4 border-b bg-white z-10 gap-2">
          <div className="w-1/5 min-w-[220px] max-w-xs">
            <AgentSelector
              onAgentSelect={handleAgentSelect}
              selectedAgent={selectedAgent}
            />
          </div>
        </div>
        {/* Content area - show only if an agent is selected */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {selectedAgent ? (
            <TestCaseAndResults selectedAgent={selectedAgent} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-1">Select an agent to begin</h2>
                <div className="text-sm">Choose an agent from the dropdown above to generate and evaluate test cases.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <LimitationsModal open={showLimitations} onClose={() => setShowLimitations(false)} />
    </div>
  );
};

export default Index;

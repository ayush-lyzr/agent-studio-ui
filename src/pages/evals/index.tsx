import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Search } from "lucide-react";

import { Agent } from "../agent-eval/types/agent";
import { WorldModel, CreateWorldModelRequest } from "./types/worldModel";
import { WorldModelCard } from "./components/WorldModelCard";
import { CreateWorldModelModal } from "./components/CreateWorldModelModal";
import { ImportAgentModal } from "./components/ImportAgentModal";
import { ReviewAgentConfigModal } from "./components/ReviewAgentConfigModal";
import { DashboardStats as DashboardStatsComponent } from "./components/DashboardStats";
import { RecentActivity } from "./components/RecentActivity";
import { fetchAgents } from "../agent-eval/utils/api";
import {
  fetchWorldModelsByAgent,
  createWorldModel,
} from "./utils/worldModelApi";
import {
  getDashboardStats,
  getRecentEnvironments,
  DashboardStats,
  RecentEnvironment,
} from "./utils/dashboardApi";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive, BASE_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgentSimulationEngine() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [worldModels, setWorldModels] = useState<WorldModel[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReviewConfigModalOpen, setIsReviewConfigModalOpen] = useState(false);
  const [parsedAgentConfig, setParsedAgentConfig] = useState<any>(null);

  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingWorldModels, setLoadingWorldModels] = useState(false);
  const [creatingWorldModel, setCreatingWorldModel] = useState(false);
  const [importingAgent, setImportingAgent] = useState(false);
  const [creatingAgentFromConfig, setCreatingAgentFromConfig] = useState(false);
  const [refreshingAgents, setRefreshingAgents] = useState(false);
  const [importingA2A, setImportingA2A] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState("");

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [recentEnvironments, setRecentEnvironments] = useState<
    RecentEnvironment[]
  >([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const apiKey = useStore((state) => state.api_key);

  useEffect(() => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
      mixpanel.track("Page Visit", {
        page: "Agent Simulation Engine",
      });
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [apiKey]);

  // Load dashboard after agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      loadDashboard();
    }
  }, [agents.length, apiKey]);

  const loadAgents = async () => {
    if (!apiKey) {
      toast.error("API key not found");
      setLoadingAgents(false);
      return;
    }

    try {
      // Fetch regular agents
      const agentsData = await fetchAgents(apiKey);

      // Fetch A2A agents
      let a2aAgents: any[] = [];
      try {
        const a2aResponse = await axios.get(`${BASE_URL}/v3/a2a/agents/`, {
          headers: {
            "x-api-key": apiKey,
          },
        });

        // Transform A2A agents to match regular agent structure
        a2aAgents = a2aResponse.data.map((a2aAgent: any) => ({
          _id: a2aAgent._id,
          name: `${a2aAgent.name} [A2A]`,
          description: a2aAgent.description || "",
          agent_type: "a2a",
          // Add other fields as needed to match Agent type
        }));
      } catch (a2aError) {
        console.warn("Failed to load A2A agents:", a2aError);
        // Continue without A2A agents if fetch fails
      }

      // Merge regular and A2A agents
      const allAgents = [...agentsData, ...a2aAgents];

      // Filter out agents with "_world_model" in their name
      const filteredAgents = allAgents.filter(
        (agent) => !agent.name.toLowerCase().includes("_world_model"),
      );

      setAgents(filteredAgents);
    } catch (error) {
      console.error("Failed to load agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleRefreshAgents = async () => {
    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setRefreshingAgents(true);
    try {
      // Fetch regular agents
      const agentsData = await fetchAgents(apiKey);

      // Fetch A2A agents
      let a2aAgents: any[] = [];
      try {
        const a2aResponse = await axios.get(`${BASE_URL}/v3/a2a/agents/`, {
          headers: {
            "x-api-key": apiKey,
          },
        });

        // Transform A2A agents to match regular agent structure
        a2aAgents = a2aResponse.data.map((a2aAgent: any) => ({
          _id: a2aAgent._id,
          name: `${a2aAgent.name} [A2A]`,
          description: a2aAgent.description || "",
          agent_type: "a2a",
        }));
      } catch (a2aError) {
        console.warn("Failed to load A2A agents:", a2aError);
      }

      // Merge regular and A2A agents
      const allAgents = [...agentsData, ...a2aAgents];

      // Filter out agents with "_world_model" in their name
      const filteredAgents = allAgents.filter(
        (agent) => !agent.name.toLowerCase().includes("_world_model"),
      );

      setAgents(filteredAgents);
      toast.success("Agents list refreshed");
    } catch (error) {
      console.error("Failed to refresh agents:", error);
      toast.error("Failed to refresh agents");
    } finally {
      setRefreshingAgents(false);
    }
  };

  // Categorize and filter agents
  const getCategorizedAgents = () => {
    const query = agentSearchQuery.toLowerCase();
    const filtered = agents.filter((agent) =>
      agent.name.toLowerCase().includes(query),
    );

    const lyzrAgents = filtered.filter(
      (agent) =>
        !agent.name.includes("[External]") && !agent.name.includes("[A2A]"),
    );
    const externalAgents = filtered.filter(
      (agent) =>
        agent.name.includes("[External]") || agent.name.includes("[A2A]"),
    );

    return { lyzrAgents, externalAgents };
  };

  const handleAgentSelect = async (agent: Agent) => {
    setSelectedAgent(agent);
    setWorldModels([]);

    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setLoadingWorldModels(true);
    try {
      const worldModelsData = await fetchWorldModelsByAgent(agent._id, apiKey);
      setWorldModels(worldModelsData.world_models);
    } catch (error) {
      console.error("Failed to load Environment:", error);
      toast.error("Failed to load Environment");
    } finally {
      setLoadingWorldModels(false);
    }
  };

  const handleAgentSelectFromDropdown = (agentId: string) => {
    if (agentId === "none") {
      setSelectedAgent(null);
      setWorldModels([]);
      return;
    }
    const agent = agents.find((a) => a._id === agentId);
    if (agent) {
      handleAgentSelect(agent);
    }
  };

  const loadDashboard = async () => {
    if (!apiKey) {
      setLoadingDashboard(false);
      return;
    }

    setLoadingDashboard(true);
    try {
      const [stats, envs] = await Promise.all([
        getDashboardStats(apiKey),
        getRecentEnvironments(apiKey, 5),
      ]);
      setDashboardStats(stats);

      // Map agent names from the agents list
      const environmentsWithAgentNames = envs.environments.map((env) => {
        const agent = agents.find((a) => a._id === env.agent_id);
        return {
          ...env,
          agent_name: agent?.name || "Unknown Agent",
        };
      });

      setRecentEnvironments(environmentsWithAgentNames);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleCreateWorldModel = async (request: CreateWorldModelRequest) => {
    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setCreatingWorldModel(true);
    try {
      await createWorldModel(request, apiKey);
      toast.success(`Environment "${request.name}" created successfully`);

      // Refresh Environments list
      if (selectedAgent) {
        const worldModelsData = await fetchWorldModelsByAgent(
          selectedAgent._id,
          apiKey,
        );
        setWorldModels(worldModelsData.world_models);
      }

      // Refresh dashboard data
      loadDashboard();
    } catch (error) {
      console.error("Failed to create Environment:", error);
      toast.error("Failed to create Environment");
      throw error; // Re-throw to let modal handle it
    } finally {
      setCreatingWorldModel(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setImportingAgent(true);

    try {
      // Step 1: Read file content
      const fileContent = await readFileContent(file);
      console.log("File content read:", fileContent.substring(0, 100) + "...");

      // Step 2: Send to inference agent to get agent config
      const agentConfig = await getAgentConfigFromInference(fileContent);
      console.log("Received agent config:", agentConfig);

      // Step 3: Store config and open review modal
      setParsedAgentConfig(agentConfig);
      setIsImportModalOpen(false);
      setIsReviewConfigModalOpen(true);
      toast.success(
        "Agent configuration parsed successfully! Review and finalize.",
      );
    } catch (error: any) {
      console.error("Failed to parse agent config:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to parse agent configuration",
      );
    } finally {
      setImportingAgent(false);
    }
  };

  const handleConfirmAgentConfig = async (finalConfig: any) => {
    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setCreatingAgentFromConfig(true);

    try {
      // Add [External] prefix to agent name if not already present
      const agentName = finalConfig.name || "Imported Agent";
      const finalAgentName = agentName.includes("[External]")
        ? agentName
        : `[External] ${agentName}`;

      // Convert response_format back to object format for API
      const responseFormat =
        finalConfig.response_format === "json_object"
          ? { type: "json_object" }
          : { type: "text" };

      // Create agent using the finalized config
      const response = await axios.post(
        "/agents/",
        {
          ...finalConfig,
          name: finalAgentName,
          response_format: responseFormat,
        },
        {
          headers: { "x-api-key": apiKey },
        },
      );

      const agentId =
        response.data.agent_id || response.data._id || response.data.id;

      if (!agentId) {
        throw new Error("No agent ID returned from API");
      }

      toast.success(`Agent "${finalAgentName}" created successfully!`);

      // Close modal and refresh agents list
      setIsReviewConfigModalOpen(false);
      setParsedAgentConfig(null);
      await loadAgents();
    } catch (error: any) {
      console.error("Failed to create agent:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create agent",
      );
    } finally {
      setCreatingAgentFromConfig(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const getAgentConfigFromInference = async (
    fileContent: string,
  ): Promise<any> => {
    const AGENT_ID = "691bba82dcdd91af30a8ff46";
    const SESSION_ID = "691bba82dcdd91af30a8ff46-bq5dlhqd0kc";

    const response = await fetch(
      "https://agent.maia.prophet.com/v3/inference/chat/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny",
        },
        body: JSON.stringify({
          user_id: "import-user",
          agent_id: AGENT_ID,
          session_id: SESSION_ID,
          message: fileContent,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Inference API failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract agent config from response
    // The agent should return a JSON config in the response
    console.log("Inference response:", data);

    // Parse the agent config from the response
    // Assuming the agent returns the config in the response field
    const configText = data.response || data.message || data;

    try {
      // Try to parse JSON from the response
      const config =
        typeof configText === "string" ? JSON.parse(configText) : configText;
      return config;
    } catch (e) {
      // If response contains markdown code blocks, extract JSON
      const jsonMatch = configText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error("Failed to parse agent config from inference response");
    }
  };

  const handleA2AImport = async (baseUrl: string, _name: string) => {
    if (!apiKey) {
      toast.error("API key not found");
      return;
    }

    setImportingA2A(true);

    try {
      // Step 1: Create A2A agent connection
      const createResponse = await axios.post(
        `${BASE_URL}/v3/a2a/agents/`,
        { base_url: baseUrl },
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      const agentId = createResponse.data.agent_id;

      if (!agentId) {
        throw new Error("No agent ID returned from A2A API");
      }

      // Step 2: Get agent details
      const getResponse = await axios.get(
        `${BASE_URL}/v3/a2a/agents/${agentId}`,
        {
          headers: {
            "x-api-key": apiKey,
          },
        },
      );

      const agentData = getResponse.data;

      // The [A2A] tag will be added automatically when loading agents
      toast.success(`A2A Agent "${agentData.name}" connected successfully!`);
      console.log("A2A Agent data:", agentData);

      // Close modal and refresh agents list
      setIsImportModalOpen(false);
      await loadAgents();
    } catch (error: any) {
      console.error("Failed to import A2A agent:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to connect A2A agent",
      );
    } finally {
      setImportingA2A(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex h-full w-full flex-col space-y-6 overflow-y-auto p-8"
      >
        {/* Header with Agent Selector */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              Agent Simulation Engine
            </h1>
            <p className="inline-flex items-center text-gray-600">
              Monitor evaluations and manage environments
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="ml-1 size-4 text-yellow-600" />
                </TooltipTrigger>
                <TooltipContent align="start" side="right">
                  The current version doesn’t yet support multi-turn
                  conversations or workflows, and both capabilities are actively
                  being developed.
                </TooltipContent>
              </Tooltip>
            </p>
          </div>

          {!selectedAgent ? (
            /* Agent Selector Dropdown with Import Button - Only show when no agent selected */
            <div className="flex items-end gap-3">
              <div className="w-full max-w-xs">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Agent to Simulate
                </label>
                <div className="flex gap-2">
                  {loadingAgents ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value="none"
                      onValueChange={handleAgentSelectFromDropdown}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="border-b px-2 py-1.5">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="Search agents..."
                              value={agentSearchQuery}
                              onChange={(e) =>
                                setAgentSearchQuery(e.target.value)
                              }
                              className="h-8 pl-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {(() => {
                          const { lyzrAgents, externalAgents } =
                            getCategorizedAgents();
                          return (
                            <>
                              {lyzrAgents.length > 0 && (
                                <>
                                  <div className="bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500">
                                    Lyzr Agents
                                  </div>
                                  {lyzrAgents.map((agent) => (
                                    <SelectItem
                                      key={agent._id}
                                      value={agent._id}
                                    >
                                      {agent.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {externalAgents.length > 0 && (
                                <>
                                  <div className="bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500">
                                    External Agents
                                  </div>
                                  {externalAgents.map((agent) => {
                                    const isA2A = agent.name.includes("[A2A]");
                                    const colorClass = isA2A
                                      ? "text-green-600 font-medium"
                                      : "text-purple-600 font-medium";
                                    return (
                                      <SelectItem
                                        key={agent._id}
                                        value={agent._id}
                                        className={colorClass}
                                      >
                                        {agent.name}
                                      </SelectItem>
                                    );
                                  })}
                                </>
                              )}
                              {lyzrAgents.length === 0 &&
                                externalAgents.length === 0 && (
                                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                                    No agents found
                                  </div>
                                )}
                            </>
                          );
                        })()}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefreshAgents}
                    disabled={refreshingAgents || loadingAgents}
                    className="flex-shrink-0"
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        refreshingAgents && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Import Agent
              </Button>
            </div>
          ) : (
            /* Agent Selector and Create Button - Show when agent is selected */
            <div className="flex items-end gap-3">
              <div className="w-full max-w-xs">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Agent to Simulate
                </label>
                <div className="flex gap-2">
                  {loadingAgents ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedAgent._id}
                      onValueChange={handleAgentSelectFromDropdown}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="border-b px-2 py-1.5">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="Search agents..."
                              value={agentSearchQuery}
                              onChange={(e) =>
                                setAgentSearchQuery(e.target.value)
                              }
                              className="h-8 pl-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <SelectItem value="none">
                          -- View Dashboard --
                        </SelectItem>
                        {(() => {
                          const { lyzrAgents, externalAgents } =
                            getCategorizedAgents();
                          return (
                            <>
                              {lyzrAgents.length > 0 && (
                                <>
                                  <div className="bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500">
                                    Lyzr Agents
                                  </div>
                                  {lyzrAgents.map((agent) => (
                                    <SelectItem
                                      key={agent._id}
                                      value={agent._id}
                                    >
                                      {agent.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {externalAgents.length > 0 && (
                                <>
                                  <div className="bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500">
                                    External Agents
                                  </div>
                                  {externalAgents.map((agent) => {
                                    const isA2A = agent.name.includes("[A2A]");
                                    const colorClass = isA2A
                                      ? "text-green-600 font-medium"
                                      : "text-purple-600 font-medium";
                                    return (
                                      <SelectItem
                                        key={agent._id}
                                        value={agent._id}
                                        className={colorClass}
                                      >
                                        {agent.name}
                                      </SelectItem>
                                    );
                                  })}
                                </>
                              )}
                              {lyzrAgents.length === 0 &&
                                externalAgents.length === 0 && (
                                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                                    No agents found
                                  </div>
                                )}
                            </>
                          );
                        })()}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefreshAgents}
                    disabled={refreshingAgents || loadingAgents}
                    className="flex-shrink-0"
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        refreshingAgents && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Environment
              </Button>
            </div>
          )}
        </div>

        {/* Dashboard Stats - Only show when no agent is selected */}
        {!selectedAgent && (
          <>
            {/* Check if there's any data at all */}
            {!loadingDashboard &&
            dashboardStats?.total_environments === 0 &&
            dashboardStats?.total_simulations === 0 &&
            dashboardStats?.total_evaluations === 0 &&
            recentEnvironments.length === 0 ? (
              /* Empty State - No data at all */
              <div className="flex flex-col items-center justify-center space-y-6 py-16">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl"></div>
                  <img
                    src="/images/no-tools.svg"
                    alt="Get started"
                    className="relative h-48"
                  />
                </div>
                <div className="max-w-md space-y-3 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome to Agent Simulation Engine
                  </h2>
                  <p className="text-gray-600">
                    Get started by selecting an agent above to create your first
                    environment and begin simulating agent performance
                  </p>
                </div>
                <div className="flex max-w-xl flex-col gap-3 rounded-lg bg-blue-50 p-6 text-sm text-gray-600">
                  <p className="mb-2 font-semibold text-blue-900">
                    Quick Start Guide:
                  </p>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      1
                    </span>
                    <p>
                      <strong>Select an agent</strong> from the dropdown above
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      2
                    </span>
                    <p>
                      <strong>Create an environment</strong> to test your agent
                      in different scenarios
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      3
                    </span>
                    <p>
                      <strong>Add personas and scenarios</strong> to define
                      Simulations
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      4
                    </span>
                    <p>
                      <strong>Run evaluations</strong> and view metrics to
                      harden your agent
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Dashboard with data */
              <>
                <DashboardStatsComponent
                  totalEnvironments={dashboardStats?.total_environments || 0}
                  totalSimulations={dashboardStats?.total_simulations || 0}
                  totalEvaluations={dashboardStats?.total_evaluations || 0}
                  loading={loadingDashboard}
                />

                {/* Recent Environments */}
                <RecentActivity
                  recentEnvironments={recentEnvironments}
                  loading={loadingDashboard}
                />
              </>
            )}
          </>
        )}

        {/* Your Environments Section */}
        {selectedAgent && (
          <div className="border-t pt-6">
            <div className={cn("grid gap-4", "grid-cols-4")}>
              {loadingWorldModels ? (
                new Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <Skeleton
                      key={`skeleton-${index}`}
                      className="h-[180px] w-full rounded-xl"
                    />
                  ))
              ) : worldModels.length > 0 ? (
                worldModels.map((worldModel, index) => (
                  <WorldModelCard
                    key={worldModel._id}
                    worldModel={worldModel}
                    agentId={selectedAgent._id}
                    index={index}
                  />
                ))
              ) : (
                <div className="col-span-4 flex flex-col items-center justify-center space-y-5 py-12 text-center">
                  <img
                    src="/images/no-tools.svg"
                    alt="Empty state"
                    className="h-32"
                  />
                  <p className="font-medium">
                    No Environments found for this agent
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Environment
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <CreateWorldModelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedAgent={selectedAgent}
        onCreateWorldModel={handleCreateWorldModel}
        isCreating={creatingWorldModel}
      />

      <ImportAgentModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onFileUpload={handleFileUpload}
        onA2AImport={handleA2AImport}
        isImporting={importingAgent}
        isImportingA2A={importingA2A}
      />

      <ReviewAgentConfigModal
        isOpen={isReviewConfigModalOpen}
        onClose={() => {
          setIsReviewConfigModalOpen(false);
          setParsedAgentConfig(null);
        }}
        agentConfig={parsedAgentConfig}
        onConfirm={handleConfirmAgentConfig}
        isCreating={creatingAgentFromConfig}
      />
    </>
  );
}

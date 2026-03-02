import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorldModel, Scenario, Persona, TestCase } from "../types/worldModel";
import { Agent } from "../../agent-eval/types/agent";
import {
  fetchWorldModelsByAgent,
  fetchScenarios,
  fetchPersonas,
  fetchTestCases,
  createScenarios,
  createPersonas,
  deleteScenario,
  deletePersona,
  deleteSimulation,
  JobStatusResponse,
} from "../utils/worldModelApi";
import { fetchAgents } from "../../agent-eval/utils/api";
import { useEnvironmentApi } from "./useEnvironmentMutations";
import axios from "@/lib/axios";
import { BASE_URL } from "@/lib/constants";

export const useWorldModelData = (
  worldModelId: string | undefined,
  apiKey: string,
  agentId?: string,
) => {
  const [worldModel, setWorldModel] = useState<WorldModel | null>(null);
  const [sourceAgent, setSourceAgent] = useState<Agent | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [isGeneratingTestCases, setIsGeneratingTestCases] = useState(false);

  // Job tracking state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const {
    generateScenariosMutation,
    generatePersonasMutation,
    generateSimulationsMutation,
  } = useEnvironmentApi();

  const autoPopulateWorldModel = async () => {
    if (!worldModelId || !apiKey) return;

    try {
      toast.info("Auto-populating Environment with scenarios and personas...");

      // Generate scenarios and personas in parallel
      await Promise.all([
        generateScenariosMutation({ environmentId: worldModelId }),
        generatePersonasMutation({ environmentId: worldModelId }),
      ]);

      // Fetch the generated data
      const [scenariosData, personasData] = await Promise.all([
        fetchScenarios(worldModelId, apiKey),
        fetchPersonas(worldModelId, apiKey),
      ]);

      setScenarios(scenariosData.scenarios);
      setPersonas(personasData.personas);

      // Select all by default - support both old (_id) and new (id) field names
      setSelectedScenarios(
        scenariosData.scenarios
          .map((s) => s._id || s.id)
          .filter((id) => id !== undefined) as string[],
      );
      setSelectedPersonas(
        personasData.personas
          .map((p) => p._id || p.id)
          .filter((id) => id !== undefined) as string[],
      );

      toast.success(
        `Auto-populated ${scenariosData.scenarios.length} scenarios and ${personasData.personas.length} personas`,
      );
    } catch (error: any) {
      console.error("Failed to auto-populate Environment:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to auto-populate Environment";
      toast.error(errorMessage);
    } finally {
      setIsAutoPopulating(false);
    }
  };

  const loadWorldModelDetails = async () => {
    if (!worldModelId || !apiKey) return;

    try {
      setLoading(true);

      let foundWorldModel: WorldModel | null = null;
      let foundSourceAgent: Agent | null = null;

      // Helper function to fetch all agents (regular + A2A)
      const fetchAllAgents = async () => {
        const regularAgents = await fetchAgents(apiKey);

        // Fetch A2A agents
        let a2aAgents: any[] = [];
        try {
          const a2aResponse = await axios.get(`${BASE_URL}/v3/a2a/agents/`, {
            headers: {
              "x-api-key": apiKey,
            },
          });

          a2aAgents = a2aResponse.data.map((a2aAgent: any) => ({
            _id: a2aAgent._id,
            name: `${a2aAgent.name} [A2A]`,
            description: a2aAgent.description || "",
            agent_type: "a2a",
          }));
        } catch (a2aError) {
          console.warn("Failed to load A2A agents:", a2aError);
        }

        return [...regularAgents, ...a2aAgents];
      };

      // If agentId is provided, use it directly (much faster!)
      if (agentId) {
        try {
          // Get all agents to find the source agent details
          const agents = await fetchAllAgents();
          foundSourceAgent = agents.find((a) => a._id === agentId) || null;

          // Get environments for this specific agent (works for both regular and A2A agents)
          const worldModelsData = await fetchWorldModelsByAgent(
            agentId,
            apiKey,
          );
          foundWorldModel =
            worldModelsData.world_models.find((w) => w._id === worldModelId) ||
            null;
        } catch (error) {
          console.error(
            "Failed to load environment with provided agentId:",
            error,
          );
        }
      }

      // Fallback: If agentId not provided or not found, search through all agents
      if (!foundWorldModel) {
        const agents = await fetchAllAgents();

        for (const agent of agents) {
          try {
            const worldModelsData = await fetchWorldModelsByAgent(
              agent._id,
              apiKey,
            );
            const wm = worldModelsData.world_models.find(
              (w) => w._id === worldModelId,
            );
            if (wm) {
              foundWorldModel = wm;
              foundSourceAgent = agent;
              break;
            }
          } catch (error) {
            // Continue searching
          }
        }
      }

      if (!foundWorldModel) {
        toast.error("Environment not found");
        return null;
      }

      setWorldModel(foundWorldModel);
      setSourceAgent(foundSourceAgent);

      // Load scenarios, personas, and test cases
      const [scenariosData, personasData, testCasesData] = await Promise.all([
        fetchScenarios(worldModelId, apiKey).catch(() => ({ scenarios: [] })),
        fetchPersonas(worldModelId, apiKey).catch(() => ({ personas: [] })),
        fetchTestCases(worldModelId, apiKey).catch(() => ({ test_cases: [] })),
      ]);

      setScenarios(scenariosData.scenarios);
      setPersonas(personasData.personas);
      setTestCases(testCasesData.test_cases);

      // Auto populate if empty (and not already auto-populating)
      if (
        scenariosData.scenarios.length === 0 &&
        personasData.personas.length === 0 &&
        !isAutoPopulating &&
        foundSourceAgent
      ) {
        setIsAutoPopulating(true);
        await autoPopulateWorldModel();
      } else {
        // Select all by default
        setSelectedScenarios(
          scenariosData.scenarios
            .map((s) => s._id || s.id)
            .filter((id) => id !== undefined) as string[],
        );
        setSelectedPersonas(
          personasData.personas
            .map((p) => p._id || p.id)
            .filter((id) => id !== undefined) as string[],
        );
      }

      return { worldModel: foundWorldModel, sourceAgent: foundSourceAgent };
    } catch (error) {
      console.error("Failed to load Environment details:", error);
      toast.error("Failed to load Environment details");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addScenario = async (scenario: {
    name: string;
    description: string;
  }) => {
    if (!worldModelId || !apiKey) return false;

    try {
      await createScenarios(worldModelId, { scenarios: [scenario] }, apiKey);

      // Reload scenarios
      const scenariosData = await fetchScenarios(worldModelId, apiKey);
      setScenarios(scenariosData.scenarios);

      toast.success("Scenario added successfully");
      return true;
    } catch (error) {
      console.error("Failed to add scenario:", error);
      toast.error("Failed to add scenario");
      return false;
    }
  };

  const addPersona = async (persona: { name: string; description: string }) => {
    if (!worldModelId || !apiKey) return false;

    try {
      await createPersonas(worldModelId, { personas: [persona] }, apiKey);

      // Reload personas
      const personasData = await fetchPersonas(worldModelId, apiKey);
      setPersonas(personasData.personas);

      toast.success("Persona added successfully");
      return true;
    } catch (error) {
      console.error("Failed to add persona:", error);
      toast.error("Failed to add persona");
      return false;
    }
  };

  const removeScenario = async (scenarioId: string) => {
    if (!worldModelId || !apiKey) return false;

    try {
      await deleteScenario(worldModelId, scenarioId, apiKey);

      // Remove from local state
      setScenarios((prevScenarios) =>
        prevScenarios.filter((s) => (s._id || s.id) !== scenarioId),
      );

      // Remove from selected scenarios
      setSelectedScenarios((prev) => prev.filter((id) => id !== scenarioId));

      toast.success("Scenario deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete scenario:", error);
      toast.error("Failed to delete scenario");
      return false;
    }
  };

  const removePersona = async (personaId: string) => {
    if (!worldModelId || !apiKey) return false;

    try {
      await deletePersona(worldModelId, personaId, apiKey);

      // Remove from local state
      setPersonas((prevPersonas) =>
        prevPersonas.filter((p) => (p._id || p.id) !== personaId),
      );

      // Remove from selected personas
      setSelectedPersonas((prev) => prev.filter((id) => id !== personaId));

      toast.success("Persona deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete persona:", error);
      toast.error("Failed to delete persona");
      return false;
    }
  };

  const removeSimulation = async (simulationId: string) => {
    if (!worldModelId || !apiKey) return false;

    try {
      await deleteSimulation(worldModelId, simulationId, apiKey);

      // Remove from local state
      setTestCases((prevTestCases) =>
        prevTestCases.filter((tc) => (tc._id || tc.id) !== simulationId),
      );

      toast.success("Simulation deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete simulation:", error);
      toast.error("Failed to delete simulation");
      return false;
    }
  };

  const removeBulkSimulations = async (simulationIds: string[]) => {
    if (!worldModelId || !apiKey) return false;

    try {
      // Delete all simulations in parallel
      await Promise.all(
        simulationIds.map((id) => deleteSimulation(worldModelId, id, apiKey)),
      );

      // Remove from local state
      setTestCases((prevTestCases) =>
        prevTestCases.filter(
          (tc) => !simulationIds.includes(tc._id || tc.id || ""),
        ),
      );

      toast.success(
        `${simulationIds.length} simulation${simulationIds.length > 1 ? "s" : ""} deleted successfully`,
      );
      return true;
    } catch (error) {
      console.error("Failed to delete simulations:", error);
      toast.error("Failed to delete simulations");
      return false;
    }
  };

  const generateTestCasesForWorldModel = async (onSuccess?: () => void) => {
    if (!worldModelId || !apiKey || !sourceAgent) return null;

    // Check if scenarios and personas are selected
    if (selectedScenarios.length === 0 || selectedPersonas.length === 0) {
      toast.error("Please select at least one scenario and one persona");
      return null;
    }

    try {
      setIsGeneratingTestCases(true);
      toast.info("Starting simulation generation job...");

      // Use the mutation from useEnvironmentApi
      const response = await generateSimulationsMutation({
        environmentId: worldModelId,
        scenarioIds: selectedScenarios,
        personaIds: selectedPersonas,
      });

      setCurrentJobId(response.job_id);
      onSuccess?.();

      // Return job ID so the component can track it
      return response.job_id;
    } catch (error) {
      console.error("Failed to start simulation generation job:", error);
      setIsGeneratingTestCases(false);
      return null;
    }
  };

  // Handler for when simulation generation job completes
  const handleTestCaseJobComplete = async (jobStatus: JobStatusResponse) => {
    setIsGeneratingTestCases(false);
    setCurrentJobId(null);

    if (jobStatus.status === "completed") {
      // Reload simulations
      try {
        const testCasesData = await fetchTestCases(worldModelId!, apiKey);
        setTestCases(testCasesData.test_cases);
        toast.success(
          `Generated ${testCasesData.count} simulations successfully`,
        );
      } catch (error) {
        console.error("Failed to reload simulations:", error);
        toast.error("Failed to reload simulations after generation");
      }
    }
  };

  // Handler for when job is cancelled
  const handleJobCancel = (jobId: string) => {
    if (jobId === currentJobId) {
      setIsGeneratingTestCases(false);
      setCurrentJobId(null);
    }
  };

  // Handler for when job fails
  const handleJobError = (jobId: string, error: string) => {
    if (jobId === currentJobId) {
      setIsGeneratingTestCases(false);
      setCurrentJobId(null);
      toast.error(`Job failed: ${error}`);
    }
  };

  const addManualTestCase = async (
    testCase: Omit<TestCase, "_id" | "world_model_id" | "created_at">,
  ) => {
    if (!worldModelId || !apiKey) return false;

    try {
      // Use Environment API to create simulation
      const { createSimulation } = await import("../services/environmentApi");
      await createSimulation(
        worldModelId,
        {
          name: testCase.name,
          user_input: testCase.user_input,
          expected_output:
            typeof testCase.expected_output === "string"
              ? testCase.expected_output
              : JSON.stringify(testCase.expected_output),
          persona_id: testCase.persona_id,
          scenario_id: testCase.scenario_id,
        },
        apiKey,
      );

      // Reload simulations using Environment API
      const testCasesData = await fetchTestCases(worldModelId, apiKey);
      setTestCases(testCasesData.test_cases);

      toast.success("Simulation added successfully");
      return true;
    } catch (error) {
      console.error("Failed to add simulation:", error);
      toast.error("Failed to add simulation");
      return false;
    }
  };

  useEffect(() => {
    if (worldModelId && apiKey) {
      loadWorldModelDetails();
    }
  }, [worldModelId, apiKey, agentId]);

  return {
    worldModel,
    sourceAgent,
    scenarios,
    personas,
    testCases,
    selectedTestCases,
    selectedScenarios,
    selectedPersonas,
    loading,
    isGeneratingTestCases,
    currentJobId,
    setSelectedScenarios,
    setSelectedPersonas,
    setSelectedTestCases,
    addScenario,
    addPersona,
    removeScenario,
    removePersona,
    removeSimulation,
    removeBulkSimulations,
    generateTestCasesForWorldModel,
    handleTestCaseJobComplete,
    handleJobCancel,
    handleJobError,
    addManualTestCase,
    loadWorldModelDetails,
  };
};

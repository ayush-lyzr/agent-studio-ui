import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import useStore from "@/lib/store";
import { TestCase } from "../types/worldModel";
import { useWorldModelData } from "../hooks/useWorldModelData";
import { improveAgentFromResults } from "../utils/evaluationApi";
import { EvaluationTabs } from "../components/EvaluationTabs";
import { WorldModelStep } from "../components/WorldModelStep";
import { MetricsSelectionStep } from "../components/MetricsSelectionStep";
import { SimulationAnalysis } from "../components/SimulationAnalysis";
import { AgentMigrateStep } from "../components/AgentMigrateStep";
import EvaluationMetricsModal from "../components/EvaluationMetricsModal";
import { AddScenarioDialog } from "../components/AddScenarioDialog";
import { AddPersonaDialog } from "../components/AddPersonaDialog";
import { AddTestCaseDialog } from "../components/AddTestCaseDialog";
import { JobProgressCard } from "../components/JobProgressCard";
import { useEvaluationMetrics } from "../hooks/useEvaluationMetrics";
import { toast } from "sonner";

export interface EvaluationStep {
  id: number;
  title: string;
  subtitle: string;
  disabled?: boolean;
  status: "pending" | "current" | "completed";
}

export default function WorldModelDetails() {
  const { worldModelId } = useParams<{ worldModelId: string }>();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId") || undefined;
  const navigate = useNavigate();
  const apiKey = useStore((state) => state.api_key);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  // const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [isEvaluationRunning, setIsEvaluationRunning] = useState(false);

  // Track current evaluation run for passing to SimulationAnalysis
  const [currentEvaluationRunId, setCurrentEvaluationRunId] = useState<
    string | null
  >(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);

  const [isAddScenarioOpen, setIsAddScenarioOpen] = useState(false);
  const [isAddPersonaOpen, setIsAddPersonaOpen] = useState(false);
  const [isAddTestCaseOpen, setIsAddTestCaseOpen] = useState(false);
  const [newScenario, setNewScenario] = useState({ name: "", description: "" });
  const [newPersona, setNewPersona] = useState({ name: "", description: "" });
  const [newTestCase, setNewTestCase] = useState<
    Omit<TestCase, "_id" | "world_model_id" | "created_at">
  >({
    name: "",
    user_input: "",
    expected_output: "",
    scenario_id: "",
    persona_id: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false);

  const {
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
  } = useWorldModelData(worldModelId, apiKey, agentId);

  // Metrics management
  const {
    categories,
    expandedCategories,
    toggleCategory,
    toggleMetric,
    toggleCategoryExpansion,
    getEnabledMetricsCount,
    getSelectedMetrics,
  } = useEvaluationMetrics(sourceAgent);

  // Fetch evaluation runs when Step 3 is opened
  useEffect(() => {
    const fetchEvaluationRuns = async () => {
      if (currentStep === 3 && worldModelId && apiKey) {
        try {
          const { listEvaluationRuns } = await import(
            "../services/environmentApi"
          );
          const response = await listEvaluationRuns(worldModelId, apiKey);
          console.log(
            `Fetched ${response.evaluation_runs.length} evaluation runs for environment ${worldModelId}`,
          );
        } catch (error) {
          console.error("Failed to prefetch evaluation runs:", error);
          // Don't show error toast - this is just a prefetch
        }
      }
    };

    fetchEvaluationRuns();
  }, [currentStep, worldModelId, apiKey]);

  // Tab configuration
  // Check if agent is external
  const isExternalAgent = sourceAgent?.name?.includes("[External]") || false;

  const steps: EvaluationStep[] = [
    {
      id: 1,
      title: "Setup Environment",
      subtitle: "Configure scenarios",
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
            ? "completed"
            : "pending",
    },
    {
      id: 2,
      title: "Configure Simulation",
      subtitle: "Select metrics",
      disabled: selectedTestCases.length === 0,
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
            ? "completed"
            : "pending",
    },
    {
      id: 3,
      title: "Simulation Analysis / Agent Hardening",
      subtitle: "View results and improve agent",
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
            ? "completed"
            : "pending",
    },
    {
      id: 4,
      title: "Migrate",
      disabled: selectedTestCases.length === 0,
      subtitle: "Export agent to external frameworks",
      status: currentStep === 4 ? "current" : "pending",
    },
  ];

  // Tab navigation function - always allow access to both tabs
  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

  const handleEvaluationRequest = (selectedTestCaseIds: string[]) => {
    console.log("Evaluation requested for simulations:", selectedTestCaseIds);
    setSelectedTestCases(selectedTestCaseIds);
    // Navigate to Configure Simulation tab
    setCurrentStep(2);
  };

  const handleRunEvaluationFromStep = async () => {
    const selectedMetrics = getSelectedMetrics();
    console.log("Starting evaluation from Configure Simulation step...");
    console.log("Selected simulations:", selectedTestCases);
    console.log("Selected metrics:", selectedMetrics);

    if (!sourceAgent || !worldModel || selectedTestCases.length === 0) {
      console.error("No agent, Environment, or simulations selected");
      return;
    }

    // Run evaluation with the same logic as handleRunEvaluation
    const results = await handleRunEvaluation(
      selectedMetrics,
      "Evaluation Run",
    );
    console.log("Evaluation completed with", results.length, "results");
  };

  const handleRunEvaluation = async (
    selectedMetrics: string[],
    runName: string,
    hardenedAgentConfig?: any,
    testCaseIds?: string[],
  ): Promise<any[]> => {
    console.log("Starting evaluation with new Environment API...");
    console.log("Run name:", runName);

    // Use provided testCaseIds or fall back to selectedTestCases state
    const testCasesToRun = testCaseIds || selectedTestCases;
    console.log("Simulation IDs to evaluate:", testCasesToRun);
    console.log("Selected metrics:", selectedMetrics);
    if (hardenedAgentConfig) {
      console.log("Using hardened agent config:", {
        goal: hardenedAgentConfig.goal,
        instructions: hardenedAgentConfig.instructions,
      });
    }

    if (
      !sourceAgent ||
      !worldModel ||
      testCasesToRun.length === 0 ||
      !worldModelId
    ) {
      console.error("No agent, Environment, or simulation selected");
      return [];
    }

    setIsEvaluationRunning(true);
    setIsMetricsModalOpen(false); // Close the modal

    // Get the selected simulations (use testCasesToRun instead of selectedTestCases)
    const selectedTestCaseObjects = testCases.filter((tc) =>
      testCasesToRun.includes(tc._id!),
    );
    console.log("Running simulations:", selectedTestCaseObjects.length);

    // Initialize evaluation results with pending simulations
    const initialResults = selectedTestCaseObjects.map((tc) => {
      const scenarioName =
        scenarios.find((s) => s._id === tc.scenario_id)?.name || tc.scenario_id;
      const personaName =
        personas.find((p) => p._id === tc.persona_id)?.name || tc.persona_id;

      return {
        id: tc._id,
        name: tc.name,
        status: "pending" as const,
        scenario: tc.scenario_id,
        persona: tc.persona_id,
        scenarioName: scenarioName,
        personaName: personaName,
        userInput: tc.user_input,
        expectedOutput: tc.expected_output,
        agentResponse: "",
        metrics: {},
        duration: 0,
      };
    });

    // Set initial results and move to step 2
    setEvaluationResults({
      testCases: initialResults,
      overallProgress: 0,
      isRunning: true,
      runName,
      selectedMetrics,
    });

    // Move to step 3 (Results) to show honeycomb immediately
    setCurrentStep(3);

    try {
      // Start evaluation using new Environment API
      const {
        generateEvaluationRun,
        getEvaluationJobStatus,
        getEvaluationRun,
      } = await import("../services/environmentApi");

      console.log("Starting evaluation job...");
      toast.info("Starting evaluation...");

      const evaluationResponse = await generateEvaluationRun(
        worldModelId,
        {
          evaluation_run_name: runName,
          simulation_ids: testCasesToRun,
          metrics: selectedMetrics,
        },
        apiKey,
      );

      const jobId = evaluationResponse.job_id;
      const evaluationRunId = evaluationResponse.evaluation_run_id;
      console.log("Evaluation job started:", { jobId, evaluationRunId });

      // Store evaluation run ID and initial round for hardening
      setCurrentEvaluationRunId(evaluationRunId);
      setCurrentRoundNumber(1);

      // Immediately fetch first status to show running state quickly
      const initialJobStatus = await getEvaluationJobStatus(
        worldModelId,
        jobId,
        apiKey,
      );
      console.log("Initial job status:", initialJobStatus);

      // Update UI immediately with initial status
      const initialTaskMap = new Map(
        initialJobStatus.tasks.map((task) => [task.simulation_id, task]),
      );
      setEvaluationResults((prev: any) => {
        if (!prev) return prev;
        const updatedResults = prev.testCases.map((result: any) => {
          if (!result.id) return result;
          const task = initialTaskMap.get(result.id);
          if (!task) return result;

          let status: "pending" | "running" | "completed" | "failed" =
            "pending";
          if (task.state === "PENDING") status = "pending";
          else if (task.state === "RUNNING" || task.state === "STARTED")
            status = "running";
          else if (task.state === "SUCCESS") status = "completed";
          else if (task.state === "FAILURE") status = "failed";

          return {
            ...result,
            status,
            evaluationId: task.evaluation_id,
            _lastUpdated: Date.now(),
          };
        });

        return {
          ...prev,
          testCases: updatedResults,
          overallProgress: 0,
          isRunning: true,
        };
      });

      // Poll for job status
      let isJobRunning = true;
      const pollInterval = 2000; // 2 seconds

      while (isJobRunning) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const jobStatus = await getEvaluationJobStatus(
          worldModelId,
          jobId,
          apiKey,
        );
        console.log("Job status:", jobStatus);
        console.log(
          "Task states:",
          jobStatus.tasks.map((t) => ({ id: t.simulation_id, state: t.state })),
        );

        // Parse progress
        const [completed, total] = jobStatus.progress.split("/").map(Number);
        const progressPercentage = Math.round((completed / total) * 100);
        console.log(
          "Progress:",
          `${completed}/${total} (${progressPercentage}%)`,
        );

        // Update task statuses
        const taskMap = new Map(
          jobStatus.tasks.map((task) => [task.simulation_id, task]),
        );

        // Update UI with current state
        setEvaluationResults((prev: any) => {
          if (!prev) return prev;

          const updatedResults = prev.testCases.map((result: any) => {
            if (!result.id) {
              console.log("Result has no id, skipping:", result);
              return result;
            }
            const task = taskMap.get(result.id);
            if (!task) {
              console.log("No task found for result id:", result.id);
              return result;
            }

            // Map task state to result status
            let status: "pending" | "running" | "completed" | "failed" =
              "pending";
            if (task.state === "PENDING") status = "pending";
            else if (task.state === "RUNNING" || task.state === "STARTED")
              status = "running";
            else if (task.state === "SUCCESS") status = "completed";
            else if (task.state === "FAILURE") status = "failed";

            console.log(`Mapping result ${result.id}:`, {
              oldStatus: result.status,
              newStatus: status,
              taskState: task.state,
            });

            // Always return new object to ensure React detects change
            return {
              ...result,
              status,
              evaluationId: task.evaluation_id,
              _lastUpdated: Date.now(), // Force object reference change
            };
          });

          const newState = {
            ...prev,
            testCases: updatedResults,
            overallProgress: progressPercentage,
            isRunning:
              jobStatus.summary.pending > 0 || jobStatus.summary.running > 0,
          };

          console.log("Updated evaluation results:", {
            progress: progressPercentage,
            isRunning: newState.isRunning,
            statusCounts: {
              pending: updatedResults.filter((r: any) => r.status === "pending")
                .length,
              running: updatedResults.filter((r: any) => r.status === "running")
                .length,
              completed: updatedResults.filter(
                (r: any) => r.status === "completed",
              ).length,
              failed: updatedResults.filter((r: any) => r.status === "failed")
                .length,
            },
          });

          return newState;
        });

        // Check if job is complete
        if (
          jobStatus.summary.pending === 0 &&
          jobStatus.summary.running === 0
        ) {
          isJobRunning = false;
          console.log("Evaluation job completed");
        }
      }

      // Fetch complete evaluation results
      console.log("Fetching evaluation results...");
      const evaluationRunData = await getEvaluationRun(
        worldModelId,
        evaluationRunId,
        apiKey,
      );
      console.log("Evaluation results:", evaluationRunData);

      // Import getEvaluation for fetching individual evaluation details
      const { getEvaluation } = await import("../services/environmentApi");

      // Transform results to match existing format and fetch detailed evaluation data
      const resultsPromises =
        evaluationRunData.evaluation_run.rounds[0].simulation_results.map(
          async (simResult) => {
            const testCase = selectedTestCaseObjects.find(
              (tc) => tc._id === simResult.simulation_id,
            );
            if (!testCase) return null;

            // Fetch detailed evaluation data to get actual_output and trace
            let actualOutput = "";
            let activityLog: any[] = [];
            try {
              const evalDetail = await getEvaluation(
                worldModelId,
                simResult.evaluation_id,
                apiKey,
              );
              actualOutput = evalDetail.evaluation.actual_output;
              // Parse trace JSON string
              if (evalDetail.evaluation.trace) {
                try {
                  activityLog = JSON.parse(evalDetail.evaluation.trace);
                } catch (e) {
                  console.warn("Failed to parse trace:", e);
                }
              }
            } catch (error) {
              console.warn(
                `Failed to fetch evaluation details for ${simResult.evaluation_id}:`,
                error,
              );
            }

            // Convert scores to UI format
            const evaluationScores: Record<string, any> = {};
            let hasFailedMetric = false;

            for (const [metric, rawScore] of Object.entries(simResult.scores)) {
              const scoreValue = typeof rawScore === "number" ? rawScore : 0;
              const percentage = Math.round(scoreValue * 100);
              let status = "pass";

              if (["hallucinations", "bias", "toxicity"].includes(metric)) {
                // For negative metrics: fail if > 30%
                if (scoreValue > 0.3) {
                  status = "fail";
                  hasFailedMetric = true;
                }
              } else {
                // For positive metrics: fail if < 75%
                if (scoreValue < 0.75) {
                  status = "fail";
                  hasFailedMetric = true;
                }
              }

              evaluationScores[metric] = {
                score: percentage,
                status: status,
                rawScore: scoreValue,
              };
            }

            // Determine status based on metric scores, not judgment
            const resultStatus = hasFailedMetric ? "failed" : "completed";

            return {
              id: simResult.simulation_id,
              name: simResult.simulation_name,
              status: resultStatus,
              scenario: simResult.scenario_id,
              persona: simResult.persona_id,
              scenarioName: simResult.scenario_name,
              personaName: simResult.persona_name,
              userInput: testCase.user_input,
              agentResponse: actualOutput,
              expectedOutput: testCase.expected_output,
              metrics: evaluationScores,
              duration: 0, // Not provided by new API (could calculate from trace)
              evaluationId: simResult.evaluation_id,
              judgment: simResult.judgment,
              overallScore: simResult.overall_score,
              reasoning: simResult.reasoning,
              issues: simResult.issues,
              fixes: simResult.fixes,
              activityLog: activityLog,
            };
          },
        );

      const results = (await Promise.all(resultsPromises)).filter(
        (r): r is NonNullable<typeof r> => r !== null,
      );

      console.log("All simulations completed with evaluation!");
      console.log("Final results:", results);

      // Update state with all results
      setEvaluationResults((prev: any) => ({
        ...prev!,
        testCases: results,
        overallProgress: 100,
        isRunning: false,
      }));

      // Note: Evaluation runs are automatically saved by the Environment API backend
      // No need to manually save them here

      return results;
    } catch (error) {
      console.error("Failed to run test cases:", error);
      return [];
    } finally {
      setIsEvaluationRunning(false);
    }
  };

  const handleScenarioToggle = (scenarioId: string, checked: boolean) => {
    if (checked) {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    } else {
      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId));
    }
  };

  const handlePersonaToggle = (personaId: string, checked: boolean) => {
    if (checked) {
      setSelectedPersonas([...selectedPersonas, personaId]);
    } else {
      setSelectedPersonas(selectedPersonas.filter((id) => id !== personaId));
    }
  };

  const handleGenerateMoreScenarios = async () => {
    if (!worldModelId || !apiKey || isGeneratingScenarios) return;

    try {
      setIsGeneratingScenarios(true);
      toast.info("Generating more scenarios...");

      const { generateScenarios } = await import("../services/environmentApi");
      await generateScenarios(worldModelId, apiKey);

      // Reload the world model details to get the new scenarios
      await loadWorldModelDetails();

      toast.success("Scenarios generated successfully");
    } catch (error: any) {
      console.error("Failed to generate scenarios:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to generate scenarios";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingScenarios(false);
    }
  };

  const handleGenerateMorePersonas = async () => {
    if (!worldModelId || !apiKey || isGeneratingPersonas) return;

    try {
      setIsGeneratingPersonas(true);
      toast.info("Generating more personas...");

      const { generatePersonas } = await import("../services/environmentApi");
      await generatePersonas(worldModelId, apiKey);

      // Reload the world model details to get the new personas
      await loadWorldModelDetails();

      toast.success("Personas generated successfully");
    } catch (error: any) {
      console.error("Failed to generate personas:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to generate personas";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingPersonas(false);
    }
  };

  const handleAddScenario = async () => {
    if (!newScenario.name || !newScenario.description) return;

    setIsCreating(true);
    const success = await addScenario(newScenario);
    if (success) {
      setNewScenario({ name: "", description: "" });
      setIsAddScenarioOpen(false);
    }
    setIsCreating(false);
  };

  const handleAddPersona = async () => {
    if (!newPersona.name || !newPersona.description) return;

    setIsCreating(true);
    const success = await addPersona(newPersona);
    if (success) {
      setNewPersona({ name: "", description: "" });
      setIsAddPersonaOpen(false);
    }
    setIsCreating(false);
  };

  const handleAddTestCase = async () => {
    if (
      !newTestCase.name ||
      !newTestCase.user_input ||
      !newTestCase.expected_output ||
      !newTestCase.scenario_id ||
      !newTestCase.persona_id
    )
      return;

    setIsCreating(true);
    const success = await addManualTestCase(newTestCase);
    if (success) {
      setNewTestCase({
        name: "",
        user_input: "",
        expected_output: "",
        scenario_id: "",
        persona_id: "",
      });
      setIsAddTestCaseOpen(false);
    }
    setIsCreating(false);
  };

  const handleImportSimulationsCsv = async (file: File) => {
    if (!worldModelId || !apiKey) {
      toast.error("Missing environment context or API key");
      return;
    }

    try {
      const { importSimulationsCsv } = await import("../services/environmentApi");
      await importSimulationsCsv(worldModelId, file, apiKey);
      await loadWorldModelDetails();
      toast.success("Simulations imported successfully");
    } catch (error: any) {
      console.error("Failed to import simulations CSV:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to import simulations CSV";
      toast.error(message);
    }
  };

  // Agent Hardening handlers
  const handleImproveAgent = async (
    selectedTestCases: any[],
    currentAgent: any,
  ) => {
    try {
      toast.info(
        "Analyzing simulations evaluation results and hardeneing agent configuration...",
      );

      const improvedConfig = await improveAgentFromResults(
        selectedTestCases,
        currentAgent,
        apiKey,
      );

      toast.success("Agent configuration hardened successfully!");
      return improvedConfig;
    } catch (error) {
      console.error("Failed to improve agent:", error);
      toast.error("Failed to improve agent configuration");
      throw error;
    }
  };

  const handleApplyChanges = async (improvedConfig: any) => {
    if (!sourceAgent) {
      toast.error("No source agent available to update");
      return;
    }

    try {
      toast.info("Applying hardened configuration to source agent...");

      // Import the agent service functions
      const { updateAgentComplete } = await import(
        "../../orchestration/app/services/agentService"
      );

      // Update source agent with improved goal and instructions while preserving all other fields
      const updatedSourceAgentData = {
        ...sourceAgent,
        agent_goal: improvedConfig.goal,
        agent_instructions: improvedConfig.instructions,
      };

      // Update source agent
      await updateAgentComplete(sourceAgent._id, updatedSourceAgentData);

      toast.success("Agent configuration hardened successfully!", {
        description:
          "Source agent has been updated with the improved goal and instructions.",
      });

      // Log to console for reference
      console.log("Hardened Agent Configuration Applied:", {
        sourceAgentId: sourceAgent._id,
        sourceAgentName: sourceAgent.name,
        goal: improvedConfig.goal,
        instructions: improvedConfig.instructions,
        changes: improvedConfig.changeSummary,
      });

      // Optional: Download as JSON for backup
      const dataStr = JSON.stringify(
        {
          source_agent_id: sourceAgent._id,
          source_agent_name: sourceAgent.name,
          agent_role: improvedConfig.role,
          agent_goal: improvedConfig.goal,
          agent_instructions: improvedConfig.instructions,
          change_summary: improvedConfig.changeSummary,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      );

      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `hardened-agent-config-${Date.now()}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Failed to apply hardened configuration:", error);
      toast.error("Failed to apply hardened configuration", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col space-y-4 p-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!worldModel || !sourceAgent) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gray-500/10 blur-3xl"></div>
          <img
            src="/images/empty.svg"
            alt="Environment not found"
            className="relative h-48 w-48 opacity-80"
          />
        </div>
        <div className="max-w-md space-y-2 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Environment Not Found
          </h2>
          <p className="text-gray-500">
            The requested environment could not be found.
          </p>
        </div>
        <Button onClick={() => navigate("/agent-simulation-engine")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Evals
        </Button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex h-full w-full flex-col space-y-6 p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {worldModel.name}
            </h1>
            <p className="text-gray-600">
              {currentStep === 1
                ? "Configure scenarios and simulations"
                : currentStep === 2
                  ? "Select metrics for evaluation"
                  : currentStep === 3
                    ? "View results and improve agent"
                    : "Export agent to external frameworks"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/agent-simulation-engine")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evals
          </Button>
        </div>

        {/* Tabs */}
        <EvaluationTabs
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
        />

        {/* Step Content */}

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <WorldModelStep
                scenarios={scenarios}
                personas={personas}
                testCases={testCases}
                selectedScenarios={selectedScenarios}
                selectedPersonas={selectedPersonas}
                sourceAgent={sourceAgent}
                worldModelId={worldModelId!}
                isGeneratingTestCases={isGeneratingTestCases}
                isGeneratingScenarios={isGeneratingScenarios}
                isGeneratingPersonas={isGeneratingPersonas}
                onScenarioToggle={handleScenarioToggle}
                onPersonaToggle={handlePersonaToggle}
                onScenarioDelete={removeScenario}
                onPersonaDelete={removePersona}
                onSimulationDelete={removeSimulation}
                onBulkSimulationDelete={removeBulkSimulations}
                onSelectAllScenarios={setSelectedScenarios}
                onSelectAllPersonas={setSelectedPersonas}
                onAddScenarioClick={() => setIsAddScenarioOpen(true)}
                onAddPersonaClick={() => setIsAddPersonaOpen(true)}
                onAddTestCaseClick={() => setIsAddTestCaseOpen(true)}
                onImportSimulationsCsv={handleImportSimulationsCsv}
                onGenerateTestCases={generateTestCasesForWorldModel}
                onGenerateMoreScenarios={handleGenerateMoreScenarios}
                onGenerateMorePersonas={handleGenerateMorePersonas}
                onEvaluationRequest={handleEvaluationRequest}
                selectedTestCases={selectedTestCases}
                onTestCaseSelectionChange={setSelectedTestCases}
              />

              {/* Job Progress Card */}
              {currentJobId && worldModelId && (
                <JobProgressCard
                  jobId={currentJobId}
                  worldModelId={worldModelId}
                  apiKey={apiKey}
                  onComplete={handleTestCaseJobComplete}
                  onCancel={handleJobCancel}
                  onError={handleJobError}
                  pollInterval={2000}
                />
              )}
            </div>
          )}

          {currentStep === 2 && (
            <MetricsSelectionStep
              agent={sourceAgent}
              categories={categories}
              expandedCategories={expandedCategories}
              getEnabledMetricsCount={getEnabledMetricsCount}
              toggleCategory={toggleCategory}
              toggleMetric={toggleMetric}
              toggleCategoryExpansion={toggleCategoryExpansion}
              onRunEvaluation={handleRunEvaluationFromStep}
              selectedTestCasesCount={selectedTestCases.length}
            />
          )}

          {currentStep === 3 && (
            <SimulationAnalysis
              evaluationResults={evaluationResults}
              isRunning={isEvaluationRunning}
              scenarios={scenarios}
              personas={personas}
              worldModelId={worldModelId}
              agentId={sourceAgent?._id}
              agentName={sourceAgent?.name}
              selectedMetrics={getSelectedMetrics()}
              sourceAgent={sourceAgent}
              evaluationRunId={currentEvaluationRunId}
              currentRound={currentRoundNumber}
              onImproveAgent={handleImproveAgent}
              onApplyChanges={handleApplyChanges}
              onRunEvaluation={handleRunEvaluation}
              onEvaluationUpdate={setEvaluationResults}
            />
          )}

          {currentStep === 4 && (
            <>
              {isExternalAgent ? (
                <AgentMigrateStep sourceAgent={sourceAgent} />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6 py-16">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gray-500/10 blur-3xl"></div>
                    <img
                      src="/images/no-tools.svg"
                      alt="Not supported"
                      className="relative h-48"
                    />
                  </div>
                  <div className="max-w-md space-y-3 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Migration Not Supported
                    </h2>
                    <p className="text-gray-600">
                      Agent migration is only available for external agents
                      imported from other frameworks.
                    </p>
                    <p className="text-sm text-gray-500">
                      To use this feature, import an agent from LangGraph,
                      CrewAI, or other supported frameworks using the "Import
                      Agent" button on the dashboard.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>

      <AddScenarioDialog
        isOpen={isAddScenarioOpen}
        onClose={() => setIsAddScenarioOpen(false)}
        scenario={newScenario}
        onScenarioChange={setNewScenario}
        onAdd={handleAddScenario}
        isCreating={isCreating}
      />

      <AddPersonaDialog
        isOpen={isAddPersonaOpen}
        onClose={() => setIsAddPersonaOpen(false)}
        persona={newPersona}
        onPersonaChange={setNewPersona}
        onAdd={handleAddPersona}
        isCreating={isCreating}
      />

      <AddTestCaseDialog
        isOpen={isAddTestCaseOpen}
        onClose={() => setIsAddTestCaseOpen(false)}
        testCase={newTestCase}
        onTestCaseChange={setNewTestCase}
        onAdd={handleAddTestCase}
        isCreating={isCreating}
        scenarios={scenarios}
        personas={personas}
      />

      <EvaluationMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        agent={sourceAgent!}
        onStartEvaluation={handleRunEvaluation}
      />
    </>
  );
}

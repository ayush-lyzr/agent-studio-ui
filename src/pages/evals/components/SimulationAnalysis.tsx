import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  User,
  FileText,
  Activity,
  Loader2,
  CheckCircle2,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Agent } from "../types/agent";
// OLD AGENT VERSIONS API - NO LONGER NEEDED
// import { fetchAgentVersions } from '../utils/api';
import useStore from "@/lib/store";
// OLD SESSION SERVICE - NO LONGER NEEDED
// Evaluation runs and rounds are now persisted by the Environment API backend
// import { createEvaluationSession, updateEvaluationSession, getEvaluationSession } from '../services/evaluation-session.service';

// Import new tab components
import { SubTabNavigation } from "./simulation-analysis/SubTabNavigation";
import { OverviewTab } from "./simulation-analysis/OverviewTab";
import { DetailedReportTab } from "./simulation-analysis/DetailedReportTab";
import MarkdownRenderer from "@/components/custom/markdown";

interface SimulationResult {
  id: string;
  name: string;
  status: "completed" | "running" | "failed" | "pending";
  scenario: string;
  persona: string;
  userInput: string;
  agentResponse?: string;
  expectedOutput?: string;
  metrics: {
    [key: string]: {
      score: number;
      status: "pass" | "fail";
      details?: string;
      rawScore?: number;
    };
  };
  duration?: number;
  scenarioName?: string;
  personaName?: string;
  evaluationId?: string;
  activityLog?: any[];
}

interface ImprovedConfig {
  role: string;
  goal: string;
  instructions: string;
  changeSummary: string[];
}

interface LoopResult {
  loop: number;
  label: string;
  improved: ImprovedConfig | null;
  testResults: SimulationResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface SimulationAnalysisProps {
  evaluationResults?: {
    testCases: SimulationResult[];
    overallProgress: number;
    isRunning: boolean;
  };
  isRunning?: boolean;
  scenarios?: any[];
  personas?: any[];
  worldModelId?: string;
  agentId?: string;
  agentName?: string;
  selectedMetrics?: string[];
  sourceAgent: Agent | null;
  evaluationRunId?: string | null;
  currentRound?: number;
  onImproveAgent: (
    selectedTestCases: SimulationResult[],
    currentAgent: Agent,
  ) => Promise<ImprovedConfig>;
  onApplyChanges?: (improvedConfig: ImprovedConfig) => void;
  onRunEvaluation?: (
    selectedMetrics: string[],
    runName: string,
    hardenedAgentConfig?: any,
    testCaseIds?: string[],
  ) => Promise<any[]>;
  onEvaluationUpdate?: (results: any) => void;
}

export const SimulationAnalysis: React.FC<SimulationAnalysisProps> = ({
  evaluationResults,
  scenarios = [],
  personas = [],
  worldModelId,
  sourceAgent,
  evaluationRunId: propEvaluationRunId,
  currentRound: propCurrentRound,
  onApplyChanges,
  onEvaluationUpdate,
}) => {
  const apiKey = useStore((state) => state.api_key);

  // NEW: Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "detailed">(
    "overview",
  );

  // State for simulation results viewing
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const [evaluationDetail, setEvaluationDetail] = useState<any>(null);

  // State for agent hardening
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<string[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedConfig, setImprovedConfig] = useState<ImprovedConfig | null>(
    null,
  );
  const [editableGoal, setEditableGoal] = useState<string>("");
  const [editableInstructions, setEditableInstructions] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "failed">("all");

  // Automated RL Loop state
  const [isAutoHardening, setIsAutoHardening] = useState(false);
  const [currentLoop, setCurrentLoop] = useState<number>(0);
  const [maxLoops, setMaxLoops] = useState<number>(3);
  const [loopResults, setLoopResults] = useState<any[]>([]);
  const [hardeningStatus, setHardeningStatus] = useState<string>("");
  const [currentSimulation, setCurrentSimulation] = useState<number>(0);
  const [totalSimulations, setTotalSimulations] = useState<number>(0);

  // OLD VERSION-RELATED STATE - NO LONGER NEEDED
  // Agent versions are now managed through evaluation runs and rounds
  // const [agentVersions, setAgentVersions] = useState<any[]>([]);
  // const [, setIsLoadingVersions] = useState(false);

  // Evaluation runs history state
  const [showEvaluationRuns, setShowEvaluationRuns] = useState(false);
  const [evaluationRuns, setEvaluationRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Track current evaluation run for hardening
  const [currentEvaluationRunId, setCurrentEvaluationRunId] = useState<
    string | null
  >(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);

  // Sync with props when evaluation run ID or round changes from parent
  React.useEffect(() => {
    if (propEvaluationRunId) {
      setCurrentEvaluationRunId(propEvaluationRunId);
    }
  }, [propEvaluationRunId]);

  React.useEffect(() => {
    if (propCurrentRound) {
      setCurrentRoundNumber(propCurrentRound);
    }
  }, [propCurrentRound]);

  // Get results from current evaluation
  const results = evaluationResults?.testCases || [];

  // Debug: Log when results change
  React.useEffect(() => {
    if (results.length > 0) {
      console.log("[SimulationAnalysis] Results received:", {
        count: results.length,
        statuses: results.map((r: any) => ({
          id: r.id,
          status: r.status,
          _lastUpdated: r._lastUpdated,
        })),
      });
    }
  }, [results]);

  // Create initial loop result when evaluation completes (only if no loop results exist)
  React.useEffect(() => {
    if (
      isAutoHardening ||
      evaluationResults?.isRunning ||
      results.length === 0
    ) {
      return;
    }

    const completedResults = results.filter(
      (tc) => tc.status === "completed" || tc.status === "failed",
    );

    if (completedResults.length !== results.length) {
      return;
    }

    const passedCount = completedResults.filter((tc) => {
      if (tc.status === "failed") return false;
      if (tc.status === "completed" && tc.metrics) {
        return !Object.values(tc.metrics).some(
          (metric: any) => metric.status === "fail",
        );
      }
      return true;
    }).length;

    const initialLoopResult: LoopResult = {
      loop: 0,
      label: "Initial Run",
      improved: null,
      testResults: results,
      allPassed: passedCount === results.length,
      passedCount,
      totalCount: results.length,
    };

    setLoopResults((prev) => {
      if (!prev || prev.length === 0) {
        return [initialLoopResult];
      }

      const hasMultipleLoops = prev.some(
        (loopResult) => loopResult.loop > 0 || loopResult.improved,
      );

      if (!hasMultipleLoops && prev.length === 1) {
        const prevKey = prev[0].testResults
          // @ts-ignore
          .map((r) => `${r.id}:${r.status}`)
          .join("|");
        const newKey = initialLoopResult.testResults
          .map((r) => `${r.id}:${r.status}`)
          .join("|");

        if (prevKey !== newKey) {
          return [initialLoopResult];
        }
      }

      return prev;
    });
  }, [results, isAutoHardening, evaluationResults?.isRunning]);

  // Helper function to get test case property values (handles different formats)
  const getTestCaseValue = (testCase: any, property: string) => {
    switch (property) {
      case "userInput":
        console.log({ testCase });
        return testCase.user_input || testCase.userInput || "";
      case "expectedOutput":
        return testCase.expected_output || testCase.expectedOutput || "";
      case "agentResponse":
        return testCase.agent_response || testCase.agentResponse || "";
      default:
        return testCase[property] || "";
    }
  };

  // Filter test cases based on mode
  const filteredTestCases = useMemo(() => {
    const completed = results.filter(
      (tc) => tc.status === "completed" || tc.status === "failed",
    );

    switch (filterMode) {
      case "failed":
        return completed.filter((tc) => {
          if (tc.status === "failed") return true;
          if (tc.status === "completed") {
            const hasFailedMetric =
              tc.metrics &&
              Object.values(tc.metrics).some(
                (metric: any) => metric.status === "fail",
              );
            return hasFailedMetric;
          }
          return false;
        });
      default:
        return completed;
    }
  }, [results, filterMode]);

  // Auto-select all test cases when results are loaded
  useEffect(() => {
    if (results.length > 0 && selectedTestCaseIds.length === 0) {
      const allTestIds = results.map((tc) => tc.id);
      setSelectedTestCaseIds(allTestIds);
    }
  }, [results.length]);

  // OLD: Load agent versions - NO LONGER NEEDED
  // Agent version history is now tracked through evaluation run rounds
  // useEffect(() => {
  //   if (sourceAgent && apiKey) {
  //     loadAgentVersions();
  //   }
  // }, [sourceAgent?._id, apiKey]);

  // Auto-load most recent evaluation run when component mounts (if no results)
  useEffect(() => {
    const autoLoadLatestRun = async () => {
      if (worldModelId && apiKey && !evaluationResults) {
        try {
          const { listEvaluationRuns } = await import(
            "../services/environmentApi"
          );
          const response = await listEvaluationRuns(worldModelId, apiKey);
          const runs = response.evaluation_runs || [];

          if (runs.length > 0) {
            const mostRecentRun = runs[0];
            console.log(
              "Auto-loading most recent evaluation run on mount:",
              mostRecentRun.evaluation_run_name,
            );
            await handleLoadEvaluationRun(mostRecentRun.evaluation_run_id);
          }
        } catch (error) {
          console.error("Failed to auto-load evaluation run:", error);
          // Don't show error toast - this is optional auto-load
        }
      }
    };

    autoLoadLatestRun();
  }, [worldModelId, apiKey]); // Only run once on mount

  // OLD: loadAgentVersions - NO LONGER NEEDED
  // Agent versions are now managed through evaluation runs and rounds
  /* DEPRECATED
  const loadAgentVersions = async () => { ... }
  */

  const loadEvaluationRuns = async () => {
    if (!worldModelId || !apiKey) return;

    setLoadingRuns(true);
    try {
      const { listEvaluationRuns } = await import("../services/environmentApi");
      const response = await listEvaluationRuns(worldModelId, apiKey);
      const runs = response.evaluation_runs || [];
      setEvaluationRuns(runs);

      // Auto-load the most recent run (first in the list)
      if (runs.length > 0 && !evaluationResults) {
        const mostRecentRun = runs[0];
        console.log(
          "Auto-loading most recent evaluation run:",
          mostRecentRun.evaluation_run_name,
        );
        await handleLoadEvaluationRun(mostRecentRun.evaluation_run_id);
      }
    } catch (error) {
      console.error("Failed to load evaluation runs:", error);
      toast.error("Failed to load evaluation runs");
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleLoadEvaluationRun = async (runId: string) => {
    if (!worldModelId || !apiKey) return;

    try {
      const { getEvaluationRun } = await import("../services/environmentApi");
      const response = await getEvaluationRun(worldModelId, runId, apiKey);

      // Transform the evaluation run data into the format expected by the UI
      const run = response.evaluation_run;

      // Store the evaluation run ID for hardening
      setCurrentEvaluationRunId(run.id);

      // Get the latest round
      const latestRound = run.rounds[run.rounds.length - 1];
      setCurrentRoundNumber(latestRound?.round_number || 1);

      if (!run.rounds || run.rounds.length === 0) {
        toast.error("No rounds found in this evaluation run");
        return;
      }

      // Transform ALL rounds into loopResults format for round-by-round display
      const transformedLoopResults: LoopResult[] = run.rounds.map(
        (round, index) => {
          // Transform simulation results for this round
          const roundResults = round.simulation_results.map((simResult) => {
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

            const resultStatus = hasFailedMetric ? "failed" : "completed";

            return {
              id: simResult.simulation_id,
              name: simResult.simulation_name,
              status: resultStatus as "completed" | "failed",
              scenario: simResult.scenario_id,
              persona: simResult.persona_id,
              scenarioName: simResult.scenario_name,
              personaName: simResult.persona_name,
              metrics: evaluationScores,
              evaluationId: simResult.evaluation_id,
              reasoning: simResult.reasoning,
              issues: simResult.issues,
              fixes: simResult.fixes,
              userInput: "", // Will be loaded when opening details
              expectedOutput: "", // Will be loaded when opening details
              agentResponse: "", // Will be loaded when opening details
            } as SimulationResult;
          });

          // Calculate pass/fail counts for this round
          const passedCount = roundResults.filter(
            (r) => r.status === "completed",
          ).length;
          const totalCount = roundResults.length;
          const allPassed = passedCount === totalCount;

          // Create loop result entry
          return {
            loop: index,
            label: index === 0 ? "Initial Run" : `RL Loop ${index}`,
            improved:
              index > 0
                ? {
                    role: round.agent_config.agent_role,
                    goal: round.agent_config.agent_goal,
                    instructions: round.agent_config.agent_instructions,
                    changeSummary: [
                      `Hardened configuration from Round ${index}`,
                    ],
                  }
                : null,
            testResults: roundResults,
            allPassed,
            passedCount,
            totalCount,
          };
        },
      );

      // Set the loop results for round-by-round display
      setLoopResults(transformedLoopResults);

      // Use the latest round's results for the main view
      const latestRoundResults =
        transformedLoopResults[transformedLoopResults.length - 1].testResults;

      // Update the evaluation results with latest round
      if (onEvaluationUpdate) {
        onEvaluationUpdate({
          testCases: latestRoundResults,
          overallProgress: 100,
          isRunning: false,
          summary: {
            total: latestRoundResults.length,
            completed: latestRoundResults.filter(
              (r: any) => r.status === "completed",
            ).length,
            failed: latestRoundResults.filter((r: any) => r.status === "failed")
              .length,
            running: 0,
            pending: 0,
          },
        });
      }

      // If there are multiple rounds, show the improved config from the latest round
      if (transformedLoopResults.length > 1) {
        const latestImproved =
          transformedLoopResults[transformedLoopResults.length - 1].improved;
        if (latestImproved) {
          setImprovedConfig(latestImproved);
          setEditableGoal(latestImproved.goal);
          setEditableInstructions(latestImproved.instructions);
        }
      }

      setShowEvaluationRuns(false);
      toast.success(
        `Loaded evaluation run: ${run.evaluation_run_name} (${transformedLoopResults.length} round${transformedLoopResults.length > 1 ? "s" : ""})`,
      );
    } catch (error) {
      console.error("Failed to load evaluation run details:", error);
      toast.error("Failed to load evaluation run details");
    }
  };

  const openResultDetails = async (result: any) => {
    setSelectedResult(result);
    setIsSheetOpen(true);
    setEvaluationDetail(null);

    // Fetch detailed evaluation data if evaluationId is available
    if (result.evaluationId && worldModelId && apiKey) {
      setIsLoadingEvaluation(true);
      try {
        const { getEvaluation } = await import("../services/environmentApi");
        const evalData = await getEvaluation(
          worldModelId,
          result.evaluationId,
          apiKey,
        );
        console.log("Fetched evaluation detail:", evalData);
        setEvaluationDetail(evalData.evaluation);
      } catch (error) {
        console.error("Failed to fetch evaluation details:", error);
        toast.error("Failed to load detailed evaluation data");
      } finally {
        setIsLoadingEvaluation(false);
      }
    }
  };

  const toggleSelection = (testCaseId: string) => {
    setSelectedTestCaseIds((prev) =>
      prev.includes(testCaseId)
        ? prev.filter((id) => id !== testCaseId)
        : [...prev, testCaseId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedTestCaseIds.length === filteredTestCases.length) {
      // Deselect all
      setSelectedTestCaseIds([]);
    } else {
      // Select all filtered test cases
      setSelectedTestCaseIds(filteredTestCases.map((tc) => tc.id));
    }
  };

  const isAllSelected =
    filteredTestCases.length > 0 &&
    selectedTestCaseIds.length === filteredTestCases.length;
  const isSomeSelected =
    selectedTestCaseIds.length > 0 &&
    selectedTestCaseIds.length < filteredTestCases.length;

  // OLD SESSION STATE FUNCTIONS - NO LONGER NEEDED
  // The new Environment API automatically persists all evaluation runs and rounds
  // Session state is replaced by the evaluation run's round history

  /* DEPRECATED - Removed old session management
  const saveSessionState = async () => { ... }
  const loadSessionState = async (sessionId: string) => { ... }
  */

  // Handle automated hardening with RL loops
  const handleAutomatedHardening = async () => {
    if (!sourceAgent || selectedTestCaseIds.length === 0) return;

    setIsAutoHardening(true);
    setCurrentLoop(1);
    setTotalSimulations(selectedTestCaseIds.length);
    setHardeningStatus("Preparing automated hardening...");

    // Keep ALL originally selected test cases (never changes during loops)
    const allSelectedTestCases = results.filter((tc) =>
      selectedTestCaseIds.includes(tc.id),
    );
    const allTestCaseIds = allSelectedTestCases.map((tc) => tc.id);

    // Track round number locally (state updates are async and won't reflect in time)
    let localRoundNumber = currentRoundNumber;

    console.log(
      `Starting auto-hardening with ${allSelectedTestCases.length} test cases`,
    );

    // For Initial Run, show ALL test results (not just selected ones)
    const allTestsPassed = results.filter((tc) => {
      if (tc.status === "failed") return false;
      if (tc.status === "completed" && tc.metrics) {
        const hasFailedMetric = Object.values(tc.metrics).some(
          (metric: any) => metric.status === "fail",
        );
        return !hasFailedMetric;
      }
      return true;
    }).length;

    setLoopResults([
      {
        loop: 0,
        label: "Initial Run",
        improved: null,
        testResults: results, // Show ALL test results in Initial Run
        allPassed: allTestsPassed === results.length,
        passedCount: allTestsPassed,
        totalCount: results.length,
      },
    ]);

    // Note: Session state is automatically saved by the Environment API backend
    // Each round is persisted as part of the evaluation run

    let currentAgent = sourceAgent;
    let currentResults = allSelectedTestCases; // Track current run results

    // Support unlimited loops (maxLoops = 999 means unlimited)
    const isUnlimited = maxLoops === 999;
    let loop = 1;

    while (isUnlimited || loop <= maxLoops) {
      setCurrentLoop(loop);
      setHardeningStatus(
        `Starting RL Loop ${loop}${isUnlimited ? "" : `/${maxLoops}`}...`,
      );

      try {
        // Phase 1: Analyze failures from current results
        setHardeningStatus(`RL Loop ${loop}: Analyzing failures...`);
        const failedTestCases = currentResults.filter((tc) => {
          if (tc.status === "failed") return true;
          if (tc.status === "completed" && tc.metrics) {
            return Object.values(tc.metrics).some(
              (metric: any) =>
                metric.status === "fail" || metric.status === "warning",
            );
          }
          return false;
        });

        console.log(
          `RL Loop ${loop} - Phase 1: Analyzing ${failedTestCases.length} failed test cases out of ${currentResults.length} total`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // If no failures, we're done early
        if (failedTestCases.length === 0) {
          toast.success(`🎉 All tests passed! No need for Loop ${loop}.`);
          break;
        }

        // Phase 2: Improve agent based on selected test results
        setHardeningStatus(`RL Loop ${loop}: Hardening agent configuration...`);
        console.log(
          `RL Loop ${loop} - Phase 2: Hardening agent configuration based on ${currentResults.length} test cases (${failedTestCases.length} failed, ${currentResults.length - failedTestCases.length} passed)`,
        );

        // Get evaluation IDs from current results for hardening
        const evaluationIdsForHardening = currentResults
          .map((tc) => tc.evaluationId)
          .filter((id) => id !== undefined && id !== null) as string[];

        console.log(
          `Calling hardening with ${evaluationIdsForHardening.length} evaluation IDs`,
        );

        // Call the hardening API with selected evaluation IDs
        const { requestAgentHardening } = await import(
          "../services/environmentApi"
        );
        const hardeningResponse = await requestAgentHardening(
          worldModelId!,
          currentEvaluationRunId!,
          {
            round_number: localRoundNumber,
            evaluation_ids: evaluationIdsForHardening,
          },
          apiKey!,
        );

        const improved: ImprovedConfig = {
          role: hardeningResponse.improved_config.agent_role,
          goal: hardeningResponse.improved_config.agent_goal,
          instructions: hardeningResponse.improved_config.agent_instructions,
          changeSummary: ["Hardened based on selected test cases"],
        };

        console.log("Hardening completed, improved config received");

        // Phase 3: Continue evaluation run with new round (improved agent config)
        setHardeningStatus(
          `RL Loop ${loop}: Creating new round from Round ${localRoundNumber}...`,
        );
        setCurrentSimulation(0);
        console.log(
          `RL Loop ${loop} - Phase 3: Continuing evaluation run from Round ${localRoundNumber}`,
          {
            evaluationRunId: currentEvaluationRunId,
            currentRound: localRoundNumber,
            improvedAgent: {
              role: improved.role,
              goal: improved.goal,
              instructions: improved.instructions.substring(0, 100) + "...",
            },
          },
        );
        toast.info(
          `Creating new evaluation round with hardened agent config - ${allTestCaseIds.length} test cases`,
        );

        let newTestResults: any[] = [];
        if (
          currentEvaluationRunId &&
          worldModelId &&
          apiKey &&
          allTestCaseIds.length > 0
        ) {
          try {
            const {
              continueEvaluationRun,
              getEvaluationJobStatus,
              getEvaluationRun,
            } = await import("../services/environmentApi");

            // Continue evaluation run with new round using improved config from hardening
            // Note: round_number is the CURRENT round we're continuing FROM
            // If current round is 1, we pass round_number: 1 to create Round 2
            console.log(
              `Continuing from Round ${localRoundNumber} with improved config from hardening`,
            );
            console.log("Improved config:", {
              role: improved.role,
              goal: improved.goal,
              instructions: improved.instructions.substring(0, 200) + "...",
            });

            // Check if all simulations are selected
            // If all are selected, don't pass simulation_ids (backend will run all)
            const allSimulationsSelected =
              allTestCaseIds.length === results.length;

            if (allSimulationsSelected) {
              console.log(
                `Running on ALL ${results.length} simulations (all selected)`,
              );
            } else {
              console.log(
                `Running on ${allTestCaseIds.length} selected simulations:`,
                allTestCaseIds,
              );
            }

            const continueRequest: any = {
              round_number: localRoundNumber, // Current round (to create next round)
              agent_config: {
                agent_role: improved.role,
                agent_goal: improved.goal,
                agent_instructions: improved.instructions,
              },
            };

            // Only pass simulation_ids if not all simulations are selected
            if (!allSimulationsSelected) {
              continueRequest.simulation_ids = allTestCaseIds;
            }

            const continueResponse = await continueEvaluationRun(
              worldModelId,
              currentEvaluationRunId,
              continueRequest,
              apiKey,
            );

            const jobId = continueResponse.job_id;
            const createdRoundNumber = continueResponse.round_number;
            console.log(`New Round ${createdRoundNumber} job started:`, {
              jobId,
              roundNumber: createdRoundNumber,
            });

            // Add placeholder loop result entry for this round (will be updated when complete)
            setLoopResults((prev) => [
              ...prev,
              {
                loop,
                label: `RL Loop ${loop}`,
                improved,
                testResults: [],
                allPassed: false,
                passedCount: 0,
                totalCount: allTestCaseIds.length,
              },
            ]);

            // Poll for job completion and update results in real-time
            let isJobRunning = true;
            const pollInterval = 2000;
            let lastUpdateTime = 0;
            const updateInterval = 3000; // Update honeycomb every 3 seconds

            while (isJobRunning) {
              await new Promise((resolve) => setTimeout(resolve, pollInterval));

              const jobStatus = await getEvaluationJobStatus(
                worldModelId,
                jobId,
                apiKey,
              );
              const [completed, total] = jobStatus.progress
                .split("/")
                .map(Number);
              const progressPercentage = Math.round((completed / total) * 100);

              setHardeningStatus(
                `RL Loop ${loop}: Round ${createdRoundNumber} progress ${progressPercentage}%`,
              );
              setCurrentSimulation(completed);
              setTotalSimulations(total);

              // Fetch and update partial results during polling (throttled)
              const now = Date.now();
              if (completed > 0 && now - lastUpdateTime > updateInterval) {
                try {
                  console.log(
                    `[RL Loop ${loop}] Fetching partial results for Round ${createdRoundNumber}...`,
                  );
                  const partialRunData = await getEvaluationRun(
                    worldModelId,
                    currentEvaluationRunId,
                    apiKey,
                  );
                  const currentRound =
                    partialRunData.evaluation_run.rounds.find(
                      (r) => r.round_number === createdRoundNumber,
                    );
                  console.log(
                    `[RL Loop ${loop}] Found round:`,
                    currentRound
                      ? `Yes (${currentRound.simulation_results?.length} results)`
                      : "No",
                  );

                  if (
                    currentRound &&
                    currentRound.simulation_results &&
                    currentRound.simulation_results.length > 0
                  ) {
                    // Transform partial results
                    const partialResults = currentRound.simulation_results.map(
                      (simResult) => {
                        const evaluationScores: Record<string, any> = {};
                        let hasFailedMetric = false;

                        for (const [metric, rawScore] of Object.entries(
                          simResult.scores,
                        )) {
                          const scoreValue =
                            typeof rawScore === "number" ? rawScore : 0;
                          const percentage = Math.round(scoreValue * 100);
                          let status = "pass";

                          if (
                            ["hallucinations", "bias", "toxicity"].includes(
                              metric,
                            )
                          ) {
                            if (scoreValue > 0.3) {
                              status = "fail";
                              hasFailedMetric = true;
                            }
                          } else {
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

                        const resultStatus = hasFailedMetric
                          ? "failed"
                          : "completed";

                        return {
                          id: simResult.simulation_id,
                          name: simResult.simulation_name,
                          status: resultStatus as "completed" | "failed",
                          scenario: simResult.scenario_id,
                          persona: simResult.persona_id,
                          scenarioName: simResult.scenario_name,
                          personaName: simResult.persona_name,
                          metrics: evaluationScores,
                          evaluationId: simResult.evaluation_id,
                          reasoning: simResult.reasoning,
                          issues: simResult.issues,
                          fixes: simResult.fixes,
                          userInput: "",
                          expectedOutput: "",
                          agentResponse: "",
                        } as SimulationResult;
                      },
                    );

                    // Add placeholder "running" entries for simulations that haven't completed yet
                    const completedSimIds = partialResults.map((r) => r.id);
                    const allSimIds = allTestCaseIds;
                    const runningSimIds = allSimIds.filter(
                      (id) => !completedSimIds.includes(id),
                    );

                    // Create running placeholders
                    const runningPlaceholders = runningSimIds.map(
                      (simId, idx) => ({
                        id: simId,
                        name: `Simulation ${idx + 1}`,
                        status: "running" as const,
                        scenario: "",
                        persona: "",
                        scenarioName: "",
                        personaName: "",
                        metrics: {},
                        evaluationId: "",
                        reasoning: "",
                        issues: [],
                        fixes: [],
                        userInput: "",
                        expectedOutput: "",
                        agentResponse: "",
                      }),
                    );

                    const combinedResults = [
                      ...partialResults,
                      ...runningPlaceholders,
                    ];

                    // Update both the parent results AND the loopResults array in real-time
                    // This allows users to switch between loops and see live updates

                    // Update parent component's results (for current loop display)
                    if (onEvaluationUpdate && combinedResults.length > 0) {
                      console.log(
                        `[RL Loop ${loop}] Updating honeycomb with ${partialResults.length} completed + ${runningPlaceholders.length} running`,
                      );
                      onEvaluationUpdate({
                        testCases: combinedResults,
                        overallProgress: progressPercentage,
                        isRunning: true,
                        summary: {
                          total: total,
                          completed: partialResults.length,
                          failed: 0,
                          running: runningPlaceholders.length,
                          pending: 0,
                        },
                      });
                    }

                    // CRITICAL: Update the loopResults entry for this specific loop in real-time
                    // This allows users to switch to this loop and see its live progress
                    setLoopResults((prev) => {
                      const updated = [...prev];
                      // Find the loop entry (loop index in array = loop number)
                      const loopIndex = updated.findIndex(
                        (lr) => lr.loop === loop,
                      );

                      if (loopIndex >= 0) {
                        // Calculate current pass/fail for this loop
                        const currentPassCount = partialResults.filter(
                          (r) => r.status === "completed",
                        ).length;

                        // Update the entry with live data
                        updated[loopIndex] = {
                          ...updated[loopIndex],
                          testResults: combinedResults, // Live results with running placeholders
                          passedCount: currentPassCount,
                          totalCount: allTestCaseIds.length,
                          allPassed: false, // Not done yet
                        };
                      }

                      return updated;
                    });

                    lastUpdateTime = now;
                  }
                } catch (error) {
                  console.error("Failed to fetch partial results:", error);
                }
              }

              if (
                jobStatus.summary.pending === 0 &&
                jobStatus.summary.running === 0
              ) {
                isJobRunning = false;
                console.log(`Round ${createdRoundNumber} completed`);
              }
            }

            // Fetch complete evaluation run with new round results
            const evaluationRunData = await getEvaluationRun(
              worldModelId,
              currentEvaluationRunId,
              apiKey,
            );
            const latestRound =
              evaluationRunData.evaluation_run.rounds[
                evaluationRunData.evaluation_run.rounds.length - 1
              ];

            if (!latestRound || !latestRound.simulation_results) {
              throw new Error("No simulation results in latest round");
            }

            // Update current round number (both state and local variable)
            localRoundNumber = latestRound.round_number;
            setCurrentRoundNumber(latestRound.round_number);

            // Transform simulation results to UI format (same logic as handleLoadEvaluationRun)
            newTestResults = latestRound.simulation_results.map((simResult) => {
              const evaluationScores: Record<string, any> = {};
              let hasFailedMetric = false;

              for (const [metric, rawScore] of Object.entries(
                simResult.scores,
              )) {
                const scoreValue = typeof rawScore === "number" ? rawScore : 0;
                const percentage = Math.round(scoreValue * 100);
                let status = "pass";

                if (["hallucinations", "bias", "toxicity"].includes(metric)) {
                  if (scoreValue > 0.3) {
                    status = "fail";
                    hasFailedMetric = true;
                  }
                } else {
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

              const resultStatus = hasFailedMetric ? "failed" : "completed";

              return {
                id: simResult.simulation_id,
                name: simResult.simulation_name,
                status: resultStatus,
                scenario: simResult.scenario_id,
                persona: simResult.persona_id,
                scenarioName: simResult.scenario_name,
                personaName: simResult.persona_name,
                metrics: evaluationScores,
                evaluationId: simResult.evaluation_id,
                reasoning: simResult.reasoning,
                issues: simResult.issues,
                fixes: simResult.fixes,
              };
            });

            console.log(
              `Round ${createdRoundNumber} completed with ${newTestResults.length} results`,
            );

            // Update the main evaluation results to show live progress in honeycomb
            if (onEvaluationUpdate && newTestResults.length > 0) {
              onEvaluationUpdate({
                testCases: newTestResults,
                overallProgress: 100,
                isRunning: false,
                summary: {
                  total: newTestResults.length,
                  completed: newTestResults.filter(
                    (r: any) => r.status === "completed",
                  ).length,
                  failed: newTestResults.filter(
                    (r: any) => r.status === "failed",
                  ).length,
                  running: 0,
                  pending: 0,
                },
              });
            }
          } catch (evalError) {
            console.error("Failed to continue evaluation run:", evalError);
            toast.error(`Failed to run Round ${currentRoundNumber + 1}`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } else {
          console.error(
            "Missing required data for continuing evaluation run:",
            {
              hasEvaluationRunId: !!currentEvaluationRunId,
              hasWorldModelId: !!worldModelId,
              hasApiKey: !!apiKey,
              testCaseCount: allTestCaseIds.length,
            },
          );
          toast.error(
            "Cannot continue evaluation run - missing evaluation context",
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Update current agent to the improved version for next loop
        currentAgent = {
          ...currentAgent,
          agent_role: improved.role,
          agent_goal: improved.goal,
          agent_instructions: improved.instructions,
        };

        // Update currentResults with new results for next loop analysis
        if (newTestResults.length > 0) {
          currentResults = newTestResults;
        }

        // Phase 4: Check results
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Calculate if all tests passed based on actual evaluation results
        const allPassed =
          newTestResults.length > 0
            ? newTestResults.every(
                (result) =>
                  result.status === "completed" &&
                  (!result.metrics ||
                    Object.values(result.metrics).every(
                      (metric: any) => metric.status === "pass",
                    )),
              )
            : false;

        console.log(`RL Loop ${loop} Results:`, {
          totalTests: newTestResults.length,
          completedTests: newTestResults.filter((r) => r.status === "completed")
            .length,
          allPassed,
          testDetails: newTestResults.map((r) => ({
            name: r.name,
            status: r.status,
            metrics: r.metrics,
          })),
        });

        // Calculate statistics from new test results
        const passedCount = newTestResults.filter(
          (result) =>
            result.status === "completed" &&
            (!result.metrics ||
              Object.values(result.metrics).every(
                (metric: any) => metric.status === "pass",
              )),
        ).length;

        // Update the existing loop result entry with completed data
        setLoopResults((prev) => {
          const updated = [...prev];
          const loopIndex = updated.findIndex((lr) => lr.loop === loop);
          if (loopIndex >= 0) {
            // Update existing entry
            updated[loopIndex] = {
              loop,
              label: `RL Loop ${loop}`,
              improved,
              testResults:
                newTestResults.length > 0
                  ? newTestResults
                  : allSelectedTestCases,
              allPassed,
              passedCount,
              totalCount: allTestCaseIds.length,
            };
          } else {
            // Fallback: add new entry if not found
            updated.push({
              loop,
              label: `RL Loop ${loop}`,
              improved,
              testResults:
                newTestResults.length > 0
                  ? newTestResults
                  : allSelectedTestCases,
              allPassed,
              passedCount,
              totalCount: allTestCaseIds.length,
            });
          }
          return updated;
        });

        // Note: Loop state is automatically saved as rounds in the evaluation run
        // No need to manually save session state

        // If all tests passed, break early
        if (allPassed) {
          toast.success(
            `🎉 All ${allTestCaseIds.length} tests passed after RL Loop ${loop}! Hardening completed successfully.`,
          );
          setIsAutoHardening(false);
          return; // Exit the function completely
        }

        // If no tests were returned, something went wrong - stop the loop
        if (newTestResults.length === 0) {
          toast.error(
            `No evaluation results returned from Loop ${loop}. Stopping hardening.`,
          );
          break;
        }

        // Show progress for next loop
        const failedCount = newTestResults.filter(
          (result) =>
            result.status !== "completed" ||
            (result.metrics &&
              Object.values(result.metrics).some(
                (metric: any) =>
                  metric.status === "fail" || metric.status === "warning",
              )),
        ).length;

        if (failedCount === 0) {
          toast.success(`🎉 All tests passed after Loop ${loop}!`);
          break;
        }

        // Check if we should ask user to continue (every 10 loops in unlimited mode)
        if (isUnlimited && loop % 10 === 0) {
          const userWantsToContinue = window.confirm(
            `Completed ${loop} hardening loops. ${failedCount} test(s) still failing.\n\nDo you want to continue for 10 more loops?`,
          );
          if (!userWantsToContinue) {
            toast.info(`Hardening stopped by user after ${loop} loops.`);
            break;
          }
        }

        // Check if we should continue (unlimited mode or still under max loops)
        const shouldContinue = isUnlimited || loop < maxLoops;
        if (shouldContinue) {
          toast.info(
            `Loop ${loop} completed: ${passedCount}/${allTestCaseIds.length} passed. Continuing to Loop ${loop + 1}...`,
          );
        } else {
          toast.warning(
            `Reached max loops (${maxLoops}). ${failedCount} test(s) still failing.`,
          );
        }
      } catch (error) {
        console.error(`RL Loop ${loop} failed:`, error);
        toast.error(`RL Loop ${loop} failed`);
        break;
      }

      // Increment loop counter
      loop++;
    }

    setIsAutoHardening(false);
    setHardeningStatus("");
    setCurrentSimulation(0);

    // Note: All rounds are already persisted in the evaluation run
    // No need for final session save

    toast.success("Automated hardening completed!");
  };

  // Handle improve agent using the new hardening API
  const handleImproveAgent = async () => {
    if (!sourceAgent || selectedTestCaseIds.length === 0) return;

    // Check if we have the required evaluation run context
    if (!currentEvaluationRunId || !worldModelId || !apiKey) {
      toast.error(
        "No evaluation run context available. Please run an evaluation first.",
      );
      return;
    }

    setIsImproving(true);
    try {
      const selectedTests = results.filter((tc) =>
        selectedTestCaseIds.includes(tc.id),
      );

      // Extract evaluation IDs from the selected test cases
      const evaluationIds = selectedTests
        .map((tc) => tc.evaluationId)
        .filter((id) => id !== undefined && id !== null) as string[];

      if (evaluationIds.length === 0) {
        toast.error(
          "Selected test cases do not have evaluation IDs. Please ensure they are from an evaluation run.",
        );
        return;
      }

      console.log("Requesting agent hardening with:", {
        environmentId: worldModelId,
        evaluationRunId: currentEvaluationRunId,
        roundNumber: currentRoundNumber,
        evaluationIds,
      });

      // Call the new hardening API
      const { requestAgentHardening } = await import(
        "../services/environmentApi"
      );
      const response = await requestAgentHardening(
        worldModelId,
        currentEvaluationRunId,
        {
          round_number: currentRoundNumber,
          evaluation_ids: evaluationIds,
        },
        apiKey,
      );

      console.log("Agent hardening response:", response);

      // Transform the API response to match the expected ImprovedConfig format
      const improved: ImprovedConfig = {
        role: response.improved_config.agent_role,
        goal: response.improved_config.agent_goal,
        instructions: response.improved_config.agent_instructions,
        changeSummary: [], // We can extract this from comparing original vs improved
      };

      // Generate change summary by comparing original and improved
      const changeSummary: string[] = [];
      if (
        response.original_config.agent_goal !==
        response.improved_config.agent_goal
      ) {
        changeSummary.push("Updated agent goal for better task alignment");
      }
      if (
        response.original_config.agent_instructions !==
        response.improved_config.agent_instructions
      ) {
        changeSummary.push("Enhanced instructions based on failed test cases");
      }
      if (
        response.original_config.agent_role !==
        response.improved_config.agent_role
      ) {
        changeSummary.push("Refined agent role definition");
      }

      improved.changeSummary =
        changeSummary.length > 0
          ? changeSummary
          : ["Hardened agent configuration based on evaluation results"];

      setImprovedConfig(improved);
      setEditableGoal(improved.goal);
      setEditableInstructions(improved.instructions);

      toast.success("Agent configuration hardened successfully!");
    } catch (error) {
      console.error("Failed to improve agent:", error);
      toast.error("Failed to harden agent configuration");
    } finally {
      setIsImproving(false);
      setActiveSubTab("detailed");
    }
  };

  const onHardenAgent = () => setActiveSubTab("detailed");

  const handleApplyChanges = async () => {
    if (improvedConfig && onApplyChanges) {
      const finalConfig = {
        ...improvedConfig,
        goal: editableGoal,
        instructions: editableInstructions,
      };

      try {
        onApplyChanges(finalConfig);

        // OLD: Agent versions are no longer tracked separately
        // The improved config is applied directly to the agent
        toast.success("Agent configuration updated successfully!");
      } catch (error) {
        console.error("Failed to apply changes:", error);
        toast.error("Failed to apply changes");
      }
    }
  };

  const handleDiscard = () => {
    setImprovedConfig(null);
    setSelectedTestCaseIds([]);
  };

  if (!sourceAgent) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">No agent information available</p>
      </div>
    );
  }

  // Check if we have any data available
  const hasNoDataAvailable = !evaluationResults;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <h2 className="mb-2 text-2xl font-bold">Simulation Analysis</h2>
          <p className="text-gray-600">
            Review results and improve agent performance
          </p>
        </div>

        {/* View Previous Runs Button */}
        <Dialog
          open={showEvaluationRuns}
          onOpenChange={(open) => {
            setShowEvaluationRuns(open);
            if (open) loadEvaluationRuns();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              View Previous Runs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[600px] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Previous Evaluation Runs</DialogTitle>
              <DialogDescription>
                View and load previous evaluation runs for this environment
              </DialogDescription>
            </DialogHeader>

            {loadingRuns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : evaluationRuns.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No previous evaluation runs found
              </div>
            ) : (
              <div className="space-y-2">
                {evaluationRuns.map((run) => (
                  <Card
                    key={run.evaluation_run_id}
                    className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                    onClick={() =>
                      handleLoadEvaluationRun(run.evaluation_run_id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {run.evaluation_run_name}
                        </h4>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            Round: {run.current_round}/{run.total_rounds}
                          </span>
                          <span>Total: {run.current_round_total}</span>
                          <span>
                            {new Date(run.created_at).toLocaleDateString()}{" "}
                            {new Date(run.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State or Content */}
      {hasNoDataAvailable ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            No Simulation Results Available
          </h3>
          <p className="text-sm text-gray-500">
            Run simulations in the previous tab to view results, or load a
            previous evaluation run using the button above.
          </p>
        </div>
      ) : (
        <>
          {/* Real-time Loop Results
      {isAutoHardening && loopResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loop Results Summary</h3>
          <div className="space-y-3">
            {loopResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                result.allPassed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.allPassed ? 'default' : 'secondary'}>
                      Loop {result.loop}
                    </Badge>
                    <span className={`text-sm font-medium ${
                      result.allPassed ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {result.passedCount || 0}/{result.totalCount || 0} tests passed
                    </span>
                  </div>
                  {result.allPassed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )} */}

          {/* SUB-TAB NAVIGATION */}
          {results.length > 0 && (
            <>
              <SubTabNavigation
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
              />

              {/* Render active tab */}
              {activeSubTab === "overview" ? (
                <OverviewTab
                  results={results}
                  loopResults={loopResults}
                  currentLoop={currentLoop}
                  maxLoops={maxLoops}
                  isAutoHardening={isAutoHardening}
                  isImproving={isImproving}
                  improvedConfig={improvedConfig}
                  sourceAgent={sourceAgent}
                  modelName={(sourceAgent?.llm_model as string) || "AI Model"}
                  selectedTestCaseIds={selectedTestCaseIds}
                  maxLoopsConfig={maxLoops}
                  hardeningStatus={hardeningStatus}
                  currentSimulation={currentSimulation}
                  totalSimulations={totalSimulations}
                  onTestClick={openResultDetails}
                  onHardenAgent={onHardenAgent}
                  onManualHarden={handleImproveAgent}
                  onAutoHarden={handleAutomatedHardening}
                  onMaxLoopsChange={setMaxLoops}
                  onApplyChanges={handleApplyChanges}
                  onDiscard={handleDiscard}
                  getTestCaseValue={getTestCaseValue}
                />
              ) : (
                <DetailedReportTab
                  filteredTestCases={filteredTestCases}
                  selectedTestCaseIds={selectedTestCaseIds}
                  isAllSelected={isAllSelected}
                  isSomeSelected={isSomeSelected}
                  filterMode={filterMode}
                  isImproving={isImproving}
                  isAutoHardening={isAutoHardening}
                  currentLoop={currentLoop}
                  improvedConfig={improvedConfig}
                  sourceAgent={sourceAgent}
                  editableGoal={editableGoal}
                  editableInstructions={editableInstructions}
                  maxLoops={maxLoops}
                  results={results}
                  loopResults={loopResults}
                  hardeningStatus={hardeningStatus}
                  currentSimulation={currentSimulation}
                  totalSimulations={totalSimulations}
                  onToggleSelection={toggleSelection}
                  onToggleSelectAll={toggleSelectAll}
                  onFilterChange={setFilterMode}
                  onClearSelection={() => setSelectedTestCaseIds([])}
                  onManualHarden={handleImproveAgent}
                  onAutoHarden={handleAutomatedHardening}
                  onMaxLoopsChange={setMaxLoops}
                  onTestClick={openResultDetails}
                  onGoalChange={setEditableGoal}
                  onInstructionsChange={setEditableInstructions}
                  onApplyChanges={handleApplyChanges}
                  onDiscard={handleDiscard}
                  getTestCaseValue={getTestCaseValue}
                />
              )}
            </>
          )}

          {/* Empty State - Show when no current results */}
          {results.length === 0 && (
            <div className="rounded-lg border bg-white p-12 text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                No Evaluation Results
              </h3>
              <p className="text-sm text-gray-500">
                Run an evaluation from the Configure Simulation tab to see
                results here
              </p>
            </div>
          )}

          {/* Details Side Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-[65vw] min-w-[800px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Simulation Details
                </SheetTitle>
                <SheetDescription>
                  Detailed results and activity log for {selectedResult?.name}
                </SheetDescription>
              </SheetHeader>

              {selectedResult && (
                <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Simulation Information
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">Name</span>
                          <p className="text-sm font-medium">
                            {selectedResult.name}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Status</span>
                          <div className="mt-1">
                            <Badge
                              variant={
                                selectedResult.status === "completed"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {selectedResult.status === "completed"
                                ? "Pass"
                                : selectedResult.status === "failed"
                                  ? "Fail"
                                  : selectedResult.status}
                            </Badge>
                          </div>
                        </div>
                        {selectedResult.duration > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">
                              Duration
                            </span>
                            <p className="text-sm">
                              {(selectedResult.duration / 1000).toFixed(1)}s
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <User className="h-4 w-4" />
                        Context
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-500">
                            Scenario
                          </span>
                          <p className="text-sm">
                            {selectedResult.scenarioName ||
                              scenarios.find(
                                (s) => s._id === selectedResult.scenario,
                              )?.name ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Persona</span>
                          <p className="text-sm">
                            {selectedResult.personaName ||
                              personas.find(
                                (p) => p._id === selectedResult.persona,
                              )?.name ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input/Output */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Input & Output
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-500">
                            User Input
                          </span>
                          {isLoadingEvaluation ? (
                            <div className="mt-1 flex items-center justify-center rounded-md bg-gray-50 p-3">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-600" />
                              <span className="text-sm text-gray-600">
                                Loading user input...
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 rounded-md bg-gray-50 p-3">
                              <p className="whitespace-pre-wrap text-sm">
                                {evaluationDetail?.user_input ||
                                  selectedResult.userInput ||
                                  selectedResult.user_input ||
                                  getTestCaseValue(
                                    selectedResult,
                                    "userInput",
                                  ) ||
                                  "No user input available"}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-xs text-gray-500">
                            Expected Output
                          </span>
                          {isLoadingEvaluation ? (
                            <div className="mt-1 flex items-center justify-center rounded-md bg-amber-50 p-3">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-600" />
                              <span className="text-sm text-amber-600">
                                Loading expected output...
                              </span>
                            </div>
                          ) : evaluationDetail?.expected_output ||
                            selectedResult.expectedOutput ||
                            getTestCaseValue(
                              selectedResult,
                              "expectedOutput",
                            ) ? (
                            <div className="mt-1 rounded-md bg-amber-50 p-3">
                              <pre className="whitespace-pre-wrap text-sm">
                                {(() => {
                                  const output = evaluationDetail?.expected_output ||
                                    selectedResult.expectedOutput ||
                                    getTestCaseValue(selectedResult, "expectedOutput");
                                  return typeof output === "string"
                                    ? output
                                    : JSON.stringify(output, null, 2);
                                })()}
                              </pre>
                            </div>
                          ) : (
                            <div className="mt-1 rounded-md bg-gray-50 p-3">
                              <p className="text-sm text-gray-400">
                                No expected output specified
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-xs text-gray-500">
                            Agent Response
                          </span>
                          {isLoadingEvaluation ? (
                            <div className="mt-1 flex items-center justify-center rounded-md bg-blue-50 p-3">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                              <span className="text-sm text-blue-600">
                                Loading actual output...
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 rounded-md bg-blue-50 p-3">
                              <MarkdownRenderer
                                content={(() => {
                                  const output =
                                    evaluationDetail?.actual_output ||
                                    selectedResult.agentResponse ||
                                    getTestCaseValue(selectedResult, "agentResponse") ||
                                    "No response available";
                                  return typeof output === "string"
                                    ? output
                                    : JSON.stringify(output, null, 2);
                                })()}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Scores */}
                    {Object.keys(selectedResult.metrics || {}).length > 0 && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                          Evaluation Scores
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(selectedResult.metrics).map(
                            ([metricName, metric]: [string, any]) => (
                              <div
                                key={metricName}
                                className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                              >
                                <div>
                                  <span className="text-sm font-medium capitalize">
                                    {metricName.replace(/_/g, " ")}
                                  </span>
                                  {metric.details && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      {metric.details}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-20">
                                    <Progress
                                      value={metric.score}
                                      className="h-2"
                                    />
                                  </div>
                                  <Badge
                                    className={`min-w-[50px] justify-center text-xs ${
                                      metric.status === "pass"
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : metric.status === "warning"
                                          ? "bg-amber-500 text-white hover:bg-amber-600"
                                          : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                                  >
                                    {metric.score}%
                                  </Badge>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Details from API */}
                    {evaluationDetail && (
                      <>
                        {/* Reasoning */}
                        {evaluationDetail.evaluation.reasoning && (
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                              Evaluation Reasoning
                            </h3>
                            <div className="rounded-md bg-purple-50 p-3">
                              <p className="whitespace-pre-wrap text-sm">
                                {evaluationDetail.evaluation.reasoning}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Issues */}
                        {evaluationDetail.evaluation.issues &&
                          evaluationDetail.evaluation.issues.length > 0 && (
                            <div>
                              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                Issues Identified (
                                {evaluationDetail.evaluation.issues.length})
                              </h3>
                              <div className="space-y-2">
                                {evaluationDetail.evaluation.issues.map(
                                  (issue: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="rounded-md border-l-4 border-red-500 bg-red-50 p-3"
                                    >
                                      <p className="text-sm">{issue}</p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Fixes */}
                        {evaluationDetail.evaluation.fixes &&
                          evaluationDetail.evaluation.fixes.length > 0 && (
                            <div>
                              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Suggested Fixes (
                                {evaluationDetail.evaluation.fixes.length})
                              </h3>
                              <div className="space-y-2">
                                {evaluationDetail.evaluation.fixes.map(
                                  (fix: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="rounded-md border-l-4 border-green-500 bg-green-50 p-3"
                                    >
                                      <p className="text-sm">{fix}</p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {/* Activity Log - Trace from API */}
                    {evaluationDetail?.trace && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Activity className="h-4 w-4" />
                          Execution Trace
                        </h3>
                        <div className="rounded-md border">
                          <pre className="overflow-x-auto whitespace-pre-wrap bg-gray-900 p-4 font-mono text-xs text-green-400">
                            {evaluationDetail.trace}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Activity Log - Raw Data (fallback) */}
                    {!evaluationDetail?.trace &&
                      selectedResult.activityLog &&
                      selectedResult.activityLog.length > 0 && (
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Activity className="h-4 w-4" />
                            Activity Log - Raw Data (
                            {selectedResult.activityLog.length} events)
                          </h3>
                          <div className="rounded-md border">
                            <pre className="overflow-x-auto whitespace-pre-wrap bg-gray-900 p-4 font-mono text-xs text-green-400">
                              {JSON.stringify(
                                selectedResult.activityLog,
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

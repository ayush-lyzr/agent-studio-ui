import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { LoopStatisticsCard } from "./LoopStatisticsCard";
import { HardenedAgentComparison } from "./HardenedAgentComparison";

interface LoopResult {
  loop: number;
  label: string;
  improved: any;
  testResults: any[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface ImprovedConfig {
  role: string;
  goal: string;
  instructions: string;
  changeSummary: string[];
}

interface OverviewTabProps {
  results: any[];
  loopResults: LoopResult[];
  currentLoop: number;
  maxLoops: number;
  isAutoHardening: boolean;
  isImproving: boolean;
  improvedConfig: ImprovedConfig | null;
  sourceAgent: any;
  modelName?: string;
  selectedTestCaseIds: string[];
  maxLoopsConfig: number;
  hardeningStatus: string;
  currentSimulation: number;
  totalSimulations: number;
  onTestClick: (result: any) => void;
  onManualHarden: () => void;
  onAutoHarden: () => void;
  onMaxLoopsChange: (value: number) => void;
  onApplyChanges: () => void;
  onDiscard: () => void;
  onLoadSession?: (sessionId: string) => void;
  onHardenAgent: () => void;
  getTestCaseValue: (testCase: any, property: string) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  results,
  loopResults,
  currentLoop,
  maxLoops,
  isAutoHardening,
  // isImproving,
  improvedConfig,
  sourceAgent,
  modelName,
  selectedTestCaseIds,
  // maxLoopsConfig,
  hardeningStatus,
  currentSimulation,
  totalSimulations,
  onTestClick,
  onHardenAgent,
  // onManualHarden,
  // onAutoHarden,
  // onMaxLoopsChange,
  onApplyChanges,
  onDiscard,
  // onLoadSession,
  getTestCaseValue,
}) => {
  // Track which loop version to display in honeycomb
  const [selectedLoopIndex, setSelectedLoopIndex] = React.useState<number>(0);

  // Session history state
  // const [showSessionHistory, setShowSessionHistory] = React.useState(false);
  // const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  // const [loadingSessions, setLoadingSessions] = React.useState(false);

  // Auto-select the latest loop when new loop results are added during hardening
  React.useEffect(() => {
    if (isAutoHardening && loopResults.length > 0) {
      setSelectedLoopIndex(loopResults.length - 1);
    }
  }, [loopResults.length, isAutoHardening]);

  // Get the results to display based on selected loop
  // ALWAYS use loopResults if available, even during hardening
  // This allows users to switch between loops and see their specific data
  const displayResults =
    loopResults.length > 0 && loopResults[selectedLoopIndex]
      ? loopResults[selectedLoopIndex].testResults
      : results;

  // Debug: Log status changes
  React.useEffect(() => {
    if (results.length > 0) {
      const statusCounts = {
        pending: results.filter((r: any) => r.status === "pending").length,
        running: results.filter((r: any) => r.status === "running").length,
        completed: results.filter((r: any) => r.status === "completed").length,
        failed: results.filter((r: any) => r.status === "failed").length,
      };
      console.log("[OverviewTab] Results status counts:", statusCounts);
    }
  }, [results]);

  // Update selected loop when new loops are added (always show latest)
  React.useEffect(() => {
    if (loopResults.length > 0) {
      setSelectedLoopIndex(loopResults.length - 1);
    }
  }, [loopResults.length]);

  // Fetch sessions when dialog opens
  // const fetchSessions = async () => {
  //   if (!sourceAgent?.id) return;

  //   setLoadingSessions(true);
  //   try {
  //     const response = await listEvaluationSessions(
  //       sourceAgent.id as string,
  //       20,
  //       0,
  //     );
  //     setSessions(response.sessions);
  //   } catch (error) {
  //     console.error("Failed to fetch sessions:", error);
  //   } finally {
  //     setLoadingSessions(false);
  //   }
  // };

  // Handle session selection
  // const handleSessionSelect = (sessionId: string) => {
  //   if (onLoadSession) {
  //     onLoadSession(sessionId);
  //     setShowSessionHistory(false);
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* Real-time Status Banner */}
      {isAutoHardening && hardeningStatus && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                {hardeningStatus}
              </p>
              {currentSimulation > 0 && totalSimulations > 0 && (
                <p className="mt-1 text-xs text-blue-700">
                  Running simulation {currentSimulation} of {totalSimulations}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Top Section - Two Column Layout */}
      <div className="grid grid-cols-[1fr,400px] gap-6">
        {/* Left: Honeycomb View */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Simulations</h3>
            {loopResults.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Viewing:{" "}
                {loopResults[selectedLoopIndex]?.label || "Current Results"}
              </Badge>
            )}
          </div>
          <TooltipProvider>
            <div className="flex justify-center">
              <div
                className="inline-flex flex-wrap justify-center gap-2"
                style={{ maxWidth: "600px" }}
              >
                {displayResults.map((result, index) => {
                  const isEvenRow = Math.floor(index / 8) % 2 === 0;
                  const offsetClass =
                    isEvenRow && index % 8 === 0 ? "ml-8" : "";

                  const hasFailedMetric =
                    result.metrics &&
                    Object.values(result.metrics).some(
                      (metric: any) => metric.status === "fail",
                    );
                  const hasMetrics =
                    result.metrics && Object.keys(result.metrics).length > 0;
                  const normalizedJudgment =
                    typeof result.judgment === "string"
                      ? result.judgment.toUpperCase()
                      : null;
                  const isFailing =
                    normalizedJudgment === "FAIL" ||
                    (!normalizedJudgment && hasFailedMetric);
                  const isPassing =
                    normalizedJudgment === "PASS" ||
                    (!normalizedJudgment && hasMetrics && !hasFailedMetric);
                  const isAwaitingScores =
                    result.status === "completed" && !isPassing && !isFailing;

                  const getStatusStyle = () => {
                    switch (result.status) {
                      case "running":
                        return {
                          bg: "bg-blue-500",
                          shadow: "shadow-lg shadow-blue-500/50",
                          hover: "hover:scale-110",
                          ring: "ring-2 ring-blue-300 ring-offset-2",
                        };
                      case "completed":
                        if (isAwaitingScores) {
                          return {
                            bg: "bg-gray-300",
                            shadow: "shadow-md shadow-gray-300/50",
                            hover: "hover:scale-105",
                            ring: "ring-1 ring-gray-300 ring-offset-1",
                          };
                        }
                        if (isFailing) {
                          return {
                            bg: "bg-red-500",
                            shadow: "shadow-lg shadow-red-500/40",
                            hover:
                              "hover:scale-110 hover:shadow-xl hover:shadow-red-500/50",
                            ring: "ring-2 ring-red-200 ring-offset-2",
                          };
                        }
                        if (isPassing) {
                          return {
                            bg: "bg-green-500",
                            shadow: "shadow-lg shadow-green-500/40",
                            hover:
                              "hover:scale-110 hover:shadow-xl hover:shadow-green-500/50",
                            ring: "ring-2 ring-green-200 ring-offset-2",
                          };
                        }
                        return {
                          bg: "bg-gray-300",
                          shadow: "shadow-md shadow-gray-300/50",
                          hover: "hover:scale-105",
                          ring: "ring-1 ring-gray-300 ring-offset-1",
                        };
                      case "failed":
                        return {
                          bg: "bg-red-500",
                          shadow: "shadow-lg shadow-red-500/40",
                          hover:
                            "hover:scale-110 hover:shadow-xl hover:shadow-red-500/50",
                          ring: "ring-2 ring-red-200 ring-offset-2",
                        };
                      default:
                        return {
                          bg: "bg-gray-300",
                          shadow: "shadow-md shadow-gray-300/50",
                          hover: "hover:scale-105",
                          ring: "ring-1 ring-gray-300 ring-offset-1",
                        };
                    }
                  };

                  const statusStyle = getStatusStyle();

                  return (
                    <Tooltip key={`${result.id}-${result.status}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative ${offsetClass}`}
                          style={{ width: "64px", height: "72px" }}
                        >
                          <div
                            className={`
                              flex h-[64px] w-[64px] cursor-pointer items-center justify-center
                              transition-all duration-300 ease-out
                              ${statusStyle.bg} ${statusStyle.shadow} ${statusStyle.hover} ${statusStyle.ring}
                              relative overflow-visible
                              ${result.status === "running" ? "shimmer" : ""}
                            `}
                            style={{
                              clipPath:
                                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            }}
                            onClick={() =>
                              result.status === "completed" ||
                              result.status === "failed"
                                ? onTestClick(result)
                                : null
                            }
                          >
                            <div className="relative z-10 text-white drop-shadow-md">
                              {result.status === "running" ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : result.status === "completed" ? (
                                isAwaitingScores ? (
                                  <Clock className="h-5 w-5" />
                                ) : isFailing ? (
                                  <XCircle className="h-6 w-6" />
                                ) : (
                                  <CheckCircle2 className="h-6 w-6" />
                                )
                              ) : result.status === "failed" ? (
                                <XCircle className="h-6 w-6" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>

                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 transform rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-bold text-gray-900 shadow-md">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{result.name}</p>
                          <p className="text-xs text-gray-300">
                            Status:{" "}
                            <span className="capitalize">{result.status}</span>
                          </p>
                          {getTestCaseValue(result, "userInput") && (
                            <p className="truncate text-xs text-gray-300">
                              Input: {getTestCaseValue(result, "userInput")}
                            </p>
                          )}
                          {result.status === "completed" && result.duration ? (
                            <p className="text-xs text-gray-300">
                              Duration: {(result.duration / 1000).toFixed(1)}s
                            </p>
                          ) : null}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Right: Loop Statistics Card */}
        <LoopStatisticsCard
          loopResults={loopResults}
          currentLoop={currentLoop}
          maxLoops={maxLoops}
          isAutoHardening={isAutoHardening}
          selectedLoopIndex={selectedLoopIndex}
          onLoopSelect={setSelectedLoopIndex}
        />
      </div>

      {/* Hardening Controls */}
      {!improvedConfig && (
        <Card className="border border-blue-200 bg-blue-50 p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {selectedTestCaseIds.length > 0 ? (
                <p className="text-sm text-blue-900">
                  <strong>{selectedTestCaseIds.length}</strong> test case
                  {selectedTestCaseIds.length > 1 ? "s" : ""} selected for
                  hardening
                </p>
              ) : (
                <span className="text-sm">
                  <p>
                    Select the test cases you want to run to harden your agent.{" "}
                  </p>

                  <p className="text-blue-900">
                    Hardening your agents helps you identify issues and improve
                    its reliability based on simulation results.
                  </p>
                </span>
              )}

              <Button variant="outline" onClick={onHardenAgent}>
                Harden Agent
              </Button>
              {/* Session History Button */}
              {/* <Dialog
                open={showSessionHistory}
                onOpenChange={(open) => {
                  setShowSessionHistory(open);
                  if (open) fetchSessions();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white">
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[600px] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Evaluation Session History</DialogTitle>
                    <DialogDescription>
                      View and load previous evaluation sessions for this agent
                    </DialogDescription>
                  </DialogHeader>

                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No evaluation sessions found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <Card
                          key={session.session_id}
                          className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            handleSessionSelect(session.session_id)
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {session.session_name}
                              </h4>
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                <span>Loops: {session.total_loops}</span>
                                <span>
                                  Pass Rate:{" "}
                                  {session.final_pass_rate.toFixed(1)}%
                                </span>
                                <span>
                                  {new Date(
                                    session.created_at,
                                  ).toLocaleDateString()}{" "}
                                  {new Date(
                                    session.created_at,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                session.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="ml-4"
                            >
                              {session.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog> */}
            </div>

            {/* Hardening Buttons */}
            {/* <div className="flex items-center gap-3">
              <Button
                onClick={onManualHarden}
                disabled={
                  isImproving ||
                  isAutoHardening ||
                  selectedTestCaseIds.length === 0
                }
                variant="outline"
              >
                {isImproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Manual Harden
                  </>
                )}
              </Button>

              <Button
                onClick={onAutoHarden}
                disabled={
                  isImproving ||
                  isAutoHardening ||
                  selectedTestCaseIds.length === 0
                }
                variant="blue"
              >
                {isAutoHardening ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    RL Loop {currentLoop}...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Automated Hardening
                  </>
                )}
              </Button>
            </div> */}

            {/* Max Loops Configuration */}
            {/* {!isAutoHardening && (
              <div className="rounded-md border border-blue-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Max Reinforcement Hardening Loops:
                  </label>
                  <select
                    value={maxLoopsConfig}
                    onChange={(e) => onMaxLoopsChange(Number(e.target.value))}
                    className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={999}>Until all pass (asks every 10)</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {maxLoopsConfig === 999
                    ? "Automated mode will continue until all tests pass, asking for confirmation every 10 loops"
                    : `Automated mode will harden and re-evaluate up to ${maxLoopsConfig} times until all tests pass`}
                </p>
              </div>
            )} */}
          </div>
        </Card>
      )}

      {/* Bottom Section - Hardened Agent Comparison for Selected Loop */}
      {loopResults.length > 0 &&
        loopResults[selectedLoopIndex] &&
        loopResults[selectedLoopIndex].improved && (
          <div>
            {loopResults[selectedLoopIndex].loop > 0 && (
              <div className="mb-3">
                <Badge className="bg-blue-600 px-3 py-1 text-xs text-white">
                  {loopResults[selectedLoopIndex].label}
                </Badge>
              </div>
            )}
            <HardenedAgentComparison
              sourceAgent={sourceAgent}
              improvedConfig={loopResults[selectedLoopIndex].improved}
              modelName={modelName}
              onApplyChanges={onApplyChanges}
              onDiscard={onDiscard}
            />
          </div>
        )}
    </div>
  );
};

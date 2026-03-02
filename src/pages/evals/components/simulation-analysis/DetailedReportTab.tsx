import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { LoopSectionalTable } from "./LoopSectionalTable";

interface ImprovedConfig {
  role: string;
  goal: string;
  instructions: string;
  changeSummary: string[];
}

interface LoopResult {
  loop: number;
  label: string;
  improved: any;
  testResults: any[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface DetailedReportTabProps {
  filteredTestCases: any[];
  selectedTestCaseIds: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  filterMode: "all" | "failed";
  isImproving: boolean;
  isAutoHardening: boolean;
  currentLoop: number;
  improvedConfig: ImprovedConfig | null;
  sourceAgent: any;
  editableGoal: string;
  editableInstructions: string;
  maxLoops: number;
  results: any[];
  loopResults: LoopResult[];
  hardeningStatus: string;
  currentSimulation: number;
  totalSimulations: number;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onFilterChange: (mode: "all" | "failed") => void;
  onClearSelection: () => void;
  onManualHarden: () => void;
  onAutoHarden: () => void;
  onMaxLoopsChange: (value: number) => void;
  onTestClick: (testCase: any) => void;
  onGoalChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onApplyChanges: () => void;
  onDiscard: () => void;
  getTestCaseValue: (testCase: any, property: string) => string;
}

export const DetailedReportTab: React.FC<DetailedReportTabProps> = ({
  filteredTestCases,
  selectedTestCaseIds,
  isAllSelected,
  isSomeSelected,
  filterMode,
  isImproving,
  isAutoHardening,
  currentLoop,
  improvedConfig,
  sourceAgent,
  editableGoal,
  editableInstructions,
  maxLoops,
  loopResults,
  hardeningStatus,
  currentSimulation,
  totalSimulations,
  onToggleSelection,
  onToggleSelectAll,
  onManualHarden,
  onAutoHarden,
  onMaxLoopsChange,
  onTestClick,
  onGoalChange,
  onInstructionsChange,
  onApplyChanges,
  onDiscard,
  getTestCaseValue,
}) => {
  // Determine whether to show sectional table or flat table
  const showSectionalTable = loopResults.length > 0;
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

      {/* Results Table with Selection */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Simulation Results
          </h3>
        </div>

        {/* Conditional Table: Sectional or Flat */}
        {showSectionalTable ? (
          // Show sectional table when loop results exist
          <LoopSectionalTable
            loopResults={loopResults}
            selectedTestCaseIds={selectedTestCaseIds}
            sourceAgent={sourceAgent}
            modelName={(sourceAgent?.llm_model as string) || "AI Model"}
            onToggleSelection={onToggleSelection}
            onTestClick={onTestClick}
            onApplyChanges={onApplyChanges}
            onDiscard={onDiscard}
            getTestCaseValue={getTestCaseValue}
          />
        ) : (
          // Show flat table when no loop results yet (initial evaluation)
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onToggleSelectAll}
                        aria-label="Select all"
                        className={
                          isSomeSelected && !isAllSelected
                            ? "data-[state=checked]:bg-blue-600"
                            : ""
                        }
                      />
                    </TableHead>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="min-w-[120px]">Test Case</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="min-w-[120px]">Input</TableHead>
                    <TableHead className="min-w-[120px]">Expected</TableHead>
                    <TableHead className="min-w-[120px]">Output</TableHead>
                    {/* Individual metric columns - abbreviated with tooltips */}
                    <TableHead
                      className="w-16 text-center"
                      title="Task Completion"
                    >
                      TC
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Hallucinations"
                    >
                      HAL
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Tool Correctness"
                    >
                      TCC
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Argument Correctness"
                    >
                      AC
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Contextual Relevancy"
                    >
                      CR
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Answer Relevancy"
                    >
                      AR
                    </TableHead>
                    <TableHead
                      className="w-16 text-center"
                      title="Knowledge Retention"
                    >
                      KR
                    </TableHead>
                    <TableHead className="w-16 text-center">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestCases.map((testCase, index) => {
                    const isSelected = selectedTestCaseIds.includes(
                      testCase.id,
                    );
                    const hasFailedMetric =
                      testCase.metrics &&
                      Object.values(testCase.metrics).some(
                        (metric: any) => metric.status === "fail",
                      );

                    console.log({ testCase });

                    return (
                      <TableRow
                        key={testCase.id}
                        className={`cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-blue-50 hover:bg-blue-50" : ""}`}
                        onClick={() => onToggleSelection(testCase.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              onToggleSelection(testCase.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell
                          className="text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTestClick(testCase);
                          }}
                        >
                          TC{String(index + 1).padStart(3, "0")}
                        </TableCell>
                        <TableCell
                          className="max-w-[120px] truncate font-medium"
                          title={testCase.name}
                        >
                          {testCase.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              testCase.status === "failed" || hasFailedMetric
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {testCase.status === "completed" && hasFailedMetric
                              ? "fail"
                              : testCase.status === "completed"
                                ? "pass"
                                : testCase.status}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="max-w-[120px] truncate text-xs"
                          title={getTestCaseValue(testCase, "userInput")}
                        >
                          {getTestCaseValue(testCase, "userInput")}
                        </TableCell>
                        <TableCell
                          className="max-w-[120px] truncate text-xs"
                          title={getTestCaseValue(testCase, "expectedOutput")}
                        >
                          {getTestCaseValue(testCase, "expectedOutput") || "-"}
                        </TableCell>
                        <TableCell
                          className="max-w-[120px] truncate text-xs"
                          title={getTestCaseValue(testCase, "agentResponse")}
                        >
                          {getTestCaseValue(testCase, "agentResponse") || "-"}
                        </TableCell>
                        {/* Individual metric columns - show score or '-' */}
                        {[
                          "task_completion",
                          "hallucinations",
                          "tool_correctness",
                          "argument_correctness",
                          "contextual_relevancy",
                          "answer_relevancy",
                          "knowledge_retention",
                        ].map((metricName) => {
                          const metric = testCase.metrics?.[metricName];
                          return (
                            <TableCell
                              key={metricName}
                              className="px-1 text-center"
                            >
                              {metric ? (
                                <div
                                  className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                                    metric.status === "pass"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                  title={`${metricName.replace(/_/g, " ")}: ${metric.score}%`}
                                >
                                  {metric.score}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {testCase.duration
                            ? `${(testCase.duration / 1000).toFixed(1)}s`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTestCases.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={16}
                        className="py-8 text-center text-gray-500"
                      >
                        {filterMode === "failed"
                          ? "No failed test cases found"
                          : "No completed or failed test cases yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Hardening Controls */}
        {!improvedConfig && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            {selectedTestCaseIds.length > 0 ? (
              <p className="mb-3 text-sm text-blue-900">
                <strong>{selectedTestCaseIds.length}</strong> test case
                {selectedTestCaseIds.length > 1 ? "s" : ""} selected for
                hardening
              </p>
            ) : (
              <p className="mb-3 text-sm text-blue-900">
                No test cases selected for hardening
              </p>
            )}

            {/* Hardening Buttons */}
            <div className="mb-3 flex items-center gap-3">
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
            </div>

            {/* Max Loops Configuration */}
            {!isAutoHardening && (
              <div className="rounded-md border border-blue-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Max Reinforcement Hardening Loops:
                  </label>
                  <select
                    value={maxLoops}
                    onChange={(e) => onMaxLoopsChange(Number(e.target.value))}
                    className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Automated mode will harden and re-evaluate up to {maxLoops}{" "}
                  times until all tests pass
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Improved Configuration */}
      {improvedConfig && (
        <Card className="border-2 border-green-200 bg-green-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-900">
                Hardened Agent Configuration
              </h3>
            </div>
          </div>

          {/* Change Summary */}
          {improvedConfig.changeSummary &&
            improvedConfig.changeSummary.length > 0 && (
              <div className="mb-4 rounded-md bg-white p-3">
                <h4 className="mb-2 text-xs font-semibold text-gray-900">
                  Key Changes:
                </h4>
                <ul className="list-inside list-disc space-y-1">
                  {improvedConfig.changeSummary.map((change, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <Separator className="my-4" />

          {/* Side-by-side comparison */}
          {/* Goal */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Current Goal
              </label>
              <div className="mt-1 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm">
                  {sourceAgent.agent_goal || "Not specified"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Improved Goal (Editable)
              </label>
              <textarea
                className="mt-1 w-full resize-none rounded-md border-2 border-green-300 bg-green-50 p-3 text-sm font-medium focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                value={editableGoal}
                onChange={(e) => onGoalChange(e.target.value)}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Current Instructions
              </label>
              <div className="mt-1 max-h-60 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                <p className="whitespace-pre-wrap text-sm">
                  {sourceAgent.agent_instructions}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Improved Instructions (Editable)
              </label>
              <textarea
                className="mt-1 min-h-[240px] w-full resize-y rounded-md border-2 border-green-300 bg-green-50 p-3 text-sm font-medium focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                value={editableInstructions}
                onChange={(e) => onInstructionsChange(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onDiscard}>
              Discard Changes
            </Button>
            <Button onClick={onApplyChanges}>Push to Production</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

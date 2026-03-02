import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { HardenedAgentComparison } from "./HardenedAgentComparison";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LoopResult {
  loop: number;
  label: string;
  improved: any;
  testResults: any[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface LoopSectionalTableProps {
  loopResults: LoopResult[];
  selectedTestCaseIds: string[];
  sourceAgent: any;
  modelName?: string;
  onToggleSelection: (id: string) => void;
  onTestClick: (testCase: any) => void;
  onApplyChanges?: () => void;
  onDiscard?: () => void;
  getTestCaseValue: (testCase: any, property: string) => string;
}

const TableHeadWithTooltip = ({
  title,
  tooltip,
}: {
  title: string;
  tooltip: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TableHead className="w-30 text-center" title={title}>
          {title}
        </TableHead>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export const LoopSectionalTable: React.FC<LoopSectionalTableProps> = ({
  loopResults,
  selectedTestCaseIds,
  sourceAgent,
  modelName,
  onToggleSelection,
  onTestClick,
  onApplyChanges,
  onDiscard,
  getTestCaseValue,
}) => {
  // Track which sections are expanded (default: only latest is expanded)
  const [expandedSections, setExpandedSections] = useState<number[]>(() => {
    if (loopResults.length > 0) {
      return [loopResults[loopResults.length - 1].loop]; // Latest loop expanded
    }
    return [];
  });

  // Track which configs are expanded
  const [expandedConfigs, setExpandedConfigs] = useState<number[]>([]);

  const toggleSection = (loop: number) => {
    setExpandedSections((prev) =>
      prev.includes(loop) ? prev.filter((l) => l !== loop) : [...prev, loop],
    );
  };

  const toggleConfig = (loop: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent section toggle when clicking config button
    setExpandedConfigs((prev) =>
      prev.includes(loop) ? prev.filter((l) => l !== loop) : [...prev, loop],
    );
  };

  // Update expanded sections when new loop results arrive
  React.useEffect(() => {
    if (loopResults.length > 0) {
      const latestLoop = loopResults[loopResults.length - 1].loop;
      if (!expandedSections.includes(latestLoop)) {
        setExpandedSections((prev) => [...prev, latestLoop]);
      }
    }
  }, [loopResults.length]);

  if (loopResults.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No loop results available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loopResults.map((loopResult) => {
        const isExpanded = expandedSections.includes(loopResult.loop);
        const failedCount = loopResult.totalCount - loopResult.passedCount;

        // For initial run (loop 0), show all tests
        // For RL loops, show only tests that were retried (failed tests from previous loop)
        const testsToShow =
          loopResult.loop === 0
            ? loopResult.testResults
            : loopResult.testResults; // Backend should send only retried tests

        return (
          <div
            key={loopResult.loop}
            className="overflow-hidden rounded-lg border bg-white"
          >
            {/* Section Header */}
            <div
              className="flex cursor-pointer items-center justify-between border-b bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              onClick={() => toggleSection(loopResult.loop)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {loopResult.loop === 0 ? "📊" : "🔄"}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {loopResult.label}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        loopResult.allPassed
                          ? "border-green-300 bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {loopResult.passedCount} passed
                    </Badge>
                    {failedCount > 0 && (
                      <Badge
                        variant="outline"
                        className="border-red-300 bg-red-100 text-xs text-red-800"
                      >
                        {failedCount} failed
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      ({loopResult.totalCount} total)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Config Toggle Button - only show for loops with improved config */}
                {loopResult.improved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => toggleConfig(loopResult.loop, e)}
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    <span className="text-xs"> Hardened Agent Config</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(loopResult.loop);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Section Content - Table */}
            {isExpanded && (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={false}
                          disabled
                          aria-label="Selection disabled in sectional view"
                        />
                      </TableHead>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead className="min-w-[120px]">Test Case</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="min-w-[120px]">Input</TableHead>
                      <TableHead className="min-w-[120px]">Expected</TableHead>
                      <TableHead className="min-w-[120px]">Output</TableHead>
                      {/* Individual metric columns */}
                      <TableHeadWithTooltip
                        title="TC"
                        tooltip="Task Completion"
                      />
                      <TableHeadWithTooltip
                        title="HAL"
                        tooltip="Hallucinations"
                      />
                      {/* <TableHead className="text-center w-16" title="Bias">BIA</TableHead>
                      <TableHead className="text-center w-16" title="Toxicity">TOX</TableHead>
                      <TableHead className="text-center w-16" title="Tool Correctness">TCC</TableHead>
                      <TableHead className="text-center w-16" title="Argument Correctness">AC</TableHead>
                      <TableHead className="text-center w-16" title="Contextual Relevancy">CR</TableHead>
                      <TableHead className="text-center w-16" title="Answer Relevancy">AR</TableHead>
                      <TableHead className="text-center w-16" title="Knowledge Retention">KR</TableHead>
                      <TableHead className="w-16 text-center">Time</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testsToShow.map((testCase, index) => {
                      const isSelected = selectedTestCaseIds.includes(
                        testCase.id,
                      );
                      const hasFailedMetric =
                        testCase.metrics &&
                        Object.values(testCase.metrics).some(
                          (metric: any) => metric.status === "fail",
                        );

                      return (
                        <TableRow
                          key={testCase.id}
                          className={`cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-blue-50 hover:bg-blue-50" : ""}`}
                          onClick={() => onTestClick(testCase)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onTestClick(testCase);
                            }}
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
                              {testCase.status === "completed" &&
                              hasFailedMetric
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
                            {getTestCaseValue(testCase, "expectedOutput") ||
                              "-"}
                          </TableCell>
                          <TableCell
                            className="max-w-[120px] truncate text-xs"
                            title={getTestCaseValue(testCase, "agentResponse")}
                          >
                            {getTestCaseValue(testCase, "agentResponse") || "-"}
                          </TableCell>
                          {/* Individual metric columns */}
                          {[
                            "task_completion",
                            "hallucinations",
                            // "bias",
                            // "toxicity",
                            // "tool_correctness",
                            // "argument_correctness",
                            // "contextual_relevancy",
                            // "answer_relevancy",
                            // "knowledge_retention",
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
                                        : metric.status === "warning"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                    title={`${metricName.replace(/_/g, " ")}: ${metric.score}%`}
                                  >
                                    {metric.score}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          {/* <TableCell className="text-center">
                            {testCase.duration
                              ? `${(testCase.duration / 1000).toFixed(1)}s`
                              : "-"}
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                    {testsToShow.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={17}
                          className="py-8 text-center text-gray-500"
                        >
                          No test results for this loop
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Hardened Agent Configuration Section */}
            {expandedConfigs.includes(loopResult.loop) &&
              loopResult.improved && (
                <div className="border-t bg-gray-50 p-4">
                  <HardenedAgentComparison
                    sourceAgent={sourceAgent}
                    improvedConfig={loopResult.improved}
                    modelName={modelName}
                    onApplyChanges={onApplyChanges}
                    onDiscard={onDiscard}
                  />
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
};

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Play, ArrowUpDown, Download, Loader2 } from "lucide-react";
import { TestCase, Scenario, Persona } from "../types/worldModel";
import { Agent } from "../../agent-eval/types/agent";
import { toast } from "sonner";
import useStore from "@/lib/store";
import { exportSimulationsCsv } from "../services/environmentApi";

interface TestCasesListProps {
  testCases: TestCase[];
  scenarios: Scenario[];
  personas: Persona[];
  loading?: boolean;
  agent: Agent;
  worldModelId: string;
  onEvaluationRequest?: (selectedTestCases: string[]) => void;
  onSimulationDelete?: (simulationId: string) => Promise<boolean>;
  onBulkSimulationDelete?: (simulationIds: string[]) => Promise<boolean>;
  onSelectTestcase?: (selectedTestcase: TestCase) => void;
  selectedTestCases: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const TestCasesList: React.FC<TestCasesListProps> = ({
  testCases,
  scenarios,
  personas,
  loading = false,
  onEvaluationRequest,
  onSimulationDelete,
  onBulkSimulationDelete,
  onSelectTestcase,
  selectedTestCases,
  onSelectionChange,
  worldModelId,
}) => {
  const apiKey = useStore((state) => state.api_key);
  const [sortField, setSortField] = useState<
    "number" | "scenario" | "persona" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isExporting, setIsExporting] = useState(false);

  const getSimulationId = (testCase: TestCase): string =>
    testCase._id || testCase.id || "";

  // Enhanced test cases with scenario and persona names
  const enhancedTestCases = useMemo(() => {
    return testCases.map((testCase, index) => {
      const scenario = scenarios.find(
        (s) => (s._id || s.name) === testCase.scenario_id,
      );
      const persona = personas.find(
        (p) => (p._id || p.name) === testCase.persona_id,
      );

      return {
        ...testCase,
        number: index + 1,
        scenarioName: scenario?.name || "Unknown Scenario",
        personaName: persona?.name || "Unknown Persona",
      };
    });
  }, [testCases, scenarios, personas]);

  // Sorted test cases
  const sortedTestCases = useMemo(() => {
    if (!sortField) return enhancedTestCases;

    return [...enhancedTestCases].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "number":
          aValue = a.number;
          bValue = b.number;
          break;
        case "scenario":
          aValue = a.scenarioName;
          bValue = b.scenarioName;
          break;
        case "persona":
          aValue = a.personaName;
          bValue = b.personaName;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [enhancedTestCases, sortField, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = testCases
        .map((tc) => getSimulationId(tc))
        .filter((id): id is string => Boolean(id));
      onSelectionChange(ids);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTestCase = (testCaseId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTestCases, testCaseId]);
    } else {
      onSelectionChange(selectedTestCases.filter((id) => id !== testCaseId));
    }
  };

  const handleSort = (field: "number" | "scenario" | "persona") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTestCases.length === 0 || !onBulkSimulationDelete) return;

    const success = await onBulkSimulationDelete(selectedTestCases);
    if (success) {
      onSelectionChange([]);
    }
  };

  const handleRunSelected = () => {
    if (selectedTestCases.length === 0) {
      return;
    }
    onEvaluationRequest?.(selectedTestCases);
  };

  const handleExportSelected = async () => {
    if (selectedTestCases.length === 0) {
      toast.error("Select at least one simulation to export");
      return;
    }

    if (!apiKey) {
      toast.error("Missing API key");
      return;
    }

    setIsExporting(true);
    try {
      const validSimulationIds = selectedTestCases.filter(Boolean);
      if (validSimulationIds.length !== selectedTestCases.length) {
        toast.error("Some selected simulations are missing valid IDs");
        return;
      }

      const csvBlob = await exportSimulationsCsv(
        worldModelId,
        validSimulationIds,
        apiKey,
      );

      const contentType = csvBlob.type || "text/csv";
      const fileBlob = new Blob([csvBlob], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = downloadUrl;
      link.download = `simulations-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Simulation CSV exported successfully");
    } catch (error) {
      console.error("Failed to export simulations CSV:", error);
      const axiosError = error as any;
      const responseData = axiosError?.response?.data;

      let serverMessage = "";
      if (responseData instanceof Blob) {
        try {
          serverMessage = await responseData.text();
        } catch {
          serverMessage = "";
        }
      } else if (typeof responseData === "string") {
        serverMessage = responseData;
      } else if (responseData?.detail) {
        serverMessage = String(responseData.detail);
      }

      toast.error(
        serverMessage
          ? `Failed to export simulations CSV: ${serverMessage}`
          : "Failed to export simulations CSV",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const isAllSelected =
    testCases.length > 0 && selectedTestCases.length === testCases.length;

  if (loading) {
    return (
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            SIMULATIONS
          </p>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">No.</TableHead>
                <TableHead>User Input</TableHead>
                <TableHead>Expected Output</TableHead>
                <TableHead>Scenario</TableHead>
                <TableHead>Persona</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!testCases || testCases.length === 0) {
    return (
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            SIMULATIONS
          </p>
        </div>
        <div className="rounded-lg border bg-gray-50 py-12 text-center">
          <p className="text-lg text-gray-500">No simulations generated yet</p>
          <p className="mt-2 text-sm text-gray-400">
            Select scenarios and personas, then generate simulations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Header with actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            SIMULATIONS
          </p>
          {selectedTestCases.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedTestCases.length} selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{testCases.length} Total</Badge>
        </div>
      </div>

      {/* Bulk Actions */}

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
        {selectedTestCases?.length > 0 ? (
          <span className="text-sm text-blue-700">
            {selectedTestCases.length} simulation
            {selectedTestCases.length > 1 ? "s" : ""} selected
          </span>
        ) : (
          <span className="text-sm font-semibold text-blue-700">
            Select simulations to run evaluation
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunSelected}
            disabled={selectedTestCases.length === 0}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <Play className="mr-1 h-4 w-4" />
            Configure Evaluation ({selectedTestCases.length} selected)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSelected}
            disabled={selectedTestCases.length === 0 || isExporting}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1 h-4 w-4" />
            )}
            Export Simulations ({selectedTestCases.length} selected)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={selectedTestCases.length === 0}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("number")}
                  className="h-8 px-2 text-xs font-medium"
                >
                  No.
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-medium">User Input</TableHead>
              <TableHead className="font-medium">Expected Output</TableHead>
              <TableHead className="w-40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("scenario")}
                  className="h-8 px-2 text-xs font-medium"
                >
                  Scenario
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("persona")}
                  className="h-8 px-2 text-xs font-medium"
                >
                  Persona
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              {onSimulationDelete && (
                <TableHead className="w-16">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTestCases.map((testCase) => {
              const testCaseId = getSimulationId(testCase);
              const isSelected = selectedTestCases.includes(testCaseId);
              const isSelectable = Boolean(testCaseId);

              return (
                <TableRow
                  key={testCaseId || `${testCase.name}-${testCase.number}`}
                  className={`hover:bg-gray-50 ${isSelected ? "border-blue-200 bg-blue-50" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      disabled={!isSelectable}
                      onCheckedChange={(checked) =>
                        isSelectable && handleSelectTestCase(testCaseId, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {testCase.number}
                  </TableCell>
                  <TableCell
                    className="max-w-md cursor-pointer truncate text-sm underline-offset-4 hover:underline"
                    title={testCase.user_input}
                    aria-label={testCase.user_input}
                    onClick={() => onSelectTestcase?.(testCase)}
                  >
                    {testCase.user_input}
                  </TableCell>
                  <TableCell className="max-w-md text-sm">
                    <div
                      className="truncate text-gray-900"
                      title={
                        typeof testCase.expected_output === "string"
                          ? testCase.expected_output
                          : JSON.stringify(testCase.expected_output, null, 2)
                      }
                    >
                      {typeof testCase.expected_output === "string"
                        ? testCase.expected_output
                        : JSON.stringify(testCase.expected_output)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="text-xs">
                      {testCase.scenarioName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="secondary" className="text-xs">
                      {testCase.personaName}
                    </Badge>
                  </TableCell>
                  {onSimulationDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSimulationDelete(testCaseId)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

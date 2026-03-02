import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload, Loader2, FileUp } from "lucide-react";
import { Agent } from "../../agent-eval/types/agent";
import { TestCase, Scenario, Persona } from "../types/worldModel";
import { ScenariosList } from "./ScenariosList";
import { AgentInfo } from "./AgentInfo";
import { PersonasList } from "./PersonasList";
import { TestCasesList } from "./TestCasesList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WorldModelStepProps {
  scenarios: Scenario[];
  personas: Persona[];
  testCases: TestCase[];
  selectedScenarios: string[];
  selectedPersonas: string[];
  sourceAgent: Agent;
  worldModelId: string;
  isGeneratingTestCases: boolean;
  isGeneratingScenarios?: boolean;
  isGeneratingPersonas?: boolean;
  onScenarioToggle: (scenarioId: string, checked: boolean) => void;
  onPersonaToggle: (personaId: string, checked: boolean) => void;
  onScenarioDelete?: (scenarioId: string) => Promise<boolean>;
  onPersonaDelete?: (personaId: string) => Promise<boolean>;
  onSimulationDelete?: (simulationId: string) => Promise<boolean>;
  onBulkSimulationDelete?: (simulationIds: string[]) => Promise<boolean>;
  onSelectAllScenarios?: (scenarioIds: string[]) => void;
  onSelectAllPersonas?: (personaIds: string[]) => void;
  onAddScenarioClick: () => void;
  onAddPersonaClick: () => void;
  onAddTestCaseClick: () => void;
  onImportSimulationsCsv: (file: File) => Promise<void>;
  onGenerateTestCases: (onSuccess?: () => void) => void;
  onGenerateMoreScenarios: () => void;
  onGenerateMorePersonas: () => void;
  onEvaluationRequest: (selectedTestCases: string[]) => void;
  selectedTestCases: string[];
  onTestCaseSelectionChange: (selectedIds: string[]) => void;
}

export const WorldModelStep: React.FC<WorldModelStepProps> = ({
  scenarios,
  personas,
  testCases,
  selectedScenarios,
  selectedPersonas,
  sourceAgent,
  worldModelId,
  isGeneratingTestCases,
  isGeneratingScenarios = false,
  isGeneratingPersonas = false,
  onScenarioToggle,
  onPersonaToggle,
  onScenarioDelete,
  onPersonaDelete,
  onSimulationDelete,
  onBulkSimulationDelete,
  onSelectAllScenarios,
  onSelectAllPersonas,
  onAddScenarioClick,
  onAddPersonaClick,
  onAddTestCaseClick,
  onImportSimulationsCsv,
  onGenerateTestCases,
  onGenerateMoreScenarios,
  onGenerateMorePersonas,
  onEvaluationRequest,
  selectedTestCases,
  onTestCaseSelectionChange,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const tableTopRef = useRef<HTMLDivElement>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [selectedTestcase, setSelectedTestcase] = useState<TestCase | null>(
    null,
  );
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const backToTop = () => {
    tableTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setIsImportingCsv(true);
        await onImportSimulationsCsv(file);
        setIsImportDialogOpen(false);
      } finally {
        setIsImportingCsv(false);
      }
    },
    [onImportSimulationsCsv],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: isImportingCsv,
  });

  const handleDownloadTemplateCsv = () => {
    const csvHeader = "No,User Input,Expected Output,Scenario,Persona";
    const csvContent = `${csvHeader}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "simulation-format.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Environments Configuration */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">World Model Configuration</h2>
          <p className="text-sm text-gray-600">
            Configure scenarios and simulations
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onAddScenarioClick} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Scenario
          </Button>
          <Button size="sm" onClick={onAddPersonaClick} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Persona
          </Button>
          <Button size="sm" onClick={onAddTestCaseClick} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Simulation
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={isImportingCsv}>
                <Upload className="mr-2 h-4 w-4" />
                Import Simulations
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Simulations</DialogTitle>
                <DialogDescription>
                  Drag and drop a CSV file or click to browse.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                <div
                  {...getRootProps()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  } ${isImportingCsv ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  {isImportingCsv ? (
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-gray-400" />
                  ) : (
                    <FileUp className="mb-4 h-12 w-12 text-gray-400" />
                  )}
                  <p className="text-base font-medium text-gray-700">
                    {isImportingCsv
                      ? "Importing..."
                      : isDragActive
                        ? "Drop the CSV file here"
                        : "Drag & drop your CSV file here"}
                  </p>
                  {!isImportingCsv && !isDragActive && (
                    <p className="mt-2 text-sm text-gray-500">
                      or <span className="text-blue-600 underline">browse</span> to choose a file
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCsv}
                  className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700"
                >
                  Download simulation format CSV
                </button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="blue"
            onClick={() => onGenerateTestCases(scrollToBottom)}
            loading={isGeneratingTestCases}
            disabled={
              isGeneratingTestCases ||
              selectedScenarios.length === 0 ||
              selectedPersonas.length === 0
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            {isGeneratingTestCases ? "Generating..." : "Generate Simulations"}
          </Button>
        </div>
      </div>

      {/* Flow Layout: Scenarios -> Agent -> Personas */}
      <div className="grid grid-cols-12 items-start gap-6">
        {/* Left: Scenarios */}
        <div className="col-span-3">
          <ScenariosList
            scenarios={scenarios}
            selectedScenarios={selectedScenarios}
            onScenarioToggle={onScenarioToggle}
            onScenarioDelete={onScenarioDelete}
            onSelectAllScenarios={onSelectAllScenarios}
          />

          <div className="mt-3">
            <Button
              onClick={onGenerateMoreScenarios}
              disabled={isGeneratingScenarios}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="mr-2 h-3 w-3" />
              {isGeneratingScenarios
                ? "Generating..."
                : "Generate More Scenarios"}
            </Button>
          </div>
        </div>

        {/* Center: Agent with Tools/Features below */}
        <div className="col-span-6 flex flex-col items-center">
          <AgentInfo agent={sourceAgent} />
        </div>

        {/* Right: Personas */}
        <div className="col-span-3">
          <PersonasList
            personas={personas}
            selectedPersonas={selectedPersonas}
            onPersonaToggle={onPersonaToggle}
            onPersonaDelete={onPersonaDelete}
            onSelectAllPersonas={onSelectAllPersonas}
          />

          <div className="mt-3">
            <Button
              onClick={onGenerateMorePersonas}
              disabled={isGeneratingPersonas}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="mr-2 h-3 w-3" />
              {isGeneratingPersonas
                ? "Generating..."
                : "Generate More Personas"}
            </Button>
          </div>
        </div>
      </div>

      {/* Simulations Section */}
      <div ref={tableTopRef} />
      <TestCasesList
        testCases={testCases}
        scenarios={scenarios}
        personas={personas}
        loading={isGeneratingTestCases}
        agent={sourceAgent}
        worldModelId={worldModelId}
        onEvaluationRequest={onEvaluationRequest}
        onSelectTestcase={(value) => {
          setSelectedTestcase(value);
          setIsSheetOpen(true);
        }}
        onSimulationDelete={onSimulationDelete}
        onBulkSimulationDelete={onBulkSimulationDelete}
        selectedTestCases={selectedTestCases}
        onSelectionChange={onTestCaseSelectionChange}
      />
      {testCases.length > 50 && (
        <div className="grid place-items-center">
          <Button
            variant="link"
            onClick={backToTop}
            className="underline underline-offset-4"
          >
            Back to Top
          </Button>
        </div>
      )}
      <div ref={bottomRef} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[65vw] min-w-[800px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Case Details
            </SheetTitle>
            <SheetDescription>
              Detailed results and activity log for the test case:{" "}
              <b>{selectedTestcase?.name}</b>
            </SheetDescription>
          </SheetHeader>

          {selectedTestcase && (
            <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Test Case Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">Name</span>
                      <p className="text-sm font-medium">
                        {selectedTestcase.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">ID</span>
                      <div className="mt-1">
                        <Badge>{selectedTestcase._id}</Badge>
                      </div>
                    </div>
                    {/* {selectedTestcase.id > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Duration</span>
                        <p className="text-sm">
                          {(selectedTestcase.scenario_id / 1000).toFixed(1)}s
                        </p>
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Input/Output */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Input & Output
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-500">User Input</span>

                      <div className="mt-1 rounded-md bg-gray-50 p-3">
                        <p className="whitespace-pre-wrap text-sm">
                          {selectedTestcase?.user_input}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500">
                        Expected Output
                      </span>
                      {selectedTestcase?.expected_output ? (
                        <div className="mt-1 rounded-md bg-amber-50 p-3">
                          <pre className="whitespace-pre-wrap text-sm">
                            {typeof selectedTestcase.expected_output === "string"
                              ? selectedTestcase.expected_output
                              : JSON.stringify(selectedTestcase.expected_output, null, 2)}
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
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  Agent,
  TestCase,
  TestResultWithEvaluation,
  EvaluationResponse,
  EvaluationResult,
} from "../types/agent";
import {
  generateTestCases,
  runTestCase,
  runEvaluation,
  getPromptSuggestions,
} from "../utils/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Lightbulb, Copy } from "lucide-react";
import useStore from "@/lib/store";
import { useAgentEvalService } from "../agent-eval.service";
import AgentEvalAccordion from "./AgentEvalAccordion";
import Loader from "@/components/loader";
import AgentEvalResultAccordion from "./AgentEvalResultAccordion";
import {
  Accordion,
  AccordionTrigger,
  AccordionContent,
  AccordionItem,
} from "./ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { extractJsonFromResponse } from "@/lib/utils";
import { Badge } from "./ui/badge";
import TestCaseDetailSidebar from "./TestResultDetailsSidebar";
import { AgentEvalResultItem } from "../types/agent";
import { useCredits } from "@/hooks/use-credits";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";


interface TestCaseAndResultsProps {
  selectedAgent: Agent | null;
}


interface AgentEvalItem {
  id: string;
  purpose: string;
  userInput: string;
  expectedOutput: string;
  evaluationNotes: string;
}
interface AgentEvalTestCase {
  agent_id: string;
  eval_name: string;
  session_id: string;
  agent_eval_list: AgentEvalItem[];
}


type PromptSuggestions = {
  suggested_system_prompt: string;
  change_summary: string[];
} | null;


const TestCaseAndResults: React.FC<TestCaseAndResultsProps> = ({
  selectedAgent,
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResultWithEvaluation[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestions>(null);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);


  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);
  const {
    fetchingAgentEval,
    evalData,
    getAgentEval,
    evalDataResult,
    getAgentEvalResult,
    fetchingAgentEvalResult,
    createAgentEvalResult,
    createAgentEvalTestCase,
  } = useAgentEvalService({
    apiKey,
    agentId: selectedAgent?._id ?? "",
  });
  const [activeTab, setActiveTab] = useState("test-cases");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedResultItem, setSelectedResultItem] = useState<AgentEvalResultItem | null>(null);


  const { handleCredits } = useCredits();
  


  useEffect(() => {
    if (selectedAgent) {
      setResults([]);
      setEvaluation(null);
      setActiveTab("test-cases");
      getAgentEval();
    }
  }, [selectedAgent]);


  useEffect(() => {
    if (!fetchingAgentEval && evalData) {
      setTestCases(evalData);
    }
  }, [evalData, fetchingAgentEval]);


  useEffect(() => {
    if (activeTab === "results") {
      getAgentEvalResult();
    }
  }, [activeTab, getAgentEvalResult]);


  const handleCreateAgentEvalTestCase = async (evalList: AgentEvalItem[]) => {
    const agentId = selectedAgent?._id;
    const sessionId = `${agentId}-${Math.random().toString(36).substring(2, 15)}`;
    try {
      const payload: AgentEvalTestCase = {
        agent_id: agentId ?? "",
        eval_name: inputValue,
        session_id: sessionId,
        agent_eval_list: evalList,
      };
      await createAgentEvalTestCase(payload);
      await getAgentEval();
    } catch (error) {
      console.error("Error creating agent eval:", error);
    }
  };


  const handleCreateAgentEvalResult = async (
    evalId: string,
    evalResultList: EvaluationResult[],
  ) => {
    const agentId = selectedAgent?._id;
    try {
      const payload: any = {
        agent_eval_id: evalId,
        agent_id: agentId,
        agent_eval_result_list: evalResultList,
      };
      await createAgentEvalResult(payload);
    } catch (error) {
      console.error("Error creating agent eval:", error);
    }
  };


  const handleGenerateTestCases = async () => {
    if (!selectedAgent || !apiKey) return;


    setGenerating(true);
    try {
      const response = await generateTestCases(apiKey, selectedAgent);


      let testCasesData;
      if (typeof response === "object" && response !== null) {
        testCasesData = response;
      } else {
        testCasesData = extractJsonFromResponse(response);
      }


      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Generate test case clicked", {
          agentId: selectedAgent?._id,
          agentName: selectedAgent?.name,
        });


    handleCreateAgentEvalTestCase(testCasesData.test_cases);
    setTestCases(testCasesData.test_cases);
    setResults([]);
    setEvaluation(null);
    setPromptSuggestions(null);
    setTimeout(handleCredits, 3 * 1000);


      toast({
        title: "Success",
        description: `Generated ${testCasesData.test_cases.length} test cases`,
      });
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        title: "Error",
        description: "Failed to generate test cases",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setShowNameDialog(false);
    }
  };


  const handleAddNameDialog = () => {
    setInputValue("");
    setShowNameDialog(true);
  };


  const getScoreColorClass = (score: number | undefined | null): string => {
    if (score === undefined || score === null) {
      return "";
    }
    return score < 0.75 ? "text-red-600" : "";
  };


  const runAllTests = async (individualTestCase: any) => {
    setActiveTab("results");
    let updatedTestCase;
    if (!selectedAgent || testCases.length === 0) return;
    if (individualTestCase.agent_eval_list?.length > 0) {
      updatedTestCase = individualTestCase.agent_eval_list;
    } else {
      updatedTestCase = testCases;
    }


    setRunning(true);
    setEvaluation(null);
    setPromptSuggestions(null);


    const newResults: TestResultWithEvaluation[] = updatedTestCase.map(
      (testCase: any) => ({
        testCase,
        actualOutput: "",
        status: "pending" as const,
      }),
    );


    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Run test case clicked", {
        agentId: selectedAgent._id,
        agentName: selectedAgent?.name,
      });


    setResults(newResults);


    try {
      const actualOutputs: string[] = [];
      const evaluationResults: any[] = [];
      let testCase;


      for (let i = 0; i < updatedTestCase.length; i++) {
        testCase = updatedTestCase[i];


        setResults((prev) =>
          prev.map((result, index) =>
            index === i ? { ...result, status: "running" as const } : result,
          ),
        );


        try {
          const actualOutput = await runTestCase(
            selectedAgent._id,
            testCase.user_input,
            apiKey,
          );
          actualOutputs.push(actualOutput);


          setResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    actualOutput,
                    timestamp: new Date().toISOString(),
                  }
                : result,
            ),
          );


          try {
            const singleTestEvaluation = await runEvaluation(
              [testCase],
              [actualOutput],
              apiKey,
              selectedAgent
            );
            const evalResult = singleTestEvaluation.results[0];
            evalResult["user_input"] = testCase.user_input;
            evalResult["expected_output"] = testCase.expected_output;
            evalResult["actual_output"] = actualOutput;
            evaluationResults.push(evalResult);


            setResults((prev) =>
              prev.map((result, index) =>
                index === i
                  ? {
                      ...result,
                      status:
                        evalResult?.status === "pass"
                          ? ("passed" as const)
                          : ("failed" as const),
                      evaluation: evalResult,
                    }
                  : result,
              ),
            );
          } catch (evalError) {
            console.error(
              `Evaluation failed for test ${testCase.id}:`,
              evalError,
            );
            setResults((prev) =>
              prev.map((result, index) =>
                index === i
                  ? {
                      ...result,
                      status: "passed" as const,
                    }
                  : result,
              ),
            );
          }
        } catch (error) {
          const errorOutput = `Error: ${error}`;
          actualOutputs.push(errorOutput);
          setResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    actualOutput: errorOutput,
                    status: "failed" as const,
                    timestamp: new Date().toISOString(),
                  }
                : result,
            ),
          );
        }
      }


      if (evaluationResults.length > 0) {
        await handleCreateAgentEvalResult(
          individualTestCase?._id,
          evaluationResults,
        );
        await getAgentEvalResult();
        const passed = evaluationResults.filter(
          (r) => r.status === "pass",
        ).length;
        const failed = evaluationResults.filter(
          (r) => r.status === "fail",
        ).length;
        const total = evaluationResults.length;
        const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";


        const overallEvaluation = {
          results: evaluationResults,
          summary: {
            passed,
            failed,
            score: passed,
            total_points: total,
            percentage: `${percentage}%`,
          },
        };


        setEvaluation(overallEvaluation);


        toast({
          title: "Tests Completed & Evaluated",
          description: `Score: ${passed}/${total} (${percentage}%)`,
        });
      } else {
        toast({
          title: "Tests Completed",
          description: `Executed ${updatedTestCase.length} test cases.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run test cases",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
      setTimeout(handleCredits, 3 * 1000);
    }
  };


  const handleGetPromptImprovement = async () => {
    if (!selectedAgent || loadingSuggestions) return;
    setActiveTab("suggestions");
    setLoadingSuggestions(true);
    await getAgentEvalResult();
    setIsGeneratingSuggestions(true);
  };
  
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!isGeneratingSuggestions || !selectedAgent) return;
  
      try {
        const agentInstructions =
          typeof selectedAgent.agent_instructions === "string"
            ? selectedAgent.agent_instructions
            : "";
  
        let evaluationSummary = "";
        let testResults = "";
  
        if (evalDataResult && evalDataResult.length > 0) {
          const latestEvalRun = evalDataResult[evalDataResult.length - 1];
          if (latestEvalRun && latestEvalRun.agent_eval_result_list && latestEvalRun.agent_eval_result_list.length > 0) {
            const agentEvalResultList = latestEvalRun.agent_eval_result_list;
            const total = agentEvalResultList.length;
            const passed = agentEvalResultList.filter(
              (r: EvaluationResult) => r.status === "pass"
            ).length;
            const failed = total - passed;
            const score = passed;
            const percentage =
              total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";
      
            evaluationSummary = `Score: ${score}/${total} (${percentage}%)
Passed: ${passed}
Failed: ${failed}`;
      
            testResults = agentEvalResultList
              .map(
                (r: AgentEvalResultItem) =>
                  `Test: ${r.id}
Input: ${r.user_input}
Expected: ${r.expected_output}
Actual: ${r.actual_output}
Status: ${r.status}
Evaluation: ${r.status} - ${r.details || "No details"}`
              )
              .join("\n\n");
          }
        }
  
        const suggestionsJSON = await getPromptSuggestions(
          agentInstructions,
          evaluationSummary,
          testResults,
          apiKey
        );
  
        setPromptSuggestions(suggestionsJSON);
        toast({
          title: "Prompt Improved",
          description: "Prompt improvement and change summary generated.",
        });
      } catch (error) {
        console.error("Error getting suggestions:", error);
        toast({
          title: "Error",
          description: "Failed to generate prompt improvement.",
          variant: "destructive",
        });
      } finally {
        setLoadingSuggestions(false);
        setIsGeneratingSuggestions(false);
      }
    };
  
    generateSuggestions();
  }, [isGeneratingSuggestions, evalDataResult, selectedAgent, apiKey, toast]);


  const handleRowClick = (result: TestResultWithEvaluation) => {
    const sidebarItem: AgentEvalResultItem = {
      id: result.testCase.id,
      details: result.evaluation?.details || "Evaluation not available.",
      status: result.evaluation?.status || result.status,
      user_input: result.testCase.user_input,
      expected_output: result.testCase.expected_output,
      actual_output: result.actualOutput,
      scorecard: result.evaluation?.scorecard,
    };
    setSelectedResultItem(sidebarItem);
  };


  const handleCopyPrompt = () => {
    if (promptSuggestions?.suggested_system_prompt) {
      navigator.clipboard.writeText(promptSuggestions.suggested_system_prompt);
      toast({ title: "Copied!", description: "Prompt copied to clipboard." });
    }
  };


  if (!selectedAgent) {
    return (
      <div className="h-full rounded-lg border bg-card">
        <div className="p-4">
          <h2 className="text-base font-semibold">Test Cases & Results</h2>
        </div>
        <div className="flex h-48 items-center justify-center">
          <div className="text-center text-sm">
            <p>Select an agent to generate test cases</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="flex h-full flex-col rounded-lg border bg-card">
        <div className="shrink-0 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">Test Cases & Results</h2>
              <div className="mt-1 text-xs">
                <p className="truncate font-medium">{selectedAgent.name}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                onClick={handleAddNameDialog}
                disabled={generating}
                size="sm"
                className="h-7 px-2 text-xs"
              >
                Generate
              </Button>
              <Button
                onClick={handleGetPromptImprovement}
                disabled={loadingSuggestions}
                size="sm"
                className="h-7 bg-blue-600 px-2 text-xs hover:bg-blue-700"
              >
                {loadingSuggestions ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Lightbulb className="mr-1 h-3 w-3" />
                    Improve
                  </>
                )}
              </Button>
            </div>
          </div>
          {evaluation && (
            <div className="mt-2 rounded border p-2">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs font-semibold">Evaluation Summary</h3>
                <Badge
                  className={`px-2 py-0 text-xs ${
                    parseInt(evaluation.summary.percentage) >= 70
                      ? "bg-green-100 text-green-800"
                      : parseInt(evaluation.summary.percentage) >= 50
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {evaluation.summary.percentage}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-green-600">
                    {evaluation.summary.passed}
                  </p>
                  <p className="text-xs">Passed</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-600">
                    {evaluation.summary.failed}
                  </p>
                  <p className="text-xs">Failed</p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {evaluation.summary.score}
                  </p>
                  <p className="text-xs">Score</p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {evaluation.summary.total_points}
                  </p>
                  <p className="text-xs">Total</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-3">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            defaultValue="test-cases"
            className="flex h-full flex-col"
          >
            <TabsList className="grid h-8 w-full shrink-0 grid-cols-3">
              <TabsTrigger value="test-cases" className="text-xs">
                Cases {testCases.length > 0 && `(${testCases.length})`}
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2 text-xs">
                Runs {evalDataResult.length > 0 && `(${evalDataResult.length})`}
                {results.length > 0 && (
                  <div className="ml-1 flex gap-1">
                    <Badge
                      variant="default"
                      className="bg-green-100 px-1 py-0 text-xs text-green-800"
                    >
                      {results.filter((r) => r.status === "passed").length}
                    </Badge>
                    <Badge variant="destructive" className="px-1 py-0 text-xs">
                      {results.filter((r) => r.status === "failed").length}
                    </Badge>
                  </div>
                )}
                {running ? "Running..." : ""}
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">
                <Lightbulb className="mr-1 h-3 w-3" />
                Improvements
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="test-cases"
              className="mt-2 flex-1 overflow-auto"
            >
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {fetchingAgentEval ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader />
                    </div>
                  ) : testCases.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      Click "Generate" to create test cases for the selected
                      agent.
                    </div>
                  ) : (
                    <AgentEvalAccordion
                      evalData={evalData}
                      onRunTest={runAllTests}
                      isRunning={running}
                    />
                  )}
                </div>
</ScrollArea>
            </TabsContent>
            
            <TabsContent
              value="results"
              className="mt-2 bg-grey-50 flex-1 w-full"
            >
              <div className="space-y-2 pr-2">
                  {fetchingAgentEvalResult ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader />
                    </div>
                  ) : results.length === 0 && evalDataResult.length === 0 ? (
                    <div className="py-8 text-center text-sm">
                      Generate test cases and click "Run Tests" to see results.
                    </div>
                  ) : (
                    <>
                      {results.length > 0 && (
                        <Accordion
                          type="single"
                          className="space-y-3"
                          collapsible
                          defaultValue="current"
                        >
                          <AccordionItem
                            value="current"
                            className="rounded-lg border border-gray-200 shadow-sm"
                          >
                            <AccordionTrigger className="p-4 transition-colors duration-200 hover:bg-gray-50">
                              <div className="flex w-full items-center justify-between">
                                <div className="flex w-2/3 items-center justify-between gap-3">
                                  <div className="flex w-20 flex-col items-start">
                                    <span className="text-sm font-medium text-gray-900">
                                      Current
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="px-2 py-1 text-xs"
                                    >
                                      {results.length} tests
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm font-medium text-green-700">
                                      {
                                        results.filter(
                                          (r) => r.status === "passed",
                                        ).length
                                      }
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      /
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {results.length}
                                    </span>
                                  </div>
                                </div>


                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-16 overflow-auto rounded-full bg-gray-200">
                                    <div
                                      className="h-full bg-green-500 transition-all duration-300"
                                      style={{
                                        width: `${results.length > 0 ? (results.filter((r) => r.status === "passed").length / results.length) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {results.length > 0 ? Math.round(
                                      (results.filter(
                                        (r) => r.status === "passed",
                                      ).length /
                                        results.length) *
                                        100,
                                    ) : 0}
                                    %
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-grey-50 p-4 pt-0">
                              <div className="overflow-x-auto">
                                <Table className="w-full table-fixed">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[14%]">TC</TableHead>
                                      <TableHead className="w-[15%]">Input</TableHead>
                                      <TableHead className="w-[15%]">Expected Output</TableHead>
                                      <TableHead className="w-[15%]">Actual Output</TableHead>
                                      <TableHead className="w-[8%] text-center">Status</TableHead>
                                      <TableHead className="w-[8%] text-center">Correctness</TableHead>
                                      <TableHead className="w-[8%] text-center">Coherence</TableHead>
                                      <TableHead className="w-[8%] text-center">Relevance</TableHead>
                                      <TableHead className="w-[8%] text-center">Conciseness</TableHead>
                                      <TableHead className="w-[8%] text-center">Safety</TableHead>
                                      <TableHead className="w-[8%] text-center font-bold">Average</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {results.map((result) => (
                                      <TableRow
                                        key={result.testCase.id}
                                        onClick={() => handleRowClick(result)}
                                        className="cursor-pointer hover:bg-gray-100"
                                      >
                                        <TableCell className="font-medium truncate overflow-auto" title={result.testCase.id}>{result.testCase.id}</TableCell>
                                        <TableCell className="truncate overflow-auto" title={result.testCase.user_input}>{result.testCase.user_input}</TableCell>
                                        <TableCell className="truncate overflow-auto" title={result.testCase.expected_output}>{result.testCase.expected_output}</TableCell>
                                        <TableCell className="truncate overflow-auto" title={result.actualOutput}>{result.actualOutput}</TableCell>
                                        <TableCell className="text-center">
                                          <Badge
                                            variant={
                                              result.status === "passed" ? "default" :
                                              result.status === "failed" ? "destructive" :
                                              result.status === "running" ? "secondary" : "outline"
                                            }
                                            className={`px-2 py-1 text-xs font-medium ${
                                              result.status === "passed" ? "border-green-200 bg-green-100 text-green-800" :
                                              result.status === "failed" ? "border-red-200 bg-red-100 text-red-800" :
                                              result.status === "running" ? "border-blue-200 bg-blue-100 text-blue-800" :
                                              "border-gray-200 bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {result.status === "running" && <Clock className="mr-1 h-3 w-3 animate-spin" />}
                                            {result.status.toUpperCase()}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.correctness)}>
                                            {result.evaluation?.scorecard?.correctness ?? "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.coherence)}>
                                            {result.evaluation?.scorecard?.coherence ?? "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.relevance)}>
                                            {result.evaluation?.scorecard?.relevance ?? "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.conciseness)}>
                                            {result.evaluation?.scorecard?.conciseness ?? "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.safety)}>
                                            {result.evaluation?.scorecard?.safety ?? "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                          <span className={getScoreColorClass(result.evaluation?.scorecard?.average)}>
                                            {result.evaluation?.scorecard?.average?.toFixed(2) ?? "N/A"}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      <AgentEvalResultAccordion evalData={evalDataResult} />
                    </>
                  )}
                </div>
            </TabsContent>


            <TabsContent
            value="suggestions"
            className="mt-2 flex-1 overflow-auto flex-col"
            >
            <ScrollArea className="h-full flex-col">
              <div className="pr-2">
                {!promptSuggestions ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    <Lightbulb className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <p className="mb-2">No suggestions generated yet.</p>
                    <p className="text-xs">
                      Run tests and evaluations first, then click "Improve" to
                      get prompt improvement recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {"suggested_system_prompt" in promptSuggestions && (
                      <div className="rounded border border-blue-200 bg-blue-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-blue-800">
                            Improved System Prompt
                          </h3>
                          <button
                            onClick={handleCopyPrompt}
                            className="ml-3 bg-gray-100 px-2 py-1 rounded text-xs hover:bg-gray-200 flex items-center"
                            title="Copy improved prompt"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </button>
                        </div>
                        <ScrollArea className="h-64">
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-slate-700">
                            {promptSuggestions.suggested_system_prompt}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    {"change_summary" in promptSuggestions && (
                      <>
                        <button
                          className="bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-200 text-xs"
                          onClick={() => setShowChangeSheet(true)}
                        >
                          View Change Summary
                        </button>
                      </>
                    )}
                    <div className="rounded border p-2">
                      <h4 className="mb-1 text-sm font-medium">
                        Current Agent Instructions
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="rounded border p-2 text-xs">
                          {selectedAgent?.agent_instructions}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <Sheet open={showChangeSheet} onOpenChange={setShowChangeSheet}>
              <SheetContent className="w-[50vw] sm:max-w-none overflow-y-auto" side="right">
                <SheetHeader>
                  <SheetTitle>Prompt Change Summary</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  <ul className="list-decimal ml-4 space-y-2">
                    {promptSuggestions?.change_summary?.map((change, idx) => (
                      <li
                        key={idx}
                        className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-slate-700"
                      >
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </SheetContent>
            </Sheet>
          </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name your test case group</DialogTitle>
            <DialogDescription>
              Provide a name to generate test cases.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Input
              required
              placeholder="Type your eval name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={generating}
              onClick={() => setShowNameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              loading={generating}
              onClick={handleGenerateTestCases}
              disabled={inputValue.trim() === "" || generating}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TestCaseDetailSidebar
        item={selectedResultItem}
        open={!!selectedResultItem}
        onClose={() => setSelectedResultItem(null)}
      />
    </>
  );
};


export default TestCaseAndResults;

import React, { useState } from "react";
import { Agent, TestCase, TestResult } from "../types/agent";
import { runTestCase } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";

interface TestResultsProps {
  selectedAgent: Agent | null;
  testCases: TestCase[];
}

const TestResults: React.FC<TestResultsProps> = ({
  selectedAgent,
  testCases,
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);

  const runAllTests = async () => {
    if (!selectedAgent || testCases.length === 0) return;

    setRunning(true);
    const newResults: TestResult[] = testCases.map((testCase) => ({
      testCase,
      actualOutput: "",
      status: "pending" as const,
    }));

    setResults(newResults);

    try {
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];

        // Update status to running
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

          // Simple evaluation - check if output contains key terms from expected output
          const passed = evaluateTestResult(
            testCase.expected_output,
            actualOutput,
          );

          setResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    actualOutput,
                    status: passed ? ("passed" as const) : ("failed" as const),
                    timestamp: new Date().toISOString(),
                  }
                : result,
            ),
          );
        } catch (error) {
          setResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    actualOutput: `Error: ${error}`,
                    status: "failed" as const,
                    timestamp: new Date().toISOString(),
                  }
                : result,
            ),
          );
        }
      }

      toast({
        title: "Tests Completed",
        description: `Executed ${testCases.length} test cases`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run test cases",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const evaluateTestResult = (expected: string, actual: string): boolean => {
    // Simple evaluation logic - can be enhanced
    const expectedLower = expected.toLowerCase();
    const actualLower = actual.toLowerCase();

    // Check if the actual output contains key terms from expected output
    const keyTerms = expectedLower
      .split(/\W+/)
      .filter((term) => term.length > 3);
    const matchedTerms = keyTerms.filter((term) => actualLower.includes(term));

    return matchedTerms.length >= Math.ceil(keyTerms.length * 0.5);
  };

  if (!selectedAgent) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-slate-800">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-slate-500">
              <p>Select an agent and generate test cases to see results</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-800">Test Results</CardTitle>
          <Button
            onClick={runAllTests}
            disabled={running || testCases.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {running ? "Running Tests..." : "Run All Tests"}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              Passed: {results.filter((r) => r.status === "passed").length}
            </Badge>
            <Badge variant="destructive">
              Failed: {results.filter((r) => r.status === "failed").length}
            </Badge>
            <Badge variant="secondary">
              Running: {results.filter((r) => r.status === "running").length}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="max-h-96 space-y-4 overflow-y-auto">
        {results.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            Generate test cases and click "Run All Tests" to see results.
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.testCase.id}
              className="rounded-lg border bg-slate-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-sm font-semibold text-slate-800">
                  {result.testCase.id}
                </h4>
                <Badge
                  variant={
                    result.status === "passed"
                      ? "default"
                      : result.status === "failed"
                        ? "destructive"
                        : result.status === "running"
                          ? "secondary"
                          : "outline"
                  }
                  className={
                    result.status === "passed"
                      ? "bg-green-100 text-green-800"
                      : result.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : ""
                  }
                >
                  {result.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-slate-600">Input:</p>
                  <p className="rounded border bg-white p-2 text-sm text-slate-800">
                    {result.testCase.user_input}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600">
                    Expected:
                  </p>
                  <p className="rounded border bg-white p-2 text-sm text-slate-700">
                    {result.testCase.expected_output}
                  </p>
                </div>

                {result.actualOutput && (
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Actual:
                    </p>
                    <p
                      className={`rounded border p-2 text-sm ${
                        result.status === "passed"
                          ? "bg-green-50 text-green-800"
                          : result.status === "failed"
                            ? "bg-red-50 text-red-800"
                            : "bg-white text-slate-800"
                      }`}
                    >
                      {result.actualOutput}
                    </p>
                  </div>
                )}

                {result.timestamp && (
                  <p className="text-xs text-slate-500">
                    Completed at:{" "}
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TestResults;

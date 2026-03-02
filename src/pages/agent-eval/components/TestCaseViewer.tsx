import React, { useState } from "react";
import { Agent, TestCase } from "../types/agent";
import { generateTestCases } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";

interface TestCaseViewerProps {
  selectedAgent: Agent | null;
  onTestCasesGenerated: (testCases: TestCase[]) => void;
  testCases: TestCase[];
}

const TestCaseViewer: React.FC<TestCaseViewerProps> = ({
  selectedAgent,
  onTestCasesGenerated,
  testCases,
}) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);

  const handleGenerateTestCases = async () => {
    if (!selectedAgent || !apiKey) return;

    setGenerating(true);
    try {
      const response = await generateTestCases(
        apiKey,
        selectedAgent
      );

      // Parse the JSON response from the test case generation agent
      //@ts-ignore
      const jsonMatch = response.match(/\[([\s\S]*)\]/);
      if (jsonMatch) {
        const testCasesData = JSON.parse(jsonMatch[0]);
        onTestCasesGenerated(testCasesData);
        toast({
          title: "Success",
          description: `Generated ${testCasesData.length} test cases`,
        });
      } else {
        throw new Error("Failed to parse test cases from response");
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        title: "Error",
        description: "Failed to generate test cases",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!selectedAgent) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-slate-800">Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-slate-500">
              <p>Select an agent to generate test cases</p>
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
          <CardTitle className="text-slate-800">Test Cases</CardTitle>
          <Button
            onClick={handleGenerateTestCases}
            disabled={generating}
            className="bg-slate-700 hover:bg-slate-800"
          >
            {generating ? "Generating..." : "Generate Test Cases"}
          </Button>
        </div>
        {selectedAgent && (
          <div className="text-sm text-slate-600">
            <p className="font-medium">{selectedAgent.name}</p>
            <p className="mt-1 text-xs">{selectedAgent.agent_role}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="max-h-96 space-y-4 overflow-y-auto">
        {testCases.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            Click "Generate Test Cases" to create test cases for the selected
            agent.
          </div>
        ) : (
          testCases.map((testCase) => (
            <div
              key={testCase.id}
              className="rounded-lg border bg-slate-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-sm font-semibold text-slate-800">
                  {testCase.id}
                </h4>
                <Badge
                  variant={
                    testCase.id.includes("happy")
                      ? "default"
                      : testCase.id.includes("edge")
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {testCase.id.includes("happy")
                    ? "Happy Path"
                    : testCase.id.includes("edge")
                      ? "Edge Case"
                      : "Negative"}
                </Badge>
              </div>

              <p className="mb-2 text-sm text-slate-700">{testCase.purpose}</p>

              <Separator className="my-2" />

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-slate-600">
                    User Input:
                  </p>
                  <p className="rounded border bg-white p-2 text-sm text-slate-800">
                    {testCase.user_input}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600">
                    Expected Output:
                  </p>
                  <p className="rounded border bg-white p-2 text-sm text-slate-800">
                    {testCase.expected_output}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600">
                    Evaluation Notes:
                  </p>
                  <p className="text-xs italic text-slate-600">
                    {testCase.evaluation_notes}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TestCaseViewer;

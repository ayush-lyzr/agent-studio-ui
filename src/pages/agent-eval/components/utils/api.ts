import { extractJsonFromResponse } from "@/lib/utils";
import { Agent, ChatResponse, TestCase } from "@/pages/agent-eval/types/agent";

const API_BASE = "https://agent-prod.maia.prophet.com/v3";
const API_KEY = "sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny";

export const fetchAgents = async (): Promise<Agent[]> => {
  const response = await fetch(`${API_BASE}/agents/`, {
    headers: {
      accept: "application/json",
      "x-api-key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch agents");
  }

  return response.json();
};

export const generateTestCases = async (
  agentInstructions: string,
): Promise<string> => {
  const response = await fetch(`${API_BASE}/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      user_id: "test@lyzr.ai",
      agent_id: "68406f1dbc4a48bd30792825", // Test case generation agent ID
      session_id: `test-${Date.now()}`,
      message: agentInstructions,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate test cases");
  }

  const data: ChatResponse = await response.json();
  return data.response;
};

export const runTestCase = async (
  agentId: string,
  userInput: string,
): Promise<string> => {
  const response = await fetch(`${API_BASE}/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      user_id: "test@lyzr.ai",
      agent_id: agentId,
      session_id: `test-${Date.now()}`,
      message: userInput,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to run test case");
  }

  const data: ChatResponse = await response.json();
  return data.response;
};

export const runEvaluation = async (
  testCases: TestCase[],
  actualOutputs: string[],
): Promise<any> => {
  const evaluationMessage = `Evaluate the following test results:
${testCases
  .map(
    (tc, index) => `
Test Case: ${tc.id}
Purpose: ${tc.purpose}
Input: ${tc.user_input}
Expected: ${tc.expected_output}
Actual: ${actualOutputs[index]}
`,
  )
  .join("\n")}`;

  const response = await fetch(`${API_BASE}/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      user_id: "test@lyzr.ai",
      agent_id: "68406f55bc4a48bd30792826", // Evaluation agent ID
      session_id: `eval-${Date.now()}`,
      message: evaluationMessage,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to run evaluation");
  }

  const data: ChatResponse = await response.json();

  // Use the robust JSON extraction function
  try {
    console.log("Raw evaluation response:", data.response);
    const parsedResponse = extractJsonFromResponse(data.response);
    console.log("Parsed evaluation response:", parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error("Failed to parse evaluation response:", error);
    console.error("Raw response was:", data.response);
    throw new Error("Failed to parse evaluation response");
  }
};

export const getPromptSuggestions = async (
  agentInstructions: string,
  evaluationSummary: string,
  testResults: string,
): Promise<string> => {
  const promptAnalysisMessage = `Original Agent Instructions:
${agentInstructions}

Test Evaluation Summary:
${evaluationSummary}

Detailed Test Results:
${testResults}

Please analyze the above and provide suggestions for improving the agent's prompt/instructions.`;

  const response = await fetch(`${API_BASE}/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      user_id: "shreyas@lyzr.ai",
      agent_id: "68406f80bc4a48bd30792827", // Prompt suggestion agent ID
      session_id: `prompt-${Date.now()}`,
      message: promptAnalysisMessage,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get prompt suggestions");
  }

  const data: ChatResponse = await response.json();
  return data.response;
};

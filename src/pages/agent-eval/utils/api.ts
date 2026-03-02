import { Agent, ChatResponse, TestCase } from "@/pages/agent-eval/types/agent";
import axios from "@/lib/axios";
import { RAG_URL } from "@/lib/constants";

const API_BASE = `${import.meta.env.VITE_BASE_URL || "http://localhost:8001"}/v3`;
const EVALUATOR_AGENT_ID = "6889fc7b116542cd00afa6e2"; // Evaluation agent ID
const PROMPT_SUGGESTION_AGENT_ID = "688fbd3eeb380e7b6f18d9c6"; // Prompt suggestion agent ID
const ACCURACY_AGENT_ID = "6885e0dc116542cd00afa6db"; // Accuracy test case generator ID
const SECURITY_AGENT_ID = "6885e12b116542cd00afa6dd"; // Security test case generator ID

// Helper function to extract JSON from various response formats
function repairAndParseTestCases(apiResponseStr: string) {
  try {
    const parsed = JSON.parse(apiResponseStr);
    // Convert expected_output objects back to strings
    return convertExpectedOutputToString(parsed);
  } catch (err) {
  }

  const key = '"expected_output"';
  let s = apiResponseStr;
  let i = 0;
  let replacedCount = 0;

  while (true) {
    const keyIdx = s.indexOf(key, i);
    if (keyIdx === -1) break;

    let colonIdx = s.indexOf(':', keyIdx + key.length);
    if (colonIdx === -1) break;

    let j = colonIdx + 1;
    while (j < s.length && /\s/.test(s[j])) j++;

    // Expect a starting quote (") for the broken value; if not, skip
    if (s[j] !== '"') {
      i = keyIdx + key.length;
      continue;
    }

    const valueOpenIdx = j;
    let k = j + 1;
    let escape = false;
    let escapedBuilder: string[] = [];

    let foundClosing = false;
    while (k < s.length) {
      const ch = s[k];

      if (ch === '\r') {
        escapedBuilder.push('\\r');
        escape = false;
        k++;
        continue;
      }
      if (ch === '\n') {
        // replace raw newline with \n
        escapedBuilder.push('\\n');
        escape = false;
        k++;
        continue;
      }

      if (escape) {
        // Previous char was backslash, keep both but escape backslash for JSON
        escapedBuilder.push('\\' + ch);
        escape = false;
        k++;
        continue;
      }

      if (ch === '\\') {
        // start escape sequence in input; we will escape the backslash itself
        escape = true;
        k++;
        continue;
      }

      if (ch === '"') {
        let p = k + 1;
        while (p < s.length && /\s/.test(s[p])) p++;
        const nextChar = s[p];

        if (nextChar === ',' || nextChar === '}' || nextChar === ']') {
          foundClosing = true;
          break;
        } else {
          escapedBuilder.push('\\"');
          k++;
          continue;
        }
      }

      if (ch === '\t') {
        escapedBuilder.push('\\t');
      } else {
        const code = ch.charCodeAt(0);
        if (code < 0x20) {
          escapedBuilder.push('\\u' + code.toString(16).padStart(4, '0'));
        } else {
          escapedBuilder.push(ch);
        }
      }
      k++;
    }

    if (!foundClosing) {
      i = keyIdx + key.length;
      continue;
    }

    const valueCloseIdx = k;

    // Build the escaped JSON string literal
    const escapedValue = escapedBuilder.join('');

    const before = s.slice(0, valueOpenIdx);
    const after = s.slice(valueCloseIdx + 1);
    s = before + '"' + escapedValue + '"' + after;

    replacedCount++;
    i = before.length + 1 + escapedValue.length + 1;
  }

  try {
    const parsed = JSON.parse(s);
    return convertExpectedOutputToString(parsed);
  } catch (err) {
    throw new Error(
      "Invalid JSON format."
    );
  }
}

// Helper function to recursively convert expected_output objects to strings
function convertExpectedOutputToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => convertExpectedOutputToString(item));
  } else if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'expected_output' && typeof value === 'object' && value !== null) {
        // Convert the object back to a JSON string
        result[key] = JSON.stringify(value);
      } else {
        result[key] = convertExpectedOutputToString(value);
      }
    }
    return result;
  }
  return obj;
}

const extractJsonFromResponse = (responseText: string): any => {
  // First try to parse as direct JSON
  try {
    return JSON.parse(responseText);
  } catch (error) {
    // If that fails, look for JSON within markdown code blocks
    const codeBlockMatch = responseText.match(
      /```(?:json)?\s*\n?([\s\S]*?)\n?```/,
    );
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (error) {
        console.log("Failed to parse JSON from code block:", error);
      }
    }

    // Try to find JSON array or object patterns
    const jsonArrayMatch = responseText.match(/\[([\s\S]*)\]/);
    if (jsonArrayMatch) {
      try {
        return JSON.parse(jsonArrayMatch[0]);
      } catch (error) {
        console.log("Failed to parse JSON array:", error);
      }
    }
    const jsonObjectMatch = responseText.match(/\{([\s\S]*)\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (error) {
        console.log("Failed to parse JSON object:", error);
      }
    }
    throw new Error("Could not extract valid JSON from response");
  }
};

// Pull RAG config from agent.features if available
function getAgentRagConfig(agent: Agent | null) {
  
  if (
    agent &&
    // @ts-ignore
    Array.isArray(agent.features)
  ) {
    // @ts-ignore
    const feature = agent.features.find(
      (f: any) =>
        f.type === "KNOWLEDGE_BASE" &&
        f.config &&
        f.config.lyzr_rag &&
        f.config.lyzr_rag.rag_id
    );
    if (feature) {
      const lyzr_rag = feature.config.lyzr_rag;
      const rag_id = lyzr_rag.rag_id;
      const rag_params = lyzr_rag.params || {};
      return {
        rag_id,
        rag_params,
      };
    }
  }
  return null;
}

// Helper to get RAG context only if rag config is present
const getRAGContext = async (
  query: string,
  apiKey: string,
  agent: Agent | null,
  default_max_chunks: number = 10
): Promise<string> => {
  const ragConfig = getAgentRagConfig(agent);
  if (!ragConfig) return "";
  const { rag_id, rag_params } = ragConfig;
  try {
    const params = {
      query,
      top_k: rag_params.top_k ?? default_max_chunks,
      lambda_param: rag_params.lambda_param ?? 0.6,
      retrieval_type: rag_params.retrieval_type ?? "basic",
      score_threshold: rag_params.score_threshold ?? 0,
      time_decay_factor: rag_params.time_decay_factor ?? 0.7,
    };
    const url = `${RAG_URL}/v3/rag/${rag_id}/retrieve/`;
    const ragResponse = await axios.get(url, {
      params,
      headers: {
        "x-api-key": apiKey,
      },
    });
    if (ragResponse.data && ragResponse.data.results) {
      const ragContext = ragResponse.data.results
        .map((result: any) => result.text || "")
        .filter(Boolean)
        .join('\n\n');
      return ragContext;
    }
  } catch (error) {
    console.error("Error fetching RAG context:", error);
  }
  return "";
};

export const fetchAgents = async (apiKey: string): Promise<Agent[]> => {
  const response = await axios.get(`${API_BASE}/agents/`, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });
  if (!response.data) {
    throw new Error("Failed to fetch agents");
  }
  return response.data;
};

export const generateTestCases = async (
  apiKey: string,
  agent: Agent | null,
): Promise<{ test_cases: TestCase[] }> => {
  let agentInstructions = ""
  if (agent) {
    agentInstructions =
      agent.agent_instructions?.trim() ||
      agent.agent_goal?.trim() ||
      agent.agent_role?.trim() ||
      agentInstructions;
  }
  if (agentInstructions === ""){
    agentInstructions = "You are an AI agent. Generate a set of meaningful test cases to validate your performance, including standard and edge scenarios.";
  }
  let messageForGenerator = agentInstructions;
  const ragContext = await getRAGContext(agentInstructions, apiKey, agent, 10);
  if (ragContext && ragContext.trim()) {
    messageForGenerator = `${agentInstructions}\n\nRelevant Knowledge Base Context:\n${ragContext}`;
  }
  const generateForAgent = async (agentId: string) => {
    const response = await axios.post(
      `${API_BASE}/inference/chat/`,
      {
        user_id: "test@lyzr.ai",
        agent_id: agentId,
        session_id: `test-${Date.now()}`,
        message: messageForGenerator,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      }
    );
    if (!response.data || !response.data.response) {
      throw new Error(`Failed to generate test cases for agent ${agentId}`);
    }
    // The generator agents are configured to return a JSON object as a string, so we parse it.
    return repairAndParseTestCases(response.data.response);
  };
  try {
    // Run both API calls in parallel to generate test cases simultaneously.
    const [accuracyResult, securityResult] = await Promise.all([
      generateForAgent(ACCURACY_AGENT_ID),
      generateForAgent(SECURITY_AGENT_ID),
    ]);

    // Combine the 'test_cases' arrays from both results.
    const combinedTestCases = [
      ...(accuracyResult.test_cases || []),
      ...(securityResult.test_cases || []),
    ];

    // Return the combined list in the expected object format.
    return { test_cases: combinedTestCases };
  } catch (error) {
    console.error("Error generating test cases from multiple agents:", error);
    throw error;
  }
};

export const runTestCase = async (
  agentId: string,
  userInput: string,
  apiKey: string,
): Promise<string> => {
  const response = await axios.post(
    `${API_BASE}/inference/chat/`,
    {
      user_id: "test@lyzr.ai",
      agent_id: agentId,
      session_id: `test-${Date.now()}`,
      message: userInput,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );
  if (!response.data) {
    throw new Error("Failed to run test case");
  }
  return response.data.response;
};

export const runEvaluation = async (
  testCases: TestCase[],
  actualOutputs: string[],
  apiKey: string,
  agent: Agent | null,
): Promise<any> => {
  let evaluationMessage = `Evaluate the following test results:
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
  const ragContext = await getRAGContext("evaluation criteria assessment metrics quality standards", apiKey, agent, 10);
  if (ragContext && ragContext.trim()) {
    evaluationMessage += `\n\nEvaluation Guidelines from Knowledge Base:\n${ragContext}`;
  }
  const response = await axios.post(
    `${API_BASE}/inference/chat/`,
    {
      user_id: "test@lyzr.ai",
      agent_id: EVALUATOR_AGENT_ID,
      session_id: `eval-${Date.now()}`,
      message: evaluationMessage,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );
  if (!response.data) {
    throw new Error("Failed to run evaluation");
  }
  const data: ChatResponse = response.data;
  try {
    const parsedResponse = extractJsonFromResponse(data.response);
    return parsedResponse;
  } catch (error) {
    console.error("Failed to parse evaluation response:", error);
    console.error("Raw response was:", data.response);
    throw new Error("Failed to parse evaluation response");
  }
};


/**
 * Repairs a malformed JSON string from the AI using a direct, array-aware method.
 * This function preserves the logic of the previous solution but fixes the bug that
 * corrupted the `change_summary` array.
 */
function repairMalformedJson(jsonString: string): string {
  try {
    // Step 1: Globally sanitize illegal control characters (newlines, etc.).
    const sanitizedString = jsonString
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    // Step 2: Define keys to find the content of each field.
    const promptKey = '"suggested_system_prompt":';
    const summaryKey = ',"change_summary":';

    // Step 3: Isolate the raw string content for both fields.
    const promptValueStartIndex = sanitizedString.indexOf(promptKey) + promptKey.length;
    const summaryKeyIndex = sanitizedString.lastIndexOf(summaryKey);

    if (promptValueStartIndex < promptKey.length || summaryKeyIndex === -1) {
      console.error("Cannot repair JSON: key structure markers are missing.");
      return jsonString;
    }
    
    const rawPromptValue = sanitizedString.substring(promptValueStartIndex, summaryKeyIndex).trim();
    const rawSummaryValue = sanitizedString.substring(summaryKeyIndex + summaryKey.length, sanitizedString.length - 1).trim();

    /**
     * A helper function to repair a single string value by escaping its inner quotes.
     * Example: `"hello "world""` becomes `"hello \\"world\\""`.
     */
    const repairStringValue = (str: string): string => {
      // Ensure it's a non-empty string that starts and ends with a quote
      if (str.length < 2 || str[0] !== '"' || str[str.length - 1] !== '"') {
        return str; // Return as-is if not a well-formed string literal
      }
      const innerContent = str.substring(1, str.length - 1);
      const repairedInnerContent = innerContent.replace(/"/g, '\\"');
      return `"${repairedInnerContent}"`;
    };
    
    // Step 4.1: Repair the prompt value, which is a single string.
    const repairedPrompt = repairStringValue(rawPromptValue);

    // Step 4.2: Repair the summary value, which is an array of strings.
    // This is the corrected, array-aware logic.
    const repairArrayValue = (arrayStr: string): string => {
        // Ensure it's a non-empty array that starts and ends with brackets
        if (arrayStr.length < 2 || arrayStr[0] !== '[' || arrayStr[arrayStr.length - 1] !== ']') {
            return arrayStr; // Return as-is if not a well-formed array literal
        }
        // Get the content inside the brackets
        const innerArrayContent = arrayStr.substring(1, arrayStr.length - 1);
        
        // Split the content into individual elements. This regex splits by a comma
        // that is followed by optional whitespace and a quote, which is a reliable
        // separator for the AI's list format.
        const elements = innerArrayContent.split(/,(?=\s*")/);
        
        // Repair each element individually and join them back together.
        const repairedElements = elements.map(el => repairStringValue(el.trim()));
        
        return `[${repairedElements.join(',')}]`;
    };

    const repairedSummary = repairArrayValue(rawSummaryValue);

    // Step 5: Reconstruct the final, valid JSON string.
    const finalJson = `{${promptKey}${repairedPrompt}${summaryKey}${repairedSummary}}`;
    
    return finalJson;

  } catch (err) {
    return jsonString; // Fallback to the original string if repair logic fails
  }
}

// The rest of your getPromptSuggestions function remains unchanged.
export const getPromptSuggestions = async (
  agentInstructions: string,
  evaluationSummary: string,
  testResults: string,
apiKey: string
): Promise<{ suggested_system_prompt: string; change_summary: string[] }> => {
  const promptAnalysisMessage =
    `ORIGINAL SYSTEM PROMPT:\n${agentInstructions}\n\n` +
    `TEST EVALUATIONS:\n${evaluationSummary}\n\n` +
    `DETAILED TEST RESULTS:\n${testResults}\n\n` +
    `INSTRUCTIONS:\n` +
    `Analyze the evaluation feedback and suggest an improved system prompt for this agent. Address every failed case, make only additions or clarifications, and preserve the original style and intent. Your output must be a JSON object:\n` +
    `{\n  "suggested_system_prompt": "<the new prompt (markdown OK)>",\n  "change_summary": [ "<bullet 1>", "<bullet 2>", ... ]\n}\n` +
    `NO commentary or prose before or after -- respond with only the strict JSON block above.`;

  try {
    const response = await axios.post(
      `${API_BASE}/inference/chat/`,
      {
        user_id: "shreyas@lyzr.ai",
        agent_id: PROMPT_SUGGESTION_AGENT_ID,
        session_id: `prompt-${Date.now()}`,
        message: promptAnalysisMessage,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      }
    );

    const rawResponse = response.data?.response?.trim();
    
    if (!rawResponse) {
      throw new Error("Received an empty or invalid response from the agent.");
    }

    let parsed: { suggested_system_prompt: string; change_summary: string[] };

    try {
      parsed = JSON.parse(rawResponse);
    } catch (initialError) {      
      const repairedString = repairMalformedJson(rawResponse);

      try {
        parsed = JSON.parse(repairedString);

      } catch (repairError) {
        throw new Error("Failed to parse suggestion JSON from the agent.");
      }
    }

    if (!parsed.suggested_system_prompt || !parsed.change_summary) {
        throw new Error("Parsed JSON is missing required fields.");
    }

    return parsed;

  } catch (err: any) {
    console.error("Error getting prompt suggestions:", err.message);
    throw err;
  }
};


interface ChatResponse {
  response: string;
}

// Evaluation Run API Functions


// Agent Improvement API Function

interface TestCaseForImprovement {
  id: string;
  name: string;
  status: string;
  userInput: string;
  expectedOutput?: string;
  agentResponse?: string;
  metrics: Record<string, any>;
}

interface AgentForImprovement {
  _id: string;
  name: string;
  agent_role: string;
  agent_instructions: string;
  agent_goal: string;
}

interface ImprovedAgentConfig {
  role: string;
  goal: string;
  instructions: string;
  changeSummary: string[];
}

export const improveAgentFromResults = async (
  selectedTestCases: TestCaseForImprovement[],
  currentAgent: AgentForImprovement,
  apiKey: string
): Promise<ImprovedAgentConfig> => {
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8001";

  // Use the prompt improvement agent ID
  const IMPROVE_AGENT_ID = "68e57661bbd3b5ad61b36c29";

  // Prepare the improvement request message
  const improvementMessage = `
CURRENT AGENT CONFIGURATION:
Agent Name: ${currentAgent.name}
Agent Role: ${currentAgent.agent_role}
Agent Goal: ${currentAgent.agent_goal || 'Not specified'}
Agent Instructions: ${currentAgent.agent_instructions}

PROBLEMATIC TEST CASES:
${selectedTestCases.map((tc, idx) => `
Test Case ${idx + 1}: ${tc.name}
Status: ${tc.status}
User Input: ${tc.userInput}
Expected Output: ${tc.expectedOutput || 'Not specified'}
Actual Agent Response: ${tc.agentResponse || 'No response'}
Performance Metrics: ${JSON.stringify(tc.metrics, null, 2)}
---
`).join('\n')}

TASK:
Based on the issues identified in these test cases, provide improved agent configuration that addresses the shortcomings.

RESPONSE FORMAT (use exactly this format):

""json
{
  "agent_goal": "[Improved agent goal here]",
  "agent_instructions": "[Improved agent instructions here]",
  "changes": [
    "[Key change 1]",
    "[Key change 2]",
    "[Key change 3]"
  ]
}
"" 
`;

  const response = await fetch(`${baseUrl}/v3/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      user_id: "test@lyzr.ai",
      agent_id: IMPROVE_AGENT_ID,
      session_id: `${IMPROVE_AGENT_ID}-${Math.random().toString(36).substring(7)}`,
      message: improvementMessage,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to improve agent configuration");
  }

  const data: ChatResponse = await response.json();
  let responseText = data.response;

  console.log('Raw response from improvement agent:', responseText);
  console.log('Response type:', typeof responseText);

  // Strip markdown code fence if present (```json ... ```)
  if (typeof responseText === 'string') {
    responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    // Also remove quotes around the JSON if present
    responseText = responseText.replace(/^["']|["']$/g, '');
    console.log('Cleaned response:', responseText);
  }

  // Try to parse as JSON first (new format)
  try {
    let jsonResponse;

    if (typeof responseText === 'string') {
      // Try direct parsing first
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (firstError) {
        console.log('Direct parse failed, attempting to fix control characters...');
        // If parsing fails, try to fix the JSON format
        console.log('Attempting to fix JSON format...');
        
        // Try a more robust approach - parse the JSON structure properly
        try {
          // First, try to handle common JSON formatting issues
          let fixedText = responseText
            .trim()
            // Remove any extra characters at start/end
            .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
            // Fix unescaped newlines within string values
            .replace(/"([^"]*?)"\s*:\s*"([^"]*(?:\n[^"]*)*?)"/g, (_, key, value) => {
              // Only fix the value part, escape quotes and newlines
              const escapedValue = value
                .replace(/\\/g, '\\\\')  // Escape backslashes first
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
              return `"${key}": "${escapedValue}"`;
            });
            
          console.log('Fixed text attempt:', fixedText);
          jsonResponse = JSON.parse(fixedText);
        } catch (secondError) {
          console.log('Second attempt failed, trying manual extraction...');
          // Manual extraction as last resort
          const goalMatch = responseText.match(/"agent_goal"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          const instructionsMatch = responseText.match(/"agent_instructions"\s*:\s*"([^"]*(?:\\.|[^"\\])*?)"/s);
          
          if (goalMatch && instructionsMatch) {
            jsonResponse = {
              agent_goal: goalMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
              agent_instructions: instructionsMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
              changes: []
            };
            console.log('Manual extraction successful:', jsonResponse);
          } else {
            throw secondError;
          }
        }
      }
    } else {
      jsonResponse = responseText;
    }
    console.log('Parsed JSON response:', jsonResponse);

    // Handle both agent_role and agent_goal fields
    const goal = jsonResponse.agent_goal;
    const role = jsonResponse.agent_role;
    const instructions = jsonResponse.agent_instructions;

    console.log('Extracted fields:', { goal, role, instructions });

    if (instructions && (goal || role)) {
      const result = {
        role: role || goal, // Use role if available, otherwise use goal
        goal: goal || role, // Use goal if available, otherwise use role
        instructions: instructions,
        changeSummary: jsonResponse.changes || ['Agent configuration has been improved based on test results'],
      };
      console.log('Returning improved config:', result);
      return result;
    } else {
      console.log('Missing required fields - instructions:', !!instructions, 'goal or role:', !!(goal || role));
    }
  } catch (jsonError) {
    console.log('JSON parsing failed:', jsonError);
    console.log('Not JSON format, trying text parsing...');
  }

  // Fallback to text format parsing (old format)
  const roleMatch = responseText.match(/ROLE:\s*([\s\S]*?)(?=GOAL:|INSTRUCTIONS:|$)/i);
  const goalMatch = responseText.match(/GOAL:\s*([\s\S]*?)(?=INSTRUCTIONS:|$)/i);
  const instructionsMatch = responseText.match(/INSTRUCTIONS:\s*([\s\S]*?)(?=CHANGES:|$)/i);
  const changesMatch = responseText.match(/CHANGES:\s*([\s\S]*?)$/i);

  if (!instructionsMatch || (!roleMatch && !goalMatch)) {
    console.error('Failed to parse response. Raw response:', responseText);
    throw new Error("Failed to parse improved agent configuration from response");
  }

  // Extract changes as array
  const changesText = changesMatch ? changesMatch[1].trim() : '';
  const changes = changesText
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(line => line.length > 0);

  const parsedRole = roleMatch ? roleMatch[1].trim() : '';
  const parsedGoal = goalMatch ? goalMatch[1].trim() : '';

  return {
    role: parsedRole || parsedGoal,
    goal: parsedGoal || parsedRole,
    instructions: instructionsMatch[1].trim(),
    changeSummary: changes.length > 0 ? changes : ['Agent configuration has been improved based on test results'],
  };
};
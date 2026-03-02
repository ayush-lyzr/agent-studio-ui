export interface Agent {
  _id: string;
  api_key: string;
  template_type: string;
  name: string;
  description: string;
  agent_role: string;
  agent_instructions: string;
  agent_goal: string;
  agent_context?: any;
  agent_output?: any;
  examples?: any;
  features: any[];
  tool: string;
  tool_usage_description: string;
  tool_configs?: any[];
  response_format: {
    type: string;
  };
  provider_id: string;
  model: string;
  top_p: number;
  temperature: number;
  managed_agents: any[];
  version: string;
  created_at: string;
  updated_at: string;
  llm_credential_id: string;
  [key: string]: unknown;
}

export interface TestCase {
  id: string;
  purpose: string;
  user_input: string;
  expected_output: string;
  evaluation_notes: string;
}

export interface TestResult {
  testCase: TestCase;
  actualOutput: string;
  status: "running" | "passed" | "failed" | "pending";
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
}

export interface EvaluationResult {
  id: string;
  status: "pass" | "fail";
  details: string;
  scorecard?: ScoreCard;
}

export interface EvaluationSummary {
  passed: number;
  failed: number;
  score: number;
  total_points: number;
  percentage: string;
}

export interface EvaluationResponse {
  results: EvaluationResult[];
  summary: EvaluationSummary;
}

export interface TestResultWithEvaluation extends TestResult {
  evaluation?: EvaluationResult;
}

export interface ScoreCard {
  correctness: number;
  relevance: number;
  coherence: number;
  conciseness: number;
  safety: number;
  average: number;
}

export interface PromptSuggestion {
  suggestion: string;
  reasoning: string;
  improvements: string[];
}
export interface AgentEvalResultItem {
  id: string;
  details: string;
  status: string;
  user_input: string;
  expected_output: string;
  actual_output: string;
  scorecard?: ScoreCard;
}

export interface ResultEvalData {
  _id: string;
  created_at: string;
  agent_eval_result_list: AgentEvalResultItem[];
}

export type PromptSuggestionRequest = {
  original_system_prompt: string;
  test_evaluations: { id: string; status: string; details: string }[];
};

export type PromptSuggestionResponse = {
  improved_system_prompt: string;
  change_summary: string[];
};

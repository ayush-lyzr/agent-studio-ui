import axios from "axios";
import { EVAL_SERVER_URL } from "@/lib/constants";

// ============================================
// Type Definitions
// ============================================

export interface Environment {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  status: "created" | "processing" | "failed";
  scenarios_count: number;
  personas_count: number;
  simulations_count: number;
  created_at: string;
  updated_at: string;
}


export interface CreateEnvironmentResponse {
  environment_id: string;
  agent_id: string;
  name: string;
  created_at: string;
}

export interface Persona {
  id?: string;
  environment_id?: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface Scenario {
  id?: string;
  environment_id?: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface Simulation {
  id?: string;
  environment_id?: string;
  name: string;
  user_input: string;
  expected_output: string | Record<string, unknown>;
  ground_truth?: string | Record<string, unknown> | null;
  persona_id?: string;
  scenario_id?: string;
  created_at?: string;
}

export interface CreatePersonasRequest {
  personas: Omit<Persona, 'id' | 'environment_id' | 'created_at'>[];
}

export interface CreatePersonasResponse {
  personas: Persona[];
  count: number;
}

export interface CreateScenariosRequest {
  scenarios: Omit<Scenario, 'id' | 'environment_id' | 'created_at'>[];
}

export interface CreateScenariosResponse {
  scenarios: Scenario[];
  count: number;
}

export interface CreateSimulationRequest {
  name: string;
  user_input: string;
  expected_output: string | Record<string, unknown>;
  persona_id?: string;
  scenario_id?: string;
  environment_id?: string;
}

export interface CreateSimulationResponse {
  simulation: Simulation;
}

export interface GetPersonasResponse {
  personas: Persona[];
  count: number;
}

export interface GetScenariosResponse {
  scenarios: Scenario[];
  count: number;
}

export interface GetSimulationsResponse {
  simulations: Simulation[];
  count: number;
}

export interface GetEnvironmentsByAgentResponse {
  environments: Environment[];
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new environment
 * Note: user_id is set to the api_key for user identification
 */
export const createEnvironment = async (
  agentId: string,
  name: string,
  apiKey: string
): Promise<CreateEnvironmentResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/`,
    {
      agent_id: agentId,
      name: name,
      user_id: apiKey, 
    },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to create environment");
  }

  return response.data;
};

/**
 * Get all environments for a specific agent
 */
export const getEnvironmentsByAgent = async (
  agentId: string,
  apiKey: string
): Promise<GetEnvironmentsByAgentResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/by_agent/${agentId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch environments");
  }

  return response.data;
};

// ============================================
// Persona Operations
// ============================================

/**
 * Add personas to an environment
 */
export const createPersonas = async (
  environmentId: string,
  request: CreatePersonasRequest,
  apiKey: string
): Promise<CreatePersonasResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/personas`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to create personas");
  }

  return response.data;
};

/**
 * Get all personas for an environment
 */
export const getPersonas = async (
  environmentId: string,
  apiKey: string
): Promise<GetPersonasResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/personas`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch personas");
  }

  return response.data;
};

/**
 * Generate personas for an environment
 */
export const generatePersonas = async (
  environmentId: string,
  apiKey: string
): Promise<void> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/personas/generate`,
    {},
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to generate personas");
  }
};

/**
 * Delete a persona from an environment
 */
export const deletePersona = async (
  environmentId: string,
  personaId: string,
  apiKey: string
): Promise<void> => {
  const response = await axios.delete(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/personas/${personaId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error("Failed to delete persona");
  }
};

// ============================================
// Scenario Operations
// ============================================

/**
 * Add scenarios to an environment
 */
export const createScenarios = async (
  environmentId: string,
  request: CreateScenariosRequest,
  apiKey: string
): Promise<CreateScenariosResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/scenarios`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to create scenarios");
  }

  return response.data;
};

/**
 * Get all scenarios for an environment
 */
export const getScenarios = async (
  environmentId: string,
  apiKey: string
): Promise<GetScenariosResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/scenarios`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch scenarios");
  }

  return response.data;
};

/**
 * Generate scenarios for an environment
 */
export const generateScenarios = async (
  environmentId: string,
  apiKey: string
): Promise<void> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/scenarios/generate`,
    {},
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to generate scenarios");
  }
};

/**
 * Delete a scenario from an environment
 */
export const deleteScenario = async (
  environmentId: string,
  scenarioId: string,
  apiKey: string
): Promise<void> => {
  const response = await axios.delete(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/scenarios/${scenarioId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error("Failed to delete scenario");
  }
};

// ============================================
// Simulation Operations (formerly Test Cases)
// ============================================


export interface GenerateSimulationsResponse {
  message: string;
  job_id: string;
  environment_id: string;
  total_tasks: number;
  personas_count: number;
  scenarios_count: number;
}

export interface SimulationJobTask {
  task_id: string;
  scenario_name: string;
  persona_name: string;
  state: "PENDING" | "RUNNING" | "STARTED" | "SUCCESS" | "FAILURE";
  started_at?: string;
  completed_at?: string;
  simulation_id?: string | null;
}

export interface SimulationJobStatus {
  job_id: string;
  environment_id: string;
  progress: string;
  summary: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  tasks: SimulationJobTask[];
  created_at: string;
}

/**
 * Create a simulation (test case)
 */
export const createSimulation = async (
  environmentId: string,
  request: CreateSimulationRequest,
  apiKey: string
): Promise<CreateSimulationResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to create simulation");
  }

  return response.data;
};

/**
 * Get all simulations for an environment
 */
export const getSimulations = async (
  environmentId: string,
  apiKey: string
): Promise<GetSimulationsResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch simulations");
  }

  return response.data;
};

/**
 * Generate simulations for scenario × persona pairs (creates background job)
 */
export const generateSimulationsJob = async (
  environmentId: string,
  scenarioIds: string[],
  personaIds: string[],
  apiKey: string
): Promise<GenerateSimulationsResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations/generate`,
    {
      scenario_ids: scenarioIds,
      persona_ids: personaIds,
    },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to start simulation generation");
  }

  return response.data;
};

/**
 * Get simulation generation job status
 */
export const getSimulationJobStatus = async (
  environmentId: string,
  jobId: string,
  apiKey: string
): Promise<SimulationJobStatus> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/jobs/${jobId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch job status");
  }

  return response.data;
};

/**
 * Delete a simulation from an environment
 */
export const deleteSimulation = async (
  environmentId: string,
  simulationId: string,
  apiKey: string
): Promise<void> => {
  const response = await axios.delete(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations/${simulationId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error("Failed to delete simulation");
  }
};

// ============================================
// Job Management
// ============================================

export interface CancelJobResponse {
  message: string;
  job_id: string;
  summary: {
    total_tasks: number;
    revoked: number;
    already_completed: number;
    pending_before_cancel: number;
    running_before_cancel: number;
  };
}

/**
 * Cancel a running simulation generation job
 */
export const cancelSimulationJob = async (
  environmentId: string,
  jobId: string,
  apiKey: string
): Promise<CancelJobResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/jobs/${jobId}/cancel`,
    {},
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to cancel job");
  }

  return response.data;
};

// ============================================
// Evaluation API
// ============================================

export interface GenerateEvaluationRequest {
  evaluation_run_name: string;
  simulation_ids: string[];
  metrics: string[];
}

export interface GenerateEvaluationResponse {
  message: string;
  evaluation_run_id: string;
  job_id: string;
  environment_id: string;
  total_tasks: number;
  agent_id: string;
  simulations_count: number;
  current_round: number;
}

export interface EvaluationJobTask {
  task_id: string;
  agent_id: string;
  agent_name: string;
  simulation_id: string;
  simulation_name: string;
  persona_id: string;
  persona_name: string;
  scenario_id: string;
  scenario_name: string;
  state: "PENDING" | "RUNNING" | "STARTED" | "SUCCESS" | "FAILURE";
  started_at?: string;
  completed_at?: string;
  evaluation_id?: string;
}

export interface EvaluationJobStatus {
  job_id: string;
  environment_id: string;
  job_type: "evaluation";
  agent_id: string;
  agent_name: string;
  metrics: string[];
  progress: string;
  summary: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  tasks: EvaluationJobTask[];
  created_at: string;
}

export interface SimulationResult {
  simulation_id: string;
  simulation_name: string;
  persona_id: string;
  persona_name: string;
  scenario_id: string;
  scenario_name: string;
  evaluation_id: string;
  judgment: "PASS" | "FAIL";
  issues: string[];
  fixes: string[];
  scores: Record<string, number>;
  overall_score: number;
  reasoning: string;
  evaluated_at: string;
}

export interface EvaluationRound {
  round_number: number;
  job_id: string;
  agent_config: any;
  previous_agent_config: any | null;
  simulation_results: SimulationResult[];
  started_at: string;
  completed_at: string;
}

export interface EvaluationRunDetails {
  id: string;
  environment_id: string;
  evaluation_run_name: string;
  agent_id: string;
  agent_name: string;
  metrics: string[];
  simulation_ids: string[];
  rounds: EvaluationRound[];
  current_round: number;
  status: "in_progress" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface GetEvaluationRunResponse {
  evaluation_run: EvaluationRunDetails;
}

/**
 * Generate evaluation run for simulations
 */
export const generateEvaluationRun = async (
  environmentId: string,
  request: GenerateEvaluationRequest,
  apiKey: string
): Promise<GenerateEvaluationResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluations/generate`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to generate evaluation run");
  }

  return response.data;
};

/**
 * Get evaluation job status
 */
export const getEvaluationJobStatus = async (
  environmentId: string,
  jobId: string,
  apiKey: string
): Promise<EvaluationJobStatus> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluation-jobs/${jobId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch evaluation job status");
  }

  return response.data;
};

/**
 * Get evaluation run details
 */
export const getEvaluationRun = async (
  environmentId: string,
  evaluationRunId: string,
  apiKey: string
): Promise<GetEvaluationRunResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluation-runs/${evaluationRunId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch evaluation run");
  }

  return response.data;
};

/**
 * Individual evaluation detail response
 */
export interface EvaluationDetail {
  id: string;
  simulation_id: string;
  environment_id: string;
  agent_id: string;
  user_input: string;
  expected_output: string;
  actual_output: string;
  trace: string; // JSON string of trace events
  metrics_used: string[];
  evaluation: {
    scores: Record<string, number>;
    overall_score: number;
    judgment: "PASS" | "FAIL";
    issues: string[];
    fixes: string[];
    reasoning: string;
  };
  created_at: string;
}

export interface GetEvaluationResponse {
  evaluation: EvaluationDetail;
}

/**
 * Get individual evaluation details
 */
export const getEvaluation = async (
  environmentId: string,
  evaluationId: string,
  apiKey: string
): Promise<GetEvaluationResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluations/${evaluationId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch evaluation");
  }

  return response.data;
};

// Evaluation Run List interfaces
export interface EvaluationRunSummary {
  evaluation_run_id: string;
  evaluation_run_name: string;
  environment_id: string;
  agent_id: string;
  agent_name: string;
  current_round: number;
  total_rounds: number;
  status: string;
  created_at: string;
  updated_at: string;
  current_round_pass_count: number;
  current_round_fail_count: number;
  current_round_total: number;
  current_round_completed: boolean;
}

export interface ListEvaluationRunsResponse {
  evaluation_runs: EvaluationRunSummary[];
  count: number;
}

// List all evaluation runs for an environment
export const listEvaluationRuns = async (
  environmentId: string,
  apiKey: string
): Promise<ListEvaluationRunsResponse> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluation-runs`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to fetch evaluation runs");
  }

  return response.data;
};

// ============================================
// Agent Hardening
// ============================================

export interface AgentHardeningRequest {
  round_number: number;
  evaluation_ids: string[];
}

export interface AgentHardeningResponse {
  message: string;
  original_config: {
    agent_role: string;
    agent_instructions: string;
    agent_goal: string;
  };
  improved_config: {
    agent_role: string;
    agent_instructions: string;
    agent_goal: string;
  };
}

/**
 * Request agent hardening based on selected evaluation results
 * @param environmentId - The environment ID
 * @param evaluationRunId - The evaluation run ID
 * @param request - The hardening request with round number and evaluation IDs
 * @param apiKey - API key for authentication
 */
export const requestAgentHardening = async (
  environmentId: string,
  evaluationRunId: string,
  request: AgentHardeningRequest,
  apiKey: string
): Promise<AgentHardeningResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluation-runs/${evaluationRunId}/agent-hardening`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to request agent hardening");
  }

  return response.data;
};

// ============================================
// Continue Evaluation Run (New Round)
// ============================================

export interface ContinueEvaluationRunRequest {
  round_number: number;
  agent_config: {
    agent_role: string;
    agent_goal: string;
    agent_instructions: string;
  };
  simulation_ids?: string[];
}

export interface ContinueEvaluationRunResponse {
  message: string;
  job_id: string;
  round_number: number;
  evaluation_run_id: string;
}

/**
 * Continue evaluation run with a new round using improved agent config
 * @param environmentId - The environment ID
 * @param runId - The evaluation run ID
 * @param request - Continue request with round_number, agent_config, and optional simulation_ids
 * @param apiKey - API key for authentication
 */
export const continueEvaluationRun = async (
  environmentId: string,
  runId: string,
  request: ContinueEvaluationRunRequest,
  apiKey: string
): Promise<ContinueEvaluationRunResponse> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/evaluation-runs/${runId}/continue`,
    request,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  if (!response.data) {
    throw new Error("Failed to continue evaluation run");
  }

  return response.data;
};

// ============================================
// Simulation Export
// ============================================

export interface ExportSimulationsCsvRequest {
  simulation_ids: string[];
}

/**
 * Export selected simulations as CSV.
 */
export const exportSimulationsCsv = async (
  environmentId: string,
  simulationIds: string[],
  apiKey: string,
): Promise<Blob> => {
  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations/export-csv`,
    {
      simulation_ids: simulationIds,
    } satisfies ExportSimulationsCsvRequest,
    {
      responseType: "blob",
      headers: {
        accept: "text/csv",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    },
  );

  if (!response.data) {
    throw new Error("Failed to export simulations CSV");
  }

  return response.data;
};

/**
 * Import simulations from a CSV file.
 */
export const importSimulationsCsv = async (
  environmentId: string,
  file: File,
  apiKey: string,
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${EVAL_SERVER_URL}/api/environments/${environmentId}/simulations/import-csv`,
    formData,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    },
  );

  if (!response.data) {
    throw new Error("Failed to import simulations CSV");
  }

  return response.data;
};

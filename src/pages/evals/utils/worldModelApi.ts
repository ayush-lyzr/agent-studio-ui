import {
  WorldModelResponse,
  CreateWorldModelRequest,
  CreateWorldModelResponse,
  ScenariosResponse,
  PersonasResponse,
  CreateScenariosRequest,
  CreatePersonasRequest,
  TestCasesResponse,
} from "../types/worldModel";
import * as EnvAPI from "../services/environmentApi";
import {
  environmentsToWorldModels,
  newPersonasToOld,
  newScenariosToOld,
  simulationsToTestCases,
} from "../services/apiAdapter";

export const fetchWorldModelsByAgent = async (
  agentId: string,
  apiKey: string,
): Promise<WorldModelResponse> => {
  // Use new environment API
  const response = await EnvAPI.getEnvironmentsByAgent(agentId, apiKey);

  // Transform to old format for backward compatibility
  return {
    world_models: environmentsToWorldModels(response.environments),
    source_agent_id: agentId,
    total_count: response.environments.length,
  };
};

export const createWorldModel = async (
  request: CreateWorldModelRequest,
  apiKey: string,
): Promise<CreateWorldModelResponse> => {
  // Use new environment API
  const response = await EnvAPI.createEnvironment(
    request.source_agent_id,
    request.name,
    apiKey,
  );

  // Transform to old format for backward compatibility
  return {
    world_model_id: response.environment_id,
    source_agent_id: response.agent_id,
    cloned_agent_id: "", // Not provided by new API
    name: response.name,
    created_at: response.created_at,
  };
};

// Note: generateScenarios and generatePersonas have been moved to environmentApi.ts
// and now use the new dedicated generation endpoints instead of agent-based generation

// CRUD Operations for Scenarios
export const createScenarios = async (
  worldModelId: string,
  request: CreateScenariosRequest,
  apiKey: string,
): Promise<void> => {
  // Use new environment API
  await EnvAPI.createScenarios(
    worldModelId,
    { scenarios: request.scenarios },
    apiKey,
  );
};

export const fetchScenarios = async (
  worldModelId: string,
  apiKey: string,
): Promise<ScenariosResponse> => {
  // Use new environment API
  const response = await EnvAPI.getScenarios(worldModelId, apiKey);

  // Transform to old format
  return {
    scenarios: newScenariosToOld(response.scenarios),
  };
};

/**
 * Delete a scenario from an environment
 */
export const deleteScenario = async (
  worldModelId: string,
  scenarioId: string,
  apiKey: string,
): Promise<void> => {
  // Use new environment API
  await EnvAPI.deleteScenario(worldModelId, scenarioId, apiKey);
};

// CRUD Operations for Personas
export const createPersonas = async (
  worldModelId: string,
  request: CreatePersonasRequest,
  apiKey: string,
): Promise<void> => {
  // Use new environment API
  await EnvAPI.createPersonas(
    worldModelId,
    { personas: request.personas },
    apiKey,
  );
};

export const fetchPersonas = async (
  worldModelId: string,
  apiKey: string,
): Promise<PersonasResponse> => {
  // Use new environment API
  const response = await EnvAPI.getPersonas(worldModelId, apiKey);

  // Transform to old format
  return {
    personas: newPersonasToOld(response.personas),
  };
};

/**
 * Delete a persona from an environment
 */
export const deletePersona = async (
  worldModelId: string,
  personaId: string,
  apiKey: string,
): Promise<void> => {
  // Use new environment API
  await EnvAPI.deletePersona(worldModelId, personaId, apiKey);
};

/**
 * Delete a simulation (test case) from an environment
 */
export const deleteSimulation = async (
  worldModelId: string,
  simulationId: string,
  apiKey: string,
): Promise<void> => {
  // Use new environment API
  await EnvAPI.deleteSimulation(worldModelId, simulationId, apiKey);
};

export const fetchTestCases = async (
  worldModelId: string,
  apiKey: string,
): Promise<TestCasesResponse> => {
  // Use new environment API
  const response = await EnvAPI.getSimulations(worldModelId, apiKey);

  // Transform to old format
  return {
    count: response.count,
    test_cases: simulationsToTestCases(response.simulations),
  };
};

// ============================================
// Background Job API Functions
// ============================================

export interface JobProgress {
  current: number;
  total: number;
  current_item: string | null;
}

export interface JobResults {
  created_ids: string[];
  failed_items: Array<{
    combination?: string;
    error?: string;
    reason?: string;
  }>;
}

export interface JobStatusResponse {
  job_id: string;
  type: string;
  world_model_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: JobProgress;
  results: JobResults;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobCreateResponse {
  job_id: string;
  type: string;
  status: string;
  progress: JobProgress;
  created_at: string;
}

/**
 * Start a background job to generate test cases for scenario×persona combinations
 * Now uses the new environment API with Celery-based job system
 */
export const startTestCaseGenerationJob = async (
  worldModelId: string,
  scenarioIds: string[],
  personaIds: string[],
  apiKey: string,
): Promise<JobCreateResponse> => {
  // Use new environment API
  const response = await EnvAPI.generateSimulationsJob(
    worldModelId,
    scenarioIds,
    personaIds,
    apiKey,
  );

  // Transform to old format for backward compatibility
  return {
    job_id: response.job_id,
    type: "test_case_generation",
    status: "queued",
    progress: {
      current: 0,
      total: response.total_tasks,
      current_item: null,
    },
    created_at: new Date().toISOString(),
  };
};

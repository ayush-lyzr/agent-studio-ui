export interface WorldModel {
  _id: string; // Legacy field, maps to 'id' in new API
  id?: string; // New API field
  name: string;
  source_agent_id: string;
  agent_id?: string; // New API field
  cloned_agent_id?: string; // Not present in new API
  user_id?: string; // New API field
  api_key?: string;
  status: "created" | "processing" | "failed";
  scenarios_count: number;
  personas_count: number;
  test_cases_count?: number; // Legacy field
  simulations_count?: number; // New API field
  created_at: string;
  updated_at: string;
}

export interface WorldModelResponse {
  world_models: WorldModel[];
  source_agent_id: string;
  total_count: number;
}

export interface CreateWorldModelRequest {
  source_agent_id: string;
  name: string;
}

export interface CreateWorldModelResponse {
  world_model_id: string;
  source_agent_id: string;
  cloned_agent_id: string;
  name: string;
  created_at: string;
}

export interface Scenario {
  _id?: string; // Legacy field
  id?: string; // New API field
  world_model_id?: string; // Legacy field
  environment_id?: string; // New API field
  name: string;
  description: string;
  created_at?: string;
}

export interface Persona {
  _id?: string; // Legacy field
  id?: string; // New API field
  world_model_id?: string; // Legacy field
  environment_id?: string; // New API field
  name: string;
  description: string;
  created_at?: string;
}

export interface TestCase {
  _id?: string; // Legacy field
  id?: string; // New API field
  world_model_id?: string; // Legacy field
  environment_id?: string; // New API field
  scenario_id?: string;
  persona_id?: string;
  name: string;
  user_input: string;
  expected_output: string | Record<string, unknown>;
  ground_truth?: string | Record<string, unknown> | null;
  created_at?: string;
}

// New alias for TestCase to match new API terminology
export type Simulation = TestCase;

export interface ScenariosResponse {
  scenarios: Scenario[];
}

export interface PersonasResponse {
  personas: Persona[];
}

export interface TestCasesResponse {
  count: number;
  test_cases: TestCase[];
}

export interface CreateScenariosRequest {
  scenarios: Omit<Scenario, "_id" | "world_model_id" | "created_at">[];
}

export interface CreatePersonasRequest {
  personas: Omit<Persona, "_id" | "world_model_id" | "created_at">[];
}

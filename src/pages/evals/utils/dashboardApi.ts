import axios from "axios";

const EVAL_SERVER_URL = import.meta.env.VITE_EVAL_SERVER_URL || "http://localhost:8200";

// New Environment API Dashboard Stats
export interface DashboardStats {
  total_environments: number;
  total_simulations: number;
  total_evaluations: number;
  average_pass_rate: number;
}

export interface RecentEnvironment {
  id: string;
  name: string;
  agent_id: string;
  agent_name?: string;
  personas_count: number;
  scenarios_count: number;
  simulations_count: number;
  created_at: string;
  status: string;
}

export interface ActiveEvaluationRun {
  id: string;
  evaluation_run_name: string;
  environment_id: string;
  environment_name: string;
  current_round: number;
  total_rounds: number;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  pass_count: number;
  fail_count: number;
  status: string;
  started_at: string;
  updated_at: string;
}

export interface RecentJob {
  id: string;
  job_type: string;
  environment_id: string;
  environment_name: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  status: string;
  started_at: string;
  completed_at: string | null;
}

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (apiKey: string): Promise<DashboardStats> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/dashboard/stats`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  return response.data;
};

/**
 * Get recent environments
 */
export const getRecentEnvironments = async (
  apiKey: string,
  limit: number = 5
): Promise<{ environments: RecentEnvironment[] }> => {
  const response = await axios.get(
    `${EVAL_SERVER_URL}/api/environments/dashboard/recent-environments`,
    {
      params: { limit },
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  return response.data;
};

/**
 * Recent evaluation result
 */
export interface RecentEvaluation {
  id: string;
  environment_id: string;
  environment_name: string;
  simulation_id: string;
  simulation_name: string;
  persona_name: string;
  scenario_name: string;
  agent_id: string;
  judgment: "PASS" | "FAIL";
  scores: {
    [key: string]: number;
  };
  feedback: string;
  agent_response: string;
  created_at: string;
  evaluation_time_ms: number;
}


import axiosInstance from '@/lib/axios';



export interface SessionSummary {
  session_id: string;
  session_name: string;
  total_loops: number;
  final_pass_rate: number;
  status: string;
  created_at: string;
}

/**
 * List all evaluation sessions for an agent
 */
export const listEvaluationSessions = async (
  agentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  sessions: SessionSummary[];
  total: number;
}> => {
  const response = await axiosInstance.get(
    `/world_model/agents/${agentId}/evaluation-sessions`,
    {
      params: { limit, offset }
    }
  );
  return response.data;
};



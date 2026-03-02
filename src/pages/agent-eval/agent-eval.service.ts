import { useQuery, useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import axios from "@/lib/axios";

interface AgentEvalItem {
  id: string;
  purpose: string;
  userInput: string;
  expectedOutput: string;
  evaluationNotes: string;
}

interface AgentEvalTestCase {
  agent_id: string;
  session_id: string;
  agent_eval_list: AgentEvalItem[];
}

export interface ScoreCard {
  correctness: number;
  relevance: number;
  coherence: number;
  conciseness: number;
  safety: number;
  average: number;
}


interface AgentEvalResultItem {
  id: string;
  status: string;
  details: string;
  scorecard?: ScoreCard;
  user_input?: string;
  expected_output?: string;
  actual_output?: string;
}


interface AgentEvalResultPayload { 
  agent_eval_id: string;
  agent_id: string;
  agent_eval_result_list: AgentEvalResultItem[];
}

export const useAgentEvalService = ({
  apiKey,
  agentId,
}: {
  apiKey: string;
  agentId: string;
}) => {
  const { mutateAsync: createAgentEvalTestCase } = useMutation({
    mutationKey: ["createAgentEvalTestCase"],
    mutationFn: (payload: AgentEvalTestCase) =>
      axios.post(`/agent_eval/`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      }),
  });

  const { mutateAsync: createAgentEvalResult } = useMutation({
    mutationKey: ["createAgentEvalResult"],
    mutationFn: (payload: AgentEvalResultPayload) => 
      axios.post(`/agent_eval/result`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      }),
  });

  const {
    data: evalData = [],
    refetch: getAgentEval,
    isPending: fetchingAgentEval,
  } = useQuery({
    queryKey: ["getAgentEval", apiKey, agentId],
    queryFn: () =>
      axios.get(`/agent_eval/`, {
        headers: {
          "x-api-key": apiKey,
        },
        params: {
          agent_id: agentId,
        },
      }),
    select: (res: AxiosResponse) => res.data,
    retry: false,
    enabled: false,
  });

  const {
    data: evalDataResult = [],
    refetch: getAgentEvalResult,
    isPending: fetchingAgentEvalResult,
  } = useQuery({
    queryKey: ["getAgentEvalResult", apiKey, agentId],
    queryFn: () =>
      axios.get(`/agent_eval/result/agent`, {
        headers: {
          "x-api-key": apiKey,
        },
        params: {
          agent_id: agentId,
        },
      }),
    select: (res: AxiosResponse) => res.data,
    retry: false,
    enabled: false,
  });

  return {
    evalData,
    createAgentEvalTestCase,
    fetchingAgentEvalResult,
    createAgentEvalResult,
    fetchingAgentEval,
    getAgentEval,
    evalDataResult,
    getAgentEvalResult,
  };
};

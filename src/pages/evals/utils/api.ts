import { Agent } from "@/pages/agent-eval/types/agent";
import axios from "@/lib/axios";

const API_BASE = `${import.meta.env.VITE_BASE_URL || "http://localhost:8001"}/v3`;

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


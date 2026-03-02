import useStore from "@/lib/store";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/v3`;

// Get API key from store
const getApiKey = (): string => {
  return useStore.getState().api_key || "";
};

/**
 * Interface for agent creation parameters
 */
export interface CreateAgentParams {
  name: string;
  description: string;
  agent_role: string;
  agent_instructions: string;
  examples?: any;
  tool?: string;
  tool_usage_description?: string;
  provider_id: string;
  model: string;
  temperature: number;
  top_p: number;
  llm_credential_id: string;
  features?: string[];
  managed_agents?: string[];
  response_format:
  | { type: "json_schema"; json_schema: { strict: boolean; schema: any } }
  | { type: "text" };
}

/**
 * Create a new agent
 * @param params Agent creation parameters
 * @returns The created agent data with ID
 */
export const createAgent = async (params: CreateAgentParams): Promise<any> => {
  try {
    const apiKey = getApiKey();

    // Use fetch directly to match the exact curl command structure
    const response = await fetch(
      `${API_BASE_URL}/agents/template/single-task`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create agent");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
};

/**
 * Get all agents for the current user
 * @returns A list of agents
 */
export const listAgents = async (): Promise<any[]> => {
  try {
    const apiKey = getApiKey();
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to list agents");
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing agents:", error);
    throw error;
  }
};

/**
 * Get agent by ID
 * @param agentId The ID of the agent to retrieve
 * @returns The agent data
 */
export const getAgent = async (agentId: string): Promise<any> => {
  try {
    const apiKey = getApiKey();
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to get agent");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
};


export interface ManagedAgent {
  id: string;
  name: string;
  usage_description: string;
}

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
  response_format: {
    type: string;
  };
  provider_id: string;
  model: string;
  top_p: number;
  temperature: number;
  managed_agents: ManagedAgent[];
  version: string;
  created_at: string;
  updated_at: string;
  llm_credential_id: string;
  [key: string]: unknown; // Index signature to allow spreading into Record<string, unknown>
}

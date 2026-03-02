import { IAgent } from "@/lib/types";
import { Agent } from "../types/agent";

/**
 * Adapts an IAgent object to the Agent interface expected by agent-eval components
 * This helps bridge the gap between the global IAgent type and the local Agent type
 */
export function adaptIAgentToAgent(iagent: IAgent): Agent {
  return {
    _id: iagent._id,
    api_key: iagent.api_key || "",
    template_type: iagent.template_type || "",
    name: iagent.name,
    description: iagent.description || "",
    agent_role: iagent.agent_role,
    agent_instructions: iagent.agent_instructions,
    agent_goal: (iagent as any).agent_goal || "",
    agent_context: (iagent as any).agent_context,
    agent_output: (iagent as any).agent_output,
    examples: iagent.examples,
    features: iagent.features || [],
    tool: iagent.tool || "",
    tool_usage_description: iagent.tool_usage_description || "",
    response_format: iagent.response_format || { type: "text" },
    provider_id: iagent.provider_id || "",
    model: iagent.model || "",
    top_p: typeof iagent.top_p === 'number' ? iagent.top_p : 1,
    temperature: typeof iagent.temperature === 'number' ? iagent.temperature : 0.7,
    managed_agents: iagent.managed_agents || [],
    version: iagent.version || "1.0",
    created_at: (iagent as any).created_at || new Date().toISOString(),
    updated_at: (iagent as any).updated_at || new Date().toISOString(),
    llm_credential_id: iagent.llm_credential_id || "",
  };
}

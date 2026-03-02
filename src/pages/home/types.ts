export interface ChatMessage {
  role: "user" | "assistant" | "loading";
  content: string;
  showRagSelection?: boolean;
  showToolsSelection?: boolean;
}

export interface Rag {
  id: string;
  collection_name: string;
  description: string;
  llm_model: string;
  embedding_model: string;
  vector_store_provider: string;
  _id: string;
  [key: string]: any;
}

export interface AgentConfiguration {
  name: string;
  agent_instructions: string;
  provider_id: string;
  model: string;
  features?: string[];
  tool?: string;
  rag_name?: string;
  description: string;
  agent_role: string;
  tool_usage_description: string | null;
  temperature: string;
  top_p: string;
  llm_credential_id: string;
  rag_id: string | null;
}

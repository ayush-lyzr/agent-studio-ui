import { RefObject } from "react";
import { UseFormReturn } from "react-hook-form";

import { IAgent, IProvider } from "@/lib/types";
import { MemberstackCurrentUser } from "@/lib/types";

export interface ToolResponse {
  _id: string;
  provider_id: string;
  type: string;
  form: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description?: string;
      }
    >;
    required: string[];
  };
  meta_data: {
    schema: {
      info: {
        title: string;
        description: string;
      };
    };
  };
}

export interface BasicDetailsProps {
  scrollRef: RefObject<HTMLDivElement>;
  form: UseFormReturn<any, any, any>;
  providers: IProvider[];
  models: { [key: string]: string[] };
  setModels: React.Dispatch<React.SetStateAction<{ [key: string]: string[] }>>;
  apiTools: ToolResponse[];
  userTools: string[];
  setApiTools: (tools: ToolResponse[]) => void;
  setUserTools: (tools: string[]) => void;
  toolsLoading: boolean;
  isExistingAgent?: boolean;
  isModelFieldLoading?: boolean;
  structuredOpErrors: string[];
}

export interface ToolsEmptyStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export interface FormProperty {
  type: string;
  description?: string;
}

export interface ToolsProps {
  form: UseFormReturn<any, any, any>;
  onEnabledCountChange: (count: number) => void;
  apiTools: ToolResponse[];
  userTools: string[];
  loading: boolean;
  error: string | null;
  apiKey: string;
  setApiTools: (tools: ToolResponse[]) => void;
  setUserTools: (tools: string[]) => void;
}

export interface RagConfig {
  lyzr_rag: {
    base_url: string;
    rag_id: string;
    rag_name?: string;
    params?: {
      top_k?: number;
      retrieval_type?: string;
      score_threshold?: number;
    };
  };
}

export interface LaunchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Partial<IAgent>;
  userId: string;
  currentUser: Partial<MemberstackCurrentUser>;
}

export interface LabelWithTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  tooltipDescription?: string;
}

export interface Agent {
  _id: string;
  name: string;
  description: string;
  agent_role: string;
  agent_instructions: string;
  features: Array<{
    type: string;
    config: Record<string, any>;
    priority: number;
  }>;
  tools?: string[];
  provider_id: string;
  model: string;
  temperature: string | number;
  top_p: string | number;
  tool?: string;
  tool_usage_description?: string;
  created_at?: string;
  updated_at?: string;
  llm_credential_id?: string;
  examples?: string;
  response_format:
    | { type: "json_schema"; json_schema: { strict: boolean; schema: any } }
    | { type: "text" };
}

export interface Tool {
  name: string;
  usage_description: string;
  tool_source: string;
  server_id?: string;
  persist_auth?: boolean;
  provider_uuid?: string;
  credential_id?: string;
}

export interface ToolConfig {
  tool_name: string;
  tool_source: string;
  action_names: string[];
  persist_auth: boolean;
  server_id?: string;
  provider_uuid?: string;
  credential_id?: string;
}

export interface FormValues {
  name: string;
  description?: string;
  agent_role?: string;
  agent_goal?: string;
  agent_instructions?: string;
  optional_examples?: string;
  features: Array<{
    type: string;
    config: Record<string, any>;
    priority: number;
  }>;
  tool?: string;
  tool_usage_description?: string;
  tools: Tool[];
  tool_configs: ToolConfig[];
  provider_id: string;
  model: string;
  temperature: number;
  top_p: number;
  llm_credential_id?: string;
  examples?: string | null;
  examples_visible?: boolean;
  structured_output?: string | null;
  structured_output_visible?: boolean;
  managed_agents?: ManagedAgent[];
  a2a_tools?: { base_url: string }[];
  response_format:
    | { type: "json_schema"; json_schema: { strict: boolean; schema: any } }
    | { type: "text" };
  store_messages: boolean;
  file_output?: boolean;
  language?: string;
  who_speaks_first?: "ai" | "human";
  ai_intro_text?: string;
  voice?: string;
  additional_model_params: Record<string, any> | null;
}

export interface ManagedAgent {
  id: string;
  name: string;
  usage_description: string;
}

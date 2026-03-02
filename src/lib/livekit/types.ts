export type NoiseCancellationType = "auto" | "telephony" | "standard" | "none";

export type Engine =
  | {
    kind: "pipeline";
    stt: string;
    llm: string;
    tts: string;
    voice_id?: string;
    language?: string;
  }
  | {
    kind: "realtime";
    llm: string;
    voice?: string;
    language?: string;
  };

export type RealtimeOption = {
  id: string;
  name: string;
  /**
   * Supported language codes for this model (if provided by backend).
   * Used to populate the voice-new-create language selector.
   */
  languages?: string[];
};

export type RealtimeProviderOptions = {
  providerId: string;
  displayName: string;
  models: RealtimeOption[];
  voices: RealtimeOption[];
  requiredEnv: string[];
  dynamic?: boolean;
  warning?: string;
};

export type RealtimeOptionsResponse = {
  providers: RealtimeProviderOptions[];
};

export type PipelineModelOption = {
  id: string;
  name: string;
  description?: string;
  /**
   * Supported language codes for this model (if provided by backend).
   * Used to populate the voice-new-create language selector.
   */
  languages?: string[];
};

export type PipelineProviderModels = {
  providerId: string;
  displayName: string;
  models: PipelineModelOption[];
};

export type PipelineOptionsResponse = {
  stt: PipelineProviderModels[];
  tts: PipelineProviderModels[];
  llm: PipelineProviderModels[];
};

export type TurnDetection = "english" | "multilingual";

export interface AvatarConfig {
  enabled?: boolean;
  provider?: "anam";
  anam?: {
    name?: string;
    avatarId?: string;
  };
  avatar_participant_name?: string;
}

export interface AgentConfig {
  // Runtime config
  engine?: Engine;
  /**
   * Optional: store both engine configs so switching modes doesn't lose state.
   * Runtime uses `engine`; these are for persistence/UI hydration.
   */
  engine_pipeline?: Extract<Engine, { kind: "pipeline" }>;
  engine_realtime?: Extract<Engine, { kind: "realtime" }>;
  prompt?: string;
  conversation_start?: { who: "human" | "ai"; greeting?: string };
  /**
   * Per-session dynamic variables for `{{var_name}}` placeholders.
   * Keys must be snake_case; values must be strings.
   */
  dynamic_variables?: Record<string, string>;
  /**
   * Default/fallback dynamic variables.
   * Used only when `dynamic_variables` does not contain a key.
   */
  dynamic_variable_defaults?: Record<string, string>;
  vad_enabled?: boolean;
  preemptive_generation?: boolean;
  pronunciation_correction?: boolean;
  pronunciation_rules?: Record<string, string>;
  turn_detection?: TurnDetection;
  noise_cancellation?: { enabled: boolean; type: NoiseCancellationType };
  tools?: string[];
  /**
   * Remote tool configs (tools v2) exposed as callable action tools.
   * Each action name is registered as a callable tool by the Python agent.
   */
  lyzr_tools?: LyzrToolConfig[];

  // Optional: knowledge base (RAG)
  knowledge_base?: {
    enabled?: boolean;
    lyzr_rag?: {
      base_url: string;
      rag_id: string;
      rag_name?: string;
      params?: {
        top_k?: number;
        retrieval_type?: string;
        score_threshold?: number;
      };
    };
    agentic_rag?: Array<{
      rag_id: string;
      top_k: number;
      retrieval_type: string;
      score_threshold: number;
    }>;
  };

  // Optional: external tool/sub-agent delegation
  api_key?: string;
  managed_agents?: {
    enabled: boolean;
    agents: Array<{
      id: string;
      name: string;
      usage_description: string;
    }>;
  };

  // Optional: avatar worker (e.g., Anam)
  avatar?: AvatarConfig;

  // Optional: agent-published background audio
  background_audio?: {
    enabled?: boolean;
    ambient?: { enabled?: boolean; source?: string; volume?: number };
    tool_call?: {
      enabled?: boolean;
      sources?: Array<{
        source: string;
        volume?: number;
        probability?: number;
      }>;
    };
    turn_taking?: {
      enabled?: boolean;
      sources?: Array<{
        source: string;
        volume?: number;
        probability?: number;
      }>;
    };
  };
}

/**
 * Tools v2 configuration (mirrors Lyzr agent `tool_configs` shape).
 *
 * Note: this is distinct from `tools` (the backend-livekit registry IDs).
 */
export interface LyzrToolConfig {
  tool_name: string;
  tool_source: string;
  action_names: string[];
  persist_auth: boolean;
  server_id?: string | null;
  provider_uuid?: string | null;
  credential_id?: string | null;
}

export const AGENT_CONFIG_DEFAULTS: AgentConfig = {
  engine: {
    kind: "pipeline",
    stt: "assemblyai/universal-streaming:en",
    tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    llm: "openai/gpt-4o-mini",
  },
  prompt: "You are a helpful voice AI assistant. Be concise and friendly.",
  conversation_start: { who: "human" },
  tools: [],
  vad_enabled: true,
  turn_detection: "english",
  noise_cancellation: { enabled: true, type: "auto" },
};

export interface SessionRequest {
  userIdentity: string;
  roomName?: string;
  agentId?: string;
  agentConfig?: AgentConfig;
}

export interface SessionResponse {
  userToken: string;
  roomName: string;
  livekitUrl: string;
  agentDispatched: boolean;
  /**
   * NOTE: This is intentionally a summary (not the full AgentConfig).
   * Keep your requested config client-side if you need full details in UI.
   */
  agentConfig: {
    engine: Engine;
    tools: string[];
  };
}

export interface ConnectionState {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
}

/**
 * Persisted agent record as returned by backend `/agents`.
 *
 * Note: `id` is a Mongo ObjectId string.
 */
export interface StoredAgent {
  id: string;
  config: AgentConfig & { agent_name?: string; agent_description?: string };
  createdAt: string;
  updatedAt: string;
}

export type AgentConfigWithName = AgentConfig & {
  agent_name: string;
  agent_description?: string;
};

export interface ListAgentsResponse {
  agents: StoredAgent[];
}

export interface GetAgentResponse {
  agent: StoredAgent;
}

export interface CreateAgentRequest {
  config: AgentConfigWithName;
}

export interface CreateAgentResponse {
  agent: StoredAgent;
}

export interface UpdateAgentRequest {
  config: AgentConfigWithName;
}

export interface UpdateAgentResponse {
  agent: StoredAgent;
}

export type DeleteAgentResponse = void;

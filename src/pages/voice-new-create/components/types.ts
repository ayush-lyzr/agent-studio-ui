import type { LyzrToolConfig } from "@/lib/livekit/types";

export type BackgroundAudioFormConfig = {
  enabled: boolean;
  ambient: {
    enabled: boolean;
    source: string;
    volume: number; // 0..1
  };
  tool_call: {
    enabled: boolean;
    sources: Array<{
      source: string;
      volume: number; // 0..1
      probability: number; // 0..1
    }>;
  };
  turn_taking: {
    enabled: boolean;
    sources: Array<{
      source: string;
      volume: number; // 0..1
      probability: number; // 0..1
    }>;
  };
};

export type VoiceNewCreateFormValues = {
  name: string;
  description: string;
  agent_role: string;
  agent_goal: string;
  agent_instructions: string;
  /**
   * UI-only: optional example outputs to guide prompt writing.
   * Not persisted/sent to the LiveKit backend.
   */
  examples?: string;
  /**
   * UI-only: controls visibility of the Examples textarea.
   * Not persisted/sent to the LiveKit backend.
   */
  examples_visible?: boolean;
  active_mode: "pipeline" | "realtime";
  stt: string;
  tts: string;
  llm: string;
  realtime_llm: string;
  realtime_voice: string;
  noise_cancellation_type: "none" | "auto" | "standard" | "telephony";
  preemptive_generation: boolean;
  pronunciation_correction: boolean;
  pronunciation_rules: Record<string, string>;
  who_speaks_first: "human" | "ai";
  ai_intro_text: string;
  language: string;
  avatar_enabled: boolean;
  avatar_id: string;
  background_audio: BackgroundAudioFormConfig;
  dynamic_variables_enabled: boolean;
  dynamic_variable_defaults: Record<string, string>;
  knowledge_base_enabled: boolean;
  knowledge_base_config: {
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
  } | null;
  /**
   * Optional: sub-agent delegation (manager agents).
   *
   * Kept in snake_case to match the LiveKit backend contract.
   */
  managed_agents?: {
    enabled: boolean;
    agents: Array<{
      id: string;
      name: string;
      usage_description: string;
    }>;
  };
  /**
   * Optional: API key required by some tools (e.g. call_sub_agent).
   *
   * NOTE: sourced silently from store; no UI input.
   */
  api_key?: string;
  /**
   * Optional: explicit tool enablement. Required for call_sub_agent.
   *
   * NOTE: stored to preserve tools when editing a saved agent.
   */
  tools?: string[];
  /**
   * Optional: remote tool configs (tools v2). These are exposed as callable action tools.
   *
   * NOTE: this is distinct from `tools` (the backend-livekit built-in tool registry).
   */
  lyzr_tools?: LyzrToolConfig[];
};

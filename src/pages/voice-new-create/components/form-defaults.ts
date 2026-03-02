import { DEFAULT_BACKGROUND_AUDIO } from "./background-audio-defaults";
import type { VoiceNewCreateFormValues } from "./types";

export function getVoiceNewCreateDefaultValues(
  apiKey: string,
): VoiceNewCreateFormValues {
  return {
    name: "",
    description: "",
    agent_role: "",
    agent_goal: "",
    agent_instructions: "",
    // UI-only (not persisted to backend)
    examples: "",
    examples_visible: false,
    active_mode: "pipeline",
    stt: "assemblyai/universal-streaming:en",
    tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    llm: "openai/gpt-4o-mini",
    realtime_llm: "openai/gpt-realtime",
    realtime_voice: "sage",
    noise_cancellation_type: "none",
    preemptive_generation: false,
    pronunciation_correction: false,
    pronunciation_rules: {},
    who_speaks_first: "human",
    ai_intro_text: "",
    language: "en",
    avatar_enabled: false,
    avatar_id: "6dbc1e47-7768-403e-878a-94d7fcc3677b",
    background_audio: DEFAULT_BACKGROUND_AUDIO,
    dynamic_variables_enabled: false,
    dynamic_variable_defaults: {},
    knowledge_base_enabled: false,
    knowledge_base_config: null,
    managed_agents: { enabled: false, agents: [] },
    api_key: apiKey,
    tools: [],
    lyzr_tools: [],
  };
}

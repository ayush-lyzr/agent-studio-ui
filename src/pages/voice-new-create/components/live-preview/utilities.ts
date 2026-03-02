import type { AgentConfig, AvatarConfig } from "@/lib/livekit/types";
import type { VoiceNewCreateFormValues } from "../types";

const AUTO_LANGUAGE_CODE = "auto";

function dedupeStrings(items: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  for (const item of items) {
    const value = (item ?? "").trim();
    if (!value) continue;
    if (out.includes(value)) continue;
    out.push(value);
  }
  return out;
}

function cleanLyzrTools(
  tools: VoiceNewCreateFormValues["lyzr_tools"],
): NonNullable<VoiceNewCreateFormValues["lyzr_tools"]> {
  const input = Array.isArray(tools) ? tools : [];
  const out: NonNullable<VoiceNewCreateFormValues["lyzr_tools"]> = [];

  for (const raw of input) {
    if (!raw) continue;
    const tool_name = (raw.tool_name ?? "").trim();
    const tool_source = (raw.tool_source ?? "").trim();
    if (!tool_name || !tool_source) continue;

    const action_names = dedupeStrings(raw.action_names ?? []);
    if (action_names.length === 0) continue;

    out.push({
      tool_name,
      tool_source,
      action_names,
      persist_auth: Boolean(raw.persist_auth),
      server_id: raw.server_id ? String(raw.server_id).trim() : undefined,
      provider_uuid: raw.provider_uuid
        ? String(raw.provider_uuid).trim()
        : undefined,
      credential_id: raw.credential_id
        ? String(raw.credential_id).trim()
        : undefined,
    });
  }

  return out;
}

type BuildAgentConfigOptions = {
  includeDynamicVariableDefaults: boolean;
  includeEngineStash: boolean;
};

function buildAgentConfigInternal(
  formValues: VoiceNewCreateFormValues,
  options: BuildAgentConfigOptions,
): AgentConfig {
  const prompt = [
    formValues.agent_role,
    formValues.agent_goal,
    formValues.agent_instructions,
  ]
    .filter(Boolean)
    .join("\n\n");

  const dynamic_variable_defaults =
    options.includeDynamicVariableDefaults && formValues.dynamic_variables_enabled
      ? (formValues.dynamic_variable_defaults ?? {})
      : undefined;

  const conversation_start: AgentConfig["conversation_start"] =
    formValues.who_speaks_first === "ai" && formValues.ai_intro_text.trim()
      ? { who: "ai", greeting: `Say, "${formValues.ai_intro_text.trim()}"` }
      : { who: "human" };

  const avatar: AvatarConfig | undefined = formValues.avatar_enabled
    ? {
        enabled: true,
        provider: "anam",
        anam: {
          avatarId: formValues.avatar_id,
        },
      }
    : undefined;

  const selectedKb = formValues.knowledge_base_config;
  const kbEnabled = Boolean(
    formValues.knowledge_base_enabled && selectedKb?.lyzr_rag?.rag_id?.trim(),
  );

  const managedAgentsConfig = formValues.managed_agents;
  const managedAgentsList = managedAgentsConfig?.agents ?? [];
  const managedAgentsEnabled = Boolean(
    managedAgentsConfig?.enabled && managedAgentsList.length > 0,
  );
  const baseTools = Array.isArray(formValues.tools) ? formValues.tools : [];
  // `call_sub_agent` is only meaningful when manager agents are enabled.
  const cleanedBaseTools = baseTools.filter(
    (t) => (t ?? "").trim() !== "call_sub_agent",
  );
  const tools = dedupeStrings([
    ...cleanedBaseTools,
    ...(managedAgentsEnabled ? ["call_sub_agent"] : []),
  ]);

  const lyzr_tools = cleanLyzrTools(formValues.lyzr_tools);
  const normalizedLanguage = formValues.language?.trim();
  const isAutoLanguage = normalizedLanguage?.toLowerCase() === AUTO_LANGUAGE_CODE;
  const pipelineLanguage = isAutoLanguage
    ? AUTO_LANGUAGE_CODE
    : normalizedLanguage || undefined;
  const realtimeLanguage = isAutoLanguage ? undefined : normalizedLanguage || undefined;

  const engine: AgentConfig["engine"] =
    formValues.active_mode === "realtime"
      ? {
          kind: "realtime",
          llm: formValues.realtime_llm,
          voice: formValues.realtime_voice?.trim() || undefined,
          language: realtimeLanguage,
        }
      : {
          kind: "pipeline",
          stt: formValues.stt,
          tts: formValues.tts,
          llm: formValues.llm,
          language: pipelineLanguage,
        };

  const engine_pipeline: AgentConfig["engine_pipeline"] | undefined =
    options.includeEngineStash
      ? {
          kind: "pipeline",
          stt: formValues.stt,
          llm: formValues.llm,
          tts: formValues.tts,
          language: pipelineLanguage,
        }
      : undefined;

  const engine_realtime: AgentConfig["engine_realtime"] | undefined =
    options.includeEngineStash
      ? {
          kind: "realtime",
          llm: formValues.realtime_llm,
          voice: formValues.realtime_voice?.trim() || undefined,
          language: realtimeLanguage,
        }
      : undefined;

  return {
    engine,
    ...(engine_pipeline ? { engine_pipeline } : {}),
    ...(engine_realtime ? { engine_realtime } : {}),
    prompt: prompt || "You are a helpful voice AI assistant.",
    dynamic_variable_defaults,
    conversation_start,
    noise_cancellation: {
      enabled: formValues.noise_cancellation_type !== "none",
      type: formValues.noise_cancellation_type,
    },
    vad_enabled: true,
    preemptive_generation: formValues.preemptive_generation,
    pronunciation_correction: formValues.pronunciation_correction,
    pronunciation_rules: formValues.pronunciation_correction
      ? formValues.pronunciation_rules
      : undefined,
    turn_detection: (formValues.language?.trim().toLowerCase() ?? "").startsWith("en")
      ? "english"
      : "multilingual",
    avatar,
    background_audio: formValues.background_audio,
    api_key: formValues.api_key?.trim() || undefined,
    // Always persist managed_agents config (even when disabled) so the list is preserved.
    managed_agents:
      managedAgentsList.length > 0
        ? { enabled: managedAgentsEnabled, agents: managedAgentsList }
        : undefined,
    tools: tools.length > 0 ? tools : undefined,
    lyzr_tools: lyzr_tools.length > 0 ? lyzr_tools : undefined,
    ...(kbEnabled
      ? {
          knowledge_base: {
            enabled: true,
            ...(selectedKb?.lyzr_rag ? { lyzr_rag: selectedKb.lyzr_rag } : {}),
            agentic_rag: selectedKb?.agentic_rag ?? [],
          },
        }
      : {}),
  };
}

/**
 * Runtime config used to start LiveKit sessions (live preview).
 */
export function buildRuntimeAgentConfig(
  formValues: VoiceNewCreateFormValues,
): AgentConfig {
  return buildAgentConfigInternal(formValues, {
    includeDynamicVariableDefaults: true,
    includeEngineStash: false,
  });
}

/**
 * Persisted config saved to the LiveKit backend `/agents`.
 * Includes both engine stashes so switching modes doesn't lose state.
 */
export function buildPersistedAgentConfig(
  formValues: VoiceNewCreateFormValues,
): AgentConfig {
  return buildAgentConfigInternal(formValues, {
    includeDynamicVariableDefaults: true,
    includeEngineStash: true,
  });
}

export function generateUserIdentity(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

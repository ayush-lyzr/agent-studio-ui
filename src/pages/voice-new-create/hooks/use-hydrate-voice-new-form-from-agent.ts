import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { backendClient } from "@/lib/livekit/backend-client";

import { normalizeBackgroundAudioConfig } from "../components/background-audio-defaults";
import type { VoiceNewCreateFormValues } from "../components/types";

type ManagedAgentsValue = NonNullable<VoiceNewCreateFormValues["managed_agents"]>;
const AUTO_LANGUAGE_CODE = "auto";

function parseGreeting(greeting?: string): string {
  if (!greeting) return "";
  const trimmed = greeting.trim();

  // Common pattern used across this repo: `Say, "..."` or `Say, '...'`
  const sayPrefix = /^say,\s*/i;
  const withoutPrefix = trimmed.replace(sayPrefix, "").trim();

  // Strip wrapping quotes if present.
  const match = withoutPrefix.match(/^["']([\s\S]*)["']$/);
  return (match?.[1] ?? withoutPrefix).trim();
}

function parseInferenceDescriptor(value?: string): {
  model: string;
  variant?: string;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { model: "" };
  const [model, variant] = raw.split(":", 2);
  return {
    model: (model ?? "").trim().toLowerCase(),
    variant: variant?.trim().toLowerCase() || undefined,
  };
}

function shouldUseAutoPipelineLanguage(
  sttDescriptor: string | undefined,
  rawLanguage: string | undefined,
): boolean {
  const language = (rawLanguage ?? "").trim().toLowerCase();
  if (language === AUTO_LANGUAGE_CODE) return true;

  const { model, variant } = parseInferenceDescriptor(sttDescriptor);
  if (!model) return false;

  if (
    (model === "deepgram/nova-3" || model === "deepgram/nova-2") &&
    (variant === "multi" || language === "multi")
  ) {
    return true;
  }

  if (model === "assemblyai/universal-streaming-multilingual" && !language) {
    return true;
  }

  if (model === "elevenlabs/scribe_v2_realtime" && !language && !variant) {
    return true;
  }

  return false;
}

export function useHydrateVoiceNewFormFromAgent({
  agentId,
  form,
  apiKey,
  onError,
}: {
  agentId?: string;
  form: UseFormReturn<VoiceNewCreateFormValues>;
  apiKey: string;
  onError?: (error: unknown) => void;
}) {
  const [isHydratingFromAgent, setIsHydratingFromAgent] = useState(false);
  const onErrorReference = useRef(onError);

  useEffect(() => {
    onErrorReference.current = onError;
  }, [onError]);

  useEffect(() => {
    const selectedAgentId = agentId;
    if (!selectedAgentId || !apiKey.trim()) return;
    const selectedAgentIdString = selectedAgentId;

    let mounted = true;

    async function hydrateFromAgent() {
      setIsHydratingFromAgent(true);
      try {
        const response = await backendClient.getAgent(selectedAgentIdString);
        if (!mounted) return;

        const cfg = response.agent.config;
        const kb = cfg.knowledge_base;
        const lyzrRag = kb?.lyzr_rag;

        const pipelineEngineFromActive =
          cfg.engine && cfg.engine.kind === "pipeline" ? cfg.engine : undefined;
        const realtimeEngineFromActive =
          cfg.engine && cfg.engine.kind === "realtime" ? cfg.engine : undefined;

        const pipelineEngineFromStash =
          cfg.engine_pipeline && cfg.engine_pipeline.kind === "pipeline"
            ? cfg.engine_pipeline
            : undefined;
        const realtimeEngineFromStash =
          cfg.engine_realtime && cfg.engine_realtime.kind === "realtime"
            ? cfg.engine_realtime
            : undefined;

        const pipelineEngine =
          pipelineEngineFromActive ?? pipelineEngineFromStash;
        const realtimeEngine =
          realtimeEngineFromActive ?? realtimeEngineFromStash;

        const normalizedRealtimeLlm = (() => {
          const llm = realtimeEngine?.llm;
          if (!llm) return form.getValues("realtime_llm") as string;

          const trimmed = llm.trim();
          if (!trimmed) return form.getValues("realtime_llm") as string;

          if (trimmed.includes("/")) return trimmed;
          return `openai/${trimmed}`;
        })();

        const normalizedManagedAgents = (() => {
          const managedAgents = cfg.managed_agents;
          if (!managedAgents) return { enabled: false, agents: [] };

          // New format: { enabled, agents }
          if (
            typeof managedAgents === "object" &&
            managedAgents !== null &&
            "enabled" in managedAgents
          ) {
            return managedAgents as VoiceNewCreateFormValues["managed_agents"];
          }

          // Old format: agents[]
          const agents = managedAgents as unknown as ManagedAgentsValue["agents"];
          return { enabled: agents.length > 0, agents };
        })();

        const voiceValues: VoiceNewCreateFormValues = {
          ...form.getValues(),
          name: cfg.agent_name ?? "",
          description: cfg.agent_description ?? "",
          active_mode: realtimeEngineFromActive ? "realtime" : "pipeline",
          llm: (pipelineEngine?.llm ?? form.getValues("llm")) as string,
          realtime_llm: normalizedRealtimeLlm,
          realtime_voice: (realtimeEngine?.voice ??
            form.getValues("realtime_voice")) as string,
          stt: (pipelineEngine?.stt ?? form.getValues("stt")) as string,
          tts: (pipelineEngine?.tts ?? form.getValues("tts")) as string,
          preemptive_generation: Boolean(cfg.preemptive_generation),
          pronunciation_correction: Boolean(cfg.pronunciation_correction),
          pronunciation_rules: cfg.pronunciation_rules ?? {},
          noise_cancellation_type:
            cfg.noise_cancellation?.enabled &&
            cfg.noise_cancellation.type !== "none"
              ? cfg.noise_cancellation.type
              : "none",
          who_speaks_first: cfg.conversation_start?.who ?? "human",
          ai_intro_text:
            cfg.conversation_start?.who === "ai"
              ? parseGreeting(cfg.conversation_start.greeting)
              : "",
          language: (() => {
            const raw = realtimeEngineFromActive
              ? realtimeEngine?.language
              : pipelineEngine?.language;
            const trimmed = typeof raw === "string" ? raw.trim() : "";
            if (!realtimeEngineFromActive) {
              const sttDescriptor =
                (pipelineEngine?.stt ?? form.getValues("stt") ?? "").trim() ||
                undefined;
              if (shouldUseAutoPipelineLanguage(sttDescriptor, trimmed || undefined)) {
                return AUTO_LANGUAGE_CODE;
              }
            }
            return trimmed || form.getValues("language") || "en";
          })(),
          avatar_enabled: Boolean(cfg.avatar?.enabled),
          avatar_id:
            cfg.avatar?.enabled && cfg.avatar.anam?.avatarId
              ? cfg.avatar.anam.avatarId
              : form.getValues("avatar_id"),
          background_audio: normalizeBackgroundAudioConfig(
            cfg.background_audio,
          ),
          dynamic_variables_enabled: Boolean(cfg.dynamic_variable_defaults),
          dynamic_variable_defaults: cfg.dynamic_variable_defaults ?? {},
          knowledge_base_enabled: Boolean(kb?.enabled),
          knowledge_base_config: kb?.enabled
            ? {
                ...(lyzrRag ? { lyzr_rag: lyzrRag } : {}),
                ...(kb?.agentic_rag ? { agentic_rag: kb.agentic_rag } : {}),
              }
            : null,
          // Support both old (array) and new ({ enabled, agents }) formats.
          managed_agents: normalizedManagedAgents,
          tools: cfg.tools ?? [],
          lyzr_tools: cfg.lyzr_tools ?? [],
          api_key: cfg.api_key ?? apiKey,
          agent_role: "",
          agent_goal: "",
          agent_instructions: cfg.prompt ?? "",
        };

        form.reset(voiceValues);
      } catch (error) {
        if (!mounted) return;
        onErrorReference.current?.(error);
      } finally {
        if (!mounted) return;
        setIsHydratingFromAgent(false);
      }
    }

    hydrateFromAgent();

    return () => {
      mounted = false;
    };
  }, [agentId, apiKey, form]);

  return { isHydratingFromAgent };
}

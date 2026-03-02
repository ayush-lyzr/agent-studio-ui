import type { CreateAgentRequest } from "@/lib/livekit/types";
import type { IAgent } from "@/lib/types";

const DEFAULT_REALTIME_MODEL = "openai/gpt-realtime";
const DEFAULT_REALTIME_VOICE = "sage";
const DEFAULT_PROMPT = "You are a helpful voice AI assistant.";

const LEGACY_LANGUAGE_TO_CODE: Record<string, string> = {
  arabic: "ar",
  chinese: "zh",
  dutch: "nl",
  english: "en",
  french: "fr",
  german: "de",
  hindi: "hi",
  italian: "it",
  japanese: "ja",
  korean: "ko",
  polish: "pl",
  portuguese: "pt",
  russian: "ru",
  spanish: "es",
  turkish: "tr",
};

type LegacyVoiceConfig = {
  initiator?: "human" | "ai";
  message?: string;
  language?: string;
  voice?: string;
};

function getLegacyVoiceConfig(agent: IAgent): LegacyVoiceConfig {
  return (agent.voice_config ?? {}) as LegacyVoiceConfig;
}

function normalizeLegacyLanguage(input?: string): string | undefined {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2})?$/.test(lower)) return lower;

  return LEGACY_LANGUAGE_TO_CODE[lower];
}

function buildPrompt(agent: IAgent): string {
  const goal = (agent as IAgent & { agent_goal?: string }).agent_goal;
  const parts = [agent.agent_role, goal, agent.agent_instructions]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
  return parts.join("\n\n") || DEFAULT_PROMPT;
}

function buildConversationStart(
  agent: IAgent,
): CreateAgentRequest["config"]["conversation_start"] {
  const voiceConfig = getLegacyVoiceConfig(agent);
  const initiator = voiceConfig.initiator === "ai" ? "ai" : "human";
  const greeting = (voiceConfig.message ?? "").trim();

  if (initiator !== "ai" || !greeting) {
    return { who: "human" };
  }

  return { who: "ai", greeting: `Say, "${greeting}"` };
}

function buildManagedAgents(agent: IAgent) {
  const managedAgentsInput = Array.isArray(agent.managed_agents)
    ? agent.managed_agents
    : [];

  const managedAgents = managedAgentsInput
    .map((managedAgent) => ({
      id: (managedAgent.id ?? "").trim(),
      name: (managedAgent.name ?? "").trim(),
      usage_description: (managedAgent.usage_description ?? "").trim(),
    }))
    .filter(
      (managedAgent) =>
        managedAgent.id && managedAgent.name && managedAgent.usage_description,
    );

  if (managedAgents.length === 0) return undefined;
  return { enabled: true, agents: managedAgents };
}

export function buildNewVoiceCreatePayloadFromLegacyAgent(
  agent: IAgent,
): CreateAgentRequest {
  const voiceConfig = getLegacyVoiceConfig(agent);
  const voice = (voiceConfig.voice ?? "").trim() || DEFAULT_REALTIME_VOICE;
  const language = normalizeLegacyLanguage(voiceConfig.language);
  const managedAgents = buildManagedAgents(agent);
  const apiKey = (agent.api_key ?? "").trim() || undefined;
  const tools = managedAgents ? ["call_sub_agent"] : undefined;

  return {
    config: {
      agent_name: (agent.name ?? "").trim() || "Migrated Voice Agent",
      agent_description: (agent.description ?? "").trim() || undefined,
      prompt: buildPrompt(agent),
      conversation_start: buildConversationStart(agent),
      engine: {
        kind: "realtime",
        llm: DEFAULT_REALTIME_MODEL,
        voice,
        ...(language ? { language } : {}),
      },
      ...(apiKey ? { api_key: apiKey } : {}),
      ...(tools ? { tools } : {}),
      ...(managedAgents ? { managed_agents: managedAgents } : {}),
    },
  };
}

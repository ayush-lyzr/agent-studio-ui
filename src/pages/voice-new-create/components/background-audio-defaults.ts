import type { BackgroundAudioFormConfig } from "./types";

export type BackgroundAudioConfig = BackgroundAudioFormConfig;

/**
 * Backend/agent contract shape (nested fields optional).
 * This is what we may receive from a saved agent config.
 */
export type InboundBackgroundAudioConfig = {
  enabled?: boolean;
  ambient?: {
    enabled?: boolean;
    source?: string;
    volume?: number;
  };
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export const DEFAULT_BACKGROUND_AUDIO: BackgroundAudioConfig = {
  enabled: false,
  ambient: {
    enabled: true,
    source: "OFFICE_AMBIENCE",
    volume: 0.6,
  },
  tool_call: {
    enabled: true,
    sources: [
      { source: "KEYBOARD_TYPING_TRUNC", volume: 0.8, probability: 1 },
    ],
  },
  turn_taking: {
    enabled: false,
    sources: [
      { source: "KEYBOARD_TYPING", volume: 0.8, probability: 0.6 },
      { source: "KEYBOARD_TYPING2", volume: 0.7, probability: 0.4 },
    ],
  },
};

/**
 * Ensures a stable shape for the background-audio UI.
 * - Preserves existing choices when present
 * - Fills in missing nested objects with defaults
 * - Clamps numeric inputs into 0..1
 */
export function normalizeBackgroundAudioConfig(
  input: InboundBackgroundAudioConfig | undefined,
): BackgroundAudioConfig {
  const current = input ?? {};

  const ambient = current.ambient ?? {};
  const toolCall = current.tool_call ?? {};
  const turnTaking = current.turn_taking ?? {};

  return {
    enabled: Boolean(current.enabled),
    ambient: {
      enabled: ambient.enabled ?? DEFAULT_BACKGROUND_AUDIO.ambient.enabled,
      source: ambient.source ?? DEFAULT_BACKGROUND_AUDIO.ambient.source,
      volume: clamp01(
        typeof ambient.volume === "number"
          ? ambient.volume
          : (DEFAULT_BACKGROUND_AUDIO.ambient.volume ?? 0.6),
      ),
    },
    tool_call: {
      enabled: toolCall.enabled ?? DEFAULT_BACKGROUND_AUDIO.tool_call.enabled,
      sources: toolCall.sources?.length
        ? toolCall.sources.map(
            (s: NonNullable<typeof toolCall.sources>[number]) => ({
              source: s.source,
              volume: clamp01(typeof s.volume === "number" ? s.volume : 0.8),
              probability: clamp01(
                typeof s.probability === "number" ? s.probability : 1,
              ),
            }),
          )
        : DEFAULT_BACKGROUND_AUDIO.tool_call.sources.map((s) => ({ ...s })),
    },
    turn_taking: {
      enabled:
        turnTaking.enabled ?? DEFAULT_BACKGROUND_AUDIO.turn_taking.enabled,
      sources: turnTaking.sources?.length
        ? turnTaking.sources.map(
            (s: NonNullable<typeof turnTaking.sources>[number]) => ({
              source: s.source,
              volume: clamp01(typeof s.volume === "number" ? s.volume : 0.8),
              probability: clamp01(
                typeof s.probability === "number" ? s.probability : 1,
              ),
            }),
          )
        : DEFAULT_BACKGROUND_AUDIO.turn_taking.sources.map((s) => ({ ...s })),
    },
  };
}

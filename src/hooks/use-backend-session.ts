import { useCallback, useState } from "react";
import type { AgentConfig, SessionResponse } from "@/lib/livekit/types";
import { getOrgApiKey } from "@/lib/livekit/org-api-key";

function normalizeBaseUrl(url: string): string {
  // Avoid `//path` when callers provide a trailing slash.
  return url.replace(/\/+$/, "");
}

const BACKEND_URL = normalizeBaseUrl(
  import.meta.env.VITE_LIVEKIT_BACKEND_URL || "https://ba-dc3c74596474493fba4d44a9ea25b57f.ecs.us-east-1.on.aws"
);

export function useBackendSession() {
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async (userIdentity: string, agentConfig?: AgentConfig, agentId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const userApiKey = getOrgApiKey();
        if (!userApiKey) {
          throw new Error("Missing API key (x-api-key) for LiveKit backend");
        }
        const effectiveAgentConfig: AgentConfig | undefined =
          userApiKey && !agentConfig?.api_key
            ? { ...(agentConfig ?? {}), api_key: userApiKey }
            : agentConfig;

        const response = await fetch(`${BACKEND_URL}/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userApiKey,
          },
          body: JSON.stringify({
            userIdentity,
            agentId,
            agentConfig: effectiveAgentConfig,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create session");
        }

        const data: SessionResponse = await response.json();
        setSessionData(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const endSession = useCallback(async (roomName?: string) => {
    if (!roomName) {
      setSessionData(null);
      setError(null);
      return;
    }

    setIsEnding(true);

    try {
      const userApiKey = getOrgApiKey();
      if (!userApiKey) {
        throw new Error("Missing API key (x-api-key) for LiveKit backend");
      }
      const response = await fetch(`${BACKEND_URL}/session/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userApiKey,
        },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok && response.status !== 404) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to end session");
      }
    } catch (err) {
      console.error("Backend session termination failed:", err);
      throw err;
    } finally {
      setSessionData(null);
      setError(null);
      setIsEnding(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSessionData(null);
    setError(null);
  }, []);

  return {
    sessionData,
    isLoading,
    isEnding,
    error,
    createSession,
    endSession,
    reset,
  };
}

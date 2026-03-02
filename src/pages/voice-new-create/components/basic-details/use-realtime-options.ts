import { useEffect, useState } from "react";

import useStore from "@/lib/store";
import { backendClient } from "@/lib/livekit/backend-client";
import type { RealtimeProviderOptions } from "@/lib/livekit/types";

export function useRealtimeOptions() {
  const apiKey = useStore((state) => state.api_key ?? "");
  const hasApiKey = Boolean(apiKey.trim());
  const [providers, setProviders] = useState<RealtimeProviderOptions[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasApiKey) {
      setProviders([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadRealtimeOptions() {
      setIsLoading(true);
      try {
        const response = await backendClient.getRealtimeOptions();
        if (!mounted) return;
        setProviders(response.providers ?? []);
      } catch (error) {
        // Silent failure; realtime UI will show empty lists.
        console.error("[voice-new] Failed to load realtime options:", error);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    loadRealtimeOptions();

    return () => {
      mounted = false;
    };
  }, [hasApiKey]);

  return { providers, isLoading };
}

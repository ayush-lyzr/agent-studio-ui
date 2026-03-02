import { useEffect, useState } from "react";

import useStore from "@/lib/store";
import { backendClient } from "@/lib/livekit/backend-client";
import type { PipelineProviderModels } from "@/lib/livekit/types";

export function usePipelineOptions() {
  const apiKey = useStore((state) => state.api_key ?? "");
  const hasApiKey = Boolean(apiKey.trim());
  const [sttProviders, setSttProviders] = useState<PipelineProviderModels[]>(
    [],
  );
  const [ttsProviders, setTtsProviders] = useState<PipelineProviderModels[]>(
    [],
  );
  const [llmProviders, setLlmProviders] = useState<PipelineProviderModels[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasApiKey) {
      setSttProviders([]);
      setTtsProviders([]);
      setLlmProviders([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadPipelineOptions() {
      setIsLoading(true);
      try {
        const response = await backendClient.getPipelineOptions();
        if (!mounted) return;
        setSttProviders(response.stt ?? []);
        setTtsProviders(response.tts ?? []);
        setLlmProviders(response.llm ?? []);
      } catch (error) {
        console.error("[voice-new] Failed to load pipeline options:", error);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    loadPipelineOptions();

    return () => {
      mounted = false;
    };
  }, [hasApiKey]);

  return { sttProviders, ttsProviders, llmProviders, isLoading };
}

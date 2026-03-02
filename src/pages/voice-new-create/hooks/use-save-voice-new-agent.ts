import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { NavigateFunction } from "react-router-dom";

import { Path } from "@/lib/types";
import { backendClient } from "@/lib/livekit/backend-client";

import { buildPersistedAgentConfig } from "../components/live-preview/utilities";
import type { VoiceNewCreateFormValues } from "../components/types";

export function useSaveVoiceNewAgent({
  agentId,
  form,
  apiKey,
  navigate,
  toast,
}: {
  agentId?: string;
  form: UseFormReturn<VoiceNewCreateFormValues>;
  apiKey: string;
  navigate: NavigateFunction;
  toast: (input: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}) {
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  const saveAgent = useCallback(
    async (options?: { skipCreateNavigate?: boolean }): Promise<boolean> => {
      const values = form.getValues();
      const name = values.name.trim();
      const description = values.description?.trim() || undefined;

      if (!name) {
        form.setError("name", { type: "required", message: "Name is required" });
        toast({
          title: "Agent name is required",
          description: "Add a name before saving.",
          variant: "destructive",
        });
        return false;
      }

      setIsSavingAgent(true);
      try {
        const persistedRuntime = buildPersistedAgentConfig(values);
        const persistedConfig = {
          ...persistedRuntime,
          agent_name: name,
          agent_description: description,
        };

        const response = agentId
          ? await backendClient.updateAgent(agentId, { config: persistedConfig })
          : await backendClient.createAgent({ config: persistedConfig });

        toast({ title: agentId ? "Agent updated!" : "Agent saved!" });

        if (!agentId) {
          if (!options?.skipCreateNavigate) {
            navigate(`${Path.VOICE_NEW_CREATE}/${response.agent.id}`, {
              replace: true,
            });
          }
          return true;
        }

        // Reset dirty state to the latest saved config.
        const savedCfg = response.agent.config ?? {};
        form.reset({
          ...values,
          name: savedCfg.agent_name ?? values.name,
          description: savedCfg.agent_description ?? values.description,
          tools: savedCfg.tools ?? values.tools ?? [],
          managed_agents:
            savedCfg.managed_agents ??
            values.managed_agents ?? { enabled: false, agents: [] },
          api_key: savedCfg.api_key ?? values.api_key ?? apiKey,
        });
        return true;
      } catch (error) {
        toast({
          title: "Failed to save agent",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSavingAgent(false);
      }
    },
    [agentId, apiKey, form, navigate, toast],
  );

  return { isSavingAgent, saveAgent };
}

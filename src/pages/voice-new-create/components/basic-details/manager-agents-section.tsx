import type { UseFormReturn } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { VoiceNewCreateFormValues } from "../types";
import VoiceNewCreateManagedAgentsSection from "./managed-agents-section.voice-new-create";

export function ManagerAgentsSection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const managedAgentsConfig = form.watch("managed_agents");
  const isEnabled = Boolean(managedAgentsConfig?.enabled);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="voice-new-manager-agent"
            checked={isEnabled}
            onCheckedChange={(checked) => {
              const current = form.getValues("managed_agents");
              form.setValue(
                "managed_agents",
                { enabled: checked, agents: current?.agents ?? [] },
                { shouldDirty: true, shouldValidate: true },
              );
            }}
          />
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="inline-flex cursor-help items-center gap-2">
                  <label
                    htmlFor="voice-new-manager-agent"
                    className="cursor-help text-sm font-medium underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground"
                  >
                    Manager Agent
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-[280px]"
              >
                <p>
                  A Manager Agent coordinates multiple sub-agents to execute
                  complex, multi-step tasks. It handles task delegation and
                  ensures end-to-end completion.
                </p>
                <p className="mt-2 italic">
                  Prerequisite: sub-agents must be created before they can be
                  added.
                </p>
                <p className="mt-2 italic">
                  Example: a Product Manager Agent can oversee drafting
                  requirements, creating user stories, prioritizing them, and
                  updating Slack and Notion—all through its sub-agents.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isEnabled && <VoiceNewCreateManagedAgentsSection form={form} />}
    </>
  );
}


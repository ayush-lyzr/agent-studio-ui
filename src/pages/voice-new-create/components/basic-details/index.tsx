import type { UseFormReturn } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import type { VoiceNewCreateFormValues } from "../types";
import { AgentIdentitySection } from "./agent-identity-section";
import { EngineModeSection } from "./engine-mode-section";
import { PromptSection } from "./prompt-section";
import { ToolsSection } from "./tools-section";
import { ExamplesSection } from "./examples-section";

export function VoiceNewBasicDetails() {
  const form =
    useFormContext<VoiceNewCreateFormValues>() as UseFormReturn<VoiceNewCreateFormValues>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <AgentIdentitySection form={form} />
      <EngineModeSection form={form} />
      <PromptSection form={form} />
      <ToolsSection form={form} />
      <ExamplesSection form={form} />
    </div>
  );
}

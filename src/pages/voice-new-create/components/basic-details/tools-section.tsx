import type { UseFormReturn } from "react-hook-form";

// NOTE: We reuse the existing agent-create tools editor UI (ToolsSection) via a wrapper,
// because voice-new's `tools` field is reserved for LiveKit built-in tool IDs (string[]).
import ConfigureLyzrToolsExisting from "../configure-lyzr-tools-existing";
import type { VoiceNewCreateFormValues } from "../types";

export function ToolsSection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  return (
    <div className="col-span-4">
      <ConfigureLyzrToolsExisting form={form} />
    </div>
  );
}

import { useLayoutEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { VoiceNewCreateFormValues } from "../types";

export function useRealtimeVoiceDefaulting({
  form,
  activeMode,
  realtimeVoices,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
  activeMode: VoiceNewCreateFormValues["active_mode"];
  realtimeVoices: Array<{ id: string }>;
}) {
  const shouldDefaultRealtimeVoiceOnNextModelChangeReference = useRef(false);

  function markUserInitiatedModelChange() {
    shouldDefaultRealtimeVoiceOnNextModelChangeReference.current = true;
  }

  useLayoutEffect(() => {
    if (activeMode !== "realtime") return;
    const firstVoiceId = realtimeVoices[0]?.id;
    const shouldDefaultToFirst =
      shouldDefaultRealtimeVoiceOnNextModelChangeReference.current;

    if (shouldDefaultToFirst) {
      // User-initiated realtime model selection: always pick first voice for that provider.
      shouldDefaultRealtimeVoiceOnNextModelChangeReference.current = false;
      form.setValue("realtime_voice", firstVoiceId ?? "", {
        shouldDirty: true,
      });
      return;
    }

    // Passive sync (e.g., toggling into realtime mode, options loading): ensure the voice is valid.
    // We avoid overriding an already-valid choice.
    if (!firstVoiceId) return;

    const current = form.getValues("realtime_voice");
    const isValid =
      Boolean(current) && realtimeVoices.some((v) => v.id === current);
    if (isValid) return;

    form.setValue("realtime_voice", firstVoiceId, { shouldDirty: false });
  }, [activeMode, form, realtimeVoices]);

  return { markUserInitiatedModelChange };
}

import { Mic, Phone, Settings2 } from "lucide-react";

import { Button } from "@/components/custom/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { VoiceNewCreateFormValues } from "../types";
import { ConfigChip } from "./config-chip";

export function LivePreviewOfflineCard({
  formValues,
  onStartCall,
  isStarting,
}: {
  formValues: VoiceNewCreateFormValues;
  onStartCall: () => void;
  isStarting: boolean;
}) {
  const kbInvalid =
    formValues.knowledge_base_enabled &&
    !formValues.knowledge_base_config?.lyzr_rag?.rag_id?.trim();

  return (
    <TooltipProvider>
      <Card className="flex h-full flex-col overflow-hidden hover:translate-y-0 hover:border-input hover:shadow-none">
        <CardHeader className="pb-4">
          <div className="min-w-0">
            <CardTitle className="text-base">Live preview</CardTitle>
            <CardDescription className="mt-1">
              Test your voice agent configuration in real-time.
            </CardDescription>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <ConfigChip label="LLM" value={formValues.llm} />
            <ConfigChip label="STT" value={formValues.stt} />
            <ConfigChip label="TTS" value={formValues.tts} />
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">What this does</p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>- Dispatches an Agent for you</li>
              <li>- Connects your mic and streams audio to the agent</li>
              <li>- Shows agent audio + chat and live transcriptions</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Microphone</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Your browser will ask for microphone permission when you start the
              call. We’ll show live transcriptions as you speak.
            </p>
          </div>
        </CardContent>

        <CardFooter className="mt-auto flex-col gap-2 border-t bg-card/50 p-4">
          <Button
            type="button"
            className="w-full"
            onClick={onStartCall}
            disabled={isStarting || kbInvalid}
          >
            <Phone className="mr-2 h-4 w-4" />
            Start call
          </Button>
          {kbInvalid ? (
            <p className="text-center text-[11px] text-muted-foreground">
              Configure a Knowledge Base to start a call.
            </p>
          ) : null}
          <p className="text-center text-[11px] text-muted-foreground">
            {/* This uses the current form values (no save required). */}
          </p>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

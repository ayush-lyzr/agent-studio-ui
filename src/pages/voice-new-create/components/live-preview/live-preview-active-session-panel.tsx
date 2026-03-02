import { Bot, CircleDot, Loader2, Mic, PhoneOff } from "lucide-react";
import { Track } from "livekit-client";
import {
  BarVisualizer,
  useParticipants,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";

import { Button } from "@/components/custom/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionResponse } from "@/lib/livekit/types";
import { ChatPanel } from "../voice-session/chat-panel";
import { getAgentStateMeta } from "../voice-session/state-utilities";

export function LivePreviewActiveSessionPanel({
  sessionData,
  onEndCall,
  isEnding,
}: {
  sessionData: SessionResponse;
  onEndCall: () => void;
  isEnding: boolean;
}) {
  const voiceAssistant = useVoiceAssistant();
  const participants = useParticipants();

  const agentParticipant =
    voiceAssistant.agent ??
    participants.find((p) => p.identity.startsWith("agent"));

  const audioTracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  });
  const localAudioTrack = audioTracks.find(
    (track) => track.participant?.isLocal,
  );
  const agentAudioTrack = voiceAssistant.audioTrack;
  const agentState = voiceAssistant.state;
  const agentStateMeta = getAgentStateMeta(agentState, !!agentParticipant);

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Card className="shrink-0 hover:translate-y-0 hover:border-input hover:shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base">Live session</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardDescription className="mt-1 truncate">
                      Room: {sessionData.roomName}
                    </CardDescription>
                  </TooltipTrigger>
                  <TooltipContent>{sessionData.roomName}</TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="success" className="shrink-0">
                <CircleDot className="mr-1 h-3.5 w-3.5" />
                Live
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={agentParticipant ? "secondary" : "outline"}>
                <Bot className="mr-1 h-3.5 w-3.5" />
                {agentParticipant ? "Agent connected" : "Waiting for agent"}
              </Badge>
              <Badge variant={localAudioTrack ? "secondary" : "outline"}>
                <Mic className="mr-1 h-3.5 w-3.5" />
                {localAudioTrack ? "Mic active" : "Mic inactive"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="border-t p-4">
            <div className="flex h-32 items-center justify-center">
              {agentAudioTrack ? (
                <BarVisualizer
                  trackRef={agentAudioTrack}
                  state={agentState}
                  barCount={7}
                  options={{ minHeight: 16, maxHeight: 100 }}
                  className="h-full w-full [--lk-va-bar-gap:8px] [--lk-va-bar-width:18px]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-4 w-[18px] rounded-full bg-muted-foreground/30"
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {agentStateMeta.description}
            </p>
          </CardContent>
        </Card>

        <ChatPanel agentAudioTrack={agentAudioTrack} />

        <Button
          type="button"
          variant="destructive"
          className="w-full shrink-0"
          onClick={onEndCall}
          disabled={isEnding}
        >
          {isEnding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PhoneOff className="mr-2 h-4 w-4" />
          )}
          End call
        </Button>
      </div>
    </TooltipProvider>
  );
}

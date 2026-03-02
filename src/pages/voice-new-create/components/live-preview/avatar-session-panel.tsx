import { useState } from "react";
import {
  Bot,
  CircleDot,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  PhoneOff,
} from "lucide-react";
import { Track } from "livekit-client";
import {
  useParticipants,
  useTracks,
  useVoiceAssistant,
  VideoTrack,
} from "@livekit/components-react";

import { Button } from "@/components/custom/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SessionResponse } from "@/lib/livekit/types";
import { ChatPanel } from "../voice-session/chat-panel";

interface AvatarSessionPanelProperties {
  sessionData: SessionResponse;
  onEndCall: () => void;
  isEnding: boolean;
}

export function AvatarSessionPanel({
  sessionData,
  onEndCall,
  isEnding,
}: AvatarSessionPanelProperties) {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const agentVideoTrack = voiceAssistant.videoTrack;

  const sessionCard = (
    <TooltipProvider>
      <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
        <CardHeader className="pb-3">
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
            <div className="flex items-center gap-2">
              <Badge variant="success" className="shrink-0">
                <CircleDot className="mr-1 h-3.5 w-3.5" />
                Live
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </div>
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
          <div
            className={cn(
              "relative mx-auto overflow-hidden rounded-xl bg-gray-900",
              isFullscreen
                ? "aspect-video w-full max-w-[860px]"
                : "aspect-video",
            )}
          >
            {agentVideoTrack ? (
              <VideoTrack
                trackRef={agentVideoTrack}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400">Waiting for avatar...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );

  const content = (
    <div
      className={cn(
        "flex flex-col gap-3 overflow-hidden",
        isFullscreen ? "h-screen p-4" : "h-full",
      )}
    >
      {isFullscreen ? (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <div className="flex min-h-0 items-center justify-center">
            <div className="w-full max-w-[920px]">{sessionCard}</div>
          </div>
          <ChatPanel agentAudioTrack={agentAudioTrack} />
        </div>
      ) : (
        <>
          <div className="shrink-0">{sessionCard}</div>
          <ChatPanel agentAudioTrack={agentAudioTrack} />
        </>
      )}

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
  );

  if (isFullscreen) {
    return <div className="fixed inset-0 z-50 bg-background">{content}</div>;
  }

  return content;
}

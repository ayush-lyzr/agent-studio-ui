import { useCallback, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

import { useBackendSession } from "@/hooks/use-backend-session";
import type { VoiceNewCreateFormValues } from "./types";
import { LivePreviewActiveSessionPanel } from "./live-preview/live-preview-active-session-panel";
import { LivePreviewErrorCard } from "./live-preview/live-preview-error-card";
import { LivePreviewLoadingCard } from "./live-preview/live-preview-loading-card";
import { LivePreviewOfflineCard } from "./live-preview/live-preview-offline-card";
import { AvatarSessionPanel } from "./live-preview/avatar-session-panel";
import { BackgroundAudioRenderer } from "./live-preview/background-audio-renderer";
import {
  buildRuntimeAgentConfig,
  generateUserIdentity,
} from "./live-preview/utilities";

interface LivePreviewPanelProperties {
  formValues: VoiceNewCreateFormValues;
  agentId?: string;
}

export function VoiceNewLivePreviewPanel({
  formValues,
  agentId,
}: LivePreviewPanelProperties) {
  const {
    sessionData,
    isLoading,
    isEnding,
    error,
    createSession,
    endSession,
    reset,
  } = useBackendSession();
  const [isActive, setIsActive] = useState(false);

  const handleStartCall = useCallback(async () => {
    const userIdentity = generateUserIdentity();
    const agentConfig = buildRuntimeAgentConfig(formValues);

    try {
      await createSession(userIdentity, agentConfig, agentId);
      setIsActive(true);
    } catch {
      // Error is already set in the hook
    }
  }, [formValues, createSession, agentId]);

  const handleEndCall = useCallback(async () => {
    try {
      await endSession(sessionData?.roomName);
    } catch {
      // Error logged in hook
    } finally {
      setIsActive(false);
    }
  }, [endSession, sessionData?.roomName]);

  const canConnect = useMemo(
    () => Boolean(sessionData?.livekitUrl && sessionData?.userToken),
    [sessionData],
  );

  if (isLoading) {
    return <LivePreviewLoadingCard />;
  }

  if (error) {
    return (
      <LivePreviewErrorCard
        error={error}
        onBackToPreview={() => {
          reset();
          setIsActive(false);
        }}
      />
    );
  }

  const avatarEnabled = formValues.avatar_enabled;

  if (isActive && canConnect && sessionData) {
    if (avatarEnabled) {
      return (
        <LiveKitRoom
          serverUrl={sessionData.livekitUrl}
          token={sessionData.userToken}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={handleEndCall}
          className="h-full"
        >
          <AvatarSessionPanel
            sessionData={sessionData}
            onEndCall={handleEndCall}
            isEnding={isEnding}
          />
          <RoomAudioRenderer />
          <BackgroundAudioRenderer />
        </LiveKitRoom>
      );
    }

    return (
      <LiveKitRoom
        serverUrl={sessionData.livekitUrl}
        token={sessionData.userToken}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={handleEndCall}
        className="h-full"
      >
        <LivePreviewActiveSessionPanel
          sessionData={sessionData}
          onEndCall={handleEndCall}
          isEnding={isEnding}
        />
        <RoomAudioRenderer />
        <BackgroundAudioRenderer />
      </LiveKitRoom>
    );
  }

  return (
    <LivePreviewOfflineCard
      formValues={formValues}
      onStartCall={handleStartCall}
      isStarting={isLoading}
    />
  );
}

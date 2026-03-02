import { useEffect, useMemo, useRef, useState } from "react";
import {
    LocalParticipant,
    type Participant,
    Track,
    type TranscriptionSegment,
} from "livekit-client";
import {
    useChat,
    useLocalParticipant,
    useTrackTranscription,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import {
    type ChatAccentColor,
    type ChatMessageType,
    ChatTile,
} from "../chat/chat-tile";

type TranscriptionTileProperties = {
    agentAudioTrack?: TrackReferenceOrPlaceholder;
    accentColor?: ChatAccentColor;
    onInspect?: (item: ChatMessageType) => void;
};

function segmentToChatMessage(
    segment: TranscriptionSegment,
    existingMessage: ChatMessageType | undefined,
    participant: Participant | undefined,
): ChatMessageType {
    const isSelf = participant instanceof LocalParticipant;
    const name = isSelf ? "You" : participant?.name || "Agent";

    return {
        name,
        isSelf,
        message: segment.final ? segment.text : `${segment.text} ...`,
        timestamp: existingMessage?.timestamp ?? Date.now(),
        rawData: {
            segmentId: segment.id,
            text: segment.text,
            final: segment.final,
            language: segment.language,
            startTime: segment.startTime,
            endTime: segment.endTime,
            participantName: participant?.name,
            participantIdentity: participant?.identity,
        },
    };
}

export function TranscriptionTile({
    agentAudioTrack,
    accentColor = "indigo",
    onInspect,
}: TranscriptionTileProperties) {
    const { chatMessages, send } = useChat();
    const localParticipant = useLocalParticipant();

    const agentSegments = useTrackTranscription(agentAudioTrack || undefined);
    const localSegments = useTrackTranscription({
        publication: localParticipant.microphoneTrack,
        source: Track.Source.Microphone,
        participant: localParticipant.localParticipant,
    });

    const transcriptsReference = useRef<Map<string, ChatMessageType>>(new Map());
    const [messages, setMessages] = useState<ChatMessageType[]>([]);

    useEffect(() => {
        const transcriptMap = new Map(transcriptsReference.current);

        if (agentAudioTrack) {
            for (const segment of agentSegments.segments) {
                transcriptMap.set(
                    segment.id,
                    segmentToChatMessage(
                        segment,
                        transcriptMap.get(segment.id),
                        agentAudioTrack.participant,
                    ),
                );
            }
        }

        for (const segment of localSegments.segments) {
            transcriptMap.set(
                segment.id,
                segmentToChatMessage(
                    segment,
                    transcriptMap.get(segment.id),
                    localParticipant.localParticipant,
                ),
            );
        }

        transcriptsReference.current = transcriptMap;

        const transcriptMessages = [...transcriptMap.values()];
        const livekitChatMessages: ChatMessageType[] = chatMessages.map(
            (chatMessage) => {
                const isSelf =
                    chatMessage.from?.identity ===
                    localParticipant.localParticipant.identity;
                let name = chatMessage.from?.name;

                if (!name) {
                    if (isSelf) {
                        name = "You";
                    } else if (chatMessage.from?.identity?.startsWith("agent")) {
                        name = "Agent";
                    } else {
                        name = "Participant";
                    }
                }

                return {
                    name,
                    message: chatMessage.message,
                    timestamp: chatMessage.timestamp,
                    isSelf,
                    rawData: {
                        id: chatMessage.id,
                        message: chatMessage.message,
                        timestamp: chatMessage.timestamp,
                        fromIdentity: chatMessage.from?.identity,
                        fromName: chatMessage.from?.name,
                    },
                };
            },
        );

        // Keep Array#sort for TS target compatibility in this project.
        // eslint-disable-next-line unicorn/no-array-sort
        const sortedMessages = [...transcriptMessages, ...livekitChatMessages].sort(
            (a, b) => a.timestamp - b.timestamp,
        );
        setMessages(sortedMessages);
    }, [
        chatMessages,
        agentSegments.segments,
        localSegments.segments,
        agentAudioTrack?.participant,
        agentAudioTrack,
        localParticipant.localParticipant,
    ]);

    const hasContent = useMemo(() => messages.length > 0, [messages]);

    return (
        <div className="h-full">
            {!hasContent && (
                <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Start speaking to see transcripts...
                    </p>
                </div>
            )}
            <ChatTile messages={messages} onSend={send} accentColor={accentColor} onInspect={onInspect} />
        </div>
    );
}

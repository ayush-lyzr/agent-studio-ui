import { useEffect, useRef } from "react";
import type { ChatMessage as ComponentsChatMessage } from "@livekit/components-react";
import { ChatMessage } from "./chat-message";
import { ChatMessageInput } from "./chat-message-input";
import { ToolCallBubble } from "./tool-call-bubble";

export type ChatMessageType = {
    name: string;
    message: string;
    isSelf: boolean;
    timestamp: number;
    type?: "message" | "function_call" | "function_call_output";
    interrupted?: boolean;
    toolName?: string;
    toolArgs?: string;
    toolOutput?: string;
    isError?: boolean;
    rawData?: Record<string, unknown>;
};

export type ChatAccentColor = "indigo";

type ChatTileProperties = {
    messages: ChatMessageType[];
    accentColor?: ChatAccentColor;
    onSend?: (message: string) => Promise<ComponentsChatMessage>;
    onInspect?: (item: ChatMessageType) => void;
};

export function ChatTile({
    messages,
    accentColor = "indigo",
    onSend,
    onInspect,
}: ChatTileProperties) {
    const scrollReference = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollReference.current;
        if (!container) {
            return;
        }
        container.scrollTop = container.scrollHeight;
    }, [messages]);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <div ref={scrollReference} className="flex-1 overflow-y-auto">
                <div className="flex min-h-full flex-col justify-end gap-4">
                    {messages.map((message, index, allMessages) => {
                        const messageType = message.type ?? "message";

                        if (
                            messageType === "function_call" ||
                            messageType === "function_call_output"
                        ) {
                            return (
                                <ToolCallBubble
                                    key={`${message.timestamp}-${index}`}
                                    type={messageType}
                                    toolName={message.toolName}
                                    isError={message.isError}
                                    onClick={
                                        onInspect
                                            ? () => onInspect(message)
                                            : undefined
                                    }
                                />
                            );
                        }

                        const hideName =
                            index > 0 &&
                            allMessages[index - 1].name === message.name &&
                            (allMessages[index - 1].type ?? "message") ===
                                "message";

                        return (
                            <ChatMessage
                                key={`${message.timestamp}-${index}`}
                                name={message.name}
                                message={message.message}
                                isSelf={message.isSelf}
                                hideName={hideName}
                                accentColor={accentColor}
                                interrupted={message.interrupted}
                                onClick={
                                    onInspect
                                        ? () => onInspect(message)
                                        : undefined
                                }
                            />
                        );
                    })}
                </div>
            </div>
            <ChatMessageInput
                placeholder="Send a chat message"
                onSend={onSend}
                accentColor={accentColor}
            />
        </div>
    );
}

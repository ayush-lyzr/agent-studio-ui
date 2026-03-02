import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import { Circle, Paperclip } from "lucide-react";
import ArtifactCard from "./ArtifactCard";
import { Message } from "@/types/chat";
import { CopyMessage } from "@/components/custom/copy-message";

interface ChatMessageProps {
  message: Message;
  onArtifactClick?: (artifactId: string) => void;
}

const ChatMessage = ({ message, onArtifactClick }: ChatMessageProps) => {
  // Process content to handle newlines properly
  const processedContent = message.content.replace(/\\n/g, "\n");

  return (
    <div
      className={`flex items-start space-x-4 py-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div className={cn("max-w-[70%]", message.role === "user" && "order-1")}>
        <div
          className={cn(
            "rounded-3xl py-2",
            message.role === "user"
              ? "border border-secondary bg-sidebar-accent px-3 text-primary"
              : "bg-transparent px-1 text-primary",
          )}
        >
          {message.isThinking ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Thinking</span>
              <div className="flex space-x-1">
                <div className="h-1 w-1 animate-bounce rounded-full bg-current opacity-60" />
                <div
                  className="h-1 w-1 animate-bounce rounded-full bg-current opacity-60"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="h-1 w-1 animate-bounce rounded-full bg-current opacity-60"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={`inline-flex max-w-none`}>
                <MarkdownRenderer
                  content={processedContent}
                  className="p-0 text-sm leading-[1.5rem]"
                />
                {message.isStreaming && message.role === "assistant" && (
                  <span className="ml-1 animate-pulse">
                    <Circle className="size-3 fill-primary/50 text-transparent" />
                  </span>
                )}
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.asset_id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Paperclip className="size-3" />
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {message.artifacts && message.artifacts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      onClick={() => onArtifactClick?.(artifact.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {!message.isThinking && (
          <div
            className={cn(
              "text-xs text-muted-foreground",
              message.role === "user" ? "float-right" : "float-left",
            )}
          >
            <CopyMessage content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

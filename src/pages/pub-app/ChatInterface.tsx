import { useState, useEffect } from "react";
import { Send, MessageSquare, Loader2, Paperclip, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import EventsPanel from "./EventsPanel";
import ThinkingDisplay, { ThinkingEvent } from "./ThinkingDisplay";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import { ChatInterfaceProps, ChatEvent } from "@/types/chat";
import { useAgent } from "@/hooks/useAgent";
import { useChatSession } from "@/hooks/useChatSession";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { useCredits } from "@/hooks/use-credits";
import { validateFileUploadWithMessage } from "@/utils/fileUploadValidation";
import { useDragDrop } from "@/hooks/useDragDrop";
import { DragDropOverlay } from "@/components/custom/drag-drop-overlay";

const ChatInterface = ({ initialAgentId }: ChatInterfaceProps) => {
  // State management
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isEventsCollapsed, setIsEventsCollapsed] = useState(false);
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [pendingArtifacts, setPendingArtifacts] = useState<Map<string, any>>(
    new Map(),
  );
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [currentThinkingEvent, setCurrentThinkingEvent] =
    useState<ThinkingEvent | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const api_key = useStore((state: any) => state.api_key);

  // Custom hooks
  const { handleCredits } = useCredits();
  const { currentAgent, agentData } = useAgent(api_key, initialAgentId);
  const {
    currentSessionId,
    setCurrentSessionId,
    updateCurrentSession,
    generateSessionId,
  } = useChatSession();
  const { websocket, connectWebSocket } = useWebSocket(
    currentAgent,
    api_key,
    handleEvent,
  );
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    messagesEndRef,
    sendMessage,
    uploadedFiles,
    isUploading,
    fileInputRef,
    handleFileUpload,
    removeFile,
    // stopInference,
  } = useMessageHandler(currentAgent, api_key, updateCurrentSession);

  const handleDragDropFiles = async (files: File[]) => {
    const fileList = new DataTransfer();
    files.forEach(file => fileList.items.add(file));
    await handleFileUpload(fileList.files);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  const { isDragging, isOverDropZone, error } = useDragDrop({
    onFilesDropped: handleDragDropFiles,
    acceptedTypes: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls'],
    maxFiles: 10,
    maxSizeMB: 10,
    disabled: isLoading || isUploading,
  });

  // Event handling
  function handleEvent(event: ChatEvent) {
    if (event.type === "context_memory_updated") {
      setEvents((prev) =>
        prev.filter((e) => e.type !== "context_memory_updated"),
      );
    }

    setEvents((prev) => [event, ...prev]);

    // Auto-delete context_memory_updated events after streaming animation
    if (event.type === "context_memory_updated") {
      handleAutoDeleteEvent(event.id, 2000, 1500);
    }

    // Auto-delete human_intervention_requested events after streaming animation
    if (event.type === "human_intervention_requested") {
      handleAutoDeleteEvent(event.id, 3000, 2500);
    }
  }

  // Listen for artifact events and attach them to the latest AI message
  useEffect(() => {
    const handleArtifactEvent = (event: CustomEvent<any>) => {
      if (event.detail.event_type === "artifact_create_success") {
        const artifact = {
          id: event.detail.artifact_id,
          name: event.detail.name,
          description: event.detail.description,
          format_type: event.detail.format_type,
          timestamp: event.detail.timestamp,
        };

        // Store artifact temporarily
        setPendingArtifacts((prev) => {
          const newMap = new Map(prev);
          newMap.set(artifact.id, event.detail);
          return newMap;
        });

        // Attach artifact to the latest AI message
        setMessages((prev) => {
          // Find last AI message index (backwards search)
          let lastAiMessageIndex = -1;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].role === "assistant") {
              lastAiMessageIndex = i;
              break;
            }
          }

          if (lastAiMessageIndex !== -1) {
            const updatedMessages = [...prev];
            const message = updatedMessages[lastAiMessageIndex];
            updatedMessages[lastAiMessageIndex] = {
              ...message,
              artifacts: [...(message.artifacts || []), artifact],
            };
            return updatedMessages;
          }
          return prev;
        });
      }
    };

    window.addEventListener(
      "artifact_event" as any,
      handleArtifactEvent as any,
    );

    return () => {
      window.removeEventListener(
        "artifact_event" as any,
        handleArtifactEvent as any,
      );
    };
  }, []);

  // Listen for thinking events
  useEffect(() => {
    const handleThinkingEvent = (event: CustomEvent<ThinkingEvent>) => {
      // Always capture thinking events
      setCurrentThinkingEvent(event.detail);
    };

    window.addEventListener(
      "thinking_event" as any,
      handleThinkingEvent as any,
    );

    return () => {
      window.removeEventListener(
        "thinking_event" as any,
        handleThinkingEvent as any,
      );
    };
  }, []);

  // Clear thinking event when streaming stops
  useEffect(() => {
    if (!isLoading) {
      // Delay clearing to allow for fade out animation
      const timer = setTimeout(() => {
        setCurrentThinkingEvent(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  function handleAutoDeleteEvent(
    eventId: string,
    initialDelay: number,
    fadeDelay: number,
  ) {
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, isStreaming: false } : event,
        ),
      );

      setTimeout(() => {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId ? { ...event, isRemoving: true } : event,
          ),
        );

        setTimeout(() => {
          setEvents((prev) => prev.filter((event) => event.id !== eventId));
        }, 500);
      }, fadeDelay);
    }, initialDelay);
  }

  // Chat session management
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId("");
    setHasStartedChat(false);
    if (websocket) {
      websocket.close();
    }
    handleEvent({
      id: Math.random().toString(36).substring(7),
      type: "new_chat",
      message: "Started new chat session",
      timestamp: new Date(),
    });
  };

  // Message sending
  const handleSendMessage = async () => {
    if (!validateFileUploadWithMessage(uploadedFiles.length > 0, inputValue)) {
      return;
    }

    const sessionId = generateSessionId(currentAgent.agentId);
    if (!hasStartedChat) {
      setHasStartedChat(true);
      setCurrentSessionId(sessionId);
      connectWebSocket(sessionId);
      await sendMessage(sessionId);
    } else {
      await sendMessage(currentSessionId);
    }
    setTimeout(handleCredits, 3 * 1000);
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track(`App chat`, {
        userResponse: inputValue,
        sessionId: sessionId,
      });
  };

  // Handle key press for message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if send button should be enabled
  const canSendMessage =
    (inputValue.trim() || uploadedFiles.length > 0) && !isLoading;

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <DragDropOverlay
        isDragging={isDragging}
        isOverDropZone={isOverDropZone}
        error={error}
        acceptedTypes={['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls']}
        maxFiles={10}
        showSuccess={showSuccess}
      />
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div
          className={cn(
            "w-full transition-all duration-700 ease-out",
            hasStartedChat
              ? cn(
                "grid h-screen",
                isEventsCollapsed ? "grid-cols-1" : "grid-cols-5",
              )
              : "flex min-h-screen items-center justify-center",
          )}
        >
          {/* Chat Section */}
          <div
            className={cn(
              "col-span-3 flex flex-col transition-all duration-700 ease-out",
              hasStartedChat ? "h-screen" : "mx-auto w-full max-w-3xl px-8",
            )}
          >
            {/* Header */}
            {hasStartedChat && (
              <div className="animate-fade-in border-b border-border bg-background px-8 py-6 transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted-foreground/20 transition-all duration-300">
                      <MessageSquare className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex flex-col items-start">
                      <h1 className="text-2xl font-semibold text-foreground">
                        {agentData?.name || currentAgent.name}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        by {agentData?.creator || "Avanade"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button variant="secondary-ghost" onClick={startNewChat}>
                      New Chat
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              className={cn("flex-1", hasStartedChat ? "overflow-hidden" : "")}
            >
              {hasStartedChat ? (
                <ScrollArea className="h-full px-8 py-6">
                  <div className="space-y-2">
                    {/* Show thinking display at the top if no messages yet */}
                    {messages.length === 0 && currentThinkingEvent && (
                      <ThinkingDisplay
                        event={currentThinkingEvent}
                        isStreaming={isLoading}
                      />
                    )}
                    {messages.map((message) => (
                      <div key={message.id}>
                        <ChatMessage
                          message={message}
                          onArtifactClick={(artifactId) => {
                            setSelectedArtifactId(artifactId);
                            setIsEventsCollapsed(false);
                            // Trigger a custom event to switch to artifacts tab
                            window.dispatchEvent(
                              new CustomEvent("show-artifact", {
                                detail: { artifactId },
                              }),
                            );
                          }}
                        />
                      </div>
                    ))}
                    {/* Show thinking display at the bottom when loading */}
                    {currentThinkingEvent && (
                      <ThinkingDisplay
                        event={currentThinkingEvent}
                        isStreaming={isLoading}
                      />
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              ) : (
                <div className="animate-fade-in text-center">
                  <div className="mb-16">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-600 transition-all duration-500">
                      <MessageSquare className="h-12 w-12 text-white" />
                    </div>
                    <div className="mb-6 flex flex-col items-center">
                      <h1
                        className="mb-2 text-5xl font-light text-foreground"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {agentData?.name || currentAgent.name}
                      </h1>
                      <p className="text-md mb-2 text-muted-foreground">
                        by {agentData?.creator || "Avanade"}
                      </p>
                      <div className="relative mx-auto my-4 w-full max-w-3xl">
                        <div className="relative rounded-lg shadow-sm">
                          <div
                            className="custom-scrollbar max-h-40 overflow-y-auto rounded-lg pb-5 pl-6 pr-6 pt-5"
                            style={{
                              scrollbarWidth: "thin",
                              scrollbarColor: "#94a3b8 #f1f5f9",
                            }}
                          >
                            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-muted-foreground">
                              {agentData?.description || "No Description"}
                            </p>
                          </div>
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-lg bg-gradient-to-t from-muted to-transparent dark:from-sidebar-accent"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Section */}
            <div className="border-t border-border bg-background px-8 py-6">
              <div className="mb-2 flex items-center space-x-4">
                <div className="relative flex-1">
                  {/* File attachments preview inside input */}
                  {uploadedFiles.length > 0 && (
                    <div
                      className={`absolute ${hasStartedChat ? "left-6 right-6 top-2" : "left-6 right-6 top-2"} z-10 flex max-h-24 flex-row flex-wrap items-start justify-start gap-2 overflow-y-auto`}
                    >
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex w-fit flex-shrink-0 items-center gap-1 rounded-md border bg-muted/90 px-2 py-1 text-xs backdrop-blur-sm"
                        >
                          <Paperclip className="h-3 w-3 flex-shrink-0" />
                          <div className="flex min-w-0 flex-col">
                            <span className="max-w-[80px] truncate font-medium">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.jpg,.jpeg,.png,.pptx,.xlsx,.xls"
                    onChange={(e) =>
                      e.target.files && handleFileUpload(e.target.files)
                    }
                    className="hidden"
                  />

                  {hasStartedChat ? (
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your questions here..."
                      className={`flex-1 resize-none bg-background pr-20 text-base text-foreground ${uploadedFiles.length > 0 ? "pt-24" : ""}`}
                      disabled={isLoading}
                    />
                  ) : (
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your questions here..."
                      className={`min-h-[120px] flex-1 resize-none rounded-2xl border-0 bg-muted-foreground/10 px-6 py-4 text-base text-foreground transition-all duration-300 focus:ring-2 focus:ring-slate-400 focus:ring-opacity-50 ${uploadedFiles.length > 0 ? "pt-24" : ""}`}
                      style={{
                        boxShadow: "inset 0 1px 3px rgba(71, 85, 105, 0.1)",
                      }}
                      disabled={isLoading}
                    />
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isUploading}
                        className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:bg-slate-100"
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                        ) : (
                          <Paperclip className="h-5 w-5 text-slate-600" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isUploading
                          ? "Uploading..."
                          : "Upload PDF, DOCX, PPTX, Excel, or image"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!canSendMessage}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-0 bg-slate-600 p-0 transition-all duration-300 hover:scale-105 hover:bg-slate-700"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <Send className="h-5 w-5 text-white" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    {uploadedFiles.length > 0 && !inputValue.trim() && (
                      <TooltipContent>
                        <p>Please enter a message along with the file</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  {/* Stop Inference Button: small, thick red square, no icon, only when loading */}
                  {/* {isLoading && (
                  <button
                    type="button"
                    onClick={() => stopInference(currentSessionId, api_key)}
                    className="ml-2 flex items-center justify-center rounded-md border-2 border-red-500 text-red-500 bg-transparent hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ width: '18px', height: '18px', aspectRatio: '1 / 1' }}
                  >
                  </button>
                )} */}
                </div>
              </div>
            </div>
          </div>

          {/* Events Panel */}
          {hasStartedChat && !isEventsCollapsed && (
            <div className="animate-slide-in-right col-span-2">
              <EventsPanel
                events={events}
                onCollapse={() => setIsEventsCollapsed(true)}
                selectedArtifactId={selectedArtifactId}
                pendingArtifacts={pendingArtifacts}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatInterface;

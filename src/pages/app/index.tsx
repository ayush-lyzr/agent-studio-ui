import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

import { ChatEvent, FileAttachment } from "@/types/chat";
import ThinkingDisplay, { ThinkingEvent } from "../pub-app/ThinkingDisplay";
import { useAgent } from "./agent.api";
import useStore from "@/lib/store";
import { useChatStore } from "./chat.store";
import { useChatService } from "./chat.api";
import { ChatMessage } from "../pub-app";
import { ChatSkeletonLoader } from "./components/chat-skeleton-loader";
import { ChatInput } from "@/components/custom/chat-input";
import EventsPanel from "../pub-app/EventsPanel";
import { cn } from "@/lib/utils";
import { useWebSocket } from "./use-websocket";
import { SiteHeader } from "./components/header";
import { PublishedAppSidebar } from "./components/pub-app-sidebar";
import { Layout } from "@/components/custom/layout";
import { isMixpanelActive } from "@/lib/constants";
import { useDragDrop } from "@/hooks/useDragDrop";
import { DragDropOverlay } from "@/components/custom/drag-drop-overlay";

const AgentChat = () => {
  const params = useParams();
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  // const [searchParams, setSearchParams] = useSearchParams();
  const appId = params?.app_id ?? "";
  // const sessionId = searchParams.get("sessionId");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [isEventsCollapsed, setIsEventsCollapsed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingArtifacts, setPendingArtifacts] = useState<Map<string, any>>(
    new Map(),
  );
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [currentThinkingEvent, setCurrentThinkingEvent] =
    useState<ThinkingEvent | null>(null);

  const { getAppData, isFetchingAgentData } = useAgent({
    appId,
    token,
  });
  const apiKey = useStore((state) => state.api_key);

  const { agent, setAgent, setSesions } = useChatStore((state) => state);
  const { currentSessionId, setCurrentSessionId } = useChatStore(
    (state) => state,
  );
  const {
    isLoading,
    sendMessage,
    messages = [],
    setMessages,
    createSession,
    isCreatingSession,
    isFetchingSessions,
    isFetchingSessionHistory,
    refetchSessions,
    refetchSessionHistory,
    uploadFiles,
    isUploadingFiles,
  } = useChatService({
    apiKey,
    session_id: currentSessionId,
    setAttachments,
    setPendingArtifacts,
    messagesEndRef,
  });

  const { websocket, connectWebSocket } = useWebSocket(
    agent,
    apiKey,
    handleEvent,
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const handleDragDropFiles = async (files: File[]) => {
    const fileList = new DataTransfer();
    files.forEach(file => fileList.items.add(file));
    await uploadFiles(fileList.files);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  const { isDragging, isOverDropZone, error: dragError } = useDragDrop({
    onFilesDropped: handleDragDropFiles,
    acceptedTypes: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls'],
    maxFiles: 10,
    maxSizeMB: 10,
    disabled: isLoading || isUploadingFiles,
  });

  const handleNewChat = async () => {
    if (!appId) return;

    if (websocket) {
      websocket.close();
    }
    const res = await createSession({
      agent_id: agent?.agent_id ?? "",
      metadata: {
        published: true,
        app_id: agent?.id,
        title: query,
      },
    });
    refetchSessions();
    const sessionId = res.data?.session_id;
    setCurrentSessionId(sessionId);
    setMessages([]);
    setSearchParams({ chat: "new" });
    handleEvent({
      id: Math.random().toString(36).substring(7),
      type: "new_chat",
      message: "Started new chat session",
      timestamp: new Date(),
    });
    await sendMessage({
      query,
      setQuery,
      agent,
      attachments,
      sessionId,
    });
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track(`App chat`, {
        userResponse: query,
        sessionId: sessionId,
      });
  };

  const handleSend = async () => {
    if (!appId) return;

    await sendMessage({
      query,
      setQuery,
      agent,
      attachments,
      sessionId: currentSessionId,
    });
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track(`App chat`, {
        userResponse: query,
        sessionId: currentSessionId,
      });
  };

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

  useEffect(() => {
    if (!isLoading) {
      // Delay clearing to allow for fade out animation
      const timer = setTimeout(() => {
        setCurrentThinkingEvent(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    const init = async () => {
      const appRes = await getAppData();
      setAgent(appRes.data);
    };

    if (appId) {
      init();
    }
  }, [appId]);

  useEffect(() => {
    if (agent?.agent_id) {
      refetchSessions();
    }
  }, [agent?.agent_id]);

  useEffect(() => {
    if (!currentSessionId) {
      // No session - reset everything
      setMessages([]);
      setEvents([]);
      setPendingArtifacts(new Map());
      websocket?.close();
      return;
    }

    // Valid session - connect and fetch history if needed
    if (currentSessionId) {
      console.log("connecting websocket ....");
      connectWebSocket(currentSessionId);
    }

    if (
      currentSessionId &&
      searchParams.get("chat") === "saved" &&
      !isLoading
    ) {
      refetchSessionHistory();
      setEvents([]);
      connectWebSocket(currentSessionId);
    }
  }, [currentSessionId]);

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
  }, [setMessages]);

  useEffect(() => {
    if (messages && messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [messages?.length]);

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
    setCurrentSessionId("");

    return () => {
      window.removeEventListener(
        "thinking_event" as any,
        handleThinkingEvent as any,
      );

      if (agent) setAgent({});
      setSesions([]);
      setEvents([]);
      setPendingArtifacts(new Map());
    };
  }, []);

  return (
    <>
      <DragDropOverlay
        isDragging={isDragging}
        isOverDropZone={isOverDropZone}
        error={dragError}
        acceptedTypes={['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls']}
        maxFiles={10}
        showSuccess={showSuccess}
      />
      <Layout className="flex h-screen w-full flex-col justify-between">
        <Helmet>
          <title>Avanade Agent Studio | {agent?.name ?? ""}</title>
          <meta
            name="description"
            content={
              agent?.description ??
              "This is an agentic app built using Avanade Agent Studio"
            }
          />
          <meta
            property="og:title"
            content={`Avanade Agent Studio | ${agent?.name ?? ""}`}
          />
          <meta
            property="og:description"
            content={
              agent?.description ??
              "This is an agentic app built using Avanade Agent Studio"
            }
          />
          {/* <meta
            property="og:image"
            content="https://example.com/image-for-specific-page.jpg"
          />
          <link rel="canonical" href="https://example.com/specific-page" /> */}
        </Helmet>
        <SiteHeader />
        <div className="flex h-[calc(100%-var(--header-height))] w-full border-t border-border">
          <PublishedAppSidebar
            streaming={isLoading || !!messages[messages.length - 1]?.isThinking}
            loading={isFetchingSessions}
            setMessages={setMessages}
            appId={appId}
          />
          <main className="h-full w-full overflow-hidden">
            {isFetchingAgentData ? (
              <ChatSkeletonLoader />
            ) : (
              <div className="h-full w-full">
                {currentSessionId ? (
                  isFetchingSessionHistory ? (
                    <ChatSkeletonLoader />
                  ) : (
                    <div className="flex h-full justify-between">
                      <div className="flex h-full w-full flex-col p-4">
                        <div className="no-scrollbar h-full space-y-2 overflow-y-auto p-6">
                          {messages &&
                            messages?.length === 0 &&
                            currentThinkingEvent && (
                              <ThinkingDisplay
                                event={currentThinkingEvent}
                                isStreaming={isLoading}
                              />
                            )}
                          {messages &&
                            messages?.map((message) => (
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
                          {currentThinkingEvent && (
                            <ThinkingDisplay
                              event={currentThinkingEvent}
                              isStreaming={isLoading}
                            />
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="relative w-full">
                          <ChatInput
                            query={query}
                            setQuery={setQuery}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            onSubmit={handleSend}
                            loading={isLoading}
                          />
                        </div>
                      </div>
                      {currentSessionId && (
                        <div
                          className={cn(
                            "h-full bg-background transition-all ease-in-out",
                            isEventsCollapsed ? "w-0" : "w-[40rem]",
                          )}
                        >
                          <EventsPanel
                            events={events}
                            onCollapse={() => setIsEventsCollapsed(true)}
                            pendingArtifacts={pendingArtifacts}
                            selectedArtifactId={selectedArtifactId}
                          />
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <div className="w-1/2">
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4 text-3xl font-semibold tracking-tight"
                      >
                        {`Welcome to ${agent?.name}`}{" "}
                        <span className="text-4xl">🚀</span>
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-md mb-8 line-clamp-4 max-h-[10rem] overflow-y-auto tracking-tight"
                      >
                        {agent?.welcome_message
                          ? agent?.welcome_message?.slice(
                            0,
                            expanded ? agent?.welcome_message?.length : 150,
                          )
                          : "Start an interaction with asking questions..."}
                        {agent?.welcome_message &&
                          agent?.welcome_message?.length > 150 && (
                            <>
                              ...{" "}
                              <a
                                href="#"
                                className="text-blue-600 hover:underline"
                                onClick={() => setExpanded(!expanded)}
                              >
                                read {expanded ? "less" : "more"}
                              </a>
                            </>
                          )}
                      </motion.p>
                      <ChatInput
                        query={query}
                        setQuery={setQuery}
                        onSubmit={handleNewChat}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        loading={isCreatingSession}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </Layout>
    </>
  );
};

export default AgentChat;

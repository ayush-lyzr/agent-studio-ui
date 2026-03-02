import { useState, useEffect } from "react";
import {
  Activity,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Brain,
  User,
  MessageCircle,
  Truck,
  FileText,
} from "lucide-react";
// Card import removed as it's not being used
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cleanEventText } from "@/utils/textCleaner";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtifactRenderer } from "./ArtifactRenderers";

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  isAutoDelete?: boolean;
  isStreaming?: boolean;
  isRemoving?: boolean;
  agentName?: string;
}

interface ArtifactEvent {
  timestamp: string;
  event_type: string;
  run_id: string;
  user_id: string;
  session_id: string;
  artifact_id: string;
  name: string;
  description: string;
  format_type:
    | "code"
    | "json"
    | "markdown"
    | "matplotlib"
    | "chart"
    | "text"
    | "plotly";
  data: string;
  metadata?: any;
  trace_id: string;
  log_id: string;
}

interface EventsPanelProps {
  events: Event[];
  onCollapse: () => void;
  selectedArtifactId?: string | null;
  pendingArtifacts?: Map<string, any>;
}

// const StreamingText = ({
//   text,
//   isLatest,
// }: {
//   text: string;
//   eventId?: string;
//   isLatest: boolean;
// }) => {
//   const [displayedText, setDisplayedText] = useState("");
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);

//   useEffect(() => {
//     setDisplayedText("");
//     setCurrentIndex(0);
//   }, [text]);

//   useEffect(() => {
//     // Clear any existing timer
//     if (timerRef.current) {
//       clearTimeout(timerRef.current);
//     }

//     if (currentIndex < text.length) {
//       // If this is not the latest event, finish animation quickly
//       const delay = isLatest ? 30 : 5; // Reduced from 50ms to 30ms for latest, 5ms for others

//       timerRef.current = setTimeout(() => {
//         setDisplayedText((prev) => prev + text[currentIndex]);
//         setCurrentIndex((prev) => prev + 1);
//       }, delay);
//     }

//     return () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//     };
//   }, [currentIndex, text, isLatest]);

//   // Effect to speed up animation if this is no longer the latest event
//   useEffect(() => {
//     if (!isLatest && currentIndex < text.length) {
//       // Quickly finish the animation
//       setDisplayedText(text);
//       setCurrentIndex(text.length);
//     }
//   }, [isLatest, text, currentIndex]);

//   return (
//     <div className="max-w-none">
//       <MarkdownRenderer
//         content={
//           displayedText + (currentIndex < text.length && isLatest ? "|" : "")
//         }
//         className="text-sm leading-[1.5rem]"
//       />
//     </div>
//   );
// };

// Function to clean nested response strings
const cleanResponse = (message: string): string => {
  try {
    const parsed = JSON.parse(message);
    if (parsed.response && typeof parsed.response === "string") {
      return cleanEventText(parsed.response);
    }
    return cleanEventText(message);
  } catch {
    return cleanEventText(message);
  }
};

const EventsPanel = ({ events, pendingArtifacts }: EventsPanelProps) => {
  const [artifacts, setArtifacts] = useState<ArtifactEvent[]>([]);
  const [activeTab, setActiveTab] = useState("events");

  // Listen for artifact events
  useEffect(() => {
    const handleArtifactEvent = (event: CustomEvent<ArtifactEvent>) => {
      if (event.detail.event_type === "artifact_create_success") {
        setArtifacts((prev) => [event.detail, ...prev]);
      }
    };

    const handleShowArtifact = (event: CustomEvent<{ artifactId: string }>) => {
      setActiveTab("artifacts");
      // Scroll to the artifact if needed
      setTimeout(() => {
        const element = document.getElementById(
          `artifact-${event.detail.artifactId}`,
        );
        element?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }, 100);
    };

    // Listen for artifact events on window
    window.addEventListener(
      "artifact_event" as any,
      handleArtifactEvent as any,
    );
    window.addEventListener("show-artifact" as any, handleShowArtifact as any);

    return () => {
      window.removeEventListener(
        "artifact_event" as any,
        handleArtifactEvent as any,
      );
      window.removeEventListener(
        "show-artifact" as any,
        handleShowArtifact as any,
      );
    };
  }, []);

  // Sync artifacts from pendingArtifacts if provided
  useEffect(() => {
    if (pendingArtifacts && pendingArtifacts.size > 0) {
      const newArtifacts = Array.from(pendingArtifacts.values());
      setArtifacts((prev) => {
        const existingIds = new Set(prev.map((a) => a.artifact_id));
        const uniqueNewArtifacts = newArtifacts.filter(
          (a) => !existingIds.has(a.artifact_id),
        );
        return [...uniqueNewArtifacts, ...prev];
      });
    }
  }, [pendingArtifacts]);
  // Filter out duplicate memory updated events - only show the latest one
  const filteredEvents = events.filter((event, index) => {
    if (event.type === "context_memory_updated") {
      // Find the last occurrence of memory updated event
      const lastMemoryIndex = events
        .map((e) => e.type)
        .lastIndexOf("context_memory_updated");
      return index === lastMemoryIndex;
    }
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "context_memory_updated":
        return <Brain className="h-4 w-4 text-slate-600" />;
      case "human_intervention_requested":
        return <User className="h-4 w-4 text-slate-600" />;
      case "llm_response":
      case "tool_response":
        return <MessageCircle className="h-4 w-4 text-slate-600" />;
      case "tool_call_prepare":
        return <Truck className="h-4 w-4 text-slate-600" />;
      case "session_start":
      case "websocket_connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "message_sent":
        return <Zap className="h-4 w-4 text-blue-600" />;
      case "stream_start":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case "stream_complete":
      case "response_received":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
      case "websocket_error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "session_loaded":
      case "websocket_disconnected":
        return <Clock className="h-4 w-4 text-slate-500" />;
      case "new_chat":
        return <Activity className="h-4 w-4 text-slate-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "context_memory_updated":
      case "human_intervention_requested":
      case "llm_response":
      case "tool_response":
      case "tool_call_prepare":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "session_start":
      case "new_chat":
      case "websocket_connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "message_sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "stream_start":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "stream_complete":
      case "response_received":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
      case "websocket_error":
        return "bg-red-100 text-red-800 border-red-200";
      case "session_loaded":
      case "websocket_disconnected":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex h-full w-[30rem] flex-col border-l">
      {/* Compact Header with Tabs */}

      <div className="px-4 pb-2 pt-3">
        {/* <div className="mb-3 flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
            <span className="text-muted-foreground">
              {filteredEvents.length} events
            </span>
          </div> */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-8 w-full grid-cols-2">
            <TabsTrigger
              value="events"
              className="text-xs data-[state=active]:text-xs"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="artifacts"
              className="text-xs data-[state=active]:text-xs"
            >
              Artifacts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="h-0 flex-1 overflow-hidden p-3">
        {activeTab === "events" ? (
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-6">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-6 w-fit rounded-3xl bg-secondary p-6">
                    <Activity className="size-10 text-primary/70" />
                  </div>
                  <p className="mb-3 text-lg font-medium text-primary">
                    No events yet
                  </p>
                  <p className="text-sm text-primary/60">
                    Start chatting to see activity
                  </p>
                </div>
              ) : (
                filteredEvents
                  .slice()
                  .reverse()
                  .map((event) => {
                    if (
                      event.type === "llm_response" ||
                      event.type === "tool_response"
                    ) {
                      // Special UI for Eddie (llm_response) and agent (tool_response) events
                      // const isLatest = index === filteredEvents.length - 1; // Last event is the latest one
                      let displayName =
                        event.type === "llm_response"
                          ? "Manager"
                          : event.agentName || "Agent";
                      // Show "Human Intervention Required" for Unknown Agent
                      if (displayName === "Unknown Agent") {
                        displayName = "Human Intervention Required";
                      }
                      // Clean the message for tool_response events
                      const cleanedMessage =
                        event.type === "tool_response"
                          ? cleanResponse(event.message)
                          : cleanEventText(event.message);
                      return (
                        <div
                          key={event.id}
                          className="animate-fade-in flex items-start space-x-3 py-2"
                        >
                          <div className="mt-2 h-2 w-2 rounded-full bg-muted-foreground" />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center space-x-2">
                              <span className="text-sm font-medium text-primary">
                                {displayName}
                              </span>
                              <span className="text-xs text-secondary-foreground/50">
                                {event.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="text-sm leading-relaxed text-primary">
                              <MarkdownRenderer content={cleanedMessage} />
                              {/* <StreamingText
                                text={cleanedMessage}
                                eventId={event.id}
                                isLatest={isLatest}
                              /> */}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    const eventTypeMap: Record<string, string> = {
                      context_memory_updated: "MEMORY UPDATED",
                      human_intervention_requested: "HUMAN INTERVENTION",
                      tool_call_prepare: "Manager",
                    };
                    // Regular events UI
                    const eventColorClasses = getEventColor(event.type);
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "rounded-3xl border bg-card p-3 shadow-sm backdrop-blur-sm transition-all duration-500 hover:shadow-md",
                          event.isRemoving
                            ? "animate-fade-out translate-y-2 opacity-0"
                            : event.isAutoDelete && !event.isStreaming
                              ? "animate-fade-out"
                              : "animate-fade-in",
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 rounded-2xl bg-input p-2">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs",
                                  eventColorClasses,
                                )}
                              >
                                {eventTypeMap[event.type] ??
                                  event.type.replace("_", " ").toUpperCase()}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground/50">
                                {event.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed text-slate-700">
                              {event.isStreaming ? (
                                <div className="flex items-center space-x-2">
                                  <MarkdownRenderer
                                    content={cleanEventText(event.message)}
                                    className="p-0 text-primary"
                                  />
                                  <div className="flex space-x-1">
                                    <div className="h-1 w-1 animate-bounce rounded-full bg-slate-600" />
                                    <div
                                      className="h-1 w-1 animate-bounce rounded-full bg-slate-600"
                                      style={{ animationDelay: "0.1s" }}
                                    />
                                    <div
                                      className="h-1 w-1 animate-bounce rounded-full bg-slate-600"
                                      style={{ animationDelay: "0.2s" }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <MarkdownRenderer
                                  content={cleanEventText(event.message)}
                                  className="p-0 text-primary"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-6">
              {artifacts.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-6 w-fit rounded-3xl bg-secondary p-6">
                    <FileText className="size-10 text-primary/70" />
                  </div>
                  <p className="mb-3 text-lg font-medium text-primary">
                    No artifacts yet
                  </p>
                  <p className="text-sm text-primary/60">
                    Artifacts will appear here when generated
                  </p>
                </div>
              ) : (
                artifacts.map((artifact) => (
                  <div
                    key={artifact.artifact_id}
                    id={`artifact-${artifact.artifact_id}`}
                    className="animate-fade-in rounded-lg border bg-card p-4"
                  >
                    <ArtifactRenderer
                      artifact={{
                        id: artifact.artifact_id,
                        name: artifact.name,
                        description: artifact.description,
                        format_type: artifact.format_type,
                        data: artifact.data,
                        timestamp: artifact.timestamp,
                        metadata: artifact.metadata,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default EventsPanel;

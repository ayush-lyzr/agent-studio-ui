import React, { useRef, useEffect, useState } from "react";
import {
  Activity,
  Bot,
  ChevronDown,
  Wrench,
  Code,
  Search,
  FileText,
  Database,
  AlertCircle,
  MessageCircle,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import { WebSocketMessage } from "@/types/chat";
import useStore from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ActivityLogProps {
  trace_id: string;
  log_id: string;
  run_id: string;
}

const ActivityTab: React.FC<ActivityLogProps> = ({
  trace_id,
  log_id,
  run_id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const { api_key } = useStore();
  const [messages, setMessages] = useState<any[]>([]);

  const { mutateAsync: fetchActivities } = useMutation({
    mutationKey: ["getTrace"],
    mutationFn: () =>
      axios.get(
        `/ops/activities?trace_id=${trace_id}&run_id=${run_id}&log_id=${log_id}`,
        {
          headers: {
            "x-api-key": api_key,
          },
        },
      ),
    onSuccess: (response) => {
      setMessages(response.data);
    },
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const [filteredMessages, setFileteredMessages] = useState(
    showDebugLogs
      ? messages
      : messages.filter((message) => {
          // For new format messages, check the level property
          if (message.level) {
            return message.level.toUpperCase() === "INFO";
          }
          // For legacy messages without level, show all
          return true;
        }),
  );

  useEffect(() => {
    scrollToBottom();

    if (messages.length > 0) {
      const newMessage = messages.at(-1);

      if (showDebugLogs && newMessage) {
        setFileteredMessages((prevMessages: WebSocketMessage[]) => [
          ...prevMessages,
          newMessage,
        ]);
      } else if (!showDebugLogs && newMessage?.level == "info") {
        setFileteredMessages((prevMessages: WebSocketMessage[]) => [
          ...prevMessages,
          newMessage,
        ]);
      }
    }
  }, [messages]);

  useEffect(() => {
    const filterMessages = () => {
      return showDebugLogs
        ? messages
        : messages.filter((message) => {
            // For new format messages, check the level property
            if (message.level) {
              return (
                message.level == "info" ||
                message.level == "error" ||
                message.level == "warn"
              );
            }
            // For legacy messages without level, show all
            return true;
          });
    };
    setFileteredMessages(() => filterMessages());
  }, [showDebugLogs]);
  const isMarkdown = (text: string): boolean => {
    if (!text || typeof text !== "string") return false;

    const markdownPatterns = [
      /^#\s+/,
      /\*\*.*\*\*/,
      /\*.*\*/,
      /`.*`/,
      /```[\s\S]*```/,
      /\[.*\]\(.*\)/,
      /^\s*-\s+/,
      /^\s*\d+\.\s+/,
      /^\s*>\s+/,
      /\|.*\|.*\|/,
    ];
    return markdownPatterns.some((pattern) => pattern.test(text));
  };

  const formatJSONResponse = (data: any) => {
    try {
      if (typeof data === "string") {
        return JSON.stringify(JSON.parse(data), null, 2);
      } else {
        return JSON.stringify(data, null, 2);
      }
    } catch (e) {
      return typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
  };

  const renderContent = (content: any) => {
    if (!content)
      return <p className="italic text-muted-foreground">No content</p>;

    if (
      Array.isArray(content) &&
      content.length > 0 &&
      content[0].role &&
      content[0].content_preview
    ) {
      // Handle retrieved_messages array display

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5">
            <h4 className="text-sm font-medium text-foreground">
              Chat History
            </h4>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium">
              {content.length} messages
            </span>
          </div>
          <div className="rounded-md bg-muted/10 p-2 text-xs text-muted-foreground">
            <span className="italic">
              Note: The messages shown here are previews from the memory system
              and may be truncated.
            </span>
          </div>
          <div
            className="max-h-[400px] divide-y divide-muted/30 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(156, 163, 175, 0.2) transparent",
            }}
          >
            {content.map((msg: any, index: number) => (
              <div key={index} className="py-3 first:pt-1 last:pb-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <div
                    className={`
                    rounded-full px-2 py-0.5 text-xs font-medium 
                    ${
                      msg.role === "user"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    }
                  `}
                  >
                    {msg.role}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {msg.content_length} characters
                  </div>
                  {msg.content_length > msg.content_preview.length && (
                    <span className="rounded-sm bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                      Preview
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-line break-words pl-1 font-mono text-sm text-foreground/80">
                  {msg.content_preview}
                  {msg.content_length > msg.content_preview.length && (
                    <span className="ml-1 text-xs italic text-muted-foreground">
                      (truncated)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof content !== "string") {
      return (
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
          {formatJSONResponse(content)}
        </pre>
      );
    }

    if (isMarkdown(content)) {
      return (
        <div className="markdown-content overflow-x-auto whitespace-pre-wrap">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    return (
      <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
        {content}
      </pre>
    );
  };

  const renderContentV2 = (message: any) => {
    if (!message)
      return <p className="italic text-muted-foreground">No content</p>;

    const { data, message: userMessage } = message;
    console.log("User Message", userMessage);
    console.log("Data", data);

    return (
      <div className="space-y-3">
        {Array.isArray(data) &&
          data.map((msg: any, index: number) => (
            <div key={index} className="py-3 first:pt-1 last:pb-1">
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className={`
                    rounded-full px-2 py-0.5 text-xs font-medium 
                    ${
                      msg.role === "user"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    }
                  `}
                >
                  {msg.role}
                </div>
                <div className="text-xs text-muted-foreground">
                  {msg.content_length} characters
                </div>
                {msg.content_length > msg.content_preview.length && (
                  <span className="rounded-sm bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                    Preview
                  </span>
                )}
              </div>
              <div className="whitespace-pre-line break-words pl-1 font-mono text-sm text-foreground/80">
                {msg.content_preview}
                {msg.content_length > msg.content_preview.length && (
                  <span className="ml-1 text-xs italic text-muted-foreground">
                    (truncated)
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const getIconForEventType = (eventType: string, functionName?: string) => {
    // Handle new format first
    if (eventType.includes("memory")) {
      return <Database className="h-4 w-4" />;
    }
    if (eventType.includes("llm") || eventType.includes("chat")) {
      return <MessageCircle className="h-4 w-4" />;
    }
    if (eventType.includes("tool") || eventType.includes("agent")) {
      return <Bot className="h-4 w-4" />;
    }
    if (eventType.includes("search")) {
      return <Search className="h-4 w-4" />;
    }
    if (eventType.includes("document") || eventType.includes("file")) {
      return <FileText className="h-4 w-4" />;
    }
    if (eventType.includes("error") || eventType.includes("fail")) {
      return <AlertCircle className="h-4 w-4" />;
    }
    if (eventType.includes("function") || eventType.includes("call")) {
      return <Code className="h-4 w-4" />;
    }

    // Legacy format handling
    switch (eventType) {
      case "llm_response":
        return <MessageCircle className="h-4 w-4" />;
      case "tool_response":
        if (functionName === "agent_tool") return <Bot className="h-4 w-4" />;
        return <Wrench className="h-4 w-4" />;
      case "function_call":
        return <Code className="h-4 w-4" />;
      case "search_query":
        return <Search className="h-4 w-4" />;
      case "data_retrieval":
      case "FeatureType.SHORT_TERM_MEMORY_database_session_retrieved":
      case "FeatureType.SHORT_TERM_MEMORY_messages_retrieved":
        return <Database className="h-4 w-4" />;
      case "document_processing":
        return <FileText className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getBadgeColorForLevel = (level?: string) => {
    if (!level) return "bg-primary/10 text-primary";

    switch (level.toUpperCase()) {
      case "INFO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ERROR":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    if (!status)
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";

    switch (status?.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getBadgeColorForEventType = (eventType: string) => {
    switch (eventType) {
      case "llm_response":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "tool_response":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "function_call":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "FeatureType.SHORT_TERM_MEMORY_database_session_retrieved":
      case "FeatureType.SHORT_TERM_MEMORY_messages_retrieved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== "object") {
      return <p className="italic text-muted-foreground">No metadata</p>;
    }

    const entries = Object.entries(metadata);
    if (entries.length === 0) {
      return <p className="italic text-muted-foreground">No metadata</p>;
    }

    return (
      <div className="space-y-1">
        {entries.map(([key, value], index) => (
          <div key={index} className="flex items-start gap-1">
            <span className="text-xs font-medium text-foreground">{key}:</span>
            <span className="text-xs text-muted-foreground">
              {typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : `"${String(value)}"`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderDataContent = (data: any) => {
    if (!data) {
      return <p className="italic text-muted-foreground">No data</p>;
    }

    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <p className="italic text-muted-foreground">Empty array</p>;
      }

      // Check if it's an array of objects (like retrieved messages)
      if (typeof data[0] === "object" && data[0] !== null) {
        return (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className="rounded-md border border-muted/30 bg-background/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">
                    Item {index + 1}
                  </span>
                  <span className="rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                    {Object.keys(item).length} fields
                  </span>
                </div>
                <div className="space-y-1">
                  {Object.entries(item).map(([key, value], keyIndex) => (
                    <div key={keyIndex} className="flex items-start gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {key}:
                      </span>
                      <span className="line-clamp-3 text-xs text-muted-foreground">
                        {typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : `${String(value)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        // Array of primitives
        return (
          <div className="space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="text-xs font-medium text-foreground">
                  [{index}]:
                </span>
                <span className="text-xs text-muted-foreground">
                  {typeof item === "object" && item !== null
                    ? JSON.stringify(item)
                    : `"${String(item)}"`}
                </span>
              </div>
            ))}
          </div>
        );
      }
    }

    // Handle single object
    if (typeof data === "object" && data !== null) {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        return <p className="italic text-muted-foreground">Empty object</p>;
      }

      return (
        <div className="space-y-1">
          {entries.map(([key, value], index) => (
            <div key={index} className="flex items-start gap-1">
              <span className="text-xs font-medium text-foreground">
                {key}:
              </span>
              <span className="text-xs text-muted-foreground">
                {typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : `"${String(value)}"`}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Handle primitives
    return (
      <span className="text-xs text-muted-foreground">
        {`"${String(data)}"`}
      </span>
    );
  };

  const renderMessage = (message: WebSocketMessage) => {
    const {
      event_type,
      message: userMessage,
      feature,
      status,
      level,
      data,
      metadata,
    } = message;

    const icon = getIconForEventType(event_type, message.function_name);

    // Check if this is new format or legacy format
    const isNewFormat = !!message.level;

    const badgeClass = isNewFormat
      ? getBadgeColorForLevel(level)
      : getBadgeColorForEventType(event_type);

    const statusBadgeClass = getStatusBadgeColor(status);

    console.log("Message", message);

    // Handle content for new format
    let responseContent: any = null;
    if (isNewFormat) {
      // For new format, we'll show data and metadata in collapsible content
      const hasData =
        data &&
        (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
      const hasMetadata = metadata && Object.keys(metadata).length > 0;
      const hasUserMessage = userMessage && userMessage.trim().length > 0;

      if (hasData || hasMetadata || hasUserMessage) {
        responseContent = { data, metadata, userMessage };
      }
    }
    //  else {
    //   // Legacy format handling
    //   if (
    //     (event_type ===
    //       "FeatureType.SHORT_TERM_MEMORY_database_session_retrieved" ||
    //       event_type === "FeatureType.SHORT_TERM_MEMORY_messages_retrieved") &&
    //     message.retrieved_messages
    //   ) {
    //     responseContent = message.retrieved_messages;
    //   } else if (
    //     event_type === "tool_response" &&
    //     message.function_name === "agent_tool" &&
    //     message.response
    //   ) {
    //     try {
    //       const parsedResponse =
    //         typeof message.response === "string"
    //           ? JSON.parse(message.response)
    //           : message.response;
    //       responseContent = {
    //         ...message,
    //         parsedResponse,
    //       };
    //     } catch (error) {
    //       responseContent = message;
    //     }
    //   } else {
    //     responseContent = message;
    //   }
    // }

    // Check if there's no meaningful content to display
    const hasNoContent = !responseContent;

    if (hasNoContent) {
      return (
        <>
          <Card className="border-muted bg-background/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
                  {icon}
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${badgeClass}`}
                >
                  {feature}
                </span>
                {isNewFormat && status && (
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${statusBadgeClass}`}
                  >
                    {status}
                  </span>
                )}
              </div>
              <span className="text-xs italic text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
              </span>
            </CardHeader>
          </Card>
        </>
      );
    }

    return (
      <>
        <Collapsible defaultOpen>
          <Card className="border-muted bg-background/95 shadow-md">
            <CardHeader className="flex flex-col space-y-3 p-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 min-w-8 flex-shrink-0 items-center justify-center rounded-full border bg-muted">
                    {icon}
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${badgeClass}`}
                  >
                    {feature}
                  </span>
                  {isNewFormat && status && (
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${statusBadgeClass}`}
                    >
                      {status}
                    </span>
                  )}
                </div>
                <CollapsibleTrigger className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-muted">
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </div>

              {/* Display event type and level for new format - aligned to left */}
              {isNewFormat && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="min-w-12 text-xs font-medium text-foreground">
                      Event:
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event_type.replace(/FeatureType./g, "")}
                    </span>
                  </div>
                  {userMessage && (
                    <div className="flex items-center gap-2">
                      <span className="min-w-12 text-xs font-medium text-foreground">
                        Message:
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {userMessage}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy format event display */}
              {!isNewFormat && (
                <div className="pl-10 pr-2 text-xs">
                  <div className="rounded-md border border-muted/30 bg-accent px-3 py-1.5 text-foreground/80">
                    {event_type}
                  </div>
                  {status && (
                    <div className="mt-1 rounded-md border border-muted/30 bg-accent px-3 py-1.5 text-foreground/80">
                      {status}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="max-w-full p-4 pt-0">
                {isNewFormat &&
                responseContent &&
                typeof responseContent === "object" &&
                "userMessage" in responseContent ? (
                  <>
                    {/* User Message for new format */}

                    {/* Data Section for new format */}
                    {responseContent.data &&
                      (Array.isArray(responseContent.data)
                        ? responseContent.data.length > 0
                        : Object.keys(responseContent.data).length > 0) && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-sm font-semibold text-foreground">
                            Data
                          </h4>
                          <div className="overflow-x-auto rounded-md border border-muted/30 bg-accent p-3 text-xs">
                            {renderDataContent(responseContent.data)}
                          </div>
                        </div>
                      )}

                    {/* Metadata Section for new format */}
                    {responseContent.metadata &&
                      Object.keys(responseContent.metadata).length > 0 && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-sm font-semibold text-foreground">
                            Metadata
                          </h4>
                          <div className="overflow-x-auto rounded-md border border-muted/30 bg-accent p-3 text-xs">
                            {renderMetadata(responseContent.metadata)}
                          </div>
                        </div>
                      )}

                    {/* Timestamp for new format */}
                    {message.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Timestamp:</span>{" "}
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Legacy format content */}
                    <div className="overflow-x-auto rounded-md bg-accent p-3 text-xs">
                      {renderContentV2(message)}
                    </div>

                    {message.arguments &&
                      message.arguments !== responseContent && (
                        <div className="mt-2">
                          <h4 className="mb-1 text-xs font-semibold">
                            Arguments:
                          </h4>
                          <div className="overflow-x-auto rounded-md bg-accent p-3 text-xs">
                            {renderContent(message.arguments)}
                          </div>
                        </div>
                      )}
                    {userMessage && (
                      <div className="mt-2">
                        <h4 className="mb-1 text-xs font-semibold">Message:</h4>
                        <div className="overflow-x-auto rounded-md bg-accent p-3 text-xs">
                          {userMessage}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-[calc(100vh-170px)] flex-col items-center justify-center space-y-4 rounded-md border border-muted bg-background p-4">
        <div className="rounded-full bg-accent p-3">
          <Activity className="size-6 text-muted-foreground" />
        </div>
        <p className="text-center text-muted-foreground">
          Start an inference to track activity
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-170px)] flex-col">
      {/* Filter Controls */}
      <div className="mb-4 flex items-center justify-between rounded-md border border-muted bg-background/95 p-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-debug-logs"
            checked={showDebugLogs}
            onCheckedChange={setShowDebugLogs}
          />
          <Label htmlFor="show-debug-logs" className="text-sm font-medium">
            Show debug logs
          </Label>
        </div>
        <div className="text-xs text-muted-foreground">
          {showDebugLogs
            ? `Showing all ${messages.length} logs`
            : `Showing ${filteredMessages.length} info logs of ${messages.length} total`}
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-md border border-muted bg-background p-4"
      >
        {filteredMessages.map((message, index) => (
          <div key={`msg-${index}-${message.event_type}-${Date.now()}`}>
            {renderMessage(message)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ActivityTab;

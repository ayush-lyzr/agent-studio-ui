import React, { useRef, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import MarkdownRenderer from "@/components/custom/markdown";

interface WebSocketMessage {
  event_type: string;
  function_name?: string;
  response?: string | any;
  arguments?: {
    name?: string;
    [key: string]: any;
  };
  timestamp?: string;
  run_id?: string;
  session_id?: string;
  user_id?: string;
  agent_id?: string;
  message_count?: number;
  retrieved_messages?: Array<{
    role: string;
    content_length: number;
    content_preview: string;
    content?: string; // Full content may be available in some cases
  }>;
}

interface ActivityLogProps {
  messages: WebSocketMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WebSocketMessage[]>>;
  isProcessing?: boolean;
  addEvent?: (event: WebSocketMessage) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({
  messages,
  isProcessing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                    <span
                      className="ml-1 text-xs italic text-muted-foreground"
                      style={{ wordWrap: "break-word" }}
                    >
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
        <div
          className="max-h-[20rem] font-mono text-xs"
          style={{
            width: "100%",
            overflow: "auto",
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily:
                "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }}
          >
            {formatJSONResponse(content)}
          </pre>
        </div>
      );
    }

    if (isMarkdown(content)) {
      return (
        <div className="markdown-content overflow-x-auto whitespace-pre-wrap">
          <MarkdownRenderer content={content} maxWidth="w-full" />
        </div>
      );
    }

    return (
      <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
        {content}
      </pre>
    );
  };

  const getIconForEventType = (eventType: string, functionName?: string) => {
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
      case "database_session_retrieved":
      case "messages_retrieved":
        return <Database className="h-4 w-4" />;
      case "document_processing":
        return <FileText className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventTitle = (message: WebSocketMessage) => {
    const { event_type, function_name, arguments: args } = message;

    if (event_type === "llm_response" && function_name === "llm_chat") {
      return "Manager Agent";
    }

    if (event_type === "tool_response" && function_name === "agent_tool") {
      return args?.name || "Agent";
    }

    if (
      event_type === "database_session_retrieved" ||
      event_type === "messages_retrieved"
    ) {
      return "Short-Term Memory";
    }

    if (function_name) {
      return `${function_name
        .replace(/composio/gi, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())}`;
    }

    return event_type
      .replace(/composio/gi, "")
      .replace(/FeatureType./g, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
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
      case "database_session_retrieved":
      case "messages_retrieved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const renderMessage = (message: WebSocketMessage, isLast: boolean) => {
    const { event_type } = message;

    const icon = getIconForEventType(event_type, message.function_name);
    const title = getEventTitle(message);
    const badgeClass = getBadgeColorForEventType(event_type);

    let responseContent;

    // Special handling for memory events
    if (
      (event_type === "database_session_retrieved" ||
        event_type === "messages_retrieved") &&
      message.retrieved_messages
    ) {
      responseContent = message.retrieved_messages;
    }
    // For all other events, show the entire message object
    else {
      // First handle tool_response with agent_tool special case
      if (
        event_type === "tool_response" &&
        message.function_name === "agent_tool" &&
        message.response
      ) {
        try {
          const parsedResponse =
            typeof message.response === "string"
              ? JSON.parse(message.response)
              : message.response;

          // Keep the special handling for agent_tool but include full message
          responseContent = {
            ...message,
            parsedResponse,
          };
        } catch (error) {
          responseContent = message;
        }
      } else {
        // For all other events, show the entire message object
        responseContent = message;
      }
    }

    // Check if there's no meaningful content to display
    const hasNoContent =
      responseContent === undefined ||
      responseContent === null ||
      (Array.isArray(responseContent) && responseContent.length === 0);

    if (hasNoContent) {
      return (
        <>
          <Card className="border-muted bg-background/95 hover:translate-y-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
                  {icon}
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${badgeClass}`}
                >
                  {title}
                </span>
              </div>
              <span className="text-xs italic text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
              </span>
            </CardHeader>
          </Card>
          {isLast && isProcessing && (
            <div className="mt-2 flex items-center gap-2 p-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <Collapsible defaultOpen>
          <Card className="border-muted bg-background/95 hover:translate-y-0">
            <CardHeader className="flex flex-col space-y-2 p-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 min-w-8 flex-shrink-0 items-center justify-center rounded-full border bg-muted">
                    {icon}
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${badgeClass}`}
                  >
                    {title}
                  </span>
                </div>
                <CollapsibleTrigger className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-muted">
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </div>

              {/* Display event type on its own line with full width */}
              <div className="pl-10 pr-2 text-xs">
                <div className="rounded-md border border-muted/30 bg-accent px-3 py-1.5 text-foreground/80">
                  {event_type}
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="max-w-full p-4 pt-0">
                <div className="overflow-x-auto rounded-md bg-accent p-3 text-xs">
                  {renderContent(responseContent)}
                </div>

                {message.arguments && message.arguments !== responseContent && (
                  <div className="mt-2">
                    <h4 className="mb-1 text-xs font-semibold">Arguments:</h4>
                    <div className="overflow-x-auto rounded-md bg-accent p-3 text-xs">
                      {renderContent(message.arguments)}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        {isLast && isProcessing && (
          <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
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
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-170px)] space-y-4 overflow-y-auto rounded-md border border-muted bg-background p-4"
    >
      {messages.map((message, index) => (
        <div key={`msg-${index}-${message.event_type}-${message.timestamp}`}>
          {renderMessage(message, index === messages.length - 1)}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ActivityLog;

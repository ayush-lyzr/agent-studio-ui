import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Wrench,
  BookOpen,
  Play,
  CircleStop,
  MessageCircle,
  ChevronRight,
  User,
  Sparkles,
  Info,
  Clock,
  Tag,
  Layers,
  FileText,
  Zap,
} from "lucide-react";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import { CREDITS_DIVISOR } from "@/lib/constants";

interface LogsContentProps {
  activities: any[];
  isFetchingActivities: boolean;
  selectedSpanId?: string;
}

const LogsContent: React.FC<LogsContentProps> = ({
  activities,
  isFetchingActivities,
  selectedSpanId,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logRefs = useRef<Record<string, HTMLDivElement>>({});
  const [expandedActivities, setExpandedActivities] = useState<
    Record<string, boolean>
  >({});

  const activityRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Expand and scroll to selected span when selectedSpanId changes
  useEffect(() => {
    if (!selectedSpanId) return;

    // First, expand the selected activity
    setExpandedActivities((prev) => ({
      ...prev,
      [selectedSpanId]: true,
    }));

    // Then scroll after a delay to ensure the DOM has updated
    const timeoutId = setTimeout(() => {
      const element = activityRefs.current[selectedSpanId];
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [selectedSpanId]);


  const formatJSONResponse = (data: any) => {
    try {
      if (typeof data === "string") {
        return JSON.stringify(JSON.parse(data), null, 2);
      } else {
        return JSON.stringify(data, null, 2);
      }
    } catch {
      return typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
  };

  // Helper to render attributes in a user-friendly way
  const renderAttributes = (attributes: Record<string, any>) => {
    const entries = Object.entries(attributes);
    if (entries.length === 0) return null;

    const inputKey = entries.find(
      ([key]) => key === "input" || key === "user_message" || key === "query"
    );
    const outputKey = entries.find(
      ([key]) => key === "output" || key === "agent_response" || key === "response"
    );
    const otherEntries = entries.filter(
      ([key]) =>
        ![
          "input",
          "output",
          "user_message",
          "query",
          "agent_response",
          "response",
        ].includes(key)
    );

    return (
      <div className="space-y-4">
        {inputKey && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-muted/30 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/50">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Input
              </span>
            </div>
            <div className="p-3">
              <MarkdownRenderer
                content={String(inputKey[1])}
                className="text-sm leading-relaxed"
              />
            </div>
          </motion.div>
        )}

        {outputKey && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-lg border border-border bg-muted/30 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/50">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-success/10">
                <Sparkles className="h-3 w-3 text-success" />
              </div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Output
              </span>
            </div>
            <div className="p-3 max-h-60 overflow-y-auto">
              <MarkdownRenderer
                content={String(outputKey[1])}
                className="text-sm leading-relaxed"
              />
            </div>
          </motion.div>
        )}

        {otherEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-border bg-muted/20 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/30">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Attributes
              </span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {otherEntries.map(([key, value]) => {
                  const displayKey = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  let displayValue: React.ReactNode;
                  if (typeof value === "boolean") {
                    displayValue = (
                      <Badge
                        variant={value ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {value ? "Yes" : "No"}
                      </Badge>
                    );
                  } else if (typeof value === "number") {
                    displayValue = (
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {value.toLocaleString()}
                      </span>
                    );
                  } else if (typeof value === "object" && value !== null) {
                    displayValue = (
                      <pre className="mt-1 max-h-24 overflow-auto rounded-md bg-muted/50 p-2 text-[10px] font-mono border border-border/30">
                        {formatJSONResponse(value)}
                      </pre>
                    );
                  } else {
                    displayValue = (
                      <span className="text-xs break-words">{String(value)}</span>
                    );
                  }

                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {displayKey}
                      </span>
                      {displayValue}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Utility: Render log details
  const renderLogDetails = (log: any, index: number) => {
    if ((log.timestamp || log.name) && log.attributes) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {log.timestamp && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(log.timestamp).toLocaleString()}
              </div>
            )}
            {log.name && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wider"
              >
                {log.name}
              </Badge>
            )}
          </div>

          {log.attributes && renderAttributes(log.attributes)}
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className="space-y-4"
      >
        {/* Message section */}
        {log.message && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/20">
              <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Message
              </span>
            </div>
            <div className="p-3">
              <MarkdownRenderer
                content={log.message}
                className="text-sm leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Feature and Event type */}
        {(log.feature || log.event_type) && (
          <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/20 border border-border/30">
            {log.feature && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Feature
                </span>
                <span className="text-sm font-semibold">{log.feature}</span>
              </div>
            )}
            {log.event_type && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Event Type
                </span>
                <Badge variant="secondary" className="text-[10px] w-fit">
                  {log.event_type}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Events list */}
        {Array.isArray(log.events) && log.events.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Events
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {log.events.length}
              </Badge>
            </div>
            <div className="divide-y divide-border/30">
              {log.events.map((event: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 space-y-2 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {event.name && (
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {event.name}
                      </Badge>
                    )}
                    {event.timestamp && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {event.attributes && renderAttributes(event.attributes)}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Data section */}
        {log.data && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/20">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Data
              </span>
            </div>
            <div className="p-3">
              {renderAttributes(
                typeof log.data === "object" ? log.data : { value: log.data }
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const getFeatureIcon = (feature: string) => {
    const iconClass = "h-4 w-4";
    switch (feature) {
      case "memory":
        return <Database className={cn(iconClass, "text-accent-foreground")} />;
      case "tool_calling":
        return <Wrench className={cn(iconClass, "text-warning")} />;
      case "knowledge_base":
        return <BookOpen className={cn(iconClass, "text-success")} />;
      case "__start__":
        return <Play className={cn(iconClass, "text-success")} />;
      case "__end__":
        return <CircleStop className={cn(iconClass, "text-destructive")} />;
      case "llm_response":
        return <Sparkles className={cn(iconClass, "text-primary")} />;
      default:
        return <Zap className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getFeatureColor = (feature: string) => {
    switch (feature) {
      case "memory":
        return "border-accent/30 bg-accent/5";
      case "tool_calling":
        return "border-warning/30 bg-warning-background";
      case "knowledge_base":
        return "border-success/30 bg-success-background";
      case "__start__":
        return "border-success/30 bg-success-background";
      case "__end__":
        return "border-destructive/30 bg-destructive/5";
      case "llm_response":
        return "border-primary/30 bg-primary/5";
      default:
        return "border-border bg-muted/10";
    }
  };

  const setLogRef = useCallback(
    (logId: string, element: HTMLDivElement | null) => {
      if (element) {
        logRefs.current[logId] = element;
      } else {
        delete logRefs.current[logId];
      }
    },
    []
  );

  const toggleActivity = useCallback((activityKey: string) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [activityKey]: !(prev[activityKey] ?? true),
    }));
  }, []);

  return (
    <div className="h-full overflow-y-auto" ref={scrollAreaRef}>
      <div className="space-y-3 p-2">
        {isFetchingActivities ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-12"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Loading activities...
            </span>
          </motion.div>
        ) : activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 rounded-2xl bg-muted/30 p-5 border border-border/30">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">
              No activities found for this run
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Activities will appear here once available
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activities.map((activity: any, activityIndex: number) => {
              const activityKey = activity.span_id || activity.id;
              const isSelected = selectedSpanId === activityKey;
              // Only expand the selected activity by default, others are collapsed
              const isExpanded = expandedActivities[activityKey] ?? isSelected;
              const logs = activity.events ?? activity.children ?? [];

              return (
                <motion.div
                  key={activityKey ?? activity.span_name}
                  ref={(el) => {
                    if (activityKey) activityRefs.current[activityKey] = el;
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: activityIndex * 0.03 }}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all duration-200",
                    getFeatureColor(activity.span_name),
                    isSelected && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  )}
                >
                  {/* Activity Header */}
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors",
                      "hover:bg-muted/30"
                    )}
                    onClick={() => toggleActivity(activityKey)}
                  >
                    {/* Expand/Collapse Button */}
                    <motion.button
                      type="button"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </motion.button>

                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                      {getFeatureIcon(activity.span_name)}
                    </div>

                    {/* Name and Badge */}
                    <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold capitalize truncate">
                          {activity?.span_name?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] font-semibold tabular-nums"
                      >
                        {activity.log_count ?? (Array.isArray(logs) ? logs.length : 0)} logs
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/30">
                          {/* Logs */}
                          {logs.length === 0 ? null : (
                            <div className="divide-y divide-border/20">
                              {logs.map((log: any, logIdx: number) => {
                                const logId = `${activityKey}-${logIdx}`;

                                return (
                                  <div
                                    key={logId}
                                    ref={(el) => setLogRef(logId, el)}
                                    data-log-id={logId}
                                    className="p-4 bg-background/40"
                                  >
                                    {renderLogDetails(log, logIdx)}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Tags Section */}
                          {Object.keys(activity.tags || {}).length > 0 && (
                            <div className="border-t border-border/30 p-4 bg-background/60 space-y-4">
                              {/* Input section */}
                              {(activity.tags.input ||
                                activity.tags.user_message ||
                                activity.tags.query) && (
                                  <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/50">
                                      <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                        <User className="h-3 w-3 text-primary" />
                                      </div>
                                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                        Input
                                      </span>
                                    </div>
                                    <div className="p-3">
                                      <MarkdownRenderer
                                        content={
                                          activity.tags.user_message ||
                                          activity.tags.input ||
                                          activity.tags.query
                                        }
                                        className="text-sm leading-relaxed"
                                      />
                                    </div>
                                  </div>
                                )}

                              {/* Output section */}
                              {(activity.tags.output ||
                                activity.tags.agent_response ||
                                activity.tags.response) && (
                                  <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/50">
                                      <div className="flex h-5 w-5 items-center justify-center rounded bg-success/10">
                                        <Sparkles className="h-3 w-3 text-success" />
                                      </div>
                                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                        Output
                                      </span>
                                    </div>
                                    <div className="p-3 max-h-72 overflow-y-auto">
                                      <MarkdownRenderer
                                        content={
                                          activity.tags.agent_response ||
                                          activity.tags.output ||
                                          activity.tags.response
                                        }
                                        className="text-sm leading-relaxed"
                                      />
                                    </div>
                                  </div>
                                )}

                              {/* Other tags */}
                              {(() => {
                                const excludedKeys = [
                                  "input",
                                  "output",
                                  "user_message",
                                  "query",
                                  "agent_response",
                                  "response",
                                  // Hide exception details
                                  "exception.escaped",
                                  "exception.message",
                                  "exception.stacktrace",
                                  "exception.type",
                                ];
                                const otherTags = Object.entries(
                                  activity.tags || {}
                                ).filter(([key]) => !excludedKeys.includes(key));

                                if (otherTags.length === 0) return null;

                                return (
                                  <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/30">
                                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Metadata
                                      </span>
                                    </div>
                                    <div className="p-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        {otherTags.map(([key, value]) => {
                                          const displayKey = key
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            );

                                          // Action cost extract and updated as per credits
                                          const rawValue =
                                            key === "action_cost"
                                              ? typeof value === "number"
                                                ? value / CREDITS_DIVISOR
                                                : typeof value === "string" &&
                                                    !Number.isNaN(Number(value))
                                                  ? Number(value) / CREDITS_DIVISOR
                                                  : value
                                              : value;  

                                          let displayValue: React.ReactNode;
                                          if (typeof rawValue === "boolean") {
                                            displayValue = (
                                              <Badge
                                                variant={
                                                  rawValue ? "success" : "secondary"
                                                }
                                                className="text-[10px]"
                                              >
                                                {rawValue ? "Yes" : "No"}
                                              </Badge>
                                            );
                                          } else if (typeof rawValue === "number") {
                                            displayValue = (
                                              <span className="font-mono text-xs tabular-nums">
                                                {rawValue.toLocaleString()}
                                              </span>
                                            );
                                          } else if (
                                            typeof rawValue === "object" &&
                                            rawValue !== null
                                          ) {
                                            displayValue = (
                                              <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-[10px] font-mono border border-border/30">
                                                {formatJSONResponse(rawValue)}
                                              </pre>
                                            );
                                          } else {
                                            displayValue = (
                                              <span className="text-xs break-words">
                                                {String(rawValue)}
                                              </span>
                                            );
                                          }

                                          return (
                                            <div
                                              key={key}
                                              className="flex flex-col gap-1"
                                            >
                                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                {displayKey}
                                              </span>
                                              {displayValue}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LogsContent;

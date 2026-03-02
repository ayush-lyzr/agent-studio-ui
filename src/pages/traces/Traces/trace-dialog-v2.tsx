import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  Bot,
  Database,
  Coins,
  BookOpen,
  Play,
  MessageCircle,
  CircleStop,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import RunDetailsContent from "./components/RunDetailsContent";
import MetadataDetailsContent from "./components/MetadataDetailsContent";
import LogsContent from "./components/LogsContent";
import { AgentRun, DialogProps } from "./types/trace";

const TraceDialogV2: React.FC<DialogProps> = ({ trace_id, runs }) => {
  const { api_key: apiKey } = useStore((state) => state);
  const [selectedRunId, setSelectedRunId] = useState<string>(
    runs?.length > 0 ? runs[0][0] : "",
  );
  const [agentInferences, setAgentInferences] = useState<AgentRun[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [collapsedAgents, setCollapsedAgents] = useState<Set<string>>(
    new Set(),
  );
  const [nodeActivities, setNodeActivities] = useState<Record<string, any[]>>(
    {},
  );
  const [loadingActivities, setLoadingActivities] = useState<Set<string>>(
    new Set(),
  );
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(),
  );
  const [activityLogs, setActivityLogs] = useState<Record<string, any[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Set<string>>(new Set());
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("run");

  const { isPending: isFetchingTrace, mutateAsync: fetchTrace } = useMutation({
    mutationKey: ["getTrace"],
    mutationFn: () =>
      axios.get(`/ops/trace/${trace_id}`, {
        headers: {
          "x-api-key": apiKey,
        },
      }),
    onSuccess: (res) => {
      setAgentInferences(res.data);
      if (res.data.length > 0) {
        setSelectedRunId(res.data[0].log_id);
        setExpandedNodes(new Set([res.data[0].log_id]));

        // Fetch activities for the first run
        setLoadingActivities((prev) => new Set([...prev, res.data[0].log_id]));

        fetchActivities({
          log_id: res.data[0].log_id,
          run_id: res.data[0].run_id,
          trace_id: res.data[0].trace_id,
        }).catch((error) => {
          console.error("Error fetching initial activities:", error);
          setLoadingActivities((prev) => {
            const newSet = new Set(prev);
            newSet.delete(res.data[0].log_id);
            return newSet;
          });
        });
      }
    },
  });

  const { mutateAsync: fetchActivities } = useMutation({
    mutationKey: ["getActivities"],
    mutationFn: ({
      log_id,
      run_id,
      trace_id,
    }: {
      log_id: string;
      run_id: string;
      trace_id: string;
    }) =>
      axios.get(`/ops/grouped-logs`, {
        params: {
          log_id,
          run_id,
          trace_id,
        },
        headers: {
          "x-api-key": apiKey,
        },
      }),
    onSuccess: (res, variables) => {
      setNodeActivities((prev) => ({
        ...prev,
        [variables.log_id]: res.data,
      }));
      setLoadingActivities((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.log_id);
        return newSet;
      });
    },
  });

  const { mutateAsync: fetchLogs } = useMutation({
    mutationKey: ["getLogs"],
    mutationFn: ({
      log_id,
      run_id,
      trace_id,
      feature,
    }: {
      log_id: string;
      run_id: string;
      trace_id: string;
      feature: string;
    }) =>
      axios.get(`/ops/logs`, {
        params: {
          log_id,
          run_id,
          trace_id,
          feature,
        },
        headers: {
          "x-api-key": apiKey,
        },
      }),
    onSuccess: (res, variables) => {
      const activityKey = `${variables.log_id}-${variables.feature}`;
      setActivityLogs((prev) => ({
        ...prev,
        [activityKey]: res.data,
      }));
      setLoadingLogs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activityKey);
        return newSet;
      });
    },
  });

  useEffect(() => {
    fetchTrace();
  }, []);

  // Auto-expand all activities when logs tab is selected
  useEffect(() => {
    const currentSelectedRun = agentInferences.find(
      (run) => run.log_id === selectedRunId,
    );

    if (
      activeTab === "logs" &&
      currentSelectedRun &&
      nodeActivities[currentSelectedRun.log_id]
    ) {
      const activities = nodeActivities[currentSelectedRun.log_id];
      const allActivityKeys = activities.map(
        (activity) => `${currentSelectedRun.log_id}-${activity.feature}`,
      );

      // Expand all activities that aren't already expanded
      const newExpanded = new Set(expandedActivities);
      let hasChanges = false;

      allActivityKeys.forEach((activityKey) => {
        if (!expandedActivities.has(activityKey)) {
          newExpanded.add(activityKey);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setExpandedActivities(newExpanded);

        // Fetch logs for all newly expanded activities
        allActivityKeys.forEach((activityKey) => {
          if (!expandedActivities.has(activityKey)) {
            const activity = activities.find(
              (a) =>
                `${currentSelectedRun.log_id}-${a.feature}` === activityKey,
            );
            if (activity && !activityLogs[activityKey]) {
              setLoadingLogs((prev) => new Set([...prev, activityKey]));
              fetchLogs({
                log_id: currentSelectedRun.log_id,
                run_id: currentSelectedRun.run_id,
                trace_id: currentSelectedRun.trace_id,
                feature: activity.feature,
              }).catch((error) => {
                console.error("Error fetching logs:", error);
                setLoadingLogs((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(activityKey);
                  return newSet;
                });
              });
            }
          }
        });
      }
    }
  }, [
    activeTab,
    selectedRunId,
    agentInferences,
    nodeActivities,
    expandedActivities,
    activityLogs,
    fetchLogs,
  ]);

  const selectedRun = agentInferences.find(
    (run) => run.log_id === selectedRunId,
  );

  const handleNodeSelect = async (run: AgentRun) => {
    setSelectedRunId(run.log_id);

    // Only fetch activities if we don't already have them
    if (!nodeActivities[run.log_id]) {
      setLoadingActivities((prev) => new Set([...prev, run.log_id]));

      try {
        await fetchActivities({
          log_id: run.log_id,
          run_id: run.run_id,
          trace_id: run.trace_id,
        });
      } catch (error) {
        console.error("Error fetching activities:", error);
        setLoadingActivities((prev) => {
          const newSet = new Set(prev);
          newSet.delete(run.log_id);
          return newSet;
        });
      }
    }
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleAgentCollapse = (agentId: string) => {
    const newCollapsed = new Set(collapsedAgents);
    if (newCollapsed.has(agentId)) {
      newCollapsed.delete(agentId);
    } else {
      newCollapsed.add(agentId);
    }
    setCollapsedAgents(newCollapsed);
  };

  const handleActivityClick = async (activity: any, run: AgentRun) => {
    const activityKey = `${run.log_id}-${activity.feature}`;
    const newExpanded = new Set(expandedActivities);

    if (newExpanded.has(activityKey)) {
      newExpanded.delete(activityKey);
    } else {
      newExpanded.add(activityKey);

      // Fetch logs if not already fetched
      if (!activityLogs[activityKey]) {
        setLoadingLogs((prev) => new Set([...prev, activityKey]));

        try {
          await fetchLogs({
            log_id: run.log_id,
            run_id: run.run_id,
            trace_id: run.trace_id,
            feature: activity.feature,
          });
        } catch (error) {
          console.error("Error fetching logs:", error);
          setLoadingLogs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(activityKey);
            return newSet;
          });
        }
      }
    }

    setExpandedActivities(newExpanded);
  };

  const handleLogClick = async (
    activity: any,
    run: AgentRun,
    logIndex: number,
  ) => {
    const activityKey = `${run.log_id}-${activity.feature}`;
    const logId = `${activityKey}-${logIndex}`;

    // Auto-select the run if it's not already selected
    if (selectedRunId !== run.log_id) {
      setSelectedRunId(run.log_id);

      // Fetch activities for this run if not already fetched
      if (!nodeActivities[run.log_id]) {
        setLoadingActivities((prev) => new Set([...prev, run.log_id]));

        try {
          await fetchActivities({
            log_id: run.log_id,
            run_id: run.run_id,
            trace_id: run.trace_id,
          });
        } catch (error) {
          console.error("Error fetching activities:", error);
          setLoadingActivities((prev) => {
            const newSet = new Set(prev);
            newSet.delete(run.log_id);
            return newSet;
          });
        }
      }
    }

    // Switch to logs tab
    setActiveTab("logs");

    // Expand activity if not already expanded
    if (!expandedActivities.has(activityKey)) {
      const newExpanded = new Set(expandedActivities);
      newExpanded.add(activityKey);
      setExpandedActivities(newExpanded);

      // Fetch logs if not already fetched
      if (!activityLogs[activityKey]) {
        setLoadingLogs((prev) => new Set([...prev, activityKey]));

        try {
          await fetchLogs({
            log_id: run.log_id,
            run_id: run.run_id,
            trace_id: run.trace_id,
            feature: activity.feature,
          });
        } catch (error) {
          console.error("Error fetching logs:", error);
          setLoadingLogs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(activityKey);
            return newSet;
          });
        }
      }
    }

    // Highlight the specific log
    setHighlightedLogId(logId);

    // Scroll to log after a short delay to ensure it's rendered
    setTimeout(() => {
      const logElement = document.querySelector(`[data-log-id="${logId}"]`);
      if (logElement) {
        logElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
  };

  return (
    <div className="flex h-[85vh]">
      {/* Left Panel - Waterfall View */}
      <div className="w-80 border-r">
        {/* Waterfall Content */}
        <ScrollArea className="h-full">
          <div className="p-4">
            {isFetchingTrace ? (
              <WaterfallSkeleton />
            ) : (
              <div className="max-h-[calc(85vh-2rem)] space-y-0 overflow-y-auto">
                {/* Agent Runs */}
                {agentInferences.map((run, index) => (
                  <WaterfallNode
                    key={run.log_id}
                    run={run}
                    isSelected={selectedRunId === run.log_id}
                    isExpanded={expandedNodes.has(run.log_id)}
                    isCollapsed={collapsedAgents.has(run.log_id)}
                    onSelect={() => handleNodeSelect(run)}
                    onToggle={() => toggleExpanded(run.log_id)}
                    onToggleCollapse={() => toggleAgentCollapse(run.log_id)}
                    index={index}
                    isTopLevel={true}
                    activities={nodeActivities[run.log_id] || []}
                    isFetchingActivities={loadingActivities.has(run.log_id)}
                    onActivityClick={(activity) =>
                      handleActivityClick(activity, run)
                    }
                    expandedActivities={expandedActivities}
                    activityLogs={activityLogs}
                    loadingLogs={loadingLogs}
                    highlightedLogId={highlightedLogId}
                    onLogClick={handleLogClick}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Details */}
      <div className="flex flex-1 flex-col">
        {/* Tabs Header */}
        <div className="border-b px-6 py-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="run">Run</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="run" className="mt-0">
              <div className="pt-6">
                {isFetchingTrace ? (
                  <DetailsSkeleton />
                ) : selectedRun ? (
                  <RunDetailsContent run={selectedRun} />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Select a run to view details
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="mt-0">
              <div className="pt-6">
                {selectedRun ? (
                  <MetadataDetailsContent run={selectedRun} />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Select a run to view metadata
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <div className="pt-6">
                {selectedRun ? (
                  <LogsContent
                    // run={selectedRun}
                    activities={nodeActivities[selectedRun.log_id] || []}
                    isFetchingActivities={loadingActivities.has(
                      selectedRun.log_id,
                    )}
                    // onActivityClick={(activity) =>
                    //   handleActivityClick(activity, selectedRun)
                    // }
                    // expandedActivities={expandedActivities}
                    // activityLogs={activityLogs}
                    // loadingLogs={loadingLogs}
                    // highlightedLogId={highlightedLogId}
                    // setHighlightedLogId={setHighlightedLogId}
                    // onLogClick={handleLogClick}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Select a run to view logs
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Waterfall Node Component
const WaterfallNode = ({
  run,
  isSelected,
  onSelect,
  onToggleCollapse,
  isCollapsed,
  isTopLevel,
  activities,
  isFetchingActivities,
  onActivityClick,
  expandedActivities,
  activityLogs,
  loadingLogs,
  highlightedLogId,
  onLogClick,
}: {
  run: AgentRun;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void | Promise<void>;
  onToggle: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
  index: number;
  isTopLevel: boolean;
  activities: any[];
  isFetchingActivities: boolean;
  onActivityClick: (activity: any) => void;
  expandedActivities: Set<string>;
  activityLogs: Record<string, any[]>;
  loadingLogs: Set<string>;
  highlightedLogId: string | null;
  onLogClick: (activity: any, run: AgentRun, logIndex: number) => void;
}) => {
  return (
    <div className={isTopLevel ? "" : "ml-6"}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 hover:bg-accent/50",
          isSelected && "border border-primary/20 bg-accent shadow-sm",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="flex flex-1 items-start justify-between gap-2">
          {/* <div className="flex h-4 w-4 items-center justify-center">
            <Bot className="h-3 w-3 text-blue-500" />
          </div> */}
          <span className="text-sm font-medium">{run.agent_name}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">
                {run.actions.toFixed(1)}
              </span>
            </div>
            <span className="text-xs font-medium text-blue-600">
              {(run.latency_ms / 1000).toFixed(2)}s
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 transition-colors hover:bg-accent/30"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Activities for any node that has activities - collapsible */}
      {!isCollapsed && (activities.length > 0 || isFetchingActivities) && (
        <div className="ml-6 space-y-0 transition-all duration-200 ease-in-out">
          {isFetchingActivities && activities.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-4 w-4 items-center justify-center">
                <Bot className="h-3 w-3 animate-pulse text-gray-400" />
              </div>
              <span className="text-sm text-muted-foreground">
                Loading activities...
              </span>
            </div>
          ) : (
            <div className="space-y-0 overflow-y-auto">
              {activities.map((activity: any, idx: number) => {
                const activityKey = `${run.log_id}-${activity.feature}`;
                const isExpanded = expandedActivities.has(activityKey);
                const logs = activityLogs[activityKey] || [];
                const isLoading = loadingLogs.has(activityKey);

                const getIcon = (feature: string) => {
                  switch (feature) {
                    case "memory":
                      return <Database className="h-3 w-3 text-purple-500" />;
                    case "tool_calling":
                      return <Wrench className="h-3 w-3 text-orange-500" />;
                    case "knowledge_base":
                      return <BookOpen className="h-3 w-3 text-green-500" />;
                    case "__start__":
                      return <Play className="h-3 w-3 text-blue-500" />;
                    case "__end__":
                      return <CircleStop className="h-3 w-3 text-blue-500" />;
                    case "llm_response":
                      return (
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                      );
                    default:
                      return (
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                      );
                  }
                };

                return (
                  <div key={idx} className="space-y-0">
                    <div
                      className="flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors hover:bg-accent/50"
                      onClick={() => onActivityClick(activity)}
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        {getIcon(activity.feature)}
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{activity.feature}</span>
                          <span className="text-xs text-muted-foreground">
                            ({activity.log_count} logs)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual logs */}
                    {isExpanded && (
                      <div className="ml-8 space-y-1">
                        {isLoading ? (
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                            <span className="text-xs text-muted-foreground">
                              Loading logs...
                            </span>
                          </div>
                        ) : (
                          logs.map((log: any, logIdx: number) => (
                            <div
                              key={logIdx}
                              className={`flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-accent/30 ${
                                highlightedLogId === `${activityKey}-${logIdx}`
                                  ? "border-l-2 border-foreground bg-accent"
                                  : ""
                              }`}
                              onClick={() => onLogClick(activity, run, logIdx)}
                            >
                              {/* <div
                                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                                  highlightedLogId ===
                                  `${activityKey}-${logIdx}`
                                    ? "bg-foreground"
                                    : "bg-muted-foreground"
                                }`}
                              ></div> */}
                              <div className="min-w-0 flex-1">
                                <div className="break-words text-sm text-foreground">
                                  {log.event_type}
                                </div>
                                {log.timestamp && (
                                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                                    {new Date(
                                      log.timestamp,
                                    ).toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Skeleton Components
const WaterfallSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx}>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DetailsSkeleton = () => (
  <div className="space-y-6 px-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-20" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default TraceDialogV2;

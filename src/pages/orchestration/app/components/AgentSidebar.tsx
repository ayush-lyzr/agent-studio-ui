import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Bot,
  Zap,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  LayoutList,
  Clock,
  Circle,
  Play,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Settings,
  Truck,
} from "lucide-react";
import { Agent } from "../types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ToolsLibrary from "./ToolsLibrary";
import TimelineScrubber from "./TimelineScrubber";
import { cn } from "@/lib/utils";

interface SocketEvent {
  timestamp: string;
  event_type: string;
  run_id: string;
  trace_id: string;
  log_id: string;
  tool_name?: string;
  tool_input?: string;
  arguments?: any;
  function_name?: string;
  response?: string;
}

interface AgentSidebarProps {
  agents: Agent[];
  loading: boolean;
  onAddAgent: (agent: Agent) => void;
  onRefresh: () => void | Promise<void>;
  selectedAgent?: Agent | null;
  socketLogs?: SocketEvent[];
  isSocketConnected?: boolean;
  onClearSelectedAgent?: () => void;
  onEventReplay?: (eventIndex: number, event: SocketEvent) => void;
  // Pagination props
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
  loadMore?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  isSearching?: boolean;
  totalAgents?: number;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  agents,
  loading,
  onAddAgent,
  onRefresh,
  selectedAgent,
  socketLogs = [],
  isSocketConnected = false,
  onClearSelectedAgent,
  onEventReplay,
  // Pagination props
  hasMore = false,
  isFetchingNextPage = false,
  isFetching = false,
  loadMore,
  searchQuery: externalSearchQuery = "",
  setSearchQuery: externalSetSearchQuery,
  totalAgents = 0,
}) => {
  // Use external search query if provided, otherwise use local state
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const searchTerm = externalSetSearchQuery ? externalSearchQuery : localSearchTerm;
  const setSearchTerm = externalSetSearchQuery || setLocalSearchTerm;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [agentViewMode, setAgentViewMode] = useState<"grid" | "list">("list");
  const [filteredEvents, setFilteredEvents] =
    useState<SocketEvent[]>(socketLogs);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // When using external search (pagination), agents are already filtered and sorted by server
  // Only apply local filtering/sorting if not using external search
  const filteredAgents = externalSetSearchQuery
    ? agents || [] // Already filtered and sorted (managers first) by server
    : (agents || [])
        .filter(
          (agent) =>
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .sort((a, b) => {
          const aIsManager = a.managed_agents && a.managed_agents.length > 0;
          const bIsManager = b.managed_agents && b.managed_agents.length > 0;

          if (aIsManager && !bIsManager) return -1;
          if (!aIsManager && bIsManager) return 1;

          return a.name.localeCompare(b.name);
        });

  const getAgentTypeColor = (agent: Agent) => {
    if (agent.managed_agents && agent.managed_agents.length > 0) {
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
    return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  };

  const getAgentTypeIcon = (agent: Agent) => {
    if (agent.managed_agents && agent.managed_agents.length > 0) {
      return <Zap className="h-4 w-4" />;
    }
    return <Bot className="h-4 w-4" />;
  };

  const onDragStart = (event: React.DragEvent, agent: Agent) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(agent));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Keep animation for a minimum duration for better UX
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleEventReplay = useCallback(
    (eventIndex: number, event: SocketEvent) => {
      console.log("Replaying event:", eventIndex, event);
      // Call the parent's event replay handler if provided
      if (onEventReplay) {
        onEventReplay(eventIndex, event);
      }
    },
    [onEventReplay],
  );

  const handleTimelineChange = useCallback(
    (currentIndex: number, _totalEvents: number) => {
      setCurrentTimelineIndex(currentIndex);
      // Filter events up to current timeline position for display
      setFilteredEvents(socketLogs.slice(0, currentIndex + 1));
    },
    [socketLogs],
  );

  // Refs for infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    observerRef.current?.disconnect();

    if (!loadMore || !hasMore || isFetchingNextPage) {
      observerRef.current = null;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isFetchingNextPage) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Observe sentinel if already mounted
    if (sentinelNodeRef.current) {
      observer.observe(sentinelNodeRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetchingNextPage, loadMore]);

  // Callback ref: re-observes sentinel on mount (e.g. after tab switch)
  const scrollSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelNodeRef.current = node;
    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  const renderAgentGrid = () => (
    <div className="space-y-3 px-4 pb-6">
      {loading && filteredAgents.length === 0 ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      ) : (
        <>
          {filteredAgents.map((agent) => (
            <div
              key={agent._id}
              draggable
              onDragStart={(event) => onDragStart(event, agent)}
              onClick={() => onAddAgent(agent)}
              className="hover:bg-gray-750 group cursor-pointer select-none rounded-lg border border-border bg-secondary p-3 transition-all duration-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center space-x-2 overflow-hidden">
                  <div className="flex-shrink-0">{getAgentTypeIcon(agent)}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {agent.name}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="break-words text-xs">{agent.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge
                  variant="secondary"
                  className={`flex-shrink-0 text-xs ${getAgentTypeColor(agent)}`}
                >
                  {agent.managed_agents && agent.managed_agents.length > 0
                    ? "Manager"
                    : "Sub Agent"}
                </Badge>
              </div>

              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                {agent.description || "No description available"}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {agent.model || "gpt-4o-mini"}
                </span>
                {agent.managed_agents && agent.managed_agents.length > 0 && (
                  <Badge
                    variant="outline"
                    className="border-purple-500/30 text-xs text-purple-400"
                  >
                    {agent.managed_agents.length} sub-agents
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {/* Infinite scroll sentinel and loading indicator */}
          {hasMore && (
            <div ref={scrollSentinelRef} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAgentList = () => (
    <div className="space-y-1 px-4 pb-6">
      {loading && filteredAgents.length === 0 ? (
        <div className="space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      ) : (
        <>
          {filteredAgents.map((agent) => (
            <div
              key={agent._id}
              draggable
              onDragStart={(event) => onDragStart(event, agent)}
              onClick={() => onAddAgent(agent)}
              className="hover:bg-gray-750 group cursor-pointer select-none rounded border border-border bg-secondary p-2 transition-all duration-200 hover:border-indigo-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  {getAgentTypeIcon(agent)}
                  <div className="min-w-0 flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="truncate text-xs font-medium text-foreground">
                            {agent.name}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="break-words text-xs">{agent.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent.model || "gpt-4o-mini"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center space-x-1">
                  <Badge
                    variant="secondary"
                    className={`h-4 px-1 py-0 text-xs ${getAgentTypeColor(agent)}`}
                  >
                    {agent.managed_agents && agent.managed_agents.length > 0
                      ? "M"
                      : "S"}
                  </Badge>
                  {agent.managed_agents && agent.managed_agents.length > 0 && (
                    <Badge
                      variant="outline"
                      className="h-4 border-purple-500/30 px-1 py-0 text-xs text-purple-400"
                    >
                      {agent.managed_agents.length}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Infinite scroll sentinel and loading indicator */}
          {hasMore && (
            <div ref={scrollSentinelRef} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "tool_calling_iteration":
        return <Play className="h-3 w-3 text-blue-400" />;
      case "scratch_pad_created":
        return <Settings className="h-3 w-3 text-purple-400" />;
      case "tool_called":
        return <Zap className="h-3 w-3 text-orange-400" />;
      case "tool_response":
        return (
          <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
        );
      case "tool_call_prepare":
        return (
          <Clock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
        );
      case "coroutine_tool_response":
        return <MessageSquare className="h-3 w-3 text-cyan-400" />;
      case "tool_output":
        return <Truck className="h-3 w-3 text-primary" />;
      case "process_complete":
        return <CheckCircle className="h-3 w-3 text-emerald-400" />;
      case "error":
        return (
          <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
        );
      default:
        return <Circle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "tool_calling_iteration":
        return "border-blue-400/20 bg-blue-900/10";
      case "scratch_pad_created":
        return "border-purple-400/20 bg-purple-900/10";
      case "tool_called":
        return "border-orange-400/20 bg-orange-900/10";
      case "tool_response":
        return "border-green-400/20 bg-green-900/10";
      case "tool_call_prepare":
        return "border-yellow-400/20 bg-yellow-900/10";
      case "coroutine_tool_response":
        return "border-cyan-400/20 bg-cyan-900/10";
      case "tool_output":
        return "border-indigo-400/20 bg-indigo-900/10";
      case "process_complete":
        return "border-emerald-400/20 bg-emerald-900/10";
      case "error":
        return "border-red-400/20 bg-red-900/10";
      default:
        return "border-border/20 bg-card/10";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Time stamp will be in the format of 2025-08-21T08:47:07.961052+00:00
      // return new Date(timestamp).toLocaleTimeString([], {
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   second: "2-digit",
      // });

      return new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return timestamp;
    }
  };

  const getEventDescription = (event: SocketEvent) => {
    switch (event.event_type) {
      case "tool_calling_iteration":
        return "Starting iteration";
      case "scratch_pad_created":
        return "Creating scratch pad";
      case "tool_called":
        return event.tool_name ? `Calling ${event.tool_name}` : "Tool called";
      case "tool_response":
        return "Tool response";
      case "tool_call_prepare":
        return event.function_name
          ? `Preparing ${event.function_name}`
          : "Preparing tool";
      case "coroutine_tool_response":
        return "Coroutine response";
      case "tool_output":
        return "Tool output";
      case "process_complete":
        return "Process complete";
      case "error":
        return "Error occurred";
      default:
        return event.event_type.replace(/_/g, " ");
    }
  };

  const getAgentName = (event: SocketEvent) => {
    try {
      if (event.tool_input) {
        const toolInput = JSON.parse(event.tool_input);
        return toolInput.name;
      }
      if (event.arguments?.name) {
        return event.arguments.name;
      }
      if (event.response && event.response.includes("Agent")) {
        const match = event.response.match(/([A-Za-z\s]+Agent)/);
        return match ? match[1] : null;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  };

  const renderAgentTimeline = () => (
    <div className="flex h-full flex-col">
      {/* Timeline Header */}
      <div className="mb-4 flex-shrink-0 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`mt-4 h-2 w-2 rounded-full ${isSocketConnected ? "animate-pulse bg-green-500" : "bg-red-500"}`}
            />
            <span className="mt-4 text-xs text-muted-foreground">
              {isSocketConnected ? "Live" : "Disconnected"} •{" "}
              {filteredEvents.length}/{socketLogs.length} events
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time activity for {selectedAgent?.name}
        </p>
      </div>

      {/* Timeline Content - Use filtered events based on timeline scrubber */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Waiting for agent activity...</p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {filteredEvents.map((log, index) => {
                const agentName = getAgentName(log);
                const isCurrentEvent = index === currentTimelineIndex;
                return (
                  <div
                    key={`${log.log_id}-${index}`}
                    className={cn(
                      "flex items-center gap-2 rounded border px-2 py-1 text-xs transition-all duration-500 ",
                      getEventColor(log.event_type),
                      isCurrentEvent ? "scale-105 ring-2 ring-blue-500" : "",
                    )}
                  >
                    {/* Event Icon */}
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                      {getEventIcon(log.event_type)}
                    </div>

                    {/* Event Content */}
                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">
                          {getEventDescription(log)}
                        </span>
                        {agentName && (
                          <span className="flex-shrink-0 rounded border border-blue-500/30 bg-blue-600/20 px-1 py-0.5 text-xs text-blue-300">
                            {agentName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  const renderLibraryContent = () => (
    <div style={{ height: "100%" }} className="flex flex-col">
      <Tabs
        defaultValue="agents"
        className="flex flex-col"
        style={{ height: "100%" }}
      >
        {/* Tab List - Fixed Height */}
        <TabsList className="mx-0 mb-2 mt-2 grid h-9 w-full grid-cols-2 bg-secondary">
          <TabsTrigger
            value="agents"
            className="h-7 whitespace-nowrap px-1 text-xs text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground"
          >
            Agents
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="h-7 whitespace-nowrap px-1 text-xs text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground"
          >
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent
          value="agents"
          className="mt-0"
          style={{ height: "calc(100% - 3rem)" }}
        >
          <div className="flex flex-col" style={{ height: "100%" }}>
            {/* Agents Header - Fixed Height */}
            <div className="px-4 py-3" style={{ flexShrink: 0 }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {totalAgents} Agents
                </h3>
                <div className="flex items-center space-x-2">
                  <ToggleGroup
                    type="single"
                    value={agentViewMode}
                    onValueChange={(value) =>
                      value && setAgentViewMode(value as "grid" | "list")
                    }
                    className="h-7"
                  >
                    <ToggleGroupItem
                      value="grid"
                      aria-label="Grid view"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Grid2X2 className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="list"
                      aria-label="List view"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <LayoutList className="h-3 w-3" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-border bg-secondary pl-10 pr-10 text-foreground placeholder-muted-foreground"
                />
                {/* Show animated dots when actively fetching */}
                {isFetching && searchTerm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </div>
            </div>

            {/* Agent List - Scrollable Area */}
            <div
              className="overflow-y-auto"
              style={{ height: "calc(100% - 120px - 60px)" }}
            >
              {agentViewMode === "grid" ? renderAgentGrid() : renderAgentList()}
            </div>

            {/* Footer - Fixed Height */}
            <div
              className="border-t border-border px-4 py-3"
              style={{ flexShrink: 0 }}
            >
              <p className="text-center text-xs text-muted-foreground">
                {isFetchingNextPage ? 'Loading more... • ' : hasMore ? 'Scroll for more • ' : 'All agents loaded • '}Drag to add
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent
          value="tools"
          className="mt-0"
          style={{ height: "calc(100% - 3rem)" }}
        >
          <ToolsLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "absolute left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out",
          isCollapsed ? "w-12" : "w-80",
        )}
      >
        {/* Top Bar with Collapse and Back Button */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-2">
          {/* Back to Library Button - Only show when viewing timeline */}
          {selectedAgent && !isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onClearSelectedAgent) {
                  onClearSelectedAgent();
                }
              }}
              className="flex items-center p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="text-xs">Library</span>
            </Button>
          ) : (
            <div /> // Empty div to maintain spacing
          )}

          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex flex-1 flex-col items-center space-y-4 py-4">
            <div className="rotate-90 whitespace-nowrap text-xs text-muted-foreground">
              {selectedAgent ? "Timeline" : "Library"}
            </div>
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground transition-all duration-500 ease-in-out">
                  {selectedAgent ? "Timeline" : "Library"}
                </h2>
              </div>
            </div>

            {/* Content with improved transition */}
            <div className="relative min-h-0 flex-1">
              {/* Library Content */}
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out",
                  selectedAgent
                    ? "pointer-events-none translate-x-[-20px] opacity-0"
                    : "pointer-events-auto translate-x-0 opacity-100",
                )}
              >
                {renderLibraryContent()}
              </div>

              {/* Timeline Content */}
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out",
                  selectedAgent
                    ? "pointer-events-auto translate-x-0 opacity-100"
                    : "pointer-events-none translate-x-[20px] opacity-0",
                )}
              >
                {renderAgentTimeline()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Scrubber - Only show when agent is selected and has events */}
      {selectedAgent && socketLogs.length > 0 && (
        <TimelineScrubber
          events={socketLogs}
          isConnected={isSocketConnected}
          onEventReplay={handleEventReplay}
          onTimelineChange={handleTimelineChange}
        />
      )}
    </>
  );
};

export default AgentSidebar;

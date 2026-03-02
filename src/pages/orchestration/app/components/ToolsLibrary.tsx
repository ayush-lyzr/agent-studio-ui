import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  RefreshCw,
  ExternalLink,
  Grid2X2,
  LayoutList,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useInfiniteTools } from "../hooks/useInfiniteTools";
import useStore from "@/lib/store";

interface AgentTool {
  _id: string;
  name: string;
  description: string;
  tools: string[];
  tool_usage_description: string;
}

interface ParsedToolAction {
  toolName: string;
  actionName: string;
  description?: string;
}

const ToolsLibrary: React.FC = () => {
  const apiKey = useStore((state) => state.api_key);
  const [agentTools, setAgentTools] = useState<AgentTool[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Use the infinite tools hook
  const {
    tools,
    hasMore,
    isLoading,
    isFetching,
    isFetchingNextPage,
    loadMore,
    refresh,
  } = useInfiniteTools({ apiKey, limit: 20 });

  const fetchAgentTools = async () => {
    try {
      const response = await fetch(
        "https://agent.maia.prophet.com/v3/agents/",
        {
          headers: {
            "x-api-key": "sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny",
            accept: "application/json",
          },
        },
      );
      const data = await response.json();

      // Filter agents that have tools defined
      const agentsWithTools = data.filter(
        (agent: any) =>
          agent.tools && agent.tools.length > 0 && agent.tool_usage_description,
      );

      setAgentTools(agentsWithTools);
    } catch (error) {
      console.error("Failed to fetch agent tools:", error);
      setAgentTools([]);
    }
  };

  useEffect(() => {
    fetchAgentTools();
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTrigger = loadMoreTriggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasMore, isFetchingNextPage, loadMore]);

  const parseToolUsageDescription = (
    toolUsageDescription: string,
  ): ParsedToolAction[] => {
    try {
      const parsed = JSON.parse(toolUsageDescription);
      const actions: ParsedToolAction[] = [];

      Object.entries(parsed).forEach(([toolName, actionNames]) => {
        if (Array.isArray(actionNames)) {
          actionNames.forEach((actionName: string) => {
            actions.push({
              toolName,
              actionName,
              description: `${toolName} - ${actionName.replace(/_/g, " ").toLowerCase()}`,
            });
          });
        }
      });

      return actions;
    } catch (error) {
      console.error("Failed to parse tool usage description:", error);
      return [];
    }
  };

  const getAllParsedActions = (): (ParsedToolAction & {
    agentId: string;
    agentName: string;
  })[] => {
    const allActions: (ParsedToolAction & {
      agentId: string;
      agentName: string;
    })[] = [];

    agentTools.forEach((agent) => {
      const actions = parseToolUsageDescription(agent.tool_usage_description);
      actions.forEach((action) => {
        allActions.push({
          ...action,
          agentId: agent._id,
          agentName: agent.name,
        });
      });
    });

    return allActions;
  };

  const filteredTools = tools.flatMap((provider) =>
    (provider.meta_data?.actions || [])
      .filter(
        (action) =>
          action.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
          (action.description &&
            action.description
              ?.toLowerCase()
              .includes(searchTerm?.toLowerCase())) ||
          provider.provider_id
            ?.toLowerCase()
            .includes(searchTerm?.toLowerCase()),
      )
      .map((action) => ({ provider, action })),
  );

  const filteredParsedActions = getAllParsedActions().filter(
    (action) =>
      action.actionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.description &&
        action.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const formatActionName = (name: string) => {
    return name
      .replace(/_/g, " ")
      ?.toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const onDragStart = (
    event: React.DragEvent,
    item: any,
    type: "tool" | "parsed-action",
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ ...item, type }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const allItems = [
    ...filteredTools.map((item) => ({ ...item, itemType: "tool" as const })),
    ...filteredParsedActions.map((item) => ({
      parsedAction: item,
      itemType: "parsed-action" as const,
    })),
  ];

  const renderToolGrid = () => (
    <div className="space-y-3 px-4 py-3 pb-6">
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      ) : allItems.length === 0 && !isFetching ? (
        <div className="py-8 text-center text-muted-foreground">
          {tools.length === 0 && agentTools.length === 0
            ? "No tools available"
            : "No tools match your search"}
        </div>
      ) : (
        allItems.map((item, index) => {
          if (item.itemType === "tool") {
            const { provider, action } = item;
            return (
              <div
                key={`tool-${provider._id}-${action.name}-${index}`}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, { provider, action }, "tool")
                }
                className="group cursor-pointer rounded-lg border border-border bg-secondary p-3 transition-all duration-200 hover:border-blue-500 hover:bg-accent hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-start space-x-3">
                  {/* Provider Icon */}
                  <div className="flex-shrink-0">
                    {provider.meta_data?.logo ? (
                      <img
                        src={provider.meta_data.logo}
                        alt={provider.provider_id}
                        className="h-8 w-8 rounded bg-white/10 object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.setAttribute(
                            "style",
                            "display: flex",
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded bg-secondary"
                      style={{
                        display: provider.meta_data?.logo ? "none" : "flex",
                      }}
                    >
                      <span className="text-xs text-foreground">
                        {provider.provider_id.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Provider name small */}
                    <div className="mb-1 flex items-center space-x-2">
                      <span className="text-xs capitalize text-muted-foreground">
                        {provider.provider_id}
                      </span>
                    </div>

                    {/* Action name big */}
                    <h4 className="mb-1 truncate text-sm font-medium text-foreground">
                      {formatActionName(action.name)}
                    </h4>

                    {/* Description */}
                    {action.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    )}

                    {/* Required parameters */}
                    {action.required_parameters &&
                      action.required_parameters.length > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {action.required_parameters
                              .slice(0, 2)
                              .map((param) => (
                                <Badge
                                  key={param}
                                  variant="secondary"
                                  className="h-4 border-blue-500/30 bg-blue-500/20 px-1 py-0 text-xs text-blue-300"
                                >
                                  {param}
                                </Badge>
                              ))}
                            {action.required_parameters.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="h-4 bg-secondary px-1 py-0 text-xs text-foreground"
                              >
                                +{action.required_parameters.length - 2}
                              </Badge>
                            )}
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-blue-400" />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          } else {
            const { parsedAction } = item;
            return (
              <div
                key={`parsed-${parsedAction.agentId}-${parsedAction.actionName}-${index}`}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, parsedAction, "parsed-action")
                }
                className="group cursor-pointer rounded-lg border border-border bg-secondary p-3 transition-all duration-200 hover:border-green-500 hover:bg-accent hover:shadow-lg hover:shadow-green-500/10"
              >
                <div className="flex items-start space-x-3">
                  {/* Tool Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-green-600">
                      <span className="text-xs font-semibold text-foreground">
                        {parsedAction.toolName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Tool name small */}
                    <div className="mb-1 flex items-center space-x-2">
                      <span className="text-xs capitalize text-muted-foreground">
                        {parsedAction.toolName}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-green-500/30 text-xs text-green-400"
                      >
                        Agent Tool
                      </Badge>
                    </div>

                    {/* Action name big */}
                    <h4 className="mb-1 truncate text-sm font-medium text-foreground">
                      {formatActionName(parsedAction.actionName)}
                    </h4>

                    {/* Description */}
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      From agent: {parsedAction.agentName}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="h-4 border-green-500/30 bg-green-500/20 px-1 py-0 text-xs text-green-300"
                      >
                        {parsedAction.toolName}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })
      )}
      {/* Load more trigger for infinite scroll */}
      {hasMore && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );

  const renderToolList = () => (
    <div className="space-y-1 px-4 py-3 pb-6">
      {isLoading ? (
        <div className="space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      ) : allItems.length === 0 && !isFetching ? (
        <div className="py-8 text-center text-muted-foreground">
          {tools.length === 0 && agentTools.length === 0
            ? "No tools available"
            : "No tools match your search"}
        </div>
      ) : (
        allItems.map((item, index) => {
          if (item.itemType === "tool") {
            const { provider, action } = item;
            return (
              <div
                key={`tool-${provider._id}-${action.name}-${index}`}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, { provider, action }, "tool")
                }
                className="group cursor-pointer select-none rounded border border-border bg-secondary p-2 transition-all duration-200 hover:border-blue-500 hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <div className="flex-shrink-0">
                      {provider.meta_data?.logo ? (
                        <img
                          src={provider.meta_data.logo}
                          alt={provider.provider_id}
                          className="h-6 w-6 rounded bg-white/10 object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.setAttribute(
                              "style",
                              "display: flex",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded bg-secondary"
                        style={{
                          display: provider.meta_data?.logo ? "none" : "flex",
                        }}
                      >
                        <span className="text-xs text-foreground">
                          {provider.provider_id.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-medium text-foreground">
                        {formatActionName(action.name)}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">
                        {provider.provider_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center space-x-1">
                    {action.required_parameters &&
                      action.required_parameters.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-4 border-blue-500/30 bg-blue-500/20 px-1 py-0 text-xs text-blue-300"
                        >
                          {action.required_parameters.length}
                        </Badge>
                      )}
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-blue-400" />
                  </div>
                </div>
              </div>
            );
          } else {
            const { parsedAction } = item;
            return (
              <div
                key={`parsed-${parsedAction.agentId}-${parsedAction.actionName}-${index}`}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, parsedAction, "parsed-action")
                }
                className="group cursor-pointer select-none rounded border border-border bg-secondary p-2 transition-all duration-200 hover:border-green-500 hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-green-600">
                      <span className="text-xs font-semibold text-foreground">
                        {parsedAction.toolName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-medium text-foreground">
                        {formatActionName(parsedAction.actionName)}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">
                        {parsedAction.toolName} • {parsedAction.agentName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center space-x-1">
                    <Badge
                      variant="outline"
                      className="h-4 border-green-500/30 px-1 py-0 text-xs text-green-400"
                    >
                      Agent
                    </Badge>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-green-400" />
                  </div>
                </div>
              </div>
            );
          }
        })
      )}
      {/* Load more trigger for infinite scroll */}
      {hasMore && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {/* Header - Fixed */}
      <div
        className="border-b border-border px-4 py-3"
        style={{ flexShrink: 0 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {filteredTools.length + filteredParsedActions.length} Tools
          </h3>
          <div className="flex items-center space-x-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) =>
                value && setViewMode(value as "grid" | "list")
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
              onClick={() => {
                refresh();
                fetchAgentTools();
              }}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Tools List - Scrollable */}
      <div
        className="overflow-y-auto"
        style={{ height: "calc(100% - 120px - 60px)" }}
      >
        {viewMode === "grid" ? renderToolGrid() : renderToolList()}
      </div>

      {/* Footer - Fixed */}
      <div
        className="border-t border-border px-4 py-3"
        style={{ flexShrink: 0 }}
      >
        <p className="text-center text-xs text-muted-foreground">
        {isFetchingNextPage || isLoading ? 'Loading more... • ' : hasMore ? 'Scroll for more • ' : 'All tools loaded • '}Drag to add
        </p>
      </div>
    </div>
  );
};

export default ToolsLibrary;

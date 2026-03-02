import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  XCircleIcon,
  Users,
  Phone,
  FileText,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Path } from "@/lib/types";
import { PageBanner } from "@/pages/voice-agent-builder/components/page-banner";
import { buttonVariants } from "@/components/custom/button";
import { backendClient } from "@/lib/livekit/backend-client";
import type { StoredAgent } from "@/lib/livekit/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceCard } from "@/components/custom/resource-card";
import { TelephonyPanel } from "@/pages/voice-new-create/components/telephony/telephony-panel";
import { TranscriptsPanel } from "./transcripts/transcripts-panel";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";

export default function VoiceNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key ?? "");
  const hasApiKey = Boolean(apiKey.trim());
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("voiceNewViewMode");
    return (saved === "list" ? "list" : "grid") as "grid" | "list";
  });
  const [activeView, setActiveView] = useState<
    "agents" | "telephony" | "transcripts"
  >("agents");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<StoredAgent | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  const loadAgents = useCallback(
    async (isInitial = false) => {
      if (!hasApiKey) {
        setAgentsError(null);
        setIsRefreshing(false);
        setIsLoadingAgents(false);
        return;
      }

      if (isInitial) {
        setIsLoadingAgents(true);
      } else {
        setIsRefreshing(true);
      }
      setAgentsError(null);

      try {
        const response = await backendClient.listAgents();
        setAgents(response.agents ?? []);
      } catch (error) {
        setAgentsError(
          error instanceof Error ? error.message : "Failed to load agents",
        );
      } finally {
        setIsRefreshing(false);
        setIsLoadingAgents(false);
      }
    },
    [hasApiKey],
  );

  const handleRefresh = () => {
    if (!hasApiKey) return;
    loadAgents(false);
  };

  useEffect(() => {
    loadAgents(true);
  }, [loadAgents]);

  const totalAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => {
      const name = (a.config?.agent_name ?? "").toLowerCase();
      const desc = (a.config?.agent_description ?? "").toLowerCase();
      return (
        name.includes(q) || desc.includes(q) || a.id.toLowerCase().includes(q)
      );
    });
  }, [agents, searchQuery]);

  const handleSelectAgent = (agentId: string) =>
    navigate(`${Path.VOICE_NEW_CREATE}/${encodeURIComponent(agentId)}`);

  const handleDeleteAgentRequest = (agent: StoredAgent) => {
    setAgentToDelete(agent);
  };

  const handleConfirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeletingAgent(true);
    try {
      await backendClient.deleteAgent(agentToDelete.id);
      setAgents((previous) => previous.filter((agent) => agent.id !== agentToDelete.id));
      toast({
        title: "Agent deleted",
        description: "The voice agent was deleted successfully.",
      });
      setAgentToDelete(null);
    } catch (error) {
      toast({
        title: "Failed to delete agent",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAgent(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-4 p-8 pb-0"
    >
      <PageBanner />

      {/* Main Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as typeof activeView)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Voice Agents
          </TabsTrigger>
          <TabsTrigger value="telephony" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telephony
          </TabsTrigger>
          <TabsTrigger value="transcripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transcripts
          </TabsTrigger>
        </TabsList>

        {/* Agents View */}
        <TabsContent value="agents" className="mt-4 flex-1 overflow-hidden">
          <div className="flex h-full gap-4 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Search and Action Bar */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex flex-1 items-center rounded-md border border-input px-3">
                  <Search className="size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="border-none bg-transparent shadow-none focus-visible:ring-0"
                  />
                  {searchQuery && (
                    <XCircleIcon
                      className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    />
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center rounded-md border">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => {
                          setViewMode("grid");
                          localStorage.setItem("voiceNewViewMode", "grid");
                        }}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => {
                          setViewMode("list");
                          localStorage.setItem("voiceNewViewMode", "list");
                        }}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>

                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={!hasApiKey || isRefreshing || isLoadingAgents}
                >
                  <RefreshCw
                    className={cn(
                      "size-4",
                      isRefreshing || isLoadingAgents ? "animate-spin" : "",
                    )}
                  />
                </Button>

                {/* Create Agent */}
                <Button onClick={() => navigate(Path.VOICE_NEW_CREATE)}>
                  <Plus className="mr-2 size-4" />
                  Create Agent
                </Button>
              </div>

              {/* Agents Content */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                <div
                  className={cn(
                    "mt-4 grid gap-4",
                    viewMode === "grid"
                      ? "large-screen:grid-cols-5 sm:grid-cols-3 2xl:grid-cols-4"
                      : "grid-cols-1",
                  )}
                >
                  {(() => {
                    if (agentsError) {
                      return (
                        <Card className="large-screen:col-span-6 sm:col-span-4 2xl:col-span-5">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Failed to load agents
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              {agentsError}
                            </p>
                            <Button
                              onClick={() => globalThis.location.reload()}
                              variant="outline"
                            >
                              Retry
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (isLoadingAgents) {
                      return (
                        <>
                          {Array.from({ length: 6 }, (_, index) => (
                            <Skeleton
                              key={`agent-skeleton-${index}`}
                              className={cn(
                                viewMode === "grid" ? "h-40" : "h-20",
                                "w-full rounded-md",
                              )}
                            />
                          ))}
                        </>
                      );
                    }

                    if (totalAgents.length > 0) {
                      return totalAgents.map((agent, index) => {
                        const name =
                          agent.config?.agent_name?.trim() ||
                          `Agent ${agent.id.slice(0, 8)}`;
                        const description =
                          agent.config?.agent_description?.trim() || "";

                        return (
                          <ResourceCard<StoredAgent>
                            key={agent.id}
                            index={index}
                            item={agent}
                            viewMode={viewMode}
                            withGradientIcon
                            title={name}
                            description={description}
                            timestamp={agent.updatedAt}
                            type="Voice Agent"
                            onClick={() => handleSelectAgent(agent.id)}
                            actions={[
                              {
                                label: "Edit",
                                icon: <Pencil className="size-4" />,
                                visible: true,
                                onClick: (selectedAgent) => (event) => {
                                  event.stopPropagation();
                                  handleSelectAgent(selectedAgent.id);
                                },
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 className="size-4" />,
                                visible: true,
                                className: "text-destructive",
                                onClick: (selectedAgent) => (event) => {
                                  event.stopPropagation();
                                  handleDeleteAgentRequest(selectedAgent);
                                },
                              },
                            ]}
                          />
                        );
                      });
                    }

                    return (
                      <div
                        className={cn(
                          viewMode === "grid"
                            ? "large-screen:col-span-6 sm:col-span-4 2xl:col-span-5"
                            : "w-full",
                          "flex flex-col items-center justify-center space-y-5 text-center",
                        )}
                      >
                        <img
                          src="/images/no-tools.svg"
                          alt="Empty state"
                          className="mt-20"
                        />
                        <p className="pb-5 font-medium">No Agents found</p>
                        <Button
                          onClick={() => navigate(Path.VOICE_NEW_CREATE)}
                          className={buttonVariants()}
                        >
                          <Plus className="mr-1 size-4" /> Create new
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Telephony View */}
        <TabsContent
          value="telephony"
          className="mt-4 flex-1 overflow-hidden"
        >
          <div className="no-scrollbar h-full overflow-y-auto">
            <TelephonyPanel />
          </div>
        </TabsContent>

        {/* Transcripts View */}
        <TabsContent
          value="transcripts"
          className="mt-4 flex-1 overflow-hidden"
        >
          <TranscriptsPanel />
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={Boolean(agentToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingAgent) {
            setAgentToDelete(null);
          }
        }}
        title="Delete voice agent?"
        description={`This action cannot be undone.${agentToDelete?.config?.agent_name ? ` Delete "${agentToDelete.config.agent_name}" permanently.` : ""}`}
        onConfirm={handleConfirmDeleteAgent}
        isLoading={isDeletingAgent}
        loadingLabel="Deleting..."
      />
    </motion.div>
  );
}

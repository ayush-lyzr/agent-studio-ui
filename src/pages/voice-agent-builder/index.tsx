import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  XCircleIcon,
  RefreshCw,
  // FolderPlus,
  LayoutGrid,
  List,
  Users,
  Phone,
  Activity,
  Sparkles,
} from "lucide-react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentBuilder, useUserApps } from "./agent-builder.service";
import { backendClient } from "@/lib/livekit/backend-client";
import { buttonVariants } from "@/components/custom/button";
import { IAgent, IPolicy, ITeamMember, Path } from "@/lib/types";
import useStore from "@/lib/store";
import {
  listWorkflows,
  deleteWorkflow,
  updateWorkflow,
} from "@/services/workflowApiService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Launch } from "../create-agent/components/launch";
import { AgentCard } from "./agent-card";
import { ListCard } from "./components/ListCard";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
import mixpanel from "mixpanel-browser";
import {
  IS_ENTERPRISE_DEPLOYMENT,
  isDevEnv,
  isMixpanelActive,
  MARKETPLACE_URL,
} from "@/lib/constants";
import axios from "@/lib/axios";
import ShareAgent from "./share-agent";
import { useOrganization } from "../organization/org.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import WebIDE from "./components/WebIDE";
import { AddToGroupDialog } from "@/pages/components/Groups/AddToGroupDialog";
import { CreateGroupDialog } from "@/pages/components/Groups/CreateGroupDialog";
import { RenameGroupDialog } from "@/pages/components/Groups/RenameGroupDialog";
import {
  Group,
  getGroups,
  removeAssetFromGroup,
} from "@/services/groupsApiService";
import { DeleteGroupDialog } from "../components/Groups/DeleteGroupDialog";
import { useToast } from "@/components/ui/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePlan } from "@/components/custom/upgrade-plan";
import { PageBanner } from "./components/page-banner";
import { PhoneNumbersView } from "./components/PhoneNumbersView";
import { MonitorView } from "./components/MonitorView";
import { buildNewVoiceCreatePayloadFromLegacyAgent } from "./new-voice-migration";
// import { FilterToggle } from "@/components/custom/filter-toggle";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Agents page visited");

type TabFilterType = "all" | "agent" | "workflow" | "managerial-agent";

export default function AgentBuilder() {
  // const { userId, currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, _] = useSearchParams();
  const group_name = params.get("group_name");

  const [agentToDelete, setAgentToDelete] = useState<IAgent | null>(null);
  const [agentToDuplicate, setAgentToDuplicate] = useState<IAgent | null>(null);
  const [agentToMoveToNewVoice, setAgentToMoveToNewVoice] =
    useState<IAgent | null>(null);
  const [isMovingToNewVoice, setIsMovingToNewVoice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  // State for IDE toggle and workflows
  const [isIdeOpen, setIsIdeOpen] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  // Removed unused state variables
  const [selectedAgentForIDE, setSelectedAgentForIDE] = useState<IAgent | null>(
    null,
  );
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<Partial<IAgent>>({});
  const [isLaunchOpen, setIsLaunchOpen] = useState(false);
  const [shareVisible, setShareVisible] = useState<boolean>(false);
  const [selectedAgentForGroup, setSelectedAgentForGroup] =
    useState<IAgent | null>(null);
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isRenameGroupOpen, setIsRenameGroupOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [groupToRename] = useState<Group | null>(null);
  const [groupToDelete] = useState<Group | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [_draggedAgent, setDraggedAgent] = useState<IAgent | null>(null);
  const [_dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("agentBuilderViewMode");
    return (saved === "list" ? "list" : "grid") as "grid" | "list";
  });
  const [showUpgradePricing, setShowUpgradePricing] = useState(false);
  const [tabFilter, __] = useState<TabFilterType>("all");
  const [activeView, setActiveView] = useState<
    "agents" | "phone-numbers" | "monitor"
  >("agents");

  const apiKey = useStore((state) => state.api_key);
  const token = useStore((state) => state.app_token);
  const { current_organization, current_user: currentUser } =
    useManageAdminStore((state) => state);
  const userId = currentUser?.id ?? "";
  const { data: userApps = [] } = useUserApps(userId, token);
  const {
    isFetchingAgents,
    getAgents,
    deleteAgent,
    isDeletingAgent,
    createAgent,
    isCreatingAgent,
    updateAgent,
    // isUpdatingAgent, // Commented out as it's unused
  } = useAgentBuilder({ apiKey });
  const { getCurrentOrgMembers } = useOrganization({
    token,
    current_organization,
  });
  const { getAgentPolicy } = useAgentBuilder({
    apiKey,
    permission_type: "agent",
  });

  const loadGroups = async () => {
    const orgId = current_organization?._id;
    if (!orgId) return;
    try {
      const groupsData = await getGroups(orgId, "voice-agent", token);
      setGroups(groupsData);
    } catch (error) {
      console.error("Failed to load groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    }
  };

  const getAgentsCount = () => {
    return Array.isArray(agents) ? agents.length : 0;
  };

  const agentsCount = getAgentsCount();

  const { isLimitReached } = usePlanLimits(agentsCount, "AGENT_LIMIT");

  const handleRefresh = async () => {
    try {
      // Load groups
      await loadGroups();

      // Fetch agents
      const agentsRes = await getAgents();
      setAgents(agentsRes.data);

      const teamRes = await getCurrentOrgMembers();
      setTeam(teamRes.data);

      const policyRes = await getAgentPolicy();
      setPolicies(policyRes.data);

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("User refreshed agents data");
    } catch (err: any) {
      console.log("Error refreshing agents => ", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // const fetchAgents = async () => {
  //   if (!isRefreshing && !isDeletingAgent) {
  //     try {
  //       setIsLoadingAgents(true);
  //       const agentsRes = await getAgents();
  //       setAgents(agentsRes.data);
  //       // Use the userApps data that's already available from the hook
  //       const userAppsData = userApps;
  //       setAgents((prevAgents) =>
  //         prevAgents.map((agent) => ({
  //           ...agent,
  //           isLaunched: userAppsData.some(
  //             (app: { agent_id: string }) => app.agent_id === agent._id,
  //           ),
  //         })),
  //       );
  //     } catch (error) {
  //       console.error("Error fetching agents:", error);
  //       if (isMixpanelActive) {
  //         mixpanel.track("error-page", { error: "Error fetching agents" });
  //       }
  //     } finally {
  //       setIsLoadingAgents(false);
  //     }
  //   }
  // };

  const fetchWorkflows = async () => {
    try {
      // Loading workflows
      // Get the current API key that's being used
      const apiKey = useStore.getState().api_key;
      console.log(
        "Using API key for workflows (masked):",
        apiKey ? `${apiKey.substring(0, 4)}...` : "None",
      );

      const workflowList = await listWorkflows();
      console.log("Fetched workflows (count):", workflowList?.length || 0);
      console.log("Workflow data sample:", workflowList?.[0] || "No workflows");

      if (workflowList && Array.isArray(workflowList)) {
        setWorkflows(workflowList);
        return workflowList; // Return the workflow list for use by other functions
      } else {
        console.error("Workflow data is not in expected format:", workflowList);
        setWorkflows([]); // Set to empty array if data is invalid
        return [];
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
      return []; // Return empty array on error
    } finally {
      // Finished loading workflows
    }
  };

  const isAgentLaunched = (agentId: string) => {
    const app = userApps.find((app: any) => app.agent_id === agentId);
    return app
      ? { launched: true, appId: app.id }
      : { launched: false, appId: null };
  };

  const handleDragStart = (e: React.DragEvent, agent: IAgent) => {
    setDraggedAgent(agent);
    e.dataTransfer.effectAllowed = "move";
  };

  // const handleDragOver = (e: React.DragEvent, groupId: string) => {
  //   e.preventDefault();
  //   setDragOverGroup(groupId);
  // };

  // const handleDragLeave = () => {
  //   setDragOverGroup(null);
  // };

  // Unused function - keeping for future reference
  // const handleDropOnGroup = async (group: Group) => {
  //   if (!draggedAgent) return;
  //   const orgId = current_organization?._id;
  //   if (!orgId) return;
  //   try {
  //     const currentAgentGroup = groups.find((g) =>
  //       g.assets.some((a) => a.asset_id === draggedAgent._id),
  //     );
  //     if (currentAgentGroup && currentAgentGroup.group_id !== group.group_id) {
  //       await moveAssetBetweenGroups(
  //         currentAgentGroup.group_name,
  //         currentAgentGroup.group_type,
  //         draggedAgent._id,
  //         orgId,
  //         { to_group_name: group.group_name, to_group_type: group.group_type },
  //         token,
  //       );
  //       toast({ title: "Success", description: `Moved "${draggedAgent.name}" to "${group.group_name}"` });
  //     } else if (!currentAgentGroup) {
  //       await addAssetToGroup(
  //         group.group_name, group.group_type, orgId,
  //         { asset_id: draggedAgent._id, asset_type: "voice-agent", asset_name: draggedAgent.name, metadata: { description: draggedAgent.description } },
  //         token,
  //       );
  //       toast({ title: "Success", description: `Added "${draggedAgent.name}" to "${group.group_name}"` });
  //     }
  //     handleRefresh();
  //   } catch (error) {
  //     console.error("Failed to add agent to group:", error);
  //     toast({ title: "Error", description: "Failed to add agent to group", variant: "destructive" });
  //   } finally {
  //     setDraggedAgent(null);
  //     setDragOverGroup(null);
  //   }
  // };

  useEffect(() => {
    if (currentGroup) {
      const updated = groups.find((g) => g.group_id === currentGroup.group_id);
      if (updated) setCurrentGroup(updated);
    }
  }, [groups]);

  const getFilteredAgents = () => {
    let filteredAgents = agents;

    // Filter to only show agents with voice_config
    filteredAgents = filteredAgents.filter((agent) => agent.voice_config);

    // Filter by current group if inside a group
    if (currentGroup) {
      filteredAgents = filteredAgents.filter((agent) =>
        currentGroup.assets.some((asset) => asset.asset_id === agent._id),
      );
    } else {
      // When in main view, show only ungrouped agents
      filteredAgents = filteredAgents.filter(
        (agent) =>
          !groups.some((group) =>
            group.assets.some((asset) => asset.asset_id === agent._id),
          ),
      );
    }

    // Apply search filter
    return filteredAgents.filter(
      (agent: any) =>
        agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const handleAgentClick = (agent: IAgent) => {
    const launchStatus = isAgentLaunched(agent._id);
    const groupNameParam = currentGroup?.group_name
      ? `?group_name=${currentGroup?.group_name}`
      : "";
    navigate(`/voice-agent-create/${agent._id}${groupNameParam}`, {
      state: {
        agent,
        isLaunched: launchStatus.launched,
        appId: launchStatus.appId,
      },
    });
  };

  const deleteVoiceAgentWithSideEffects = async ({
    agent,
    silent = false,
  }: {
    agent: IAgent;
    silent?: boolean;
  }) => {
    const launchStatus = isAgentLaunched(agent._id);
    if (launchStatus.launched && launchStatus.appId) {
      await axios.delete(`/app/${launchStatus.appId}`, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!silent) {
        toast({
          title: "Success",
          description: "Launched app deleted successfully",
        });
      }
    }

    await deleteAgent(agent._id);
    if (!silent) {
      toast({ title: "Success", description: "Agent deleted successfully" });
    }

    if (currentGroup) {
      await removeAssetFromGroup(
        currentGroup.group_name,
        currentGroup.group_type,
        agent._id,
        current_organization?._id || "",
        token,
      );
      if (!silent) {
        toast({
          title: "Success",
          description: `Removed "${agent.name}" from "${currentGroup.group_name}"`,
        });
      }
    }

    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
      mixpanel.track("Deleted agent", { agent_id: agent._id });
    }
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;

    try {
      await deleteVoiceAgentWithSideEffects({ agent: agentToDelete });
      handleRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
      console.error("Error deleting agent:", error);
    } finally {
      setAgentToDelete(null);
    }
  };

  const confirmMoveToNewVoice = async () => {
    if (!agentToMoveToNewVoice) return;

    setIsMovingToNewVoice(true);

    let migratedAgentId: string | null = null;
    try {
      const createPayload = buildNewVoiceCreatePayloadFromLegacyAgent(
        agentToMoveToNewVoice,
      );
      const createdAgent = await backendClient.createAgent(createPayload);
      migratedAgentId = createdAgent.agent.id;

      await deleteVoiceAgentWithSideEffects({
        agent: agentToMoveToNewVoice,
        silent: true,
      });

      toast({
        title: "Moved to New Voice",
        description: `"${agentToMoveToNewVoice.name}" was moved successfully.`,
      });

      setAgentToMoveToNewVoice(null);
      handleRefresh();
      navigate(
        `${Path.VOICE_NEW_CREATE}/${encodeURIComponent(migratedAgentId)}`,
      );
    } catch (error) {
      if (migratedAgentId) {
        toast({
          title: "Agent partially moved",
          description:
            "A New Voice agent was created, but deleting the legacy agent failed. Delete it manually.",
          variant: "destructive",
        });
        setAgentToMoveToNewVoice(null);
        handleRefresh();
        navigate(
          `${Path.VOICE_NEW_CREATE}/${encodeURIComponent(migratedAgentId)}`,
        );
      } else {
        toast({
          title: "Failed to move agent",
          description:
            error instanceof Error ? error.message : "Failed to move agent",
          variant: "destructive",
        });
      }
      console.error("Error moving agent to new voice:", error);
    } finally {
      setIsMovingToNewVoice(false);
    }
  };

  const removeFromGroupHandler = async (agent: IAgent) => {
    if (!currentGroup) return;
    try {
      await removeAssetFromGroup(
        currentGroup.group_name,
        currentGroup.group_type,
        agent._id,
        current_organization?._id || "",
        token,
      );
      toast({
        title: "Success",
        description: `Removed "${agent.name}" from "${currentGroup.group_name}"`,
      });
      handleRefresh();
    } catch (error) {
      console.error("Failed to remove agent from group:", error);
      toast({
        title: "Error",
        description: "Failed to remove agent from group",
        variant: "destructive",
      });
    }
  };

  const onDuplicate = async () => {
    if (!agentToDuplicate) return;

    try {
      const baseName = agentToDuplicate.name.replace(/\s*\(\d+\)$/, "");
      // Use the first available numeric suffix, starting at (1).
      // (The visible `agents` list can be partial/paginated, so `count` can be 0.)
      const existingNames = new Set(agents.map((a) => a.name));
      let suffix = 1;
      while (existingNames.has(`${baseName} (${suffix})`)) suffix += 1;

      // List items can be partial/synthetic depending on view/source.
      // Fetch the full agent before duplicating so we don't POST invalid values.
      let sourceAgent: any = agentToDuplicate;
      try {
        const res = await axios.get(`/agents/${agentToDuplicate._id}`, {
          headers: { "x-api-key": apiKey },
        });
        sourceAgent = res.data ?? agentToDuplicate;
      } catch (e) {
        // Fall back to the currently-selected object if fetch fails.
        sourceAgent = agentToDuplicate;
      }

      const payload: any = {
        ...sourceAgent,
        name: `${baseName} (${suffix})`,
      };
      delete payload?._id;
      delete payload?.created_at;
      delete payload?.updated_at;
      delete payload?.api_key;

      await createAgent({
        endpoint: "/agents/",
        values: payload,
      });
      toast({ title: "Success", description: "Agent duplicated successfully" });
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Duplicated agent", { agent_id: agentToDuplicate._id });
      handleRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicated agent",
        variant: "destructive",
      });
      console.error("Error duplicating agent:", error);
    } finally {
      setAgentToDuplicate(null);
    }
  };

  const handleCreateAgent = () => {
    if (isLimitReached) {
      setShowUpgradePricing(true);
    } else if (group_name) {
      navigate(
        `${Path.VOICE_AGENT_CREATE}?group_name=${currentGroup?.group_name}`,
      );
    } else {
      navigate(Path.VOICE_AGENT_CREATE);
    }
  };
  // useEffect(() => {
  //   const loadInitialData = async () => {
  //     await fetchAgents();
  //     await fetchWorkflows();
  //   };

  //   loadInitialData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  const getAgentCards = (tabFilter: TabFilterType) => {
    switch (tabFilter) {
      case "all":
        return getFilteredAgents();
      case "agent":
        return getFilteredAgents().filter(
          (agent) => agent,
          // !agent.semantic_data_model &&
          // !agent.vector_store_provider.toLowerCase().includes("neo4j"),
        );
      case "workflow":
        return workflows;
      case "managerial-agent":
        return getFilteredAgents().filter((agent) =>
          Boolean(agent?.managed_agents?.length),
        );
      default:
        return getFilteredAgents();
    }
  };

  const totalAgents = getAgentCards(tabFilter);
  const isMoveToNewVoiceEnabled = isDevEnv && !IS_ENTERPRISE_DEPLOYMENT;
  // const allAgentsCount = getAgentCards("all").length;
  // const basicAgentsCount = getAgentCards("agent").length;
  // const workflowsCount = getAgentCards("workflow").length;
  // const managerialAgentsCount = getAgentCards("managerial-agent").length;

  useEffect(() => {
    if (group_name) {
      const current_group = groups.find((g) => g.group_name === group_name);
      if (current_group) setCurrentGroup(current_group);
    }
  }, [group_name, groups.length]);

  useEffect(() => {
    if (current_organization?.org_id) {
      handleRefresh();
    }
  }, [current_organization?.org_id]);

  return (
    <>
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
          onValueChange={(v) => setActiveView(v as any)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Voice Agents
            </TabsTrigger>
            <TabsTrigger
              value="phone-numbers"
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Phone Numbers
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
          </TabsList>

          {/* Agents View */}
          <TabsContent value="agents" className="mt-4 flex-1 overflow-hidden">
            <div className="flex h-full gap-4 overflow-hidden">
              {/* Left Column - Folders */}
              {/* <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Folders</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="h-8 px-2"
                  >
                    <FolderPlus className="size-4" />
                  </Button>
                </div>

                {isRefreshing || isFetchingAgents ? (
                  new Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <Skeleton
                        key={`folder-skeleton-${index}`}
                        className="h-10 w-full rounded-md"
                      />
                    ))
                ) : (
                  <div className="space-y-1">
                    <div
                      onClick={() => {
                        setCurrentGroup(null);
                        params.delete("group_name");
                        navigate(Path.VOICE_AGENT_BUILDER);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                        !currentGroup && "bg-accent font-medium",
                      )}
                    >
                      <span>All Agents</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {totalAgents.length}
                      </span>
                    </div>

                    {groups.map((group) => (
                      <div
                        key={group.group_id}
                        onClick={() => {
                          setCurrentGroup(group);
                          params.set("group_name", group.group_name);
                          navigate(
                            `${Path.VOICE_AGENT_BUILDER}?group_name=${group.group_name}`,
                          );
                        }}
                        onDragOver={(e) => handleDragOver(e, group.group_id)}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                          currentGroup?.group_id === group.group_id &&
                            "bg-accent font-medium",
                        )}
                      >
                        <span className="flex-1 truncate">
                          {group.group_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {group.assets?.length || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}

              {/* Right Column - Agents */}
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
                            localStorage.setItem(
                              "agentBuilderViewMode",
                              "grid",
                            );
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
                            localStorage.setItem(
                              "agentBuilderViewMode",
                              "list",
                            );
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
                    disabled={isRefreshing || isFetchingAgents}
                  >
                    <RefreshCw
                      className={cn(
                        "size-4",
                        isRefreshing || isFetchingAgents ? "animate-spin" : "",
                      )}
                    />
                  </Button>

                  {isMoveToNewVoiceEnabled && (
                    <button
                      onClick={() => navigate(Path.VOICE_NEW)}
                      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 px-4 py-1.5 text-sm font-medium text-foreground ring-1 ring-violet-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:ring-violet-500/40"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/10 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <Sparkles className="relative size-4 text-violet-500 transition-transform duration-300 group-hover:scale-110 group-hover:text-fuchsia-500" />
                      <span className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-fuchsia-400">
                        New Voice Experience
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
                      </span>
                    </button>
                  )}

                  <Button onClick={handleCreateAgent}>
                    <Plus className="mr-2 size-4" />
                    Create Agent
                  </Button>
                </div>

                {/* Agents Content */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  {/* Back button when inside a group */}
                  {currentGroup && (
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbPage
                            onClick={() => {
                              setCurrentGroup(null);
                              params.delete("group_name");
                              navigate(Path.VOICE_AGENT_BUILDER);
                            }}
                            className="inline-flex cursor-pointer items-center"
                          >
                            <ArrowLeft className="mr-1 size-3" />
                            Back to All Agents
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-bold text-yellow-600">
                            {currentGroup.group_name}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  )}

                  {/* Column headers for list view */}
                  {viewMode === "list" && (
                    <div className="mb-2 flex items-center border-b bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground">
                      <div className="min-w-0 flex-1">Name</div>
                      <div className="w-32 px-4">Created At</div>
                      <div className="w-40 px-4">Shared With</div>
                      <div className="w-16"></div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-4 grid gap-4",
                      viewMode === "grid"
                        ? "large-screen:grid-cols-5 sm:grid-cols-3 2xl:grid-cols-4"
                        : "grid-cols-1",
                    )}
                  >
                    {/* Agents */}
                    {totalAgents.length > 0 ? (
                      totalAgents.map((agent, index) => (
                        <div
                          key={agent._id}
                          className="group relative"
                          draggable
                          onDragStart={(e) => handleDragStart(e, agent)}
                          onDragEnd={() => {
                            setDraggedAgent(null);
                            setDragOverGroup(null);
                          }}
                        >
                          {viewMode === "grid" ? (
                            <AgentCard
                              agent={agent}
                              index={index}
                              userId={userId}
                              isLaunched={isAgentLaunched(agent._id).launched}
                              appId={isAgentLaunched(agent._id).appId}
                              onEdit={handleAgentClick}
                              team={team}
                              agentPolicies={policies.filter(
                                (policy) => policy?.resource_id === agent?._id,
                              )}
                              onDuplicate={(agent) =>
                                setAgentToDuplicate(agent)
                              }
                              onShare={(agent) => {
                                setSelectedAgent(agent);
                                setShareVisible(true);
                                handleRefresh();
                              }}
                              onLaunch={(agent) => {
                                setSelectedAgent(agent);
                                setIsLaunchOpen(true);
                              }}
                              onDelete={(agent) => setAgentToDelete(agent)}
                              onMoveToNewVoice={(agent) =>
                                setAgentToMoveToNewVoice(agent)
                              }
                              onAddToGroup={(agent) => {
                                setSelectedAgentForGroup(agent);
                                setIsAddToGroupOpen(true);
                              }}
                              onRemoveFromGroup={(agent: IAgent) => {
                                removeFromGroupHandler(agent);
                              }}
                              onClick={handleAgentClick}
                              showMoveToNewVoice={isMoveToNewVoiceEnabled}
                              currentGroup={currentGroup}
                            />
                          ) : (
                            <ListCard
                              agent={agent}
                              index={index}
                              userId={userId}
                              isLaunched={isAgentLaunched(agent._id).launched}
                              appId={isAgentLaunched(agent._id).appId}
                              onEdit={handleAgentClick}
                              team={team}
                              agentPolicies={policies.filter(
                                (policy) => policy?.resource_id === agent?._id,
                              )}
                              onDuplicate={(agent) =>
                                setAgentToDuplicate(agent)
                              }
                              onShare={(agent) => {
                                setSelectedAgent(agent);
                                setShareVisible(true);
                                handleRefresh();
                              }}
                              onLaunch={(agent) => {
                                setSelectedAgent(agent);
                                setIsLaunchOpen(true);
                              }}
                              onDelete={(agent) => setAgentToDelete(agent)}
                              onMoveToNewVoice={(agent) =>
                                setAgentToMoveToNewVoice(agent)
                              }
                              onAddToGroup={(agent) => {
                                setSelectedAgentForGroup(agent);
                                setIsAddToGroupOpen(true);
                              }}
                              onRemoveFromGroup={(agent: IAgent) => {
                                removeFromGroupHandler(agent);
                              }}
                              onClick={handleAgentClick}
                              showJsonEdit={isDevEnv}
                              showMoveToNewVoice={isMoveToNewVoiceEnabled}
                              onEditJson={(agent) => {
                                setSelectedAgentForIDE(agent);
                                setIsIdeOpen(true);
                              }}
                              currentGroup={currentGroup}
                            />
                          )}
                          {/* {viewMode === "grid" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          setSelectedAgentForIDE(agent);
                          setIsIdeOpen(true);
                        }}
                        title="Edit as JSON"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    )} */}
                        </div>
                      ))
                    ) : (
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
                          onClick={handleCreateAgent}
                          className={buttonVariants()}
                        >
                          <Plus className="mr-1 size-4" /> Create new
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Phone Numbers View */}
          <TabsContent
            value="phone-numbers"
            className="mt-4 flex-1 overflow-hidden"
          >
            <PhoneNumbersView
              agents={totalAgents}
              clientId={current_organization?.org_id || ""}
            />
          </TabsContent>

          {/* Monitor View */}
          <TabsContent value="monitor" className="mt-4 flex-1 overflow-hidden">
            <MonitorView agents={totalAgents} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <AlertDialog
        open={!!agentToDelete}
        onOpenChange={() => setAgentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAgentLaunched(agentToDelete?._id || "").launched
                ? "Delete Agent & Published App"
                : "Delete Agent"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAgentLaunched(agentToDelete?._id || "").launched
                ? "Deleting this agent will also permanently delete its published app. This action cannot be undone. Are you sure you want to continue?"
                : `Are you sure you want to delete "${agentToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAgent}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive"
              disabled={isDeletingAgent}
            >
              {isDeletingAgent ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!agentToMoveToNewVoice}
        onOpenChange={() => {
          if (!isMovingToNewVoice) {
            setAgentToMoveToNewVoice(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move agent to New Voice?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will create a New Voice agent for "${agentToMoveToNewVoice?.name}" and then delete the current legacy voice agent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMovingToNewVoice}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMoveToNewVoice}
              disabled={isMovingToNewVoice}
              className={buttonVariants({ variant: "default" })}
            >
              {isMovingToNewVoice ? "Moving..." : "Move to New Voice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!agentToDuplicate}
        onOpenChange={() => setAgentToDuplicate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Agent</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to duplicate "${agentToDuplicate?.name}" ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingAgent}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDuplicate}
              disabled={isCreatingAgent}
              className={buttonVariants({ variant: "default" })}
            >
              {isCreatingAgent ? "Duplicating..." : "Duplicate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareAgent
        open={shareVisible}
        onOpen={setShareVisible}
        agent_id={selectedAgent?._id ?? ""}
        team={team}
        agentPolicies={policies.filter(
          (policy) => policy?.resource_id === (selectedAgent?._id ?? ""),
        )}
      />

      <Launch
        open={isLaunchOpen}
        onOpenChange={setIsLaunchOpen}
        agent={selectedAgent}
        currentUser={currentUser}
        userId={userId}
      />

      <AddToGroupDialog
        open={isAddToGroupOpen}
        onOpenChange={setIsAddToGroupOpen}
        type="voice-agent"
        currentGroupId={currentGroup?.group_id ?? null}
        asset={{
          id: selectedAgentForGroup?._id || "",
          name: selectedAgentForGroup?.name || "",
          description: selectedAgentForGroup?.description || "",
        }}
        onSuccess={() => {
          handleRefresh();
          setSelectedAgentForGroup(null);
        }}
      />

      <CreateGroupDialog
        open={isCreateGroupOpen}
        group_type={"voice-agent"}
        onOpenChange={setIsCreateGroupOpen}
        onSuccess={handleRefresh}
      />

      <RenameGroupDialog
        open={isRenameGroupOpen}
        onOpenChange={setIsRenameGroupOpen}
        group={groupToRename}
        onSuccess={handleRefresh}
      />

      <DeleteGroupDialog
        open={isDeleteGroupDialogOpen}
        onOpenChange={setIsDeleteGroupDialogOpen}
        group={groupToDelete}
        onSuccess={() => {
          setCurrentGroup(null);
          handleRefresh();
        }}
      />

      <UpgradePlan
        open={showUpgradePricing}
        onOpen={() => setShowUpgradePricing(false)}
        title="Agent Limit Exceeded"
        description="Your current plan doesn't allow adding more agents. Upgrade your plan to increase your agent limit."
      />

      {isDevEnv && (
        <>
          <WebIDE
            isOpen={isIdeOpen}
            onClose={() => setIsIdeOpen(false)}
            agentData={selectedAgentForIDE}
            allAgents={agents}
            allWorkflows={workflows}
            onSaveAgentData={async (updatedAgentData: any, agentId: string) => {
              try {
                // Check if this is a delete operation
                if (updatedAgentData._delete === true) {
                  // Delete the agent
                  await deleteAgent(agentId);
                  toast({
                    title: "Success",
                    description: "Agent deleted successfully",
                  });
                } else {
                  // Regular update
                  await updateAgent({
                    agentId: agentId,
                    endpoint: "/agents",
                    values: updatedAgentData,
                  });
                  toast({
                    title: "Success",
                    description: "Agent updated successfully",
                  });
                }
                handleRefresh();
              } catch (error) {
                console.error("Error updating agent:", error);
                toast({
                  title: "Error",
                  description: "Failed to update agent",
                });
              }
            }}
            onSaveWorkflowData={async (
              updatedWorkflowData: any,
              workflowId: string,
            ) => {
              try {
                // Check if this is a delete operation
                if (updatedWorkflowData._delete === true) {
                  // Delete the workflow
                  await deleteWorkflow(workflowId);
                  toast({
                    title: "Success",
                    description: "Workflow deleted successfully",
                  });
                } else {
                  // Regular update
                  await updateWorkflow(
                    workflowId,
                    updatedWorkflowData.flow_name,
                    updatedWorkflowData,
                  );
                  toast({
                    title: "Success",
                    description: "Workflow updated successfully",
                  });
                }
                // Refresh workflows after update
                await fetchWorkflows();
              } catch (error) {
                console.error("Error updating workflow:", error);
                toast({
                  title: "Error",
                  description: "Failed to update workflow",
                });
              }
            }}
          />
        </>
      )}
    </>
  );
}

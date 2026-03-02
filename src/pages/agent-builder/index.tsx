import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Code,
  Pencil,
  FolderPlus,
  FolderMinus,
  Folder,
  Trash2,
  RocketIcon,
  Users2,
  CheckSquare,
  Copy,
  ChevronRight,
  Activity,
} from "lucide-react";
import { ArrowLeft } from "lucide-react";

import { cn, isOrgMode, hasPermission } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentBuilder, useUserApps } from "./agent-builder.service";
import { buttonVariants } from "@/components/custom/button";
import { IAgent, IPolicy, ITeamMember, Path, UserRole } from "@/lib/types";
import useStore from "@/lib/store";
import {
  listWorkflows,
  deleteWorkflow,
  updateWorkflow,
  getWorkflowPolicies,
} from "@/services/workflowApiService";
import { useInfiniteUserAssets } from "@/hooks/useInfiniteUserAssets";
import { fetchUserAssets } from "@/services/userAssetsService";
import { Loader2 } from "lucide-react";
import type { UserAssetType } from "@/types/user-assets";
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
// import { useCurrentUser } from "@/hooks/useCurrentUser";
import mixpanel from "mixpanel-browser";
import { isDevEnv, isMixpanelActive, MAIA_URL, IS_PROPHET_DEPLOYMENT } from "@/lib/constants";
import axios from "@/lib/axios";
import ShareAgent from "./share-agent";
import { useOrganization } from "../organization/org.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useGroups } from "../groups/groups.service";
import WebIDE from "./components/WebIDE";
import { AddToGroupDialog } from "@/pages/components/Groups/AddToGroupDialog";
import { CreateGroupDialog } from "@/pages/components/Groups/CreateGroupDialog";
import { RenameGroupDialog } from "@/pages/components/Groups/RenameGroupDialog";
import {
  Group,
  getGroups,
  moveAssetBetweenGroups,
  removeAssetFromGroup,
} from "@/services/groupsApiService";
import { DeleteGroupDialog } from "../components/Groups/DeleteGroupDialog";
import { useToast } from "@/components/ui/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePlan } from "@/components/custom/upgrade-plan";
import { PageBanner } from "./components/page-banner";
import { FilterBar } from "./components/filter-bar";
import { ResourceGroupCard } from "@/components/custom/resource-group-card";
import { ResourceCard } from "@/components/custom/resource-card";
import { FilterToggle } from "@/components/custom/filter-toggle";
import { Workflow } from "@/types/workflow";
import { CreateNewModal } from "./components/create-new-modal";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import ShareWorkflow from "../workflow-builder/components/ShareWorkflow";
import { DeleteWorkflow } from "./components/delete-workflow";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormItem,
  FormField,
  FormMessage,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Agents page visited");

type TabFilterType =
  | "all"
  | "agent"
  | "workflow"
  | "managerial-agent"
  | "folders";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  base_url: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Server URL is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AgentBuilder() {
  // const { userId, currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, _] = useSearchParams();
  const group_name = params.get("group_name");
  const tab_name = params.get("tab");

  const [agentToDelete, setAgentToDelete] = useState<IAgent | null>(null);
  const [agentToDuplicate, setAgentToDuplicate] = useState<IAgent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [workflowPolicies, setWorkflowPolicies] = useState<IPolicy[]>([]);
  // State for IDE toggle and workflows
  const [isIdeOpen, setIsIdeOpen] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflows] = useState<boolean>(false);
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
  const [modalVisible, setModalVisible] = useState<{
    type: "workflow-share" | "workflow-delete" | null;
    id: string;
  }>({ type: null, id: "" });
  const [createVisible, setCreateVisible] = useState<TabFilterType | null>(
    null,
  );
  const [selectedAgentForGroup, setSelectedAgentForGroup] =
    useState<IAgent | null>(null);
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false);
  const [bulkAgentsForGroup, setBulkAgentsForGroup] = useState<IAgent[]>([]);
  const [isBulkMoveDialog, setIsBulkMoveDialog] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isRenameGroupOpen, setIsRenameGroupOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [moveSourceGroupId, setMoveSourceGroupId] = useState<string | null>(null);
  const [draggedAgent, setDraggedAgent] = useState<
    (IAgent & { type?: string }) | null
  >(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [draggedAgentIds, setDraggedAgentIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isBulkDeletingAgents, setIsBulkDeletingAgents] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportA2ADialogOpen, setIsImportA2ADialogOpen] = useState(false);
  const [editingA2AAgent, setEditingA2AAgent] = useState<IAgent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("agentBuilderViewMode");
    return (saved === "list" ? "list" : "grid") as "grid" | "list";
  });
  const [showUpgradePricing, setShowUpgradePricing] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilterType>("all");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [openMenuAgentId, setOpenMenuAgentId] = useState<string | null>(null);

  const apiKey = useStore((state) => state.api_key);
  const token = useStore((state) => state.app_token);
  const {
    usage_data,
    current_organization,
    current_user: currentUser,
  } = useManageAdminStore((state) => state);
  const userId = currentUser?.id ?? "";
  const canUpdateAgent = hasPermission("agents:update", current_organization);
  const canCreateAgent = hasPermission("agents:create", current_organization);
  const isActionable = (agent: IAgent) =>
    [UserRole.owner, UserRole.admin].includes(
      current_organization?.role as UserRole,
    ) || agent.api_key === apiKey;
  const {
    isFetchingAgents,
    getAgents,
    deleteAgent,
    deleteMultiAgent,
    isDeletingAgent,
    createAgent,
    isCreatingAgent,
    updateAgent,
    createA2AAgent,
    isCreatingA2AAgent,
    updateA2AAgent,
    isUpdatingA2AAgent,
    getA2AAgents,
    deleteA2AAgent,
    deleteMultiA2AAgent,
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
  const { moveMultiToGroup, removeMultiAssetsFromGroup } = useGroups(token);
  const isGroupMode = location.search.includes("group_name");
  const { data: userApps = [] } = useUserApps(userId, token);

  interface AgentRegistryData {
    creator_id: string;
    agent_name: string;
    agent_description: string;
    agent_role: string;
    agent_goal: string;
    agent_instruction: string;
    tags: Record<string, string[]>;
    is_public: boolean;
    id: string;
    agent_id: string;
    is_present?: boolean;
    data?: string;
  }

  const { data: agentRegistryData, isFetching: isCheckingRegistry } = useQuery<AgentRegistryData>({
    queryKey: ["agentRegistry", agentToDelete?._id],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/agent-registry/${agentToDelete?._id}`, {
        baseURL: MAIA_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!agentToDelete?._id && IS_PROPHET_DEPLOYMENT,
    retry: false,
  });

  // Map tab filter to user assets API type
  const getApiTypeFromTabFilter = (tab: TabFilterType): UserAssetType => {
    switch (tab) {
      case "agent":
        return "agent";
      case "workflow":
        return "workflow";
      case "managerial-agent":
        return "manager_agent";
      default:
        return "all";
    }
  };

  // Use the infinite scroll user assets hook
  const {
    assets: paginatedAssets,
    total: totalAssets,
    isLoading: isLoadingAssets,
    isFetching: isFetchingAssets,
    isFetchingNextPage,
    hasMore,
    loadMore,
    setType: setAssetType,
    setSearchQuery: setApiSearchQuery,
    isSearching,
  } = useInfiniteUserAssets({
    apiKey,
    limit: 20,
    type: getApiTypeFromTabFilter(tabFilter),
    enabled: !!apiKey && !isGroupMode && initialDataLoaded,
  });

  // Fetch page 1 for all asset types - gives us badge counts AND pre-loaded data.
  const [assetCounts, setAssetCounts] = useState({
    all: 0,
    agent: 0,
    workflow: 0,
    manager_agent: 0,
  });

  const fetchAssetCounts = useCallback(async () => {
    if (!apiKey) return;
    const types = ["all", "agent", "workflow", "manager_agent"] as const;
    try {
      const results = await Promise.all(
        types.map((type) =>
          fetchUserAssets(apiKey, { page: 1, limit: 20, type }),
        ),
      );

      // Seed the infinite query cache so useInfiniteUserAssets picks up data without re-fetching
      types.forEach((type, i) => {
        queryClient.setQueryData(
          ["infiniteUserAssets", apiKey, type, 20],
          { pages: [results[i]], pageParams: [1] },
        );
      });

      setAssetCounts({
        all: results[0].total,
        agent: results[1].total,
        workflow: results[2].total,
        manager_agent: results[3].total,
      });
    } catch (error) {
      console.error("Failed to fetch asset counts:", error);
    }
  }, [apiKey, queryClient]);

  // Ref for the load more trigger element
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isFetchingNextPage) {
        loadMore();
      }
    },
    [hasMore, isFetchingNextPage, loadMore],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const loadGroups = async () => {
    const orgId = current_organization?._id;
    if (!orgId) return;
    try {
      const groupsData = await getGroups(orgId, "agent", token);
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
    setIsRefreshing(true);
    try {
      // Always load groups/folders since they're always visible
      await loadGroups();

      if (isGroupMode) {
        // In group mode, we also need the old API for filtering assets within groups
        let agentsData: IAgent[] = [];
        let a2aAgentsData: IAgent[] = [];

        const agentsRes = await getAgents();
        agentsData = agentsRes?.data || [];
        const a2aAgentsRes = await getA2AAgents();
        a2aAgentsData = a2aAgentsRes?.data || [];
        setAgents([...agentsData, ...a2aAgentsData]);
        setSelectedAgentIds((prev) =>
          prev.filter((id) =>
            [...agentsData, ...a2aAgentsData].some(
              (agent: IAgent) => agent._id === id,
            ),
          ),
        );

        // Fetch workflows for group mode
        await fetchWorkflows();
      } else {
        // Fetch page 1 for all types, seed the infinite query cache, and update counts
        await fetchAssetCounts();
      }

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("User refreshed agents data");
    } catch (err: any) {
      console.log("Error refreshing agents => ", err);
    } finally {
      setIsRefreshing(false);
      setIsBulkDeletingAgents(false);
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
    setIsLoadingWorkflows(true);
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
        setWorkflows(
          workflowList?.map((workflow) => ({
            ...workflow,
            name: workflow.flow_name,
            type: "Workflow",
            _id: workflow?.flow_id,
          })),
        );
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
      setIsLoadingWorkflows(false);
    }
  };

  // const isAgentLaunched = (agentId: string) => {
  //   return agentRegistryData?.is_present
  //     ? { launched: !!agentId && true, appId: agentRegistryData?.id }
  //     : { launched: false, appId: null };
  // };

  const isAgentLaunched = (agentId: string) => {
      const foundIndex = userApps.findIndex(
        (app: any) => app.agent_id === agentId,
      );
      return foundIndex > 0;
  };

  const handleDragStart = (
    e: React.DragEvent,
    agent: IAgent & { type?: string },
  ) => {
    setDraggedAgent(agent);

    // If in selection mode and there are selected agents, drag all selected ones
    if (isSelectionMode && selectedAgentIds.length > 0) {
      const agentIdsToDrag = selectedAgentIds.includes(agent._id)
        ? selectedAgentIds
        : [...selectedAgentIds, agent._id];
      setDraggedAgentIds(Array.from(new Set(agentIdsToDrag)));

      e.dataTransfer.setData(
        "text/plain",
        `Dragging ${agentIdsToDrag.length} item${agentIdsToDrag.length > 1 ? "s" : ""}`,
      );
    } else {
      setDraggedAgentIds([agent._id]);
    }
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDragOverGroup(groupId);
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDropOnGroup = async (
    e: React.DragEvent<HTMLDivElement> | Group,
    group: Group,
  ) => {
    console.log("drop event => ", e);
    const agentIdsToHandle =
      draggedAgentIds.length > 0
        ? draggedAgentIds
        : draggedAgent
          ? [draggedAgent._id]
          : [];
    console.log({ agentIdsToHandle });
    if (agentIdsToHandle.length === 0) return;

    const agentsToHandle = [...agents, ...workflows].filter((agent) =>
      agentIdsToHandle.includes(agent._id),
    );
    if (agentsToHandle.length === 0) return;

    const orgId = current_organization?._id;
    if (!orgId) return;

    try {
      const agentsToMove: (IAgent & { type?: string })[] = [];
      const agentsToAdd: (IAgent & { type?: string })[] = [];

      agentsToHandle.forEach((agent) => {
        const currentAgentGroup = groups.find((g) =>
          g.assets.some((a) => a.asset_id === agent._id),
        );

        if (
          currentAgentGroup &&
          currentAgentGroup.group_id !== group.group_id
        ) {
          agentsToMove.push(agent);
        } else if (!currentAgentGroup) {
          agentsToAdd.push(agent);
        }
      });

      // Move between groups
      if (agentsToMove.length > 0) {
        const moveOperations = agentsToMove.map(async (agent) => {
          const currentAgentGroup = groups.find((g) =>
            g.assets.some((a) => a.asset_id === agent._id),
          );
          if (currentAgentGroup) {
            await moveAssetBetweenGroups(
              currentAgentGroup.group_name,
              currentAgentGroup.group_type,
              agent._id,
              orgId,
              {
                to_group_name: group.group_name,
                to_group_type: group.group_type,
              },
              token,
            );
          }
        });
        await Promise.all(moveOperations);
      }
      if (agentsToAdd.length > 0) {
        const payload = agentsToAdd.map((agent) => ({
          asset_id: agent._id,
          asset_type: "agent",
          asset_name: agent.name,
          metadata: {
            description: agent.description,
            type: agent?.type,
          },
        }));

        await moveMultiToGroup({
          groupName: group.group_name,
          groupType: group.group_type,
          organizationId: orgId,
          payload,
        });
      }

      const totalProcessed = agentsToMove.length + agentsToAdd.length;
      if (totalProcessed > 0) {
        toast({
          title: "Success",
          description: `${totalProcessed} agent${totalProcessed > 1 ? "s" : ""} added to "${group.group_name}"`,
        });
      }
      if (isSelectionMode) cancelSelectionMode();

      if (current_organization?.org_id) handleRefresh();
    } catch (error) {
      console.error("Failed to add agent to group:", error);
      toast({
        title: "Error",
        description: "Failed to add agent to group",
        variant: "destructive",
      });
    } finally {
      setDraggedAgent(null);
      setDraggedAgentIds([]);
      setDragOverGroup(null);
    }
  };

  const enterSelectionMode = (agentId?: string) => {
    setIsSelectionMode(true);
    if (agentId) {
      setSelectedAgentIds((prev) =>
        prev.includes(agentId) ? prev : [...prev, agentId],
      );
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedAgentIds([]);
    setIsBulkDeletingAgents(false);
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      const isAlreadySelected = prev.includes(agentId);
      if (isAlreadySelected) {
        const updated = prev.filter((id) => id !== agentId);
        return updated;
      }
      return [...prev, agentId];
    });
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedAgentIds.length === 0) return;
    setIsBulkDeletingAgents(true);
    const selectedItems = displayAssets.filter((item) =>
      selectedAgentIds.includes(item._id),
    );

    const workflowsToDelete = selectedItems.filter(
      (item) => item?.type === "Workflow",
    );

    const a2aAgentsToDelete = selectedItems.filter(
      (item) => item?.agent_type === "a2a",
    );

    const agentsToDelete = selectedItems.filter(
      (item) =>
        item?.agent_type !== "a2a" &&
        item?.type !== "Workflow" &&
        (item?.type === "Agent" || item?.type === "Manager Agent"),
    );

    const selectForDeleteIds = agentsToDelete.map((agent) => agent._id);
    const deletedAgentIds: string[] = [];

    if (selectForDeleteIds.length > 0) {
      try {
        await deleteMultiAgent({ agentIds: selectForDeleteIds });
        deletedAgentIds.push(...selectForDeleteIds);
      } catch (error) {
        console.error("Error deleting agents during bulk delete:", error);
        toast({
          title: "Error",
          description: "Failed to delete selected agents. Please try again.",
          variant: "destructive",
        });
        setIsBulkDeletingAgents(false);
        return;
      }
    }

    if (workflowsToDelete.length > 0) {
      try {
        const promises = workflowsToDelete.map((workflow) =>
          deleteWorkflow(workflow?._id),
        );
        await Promise.all(promises);
        deletedAgentIds.push(...workflowsToDelete.map((w) => w?._id));
      } catch (error) {
        console.error("Error deleting workflows during bulk delete:", error);
        toast({
          title: "Error",
          description: "Failed to delete selected workflows. Please try again.",
          variant: "destructive",
        });
        setIsBulkDeletingAgents(false);
        return;
      }
    }

    if (a2aAgentsToDelete.length > 0) {
      try {
        await deleteMultiA2AAgent({
          agentIds: a2aAgentsToDelete.map((a2aAgent) => a2aAgent._id),
        });
        deletedAgentIds.push(
          ...a2aAgentsToDelete.map((a2aAgent) => a2aAgent._id),
        );
      } catch (error) {
        console.error("Error deleting A2A agents during bulk delete:", error);
        toast({
          title: "Error",
          description:
            "Failed to delete selected A2A agents. Please try again.",

          variant: "destructive",
        });
        setIsBulkDeletingAgents(false);
        return;
      }
    }

    if (currentGroup && deletedAgentIds.length > 0) {
      try {
        await removeMultiAssetsFromGroup({
          groupName: currentGroup.group_name,
          groupType: currentGroup.group_type,
          organizationId: current_organization?._id || "",
          assetIds: deletedAgentIds,
        });
      } catch (error) {
        console.error("Failed to remove agents from group", error);
      }
    }

    toast({
      title: "Success",
      description: `${deletedAgentIds.length} agent${deletedAgentIds.length === 1 ? "" : "s"} deleted successfully`,
    });
    setIsBulkDeleteDialogOpen(false);
    cancelSelectionMode();
    await handleRefresh();
  };

  const handleRemoveFromGroup = async () => {
    if (!currentGroup) return;
    try {
      await removeMultiAssetsFromGroup({
        groupName: currentGroup.group_name,
        groupType: currentGroup.group_type,
        organizationId: current_organization?._id || "",
        assetIds: selectedAgentIds,
      });
      toast({
        title: "Success",
        description: `${selectedAgentIds.length} agent${selectedAgentIds.length === 1 ? "" : "s"} removed from "${currentGroup.group_name}"`,
      });
      cancelSelectionMode();
      handleRefresh();
    } catch (error) {
      console.error("Failed to remove agents from group:", error);
    }
  };

  const handleOpenBulkMoveDialog = () => {
    if (currentGroup) handleRemoveFromGroup();
    else {
      if (selectedAgentIds.length === 0) return;
      const selectedAgentsList = [...agents, ...workflows].filter((agent) =>
        selectedAgentIds.includes(agent._id),
      );
      if (selectedAgentsList.length === 0) return;
      setBulkAgentsForGroup(selectedAgentsList);
      setIsBulkMoveDialog(true);
      setIsAddToGroupOpen(true);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedAgentIds.length === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  useEffect(() => {
    if (currentGroup) {
      const updated = groups.find((g) => g.group_id === currentGroup.group_id);
      if (updated) setCurrentGroup(updated);
    }
  }, [groups, currentGroup]);

  useEffect(() => {
    setTabFilter((tab_name as TabFilterType) || "all");
  }, [tab_name]);

  useEffect(() => {
    const fetchTeamAndPolicyData = async () => {
      if (!current_organization?.org_id) return;

      try {
        const [teamRes, policyRes, workflowPoliciesRes] = await Promise.all([
          getCurrentOrgMembers(),
          getAgentPolicy(),
          getWorkflowPolicies(current_organization.org_id, token || ""),
        ]);

        setTeam(teamRes.data);
        setPolicies(policyRes.data);
        setWorkflowPolicies(workflowPoliciesRes);
      } catch (error) {
        console.error("Failed to fetch team and policy data:", error);
      }
    };

    fetchTeamAndPolicyData();
  }, [current_organization?.org_id, token]);

  // Sync tab filter with asset type for pagination
  useEffect(() => {
    if (!isGroupMode) {
      setAssetType(getApiTypeFromTabFilter(tabFilter));
    }
  }, [tabFilter, isGroupMode, setAssetType]);

  // Load data when entering group mode (inside a folder)
  useEffect(() => {
    const loadGroupModeData = async () => {
      if (isGroupMode && current_organization?._id) {
        try {
          // Load groups to get current group's assets
          await loadGroups();
          // Load agents and workflows using old APIs
          const agentsRes = await getAgents();
          const a2aAgentsRes = await getA2AAgents();
          setAgents([...agentsRes.data, ...a2aAgentsRes.data]);
          await fetchWorkflows();
        } catch (error) {
          console.error("Error loading group mode data:", error);
        }
      }
    };
    loadGroupModeData();
  }, [isGroupMode, current_organization?._id]);

  // Handle search query - use API search when not in group mode
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (!isGroupMode) {
      setApiSearchQuery(query);
    }
  };

  // Convert paginated assets to the format expected by ResourceCard
  const convertPaginatedAssets = (): (IAgent & { type?: string })[] => {
    // When using API search (not in group mode), filtering is done server-side
    // Only filter folders since they're handled separately
    return paginatedAssets
      .filter((asset) => asset.type !== "folder")
      .map((asset) => {
        // Map unified asset to IAgent-like structure
        const type =
          asset.type === "workflow"
            ? "Workflow"
            : asset.type === "manager_agent"
              ? "Manager Agent"
              : "Agent";

        return {
          _id: asset.id,
          name: asset.name,
          type,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          description:
            asset.metadata && "description" in asset.metadata
              ? String(asset.metadata.description || "")
              : "",
          // For workflows, we need flow_id for navigation
          flow_id: asset.type === "workflow" ? asset.id : undefined,
          // Default values for IAgent fields
          api_key: apiKey,
          agent_role: "",
          agent_instructions: "",
          features: [],
          tool: null,
          llm_credential_id: "",
          model:
            asset.metadata && "model" in asset.metadata
              ? String(asset.metadata.model || "")
              : "",
          temperature: "",
          top_p: "",
          system_prompt: "",
          provider_id:
            asset.metadata && "provider_id" in asset.metadata
              ? String(asset.metadata.provider_id || "")
              : "",
          template_type: "",
          tool_usage_description: "",
          version:
            asset.metadata && "version" in asset.metadata
              ? String(asset.metadata.version || "")
              : "",
          examples: "",
          response_format: { type: "text" as const },
          // Mark shared status from the unified asset
          _shared: asset.shared,
        } as IAgent & { type?: string; flow_id?: string; _shared?: boolean };
      });
  };

  const handleEditA2AAgent = (agent: IAgent) => {
    setEditingA2AAgent(agent);
    form.reset({
      name: agent.name || "",
      // @ts-ignore
      base_url: agent?.base_url || "",
      description: agent.description || "",
    });
    setIsImportA2ADialogOpen(true);
  };

  const handleAgentClick =
    (agent: IAgent & { type?: string }) =>
      (e: React.MouseEvent<Element, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.shiftKey) {
          if (!isSelectionMode) {
            enterSelectionMode(agent._id);
          } else {
            toggleAgentSelection(agent._id);
          }
          return;
        }

        if (isSelectionMode) {
          toggleAgentSelection(agent._id);
          return;
        }
        const launchStatus = isAgentLaunched(agent._id);
        const groupNameParam = currentGroup?.group_name
          ? `?group_name=${currentGroup?.group_name}`
          : "";

        if (agent?.type && ["Manager Agent", "Agent"].includes(agent?.type)) {
          if (agent?.agent_type === "a2a") {
            navigate(`/agent-chat/${agent._id}`, {
              state: { agent },
            });
          } else {
            navigate(`/agent-create/${agent._id}${groupNameParam}`, {
              state: {
                agent,
                isLaunched: launchStatus,
                appId: userApps.find((app: any) => app.agent_id === agent._id)?.id,
              },
            });
          }
        } else {
          // @ts-ignore
          navigate(`/multi-agent-workflow/${agent.flow_id}`);
        }
      };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    if (agentToDelete?.agent_type === "a2a") {
      await deleteA2AAgent(agentToDelete._id);
      toast({
        title: "Success",
        description: "A2A Agent deleted successfully",
      });
      handleRefresh();
      return;
    }
    try {
      if (agentRegistryData?.is_present) {
        try {
          await axios.delete(`/api/v1/agent-registry/${agentToDelete?._id}`, {
            baseURL: MAIA_URL,
            headers: { Authorization: `Bearer ${token}` },
          });
          toast({
            title: "Success",
            description: "Launched app deleted successfully",
          });
        } catch (appError) {
          console.error("Error deleting launched app:", appError);
          toast({
            title: "Error",
            description: "Failed to delete launched app",
            variant: "destructive",
          });
          return;
        }
      }

      await deleteAgent(agentToDelete._id);
      toast({ title: "Success", description: "Agent deleted successfully" });
      if (currentGroup) {
        // Remove agent from group if inside a group
        await removeAssetFromGroup(
          currentGroup.group_name,
          currentGroup.group_type,
          agentToDelete._id,
          current_organization?._id || "",
          token,
        );
        toast({
          title: "Success",
          description: `Removed "${agentToDelete.name}" from "${currentGroup.group_name}"`,
        });
      }
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Deleted agent", { agent_id: agentToDelete._id });
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

  const removeFromGroupHandler = async (agent: IAgent & { type?: string }) => {
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

      // In non-group mode, list items can come from `convertPaginatedAssets()` which
      // intentionally leaves many agent fields blank (including temperature/top_p).
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
    }
    // else if (group_name) {
    //   navigate(`${Path.AGENT_CREATE}?group_name=${currentGroup?.group_name}`);
    // }
    else {
      // navigate(Path.AGENT_CREATE);
      setCreateVisible("agent");
    }
  };

  // Helper function to find which folder an agent/workflow belongs to
  const getAgentFolder = (agent: IAgent & { type?: string; flow_id?: string }): string | undefined => {
    // For workflows, use flow_id; for agents, use _id
    const assetId = agent?.flow_id || agent._id;
    const group = groups.find((g) =>
      g.assets.some((asset) => asset.asset_id === assetId),
    );
    return group?.group_name;
  };

  /**
   * Group-mode (inside folder) must render from the folder's asset list.
   * The legacy `/agents/` + `listWorkflows()` sources may not include grouped assets,
   * which leads to "folder badge shows, but folder appears empty".
   */
  const groupModeAssets = useMemo(() => {
    if (!currentGroup) return [];

    const byId = new Map<string, any>();

    agents.forEach((agent) => {
      const normalizedType = Boolean((agent as any)?.managed_agents?.length)
        ? "Manager Agent"
        : "Agent";
      byId.set(agent._id, { ...agent, type: (agent as any)?.type ?? normalizedType });
    });

    workflows.forEach((workflow: any) => {
      const id = workflow?.flow_id ?? workflow?._id;
      if (!id) return;
      byId.set(id, {
        ...workflow,
        _id: id,
        name: workflow?.flow_name ?? workflow?.name ?? id,
        description: workflow?.description ?? "",
        type: "Workflow",
        flow_id: id,
      });
    });

    const seen = new Set<string>();
    const items = currentGroup.assets.reduce<any[]>((acc, asset) => {
      const id = asset.asset_id;
      if (seen.has(id)) return acc;
      seen.add(id);
      const existing = byId.get(id);
      if (existing) { acc.push(existing); return acc; }

      const metadata: any = asset.metadata ?? {};
      const metadataType = typeof metadata?.type === "string" ? metadata.type : undefined;
      const inferredType =
        metadataType ??
        (asset.asset_type === "workflow"
          ? "Workflow"
          : asset.asset_type === "manager_agent"
            ? "Manager Agent"
            : "Agent");

      const description = typeof metadata?.description === "string" ? metadata.description : "";

      // Minimal stub to keep card rendering/navigation working.
      const stub: any = {
        _id: id,
        name: asset.asset_name,
        description,
        type: inferredType,
        created_at: currentGroup.created_at,
        updated_at: currentGroup.updated_at,
        api_key: apiKey,
        agent_role: "",
        agent_instructions: "",
        features: [],
        tool: null,
        llm_credential_id: "",
        model: "",
        temperature: "",
        top_p: "",
        system_prompt: "",
        provider_id: "",
        template_type: "",
        tool_usage_description: "",
        version: "",
        examples: "",
        response_format: { type: "text" as const },
      };

      if (inferredType === "Workflow") {
        stub.flow_id = id;
        stub.flow_name = asset.asset_name;
      }

      acc.push(stub);
      return acc;
    }, []);

    // Search filter (matches legacy behavior).
    const q = searchQuery.trim().toLowerCase();
    const searched = items.filter((item: any) => {
      // NOTE: We intentionally keep voice agents visible in folders for consistency with the All view,
      // which is powered by `/user-assets` and does not expose `voice_config` for filtering.
      // if (item?.voice_config) return false;
      if (!q) return true;
      return (
        String(item?.name ?? "").toLowerCase().includes(q) ||
        String(item?.description ?? "").toLowerCase().includes(q)
      );
    });

    switch (tabFilter) {
      case "workflow":
        return searched.filter((item: any) => item?.type === "Workflow");
      case "managerial-agent":
        return searched.filter((item: any) => item?.type === "Manager Agent");
      case "agent":
        return searched.filter((item: any) => item?.type === "Agent");
      case "folders":
        return [];
      case "all":
      default:
        return searched;
    }
  }, [currentGroup, agents, workflows, apiKey, searchQuery, tabFilter]);

  // Use paginated data when not in group mode.
  const displayAssets = isGroupMode ? groupModeAssets : convertPaginatedAssets();

  // Static counts for tab badges - always use assetCounts to keep counts stable
  const totalAgents = displayAssets;
  const allAgentsCount = assetCounts.all;
  const basicAgentsCount = assetCounts.agent;
  const workflowsCount = assetCounts.workflow;
  const managerialAgentsCount = assetCounts.manager_agent;
  const foldersCount = groups.length;

  useEffect(() => {
    if (group_name) {
      const current_group = groups.find((g) => g.group_name === group_name);
      if (current_group) setCurrentGroup(current_group);
    }
  }, [group_name, groups.length]);

  const initialFetchRef = useRef(false);
  useEffect(() => {
    if (current_organization?.org_id && apiKey && !initialFetchRef.current) {
      initialFetchRef.current = true;
      handleRefresh().then(() => setInitialDataLoaded(true));
    }
  }, [current_organization?.org_id, apiKey]);

  const trackMCPClick = () => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("MCP Called");
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      base_url: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingA2AAgent) {
        await updateA2AAgent({
          agentId: editingA2AAgent._id,
          name: values.name,
          base_url: values.base_url,
          description: values.description,
        });
        toast({
          title: "Success",
          description: "A2A Agent updated successfully",
        });
      } else {
        await createA2AAgent({
          name: values.name,
          base_url: values.base_url,
          description: values.description,
        });
        toast({
          title: "Success",
          description: "A2A Agent created successfully",
        });
      }
      setIsImportA2ADialogOpen(false);
      setEditingA2AAgent(null);
      form.reset();
      await handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          `Failed to ${editingA2AAgent ? "update" : "create"} A2A Agent`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="-z-10 flex h-full w-full flex-col space-y-4 px-8 py-4"
      >
        <div className="flex items-center justify-between">
          <PageBanner />
          <div className="flex items-center gap-2 text-primary/80">
            <Button
              variant="outline"
              size="default"
              onClick={() => window.location.href}
            >
              <Link to={Path.EXECUTIONS} className="flex w-full flex-row">
                <Activity className="mr-2 size-4" />
                Executions
              </Link>
            </Button>
            {!isGroupMode && (
              <Button
                variant="outline"
                onClick={() => setIsCreateGroupOpen(true)}
                className="place-self-end"
              >
                <FolderPlus className="mr-2 size-4" />
                Create Folder
              </Button>
            )}
            {/* <Button
              variant="outline"
              onClick={() => {
                setEditingA2AAgent(null);
                form.reset({
                  name: "",
                  base_url: "",
                  description: "",
                });
                setIsImportA2ADialogOpen(true);
              }}
            >
              <ArrowDownToLine className="mr-2 size-4" />
              Import (A2A)
            </Button> */}
            {canCreateAgent && (
              <Button size="default" onClick={handleCreateAgent}>
                <Plus className="mr-2 h-5 w-5" />
                Create Agent
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0">
            <FilterToggle
              value={tabFilter}
              setValue={(value) => {
                if (value) {
                  if (value === "folders") {
                    setCurrentGroup(null);
                    params.delete("group_name");
                    navigate(Path.AGENT_BUILDER);
                  }
                  setTabFilter(value as TabFilterType);
                }
              }}
              items={[
                { id: "all", label: "All", count: allAgentsCount + foldersCount },
                { id: "agent", label: "Agents", count: basicAgentsCount },
                {
                  id: "managerial-agent",
                  label: "Managerial",
                  count: managerialAgentsCount,
                },
                { id: "workflow", label: "Workflows", count: workflowsCount },
                {
                  id: "folders",
                  label: "Folders",
                  count: foldersCount,
                  icon: <Folder className="size-3.5" />,
                },
              ]}
            />
          </div>
          <Link
            to="https://pypi.org/project/lyzr-mcp-tool-call/"
            target="_blank"
          >
            <div
              className="flex items-center gap-2 rounded-md border p-1"
              onClick={trackMCPClick}
            >
              <Badge>New</Badge>
              <p className="text-sm">
                Use your Lyzr agents as tools in any MCP-compatible client and
                interact with them directly
              </p>
              <ChevronRight className="size-4" />
            </div>
          </Link>
        </div>
        <div className="flex h-[calc(100%-5rem)] flex-col">
          {/* Search and buttons section */}
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchQueryChange}
            handleFolder={() => setIsCreateGroupOpen(true)}
            handleIDE={() => setIsIdeOpen(true)}
            isGroupMode={isGroupMode}
            loading={isRefreshing || isFetchingAgents ||
              (!isGroupMode && isFetchingAssets && !isFetchingNextPage)
            }
            isSearchLoading={isSearching && isLoadingAssets}
            onCreateAgent={handleCreateAgent}
            onRefresh={handleRefresh}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isSelectionMode={isSelectionMode}
            onCancelSelectionMode={cancelSelectionMode}
            onMoveToFolder={handleOpenBulkMoveDialog}
            onBulkDelete={openBulkDeleteDialog}
            selectedCount={selectedAgentIds.length}
            isBulkDeleting={isBulkDeletingAgents}
            onEnterSelectionMode={enterSelectionMode}
            onImport={() => {
              setEditingA2AAgent(null);
              setIsImportA2ADialogOpen(true);
            }}
          />

          <div className="space-y-4 overflow-y-auto overflow-x-hidden pr-2">
            {/* Back button when inside a group */}
            {currentGroup && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage
                      onClick={() => {
                        setCurrentGroup(null);
                        params.delete("group_name");
                        navigate(Path.AGENT_BUILDER);
                      }}
                      className="inline-flex cursor-pointer items-center"
                    >
                      <ArrowLeft className="mr-1 size-3" />
                      Back to Agents
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
            {/* {viewMode === "list" && (
              <div className="mb-2 flex items-center border-b bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground">
                <div className="min-w-0 flex-1">Name</div>
                <div className="w-40 px-4">Type</div>
                <div className="w-44 px-4">Last Used</div>
                <div className="w-40 px-4">Shared With</div>
                <div className="w-16"></div>
              </div>
            )} */}

            {/* Folders section - visible when tabFilter is "folders" or "all", and not inside a group */}
            {(tabFilter === "folders" || tabFilter === "all") && !currentGroup && (
              <>
                {groups.length > 0 ? (
                  <div
                    id="folders-section"
                    className={cn(
                      "grid",
                      viewMode === "grid"
                        ? "large-screen:grid-cols-6 gap-4 sm:grid-cols-4 2xl:grid-cols-5"
                        : "grid-cols-1",
                    )}
                  >
                    {isRefreshing || isFetchingAgents
                      ? new Array(6)
                        .fill(0)
                        .map((_, index) => (
                          <Skeleton
                            key={`folder-skeleton-${index}`}
                            className={cn(
                              "my-2 w-full rounded-xl",
                              viewMode === "grid" ? "h-[180px]" : "h-[50px]",
                            )}
                          />
                        ))
                      : groups
                        .filter(
                          (g) =>
                            g?.group_name
                              ?.toLowerCase()
                              ?.includes(searchQuery?.toLowerCase()) ||
                            !searchQuery,
                        )
                        .map((group, index) => (
                          <ResourceGroupCard
                            group={group}
                            index={index}
                            type={viewMode}
                            key={group.group_id}
                            onDragOver={(e) => handleDragOver(e, group.group_id)}
                            onDrop={async (e: React.DragEvent<Element>) =>
                              handleDropOnGroup(
                                e as React.DragEvent<HTMLDivElement>,
                                group,
                              )
                            }
                            onDragLeave={handleDragLeave}
                            isDragOver={dragOverGroup === group.group_id}
                            onClick={() => {
                              setSearchQuery("");
                              setApiSearchQuery("");
                              setCurrentGroup(group);
                              setTabFilter("all");
                              params.set("group_name", group.group_name);
                              navigate(
                                `${Path.AGENT_BUILDER}?group_name=${group.group_name}`,
                              );
                            }}
                            onEdit={(group) => {
                              setGroupToRename(group);
                              setIsRenameGroupOpen(true);
                            }}
                            onDelete={(group) => {
                              setIsDeleteGroupDialogOpen(true);
                              setGroupToDelete(group);
                            }}
                          />
                        ))}
                  </div>
                ) : tabFilter === "folders" ? (
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
                    <p className="pb-5 font-medium">No Folders found</p>
                    <Button onClick={() => setIsCreateGroupOpen(true)}>
                      <FolderPlus className="mr-1 size-4" /> Create Folder
                    </Button>
                  </div>
                ) : null}
              </>
            )}

            {/* Assets section - visible for all tabs except "folders" only */}
            {tabFilter !== "folders" && (
              <>
                <div
                  className={cn(
                    "z-50 grid ",
                    viewMode === "grid"
                      ? "large-screen:grid-cols-6 gap-4 sm:grid-cols-4 2xl:grid-cols-5"
                      : "grid-cols-1",
                  )}
                >
                  {(isRefreshing ||
                    isFetchingAgents ||
                    (isLoadingAssets && !isGroupMode) ||
                    (isFetchingAssets &&
                      !isFetchingNextPage &&
                      !isGroupMode &&
                      paginatedAssets.length === 0) ||
                    (tabFilter === "workflow" && isLoadingWorkflow) ? (
                    new Array(6)
                      .fill(0)
                      .map((_, index) => (
                        <Skeleton
                          key={`skeleton-${index}`}
                          className={cn(
                            "my-2 w-full rounded-xl",
                            viewMode === "grid" ? "h-[180px]" : "h-[50px]",
                          )}
                        />
                      ))
                  ) : totalAgents.length > 0 ? (
                    totalAgents.map((agent: IAgent & { type?: string }, index) => {
                      const agentPolicies = policies.filter(
                        (policy) => policy?.resource_id === (agent?._id ?? ""),
                      );
                      const workflowsPolicies = workflowPolicies.filter(
                        (policy) => policy?.resource_id === (agent?._id ?? ""),
                      );
                      const sharedAgentUsers = team
                        ?.filter((member: ITeamMember) =>
                          agentPolicies
                            ?.map((p: IPolicy) => p?.user_id)
                            .includes(member?.user_id),
                        )
                        ?.map((member: ITeamMember) => member?.email);
                      const sharedWorkflowUsers = team
                        ?.filter((member: ITeamMember) =>
                          workflowsPolicies
                            ?.map((p: IPolicy) => p?.user_id)
                            .includes(member?.user_id),
                        )
                        ?.map((member: ITeamMember) => member?.email);

                      const folderName = !currentGroup ? getAgentFolder(agent) : undefined;

                      // Find the folder group for navigation
                      const assetId = (agent as any)?.flow_id || agent._id;
                      const agentGroup = groups.find((g) =>
                        g.assets.some((asset) => asset.asset_id === assetId),
                      );

                      return (
                        <ResourceCard<(IAgent & { type?: string }) | Workflow>
                          index={index}
                          item={agent}
                          viewMode={viewMode}
                          withGradientIcon
                          title={agent.name}
                          type={agent?.type}
                          timestamp={agent?.updated_at ?? agent?.created_at}
                          description={agent.description}
                          folderName={folderName}
                          onFolderClick={
                            agentGroup
                              ? () => {
                                setSearchQuery("");
                                setApiSearchQuery("");
                                setCurrentGroup(agentGroup);
                                setTabFilter("all");
                                params.set("group_name", agentGroup.group_name);
                                navigate(
                                  `${Path.AGENT_BUILDER}?group_name=${agentGroup.group_name}`,
                                );
                              }
                              : undefined
                          }
                          onClick={handleAgentClick(agent)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedAgentIds.includes(agent._id)}
                          onToggleSelect={(e) => {
                            e.stopPropagation();
                            toggleAgentSelection(agent._id);
                          }}
                          badges={[
                            {
                              icon: (
                                <Users2 className="size-4 text-muted-foreground" />
                              ),
                              visible:
                                agent?.type === "Agent"
                                  ? sharedAgentUsers.length > 0
                                  : sharedWorkflowUsers.length > 0,
                              tooltip: `Shared with ${agent?.type === "Agent" ? sharedAgentUsers.length : sharedWorkflowUsers.length} user(s)`,
                            },
                            {
                              icon: (
                                <RocketIcon className="size-4 text-muted-foreground" />
                              ),
                              visible: isAgentLaunched(agent._id),
                              tooltip: "Launched as Agent",
                            },
                          ]}
                          dropdownOpen={openMenuAgentId === agent._id}
                          onDropdownOpenChange={(open) =>
                            setOpenMenuAgentId(open ? agent._id : null)
                          }
                          actions={!canUpdateAgent ? [] : [
                            {
                              label: "Edit",
                              icon: <Pencil className="size-4" />,
                              visible:
                                agent?.agent_type === "a2a" ||
                                ["Agent", "Manager Agent"].includes(
                                  agent?.type ?? "",
                                ),
                              onClick: () => (e) => {
                                e.stopPropagation();
                                if (agent?.agent_type === "a2a") {
                                  handleEditA2AAgent(agent);
                                } else {
                                  handleAgentClick(agent)(e);
                                }
                              },
                            },
                            {
                              label: "Select",
                              icon: <CheckSquare className="size-4" />,
                              visible: true,
                              onClick: () => (e) => {
                                e.stopPropagation();
                                // @ts-ignore
                                enterSelectionMode(agent._id || agent?.flow_id);
                              },
                            },
                            {
                              label: "Share",
                              icon: <Users2 className="size-4" />,
                              visible:
                                agent?.agent_type !== "a2a" &&
                                isOrgMode(usage_data?.plan_name) &&
                                isActionable(agent),
                              onClick: () => (e) => {
                                e.stopPropagation();
                                if (
                                  ["Agent", "Manager Agent"].includes(
                                    agent?.type ?? "",
                                  )
                                ) {
                                  setSelectedAgent(agent);
                                  setShareVisible(true);
                                }

                                if (agent?.type === "Workflow") {
                                  setModalVisible({
                                    id: agent?._id,
                                    type: "workflow-share",
                                  });
                                }
                              },
                            },
                            // {
                            //   label: isAgentLaunched(agent._id).launched
                            //     ? "View Agent"
                            //     : "Launch Agent",
                            //   icon: isAgentLaunched(agent._id).launched ? (
                            //     <ExternalLink className="size-4" />
                            //   ) : (
                            //     <RocketIcon className="size-4" />
                            //   ),
                            //   visible: ["Agent", "Manager Agent"].includes(
                            //     agent?.type ?? "",
                            //   ),
                            //   onClick: () => (e) => {
                            //     e.stopPropagation();
                            //     if (isAgentLaunched(agent._id).launched) {
                            //       const appId = isAgentLaunched(agent._id).appId;
                            //       window.open(`/agent/${appId}`, "_blank");
                            //     } else {
                            //       setSelectedAgent(agent);
                            //       setIsLaunchOpen(true);
                            //     }
                            //   },
                            // },
                            {
                              label: "Duplicate Agent",
                              icon: <Copy className="size-4" />,
                              visible:
                                agent?.agent_type !== "a2a" &&
                                ["Agent", "Manager Agent"].includes(
                                  agent?.type ?? "",
                                ),
                              onClick: () => (e) => {
                                e.stopPropagation();
                                setAgentToDuplicate(agent);
                              },
                            },
                            {
                              label: "Move to Folder",
                              icon: <FolderPlus className="size-4" />,
                              visible: agent?.agent_type !== "a2a",
                              onClick: () => (e) => {
                                e.stopPropagation();
                                setSelectedAgentForGroup(agent);
                                setMoveSourceGroupId(agentGroup?.group_id ?? null);
                                setIsAddToGroupOpen(true);
                              },
                            },
                            {
                              label: "Edit as JSON",
                              icon: <Code className="size-4" />,
                              visible:
                                agent?.agent_type !== "a2a" &&
                                isDevEnv &&
                                isActionable(agent) &&
                                ["Agent", "Manager Agent"].includes(
                                  agent?.type ?? "",
                                ),
                              onClick: () => (e) => {
                                e.stopPropagation();
                                setSelectedAgentForIDE(agent);
                                setIsIdeOpen(true);
                              },
                            },
                            {
                              label: "Remove from Folder",
                              icon: <FolderMinus className="size-4" />,
                              visible:
                                agent?.agent_type !== "a2a" &&
                                currentGroup !== null,
                              className: "text-destructive",
                              onClick: () => (e) => {
                                e.stopPropagation();
                                removeFromGroupHandler(agent);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="size-4" />,
                              visible: isActionable(agent),
                              className: "text-destructive",
                              onClick: () => (e) => {
                                e.stopPropagation();
                                if (
                                  ["Agent", "Manager Agent"].includes(
                                    agent?.type ?? "",
                                  ) ||
                                  agent?.agent_type === "a2a"
                                ) {
                                  setAgentToDelete(agent);
                                }

                                if (agent?.type === "Workflow") {
                                  setModalVisible({
                                    id: agent?._id,
                                    type: "workflow-delete",
                                  });
                                }
                              },
                            },
                          ]}
                          key={agent._id}
                          onDragStart={(e) => handleDragStart(e, agent)}
                          onDragEnd={() => {
                            setDraggedAgent(null);
                            setDragOverGroup(null);
                          }}
                        />
                      );
                    })
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
                      <p className="pb-5 font-medium">
                        No {tabFilter === "workflow" ? "Workflows" : "Agents"} found
                      </p>

                      {canCreateAgent && (
                        <Button onClick={handleCreateAgent}>
                          <Plus className="mr-1 size-4" /> Create new
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Infinite scroll trigger - only show when not in group mode */}
                {!isGroupMode && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm">Loading more...</span>
                      </div>
                    )}
                    {!hasMore && totalAssets > 0 && paginatedAssets.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Showing all {tabFilter === "all" ? totalAssets + foldersCount : totalAssets} items
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={!!agentToDelete}
        onOpenChange={(open) => {
          if (!open && isDeletingAgent) return;
          if (!open) setAgentToDelete(null);
        }}
        title={
          isAgentLaunched(agentToDelete?._id || "")
            ? "Delete Agent & Published App"
            : "Delete Agent"
        }
        description={
          agentRegistryData?.is_present
            ? "Deleting this agent will also permanently delete its published app. This action cannot be undone. Are you sure you want to continue?"
            : `Are you sure you want to delete "${agentToDelete?.name ?? ""}"? This action cannot be undone.`
        }
        loadingLabel={isCheckingRegistry ? "Checking registry..." : isDeletingAgent ? "Deleting..." : ""}
        onConfirm={confirmDelete}
        isLoading={isDeletingAgent || isCheckingRegistry}
      />

      <Dialog
        open={isImportA2ADialogOpen}
        onOpenChange={(open) => {
          setIsImportA2ADialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingA2AAgent ? "Edit A2A Agent" : "Import A2A Agent"}
            </DialogTitle>
            <DialogDescription>
              {editingA2AAgent
                ? "Update the A2A Agent configuration"
                : "Import A2A Agent"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter agent name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com/api"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter description (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsImportA2ADialogOpen(false);
                    setEditingA2AAgent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingA2AAgent || isUpdatingA2AAgent}
                >
                  {isCreatingA2AAgent || isUpdatingA2AAgent
                    ? editingA2AAgent
                      ? "Updating..."
                      : "Creating..."
                    : editingA2AAgent
                      ? "Update"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && isBulkDeletingAgents) return;
          setIsBulkDeleteDialogOpen(open);
        }}
        title="Delete Selected Agents"
        description={
          selectedAgentIds.length === 1
            ? "Are you sure you want to delete this agent? This action cannot be undone."
            : `Are you sure you want to delete ${selectedAgentIds.length} agents? This action cannot be undone.`
        }
        onConfirm={handleBulkDeleteSelected}
        isLoading={isBulkDeletingAgents}
      />

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

      <CreateNewModal
        open={createVisible !== null}
        onOpenChange={(open) => setCreateVisible(open ? "agent" : null)}
        // @ts-ignore
        agent_type={tabFilter === "all" ? "agent" : tabFilter}
        currentGroupName={currentGroup?.group_name}
      />

      <ShareAgent
        open={shareVisible}
        onOpen={setShareVisible}
        agent_id={selectedAgent?._id ?? ""}
        team={team}
        agentPolicies={policies.filter(
          (policy) => policy?.resource_id === (selectedAgent?._id ?? ""),
        )}
        onSuccess={handleRefresh}
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
        onOpenChange={(open) => {
          setIsAddToGroupOpen(open);
          if (!open) {
            setSelectedAgentForGroup(null);
            setMoveSourceGroupId(null);
            setBulkAgentsForGroup([]);
            setIsBulkMoveDialog(false);
          }
        }}
        type="agent"
        currentGroupId={moveSourceGroupId ?? currentGroup?.group_id ?? null}
        asset={
          isBulkMoveDialog
            ? undefined
            : {
              id: selectedAgentForGroup?._id || "",
              name: selectedAgentForGroup?.name || "",
              description: selectedAgentForGroup?.description || "",
            }
        }
        assets={
          isBulkMoveDialog
            ? bulkAgentsForGroup.map((agent) => ({
              id: agent._id,
              name: agent.name,
              description: agent.description,
            }))
            : undefined
        }
        onSuccess={() => {
          handleRefresh();
          if (isBulkMoveDialog) {
            setBulkAgentsForGroup([]);
            setIsBulkMoveDialog(false);
            cancelSelectionMode();
          } else {
            setSelectedAgentForGroup(null);
          }
          setMoveSourceGroupId(null);
        }}
      />

      <CreateGroupDialog
        open={isCreateGroupOpen}
        group_type={"agent"}
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

      <ShareWorkflow
        open={modalVisible.type === "workflow-share"}
        onOpen={(open) =>
          setModalVisible((prev) => ({
            ...prev,
            type: open ? "workflow-share" : null,
          }))
        }
        workflow_id={modalVisible?.id}
        team={team || []}
        workflowPolicies={workflowPolicies.filter(
          (policy) => policy?.resource_id === modalVisible.id,
        )}
        onShareComplete={handleRefresh}
      />

      <DeleteWorkflow
        id={modalVisible.id}
        open={modalVisible.type === "workflow-delete"}
        onOpen={(open) =>
          setModalVisible((prev) => ({
            ...prev,
            type: open ? "workflow-delete" : null,
          }))
        }
        onDelete={fetchWorkflows}
      />

      {isDevEnv && (
        <>
          <div className="fixed bottom-4 right-4 z-40">
            <Button
              variant="outline"
              size="icon"
              className="grid size-12 place-items-center rounded-full shadow-md"
              onClick={() => setIsIdeOpen(!isIdeOpen)}
              title="Open Web IDE"
            >
              <Code className="h-5 w-5" />
            </Button>
          </div>

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

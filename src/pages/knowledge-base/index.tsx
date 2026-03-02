import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Pencil,
  FolderPlus,
  FolderMinus,
  Share2,
  Trash2,
  Users2,
  CheckSquare,
} from "lucide-react";
import mixpanel from "mixpanel-browser";

import useStore from "@/lib/store";
import { DeleteKnowledgeBase } from "./components/delete-knowledge-base";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { isMixpanelActive } from "@/lib/constants";
import ShareKnowledgeBase from "./components/share-knowledgebase";
// import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { IAgentPolicy, ITeamMember, Path, UserRole } from "@/lib/types";
import { useOrganization } from "../organization/org.service";
import { useAgentBuilder } from "../agent-builder/agent-builder.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CreateNewKBModal } from "./components/create-new-modal";
import { cn, isOrgMode } from "@/lib/utils";
import { AddToGroupDialog } from "@/pages/components/Groups/AddToGroupDialog";
import { CreateGroupDialog } from "@/pages/components/Groups/CreateGroupDialog";
import { RenameGroupDialog } from "@/pages/components/Groups/RenameGroupDialog";
import {
  Group,
  getGroups,
  moveAssetBetweenGroups,
  removeAssetFromGroup,
} from "@/services/groupsApiService";

import { useRAGService } from "./rag.service";
import { SearchBar } from "./components/search-bar";
import { RAGConfig } from "./rag.service";
import KnowledgeBaseFormDialog from "./components/knowledge-base-form-dialog";
import { DeleteGroupDialog } from "../components/Groups/DeleteGroupDialog";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePlan } from "@/components/custom/upgrade-plan";
import { Separator } from "@/components/ui/separator";
import { FilterToggle } from "@/components/custom/filter-toggle";
import { ResourceCard } from "@/components/custom/resource-card";
import { ResourceGroupCard } from "@/components/custom/resource-group-card";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import { useGroups } from "@/pages/groups/groups.service";

// 🎯 1. Single Modal State with Type Safety
type ModalType =
  | "create"
  | "edit"
  | "delete"
  | "share"
  | "addToGroup"
  | "createGroup"
  | "renameGroup"
  | "deleteGroup"
  | "bulkDelete"
  | "upgradePricing"
  | null;

interface ModalState {
  type: ModalType;
  data: RAGConfig | null;
}

type TabFilterType = "all" | "basic-rag" | "graph-rag" | "semantic-datamodel";

// 🎯 2. Memoized Constants
const SKELETON_COUNT = 4;
const GRID_BREAKPOINTS =
  "large-screen:grid-cols-6 gap-4 sm:grid-cols-4 2xl:grid-cols-5";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Knowledge base page visited");

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [params, _] = useSearchParams();
  const group_name = params.get("group_name");
  const tab_name = params.get("tab");
  const apiKey = useStore((state) => state.api_key);
  const {
    current_organization,
    usage_data,
    current_user: currentUser,
  } = useManageAdminStore((state) => state);

  const token = useStore((state) => state.app_token);
  const { toast } = useToast();

  // 🎯 3. Single Modal State - Only One Modal at a Time
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [policies, setPolicies] = useState<IAgentPolicy[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("knowledgeBaseViewMode");
    return (saved === "list" ? "list" : "grid") as "grid" | "list";
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [draggedKnowledgeBase, setDraggedKnowledgeBase] =
    useState<RAGConfig | null>(null);
  const [draggedKnowledgeBases, setDraggedKnowledgeBases] = useState<
    RAGConfig[]
  >([]);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [selectedKnowledgeBaseForGroup, setSelectedKnowledgeBaseForGroup] =
    useState<RAGConfig | null>(null);
  const [selectedKnowledgeBasesForGroup, setSelectedKnowledgeBasesForGroup] =
    useState<RAGConfig[]>([]);
  const [groupToRename, setGroupToRename] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tabFilter, setTabFilter] = useState<TabFilterType>("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRagIds, setSelectedRagIds] = useState<string[]>([]);
  const [isBulkDeletingRags, setIsBulkDeletingRags] = useState(false);

  const {
    ragConfigs: rags,
    isFetchingRagConfigs: isRagsLoading,
    getRagConfigs: refetchRags,
    deleteMultiRag,
    isDeletingMultiRag,
  } = useRAGService({ params: {} });

  const { isLimitReached } = usePlanLimits(rags?.length, "KB_LIMIT");

  const { getCurrentOrgMembers } = useOrganization({
    token: token,
    current_organization,
  });

  const { getAgentPolicy } = useAgentBuilder({
    apiKey,
    permission_type: "knowledge_base",
  });

  const { moveMultiToGroup, removeMultiAssetsFromGroup } = useGroups(token);

  const removeFromGroupHandler = async (rag: RAGConfig) => {
    if (!currentGroup) return;
    try {
      await removeAssetFromGroup(
        currentGroup.group_name,
        currentGroup.group_type,
        rag.id,
        current_organization?._id || "",
        token,
      );
      await loadGroups();
      refetchRags();
    } catch (error) {
      console.error("Failed to remove knowledge base from group:", error);
    }
  };

  // Load groups
  const loadGroups = useCallback(async () => {
    if (!current_organization?._id) return;
    try {
      const groupsData = await getGroups(
        current_organization._id,
        "knowledge_base",
        token,
      );
      setGroups(groupsData);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  }, [token, current_organization?._id]);

  // 🎯 4. Memoized Computations
  const filteredRags = useMemo(() => {
    let filtered = rags;

    // Filter by current group if inside a group
    if (currentGroup) {
      filtered = rags.filter((rag) =>
        currentGroup.assets.some((asset) => asset.asset_id === rag.id),
      );
    } else {
      // When in main view, show only ungrouped knowledge bases
      filtered = rags.filter(
        (rag) =>
          !groups.some((group) =>
            group.assets.some((asset) => asset.asset_id === rag.id),
          ),
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((rag: RAGConfig) =>
        rag.collection_name.toLowerCase().includes(query),
      );
    }

    return filtered.map((rag) => ({
      ...rag,
      type:
        !rag.semantic_data_model &&
        !rag.vector_store_provider.toLowerCase().includes("neo4j") &&
        !rag.vector_store_provider.toLowerCase().includes("neptune")
          ? "Basic RAG"
          : rag.vector_store_provider.toLowerCase().includes("neo4j") ||
              rag.vector_store_provider.toLowerCase().includes("neptune")
            ? "Graph RAG"
            : rag.semantic_data_model
              ? "Semantic Data Model"
              : "",
    }));
  }, [rags, searchQuery, currentGroup, groups]);

  const isActionable = useMemo(() => {
    return (rag: RAGConfig) =>
      [UserRole.owner, UserRole.admin].includes(
        current_organization?.role as UserRole,
      ) || rag?.user_id === apiKey;
  }, [current_organization?.role, apiKey]);

  // View mode handler
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("knowledgeBaseViewMode", mode);
  }, []);

  // 🎯 6. Single Modal Management - Ensures Only One Modal Open
  const openModal = useCallback(
    (type: ModalType, data?: RAGConfig | RAGConfig[] | Group) => {
      if (type === "addToGroup") {
        if (Array.isArray(data)) {
          setSelectedKnowledgeBasesForGroup(data);
          setSelectedKnowledgeBaseForGroup(null);
        } else if (data && "collection_name" in data) {
          setSelectedKnowledgeBaseForGroup(data as RAGConfig);
          setSelectedKnowledgeBasesForGroup([]);
        }
      } else if (type === "renameGroup" && data && "group_name" in data) {
        setGroupToRename(data as Group);
      }
      setModalState({
        type,
        data:
          data && !Array.isArray(data) && "collection_name" in data
            ? (data as RAGConfig)
            : null,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModalState({ type: null, data: null });
    setSelectedKnowledgeBaseForGroup(null);
    setSelectedKnowledgeBasesForGroup([]);
    setGroupToRename(null);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    refetchRags();
    closeModal();
  }, [closeModal, refetchRags]);

  useEffect(() => {
    if (currentGroup) {
      const updated = groups.find((g) => g.group_id === currentGroup.group_id);
      if (updated) setCurrentGroup(updated);
    }
  }, [groups]);

  const handleGroupSuccess = useCallback(async () => {
    await loadGroups();
    cancelSelectionMode();
    refetchRags();
    closeModal();
  }, [closeModal, loadGroups, refetchRags]);

  const handleCreateNew = () => {
    if (isLimitReached) {
      openModal("upgradePricing");
    } else {
      openModal("create");
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadGroups(), refetchRags(), loadGroups()]);
    setRefreshing(false);
  }, [loadGroups, refetchRags]);

  // 🎯 7. Optimized Data Fetching
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!current_organization?.org_id || modalState.type === "share") return;

      try {
        const [teamRes, policyRes] = await Promise.all([
          getCurrentOrgMembers(),
          getAgentPolicy(),
        ]);

        setTeam(teamRes.data);
        setPolicies(policyRes.data);
      } catch (error) {
        console.error("Failed to fetch team data:", error);
      }
    };

    fetchTeamData();
  }, [current_organization?.org_id, modalState.type]);

  useEffect(() => {
    if (group_name) {
      const current_group = groups.find((g) => g.group_name === group_name);
      if (current_group) setCurrentGroup(current_group);
    }
  }, [group_name, groups.length]);

  useEffect(() => {
    const fetchGroups = async () => {
      await loadGroups();
    };
    fetchGroups();
  }, [loadGroups]);

  useEffect(() => {
    setTabFilter((tab_name as TabFilterType) || "all");
  }, [tab_name]);

  // 🎯 8. Memoized Skeleton Components
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <Skeleton
          key={`skeleton-${index}`}
          className={cn(
            "my-2 w-full rounded-xl",
            viewMode === "grid" ? "h-[180px]" : "h-[50px]",
          )}
        />
      )),
    [],
  );

  // 🎯 9. Memoized Empty State
  const emptyState = useMemo(
    () => (
      <div
        className={cn(
          viewMode === "grid" ? "col-span-full" : "w-full",
          "mt-20 flex flex-col items-center justify-center space-y-5 text-center",
        )}
      >
        <img src="/images/empty.svg" loading="lazy" alt="Empty state" />
        <p className="pb-5 font-medium">No Knowledge Bases found</p>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-1 size-4" />
          Create New
        </Button>
      </div>
    ),
    [openModal, viewMode],
  );

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, rag: RAGConfig) => {
      // If in selection mode and there are selected rags, drag all selected
      if (isSelectionMode && selectedRagIds.length > 0) {
        const selectedRags = rags.filter((r) => selectedRagIds.includes(r.id));
        setDraggedKnowledgeBases(selectedRags);
        setDraggedKnowledgeBase(null);
        e.dataTransfer.effectAllowed = "move";
        // Store the count in dataTransfer for visual feedback
        e.dataTransfer.setData(
          "text/plain",
          `${selectedRags.length} knowledge base${selectedRags.length > 1 ? "s" : ""}`,
        );
      } else {
        // Single rag drag
        setDraggedKnowledgeBase(rag);
        setDraggedKnowledgeBases([]);
        e.dataTransfer.effectAllowed = "move";
      }
    },
    [isSelectionMode, selectedRagIds, rags],
  );

  const handleDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDragOverGroup(groupId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverGroup(null);
  }, []);

  const enterSelectionMode = useCallback((ragId?: string) => {
    setIsSelectionMode(true);
    if (ragId) {
      setSelectedRagIds((prev) =>
        prev.includes(ragId) ? prev : [...prev, ragId],
      );
    }
  }, []);

  const cancelSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedRagIds([]);
    setIsBulkDeletingRags(false);
  }, []);

  const handleDropOnGroup = useCallback(
    async (e: React.DragEvent<HTMLDivElement> | Group, group: Group) => {
      // Prevent default browser behavior
      if (e && "preventDefault" in e) {
        e.preventDefault();
      }

      // Determine which knowledge bases to handle: multiple selected or single dragged
      const ragsToHandle =
        draggedKnowledgeBases.length > 0
          ? draggedKnowledgeBases
          : draggedKnowledgeBase
            ? [draggedKnowledgeBase]
            : [];

      if (ragsToHandle.length === 0) return;

      const orgId = current_organization?._id;
      if (!orgId) return;

      try {
        // Check if knowledge base is already in another group
        const ragsToProcess = ragsToHandle.filter((rag) => {
          const currentKBGroup = groups.find((g) =>
            g.assets.some((a) => a.asset_id === rag.id),
          );
          return !(
            currentKBGroup && currentKBGroup.group_id === group.group_id
          );
        });

        if (ragsToProcess.length === 0) {
          toast({
            title: "No changes",
            description: `Selected knowledge base${ragsToHandle.length > 1 ? "s are" : " is"} already in "${group.group_name}"`,
          });
          setDraggedKnowledgeBase(null);
          setDraggedKnowledgeBases([]);
          setDragOverGroup(null);
          return;
        }

        const ragsToMove: RAGConfig[] = [];
        const ragsToAdd: RAGConfig[] = [];

        ragsToProcess.forEach((rag) => {
          const currentKBGroup = groups.find((g) =>
            g.assets.some((a) => a.asset_id === rag.id),
          );
          if (currentKBGroup && currentKBGroup.group_id !== group.group_id) {
            ragsToMove.push(rag);
          } else if (!currentKBGroup) {
            ragsToAdd.push(rag);
          }
        });

        if (ragsToMove.length > 0) {
          const moveOperations = ragsToMove.map(async (rag) => {
            const currentKBGroup = groups.find((g) =>
              g.assets.some((a) => a.asset_id === rag.id),
            );
            if (currentKBGroup) {
              await moveAssetBetweenGroups(
                currentKBGroup.group_name,
                currentKBGroup.group_type,
                rag.id,
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

        if (ragsToAdd.length > 0) {
          const payload = ragsToAdd.map((rag) => ({
            asset_id: rag.id,
            asset_type: "knowledge_base",
            asset_name: rag.collection_name,
            metadata: {
              description: rag.description,
            },
          }));

          await moveMultiToGroup({
            groupName: group.group_name,
            groupType: group.group_type,
            organizationId: orgId,
            payload,
          });
        }

        const totalProcessed = ragsToMove.length + ragsToAdd.length;
        if (totalProcessed > 0) {
          toast({
            title: "Success",
            description: `${totalProcessed} knowledge base${totalProcessed > 1 ? "s" : ""} ${totalProcessed > 1 ? "were" : "was"} added to "${group.group_name}"`,
          });
        }

        if (draggedKnowledgeBases.length > 0) {
          cancelSelectionMode();
        }

        await loadGroups();
        refetchRags();
      } catch (error) {
        console.error("Failed to add knowledge bases to group:", error);
        toast({
          title: "Error",
          description:
            "Failed to add knowledge bases to group. Please try again.",
          variant: "destructive",
        });
      } finally {
        setDraggedKnowledgeBase(null);
        setDraggedKnowledgeBases([]);
        setDragOverGroup(null);
      }
    },
    [
      draggedKnowledgeBase,
      draggedKnowledgeBases,
      groups,
      token,
      loadGroups,
      refetchRags,
      current_organization?._id,
      moveMultiToGroup,
      toast,
      cancelSelectionMode,
    ],
  );

  const getRags = (tabFilter: TabFilterType) => {
    switch (tabFilter) {
      case "all":
        return filteredRags;
      case "basic-rag":
        return filteredRags.filter(
          (rag) =>
            !rag.semantic_data_model &&
            !rag.vector_store_provider.toLowerCase().includes("neo4j") &&
            !rag.vector_store_provider.toLowerCase().includes("neptune"),
        );
      case "graph-rag":
        return filteredRags.filter(
          (rag) =>
            rag.vector_store_provider.toLowerCase().includes("neo4j") ||
            rag.vector_store_provider.toLowerCase().includes("neptune"),
        );
      case "semantic-datamodel":
        return filteredRags.filter((rag) => rag?.semantic_data_model);
      default:
        return filteredRags;
    }
  };

  const getKBGroupCards = (tabFilter: TabFilterType) => {
    const getAssetDisplayName = (asset: Group["assets"][number]) => {
      const matchedRag = rags.find(
        (rag) => rag.id === asset.asset_id || rag._id === asset.asset_id,
      );

      return matchedRag?.collection_name?.slice(0, -4) ?? asset.asset_name;
    };

    const normalizedGroups = groups.map((group) => ({
      ...group,
      assets: group.assets.map((asset) => ({
        ...asset,
        asset_name: getAssetDisplayName(asset),
      })),
    }));

    return normalizedGroups
      .filter(
        (g) =>
          g?.group_name?.toLowerCase()?.match(searchQuery) ||
          g?.assets?.some((asset) =>
            asset?.asset_name?.toLowerCase().match(searchQuery),
          ),
      )
      .filter((group) => {
        const kbAssets = rags.filter((rag) =>
          group.assets.some(
            (asset) => asset.asset_id === rag._id || asset.asset_id === rag.id,
          ),
        );

        switch (tabFilter) {
          case "all":
            return true;
          case "basic-rag":
            return kbAssets.filter(
              (rag) =>
                !rag.semantic_data_model &&
                !rag.vector_store_provider.toLowerCase().includes("neo4j") &&
                !rag.vector_store_provider.toLowerCase().includes("neptune"),
            );
          case "graph-rag":
            return kbAssets.some(
              (rag) =>
                rag.vector_store_provider.toLowerCase().includes("neo4j") ||
                rag.vector_store_provider.toLowerCase().includes("neptune"),
            );
          case "semantic-datamodel":
            return kbAssets.some((rag) => rag?.semantic_data_model);
          default:
            return true;
        }
      });
  };

  const totalRags = getRags(tabFilter);
  const allRagsCount = getRags("all").length;
  const basicRagsCount = getRags("basic-rag").length;
  const graphRagsCount = getRags("graph-rag").length;
  const semanticRagsCount = getRags("semantic-datamodel").length;

  const toggleRagSelection = useCallback((ragId: string) => {
    setSelectedRagIds((prev) => {
      if (prev.includes(ragId)) {
        return prev.filter((id) => id !== ragId);
      }
      return [...prev, ragId];
    });
  }, []);

  // 🎯 5. Optimized Event Handlers with useCallback
  const routeToFiles = useCallback(
    (rag: RAGConfig, collectionName: string) =>
      (e: React.MouseEvent<Element, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.shiftKey) {
          if (!isSelectionMode) {
            enterSelectionMode(rag.id);
          } else {
            toggleRagSelection(rag.id);
          }
          return;
        }

        if (isSelectionMode) {
          toggleRagSelection(rag.id);
          return;
        }

        const groupNameParam = currentGroup?.group_name
          ? `?group_name=${currentGroup?.group_name}`
          : "";

        const route = Boolean(rag?.semantic_data_model)
          ? `/knowledge-base/semantic/${rag?.id}${groupNameParam}`
          : `/knowledge-base/${rag?.id}${groupNameParam}`;

        navigate(route, {
          state: { collectionName, meta_data: rag?.meta_data ?? {} },
        });
      },
    [
      navigate,
      isSelectionMode,
      enterSelectionMode,
      toggleRagSelection,
      currentGroup,
    ],
  );

  const handleSuccess = useCallback(
    (rag: RAGConfig) => {
      closeModal();
      routeToFiles(rag, rag?.collection_name)({} as React.MouseEvent);
    },
    [closeModal, routeToFiles],
  );

  const handleRemoveFromGroup = async () => {
    if (selectedRagIds.length === 0) return;
    try {
      await removeMultiAssetsFromGroup({
        groupName: currentGroup?.group_name || "",
        groupType: currentGroup?.group_type || "",
        organizationId: current_organization?._id || "",
        assetIds: selectedRagIds,
      });
      toast({
        title: "Success",
        description: `${selectedRagIds.length} knowledge base${selectedRagIds.length === 1 ? "" : "s"} removed from "${currentGroup?.group_name}"`,
      });
      cancelSelectionMode();
      await handleRefresh();
    } catch (error) {
      console.error("Failed to remove knowledge bases from group:", error);
    }
  };

  const handleOpenBulkMoveDialog = () => {
    if (currentGroup) handleRemoveFromGroup();
    else {
      if (selectedRagIds.length === 0) return;
      const selectedRags = rags.filter((rag) =>
        selectedRagIds.includes(rag.id),
      );
      openModal("addToGroup", selectedRags);
    }
  };

  const handleBulkDeleteSelected = useCallback(async () => {
    if (selectedRagIds.length === 0) return;
    setIsBulkDeletingRags(true);

    const selectedRags = rags.filter((rag) => selectedRagIds.includes(rag.id));
    const ragMap = new Map(selectedRags.map((rag) => [rag.id, rag]));

    try {
      await deleteMultiRag({ configIds: selectedRagIds });

      if (currentGroup) {
        for (const ragId of selectedRagIds) {
          try {
            await removeAssetFromGroup(
              currentGroup.group_name,
              currentGroup.group_type,
              ragId,
              current_organization?._id || "",
              token,
            );
          } catch (error) {
            console.error(
              "Failed to remove knowledge base from group during bulk delete:",
              error,
            );
            const rag = ragMap.get(ragId);
            toast({
              title: "Notice",
              description: `Deleted ${rag?.collection_name?.slice(0, -4) ?? "Knowledge Base"}, but failed to remove it from "${currentGroup.group_name}".`,
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Success",
        description: `${selectedRagIds.length} knowledge base${selectedRagIds.length === 1 ? "" : "s"} deleted successfully`,
      });
      closeModal();
      cancelSelectionMode();
      await handleRefresh();
    } catch (error) {
      console.error("Error deleting knowledge bases:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete selected knowledge bases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeletingRags(false);
    }
  }, [
    selectedRagIds,
    rags,
    deleteMultiRag,
    currentGroup,
    current_organization?._id,
    token,
    toast,
    cancelSelectionMode,
    handleRefresh,
  ]);

  const openBulkDeleteDialog = useCallback(() => {
    if (selectedRagIds.length === 0) return;
    openModal("bulkDelete");
  }, [openModal, selectedRagIds]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex h-full w-full flex-col space-y-4 px-8 py-4"
      >
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <PageTitle
              title="Knowledge Base"
              description={
                <span className="inline-flex items-center gap-1 space-x-1 text-sm text-muted-foreground">
                  <p>
                    Manage your document collections and knowledge sources for
                    AI interactions.
                  </p>
                  <Link
                    to="https://www.avanade.com/en-gb/services"
                    target="_blank"
                    className="flex items-center text-link underline-offset-4 hover:underline"
                    onClick={() => {
                      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                        mixpanel.track("Docs-clicked", {
                          feature: "Knowledge Base",
                        });
                    }}
                  >
                    Docs
                    <ArrowTopRightIcon className="ml-1 size-3" />
                  </Link>
                  <Link
                    to="https://www.avanade.com/en-gb/services"
                    target="_blank"
                    className="flex items-center text-link underline-offset-4 hover:underline"
                    onClick={() => {
                      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                        mixpanel.track("API-clicked", {
                          feature: "Knowledge Base",
                        });
                    }}
                  >
                    API
                    <ArrowTopRightIcon className="ml-1 size-3" />
                  </Link>
                  <Link
                    to="https://www.youtube.com/watch?v=uYr0tyluWQ4"
                    target="_blank"
                    className="flex items-center text-link underline-offset-4 hover:underline"
                    onClick={() => {
                      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                        mixpanel.track("Video-clicked", {
                          feature: "Knowledge Base",
                        });
                    }}
                  >
                    Video
                    <ArrowTopRightIcon className="ml-1 size-3" />
                  </Link>
                </span>
              }
            />
            <Button
              onClick={() => {
                if (isLimitReached) {
                  openModal("upgradePricing");
                } else {
                  openModal("create");
                }
              }}
            >
              <Plus className="mr-1 size-4" />
              Create New
            </Button>
          </div>
          <Separator />
          <div className="flex">
            <FilterToggle<TabFilterType>
              value={tabFilter}
              setValue={(value) => setTabFilter(value as TabFilterType)}
              items={[
                { id: "all", label: "All", count: allRagsCount },
                {
                  id: "basic-rag",
                  label: "Knowledge Base",
                  count: basicRagsCount,
                },
                {
                  id: "graph-rag",
                  label: "Knowledge Graph",
                  count: graphRagsCount,
                },
                {
                  id: "semantic-datamodel",
                  label: "Semantic Data Model",
                  count: semanticRagsCount,
                },
              ]}
            />
          </div>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={handleRefresh}
            isRefreshing={isRagsLoading}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onCreateGroup={() => openModal("createGroup")}
            currentGroup={currentGroup}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedRagIds.length}
            onMoveToFolder={handleOpenBulkMoveDialog}
            onCancelSelectionMode={cancelSelectionMode}
            onBulkDelete={openBulkDeleteDialog}
            isBulkDeleting={isBulkDeletingRags || isDeletingMultiRag}
            onEnterSelectionMode={enterSelectionMode}
          />
        </div>

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
                      navigate(Path.KNOWLEDGE_BASE);
                    }}
                    className="inline-flex cursor-pointer items-center"
                  >
                    <ArrowLeft className="mr-1 size-3" />
                    Back to All Knowledge Bases
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
              <div className="w-32 px-4">Created At</div>
              <div className="w-16"></div>
            </div>
          )} */}

          <div
            className={cn(
              "z-50 grid",
              viewMode === "grid" ? GRID_BREAKPOINTS : "grid-cols-1",
            )}
          >
            {/* Show groups first when not inside a group */}
            {!location.search.includes("group_name") && (
              <>
                {refreshing || isRagsLoading
                  ? skeletonItems
                  : getKBGroupCards(tabFilter).map((group, index) => (
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
                          setCurrentGroup(group);
                          params.set("group_name", group.group_name);
                          navigate(
                            `${Path.KNOWLEDGE_BASE}?group_name=${group.group_name}`,
                          );
                        }}
                        onEdit={(group) => {
                          openModal("renameGroup", group);
                        }}
                        onDelete={(group) => {
                          openModal("deleteGroup");
                          setGroupToDelete(group);
                        }}
                      />
                    ))}
              </>
            )}
            {refreshing || isRagsLoading
              ? skeletonItems
              : totalRags?.length > 0 ||
                  (!currentGroup && getKBGroupCards(tabFilter).length === 0)
                ? totalRags.map(
                    (rag: RAGConfig & { type?: string }, index: number) => {
                      const agentPolicies = policies.filter(
                        (policy) => policy?.resource_id === (rag.id ?? ""),
                      );
                      const sharedUsers = team
                        ?.filter((member: ITeamMember) =>
                          agentPolicies
                            ?.map((p) => p?.user_id)
                            .includes(member?.user_id),
                        )
                        ?.map((member: ITeamMember) => member?.email);
                      return (
                        <ResourceCard<RAGConfig & { type?: string }>
                          index={index}
                          item={rag}
                          withGradientIcon
                          viewMode={viewMode}
                          title={rag.collection_name.slice(0, -4)}
                          description={rag.description}
                          type={rag?.type}
                          timestamp={rag?.updated_at ?? rag?.created_at}
                          onClick={routeToFiles(rag, rag.collection_name)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedRagIds.includes(rag.id)}
                          onToggleSelect={() => toggleRagSelection(rag.id)}
                          onEnterSelectionMode={() =>
                            enterSelectionMode(rag.id)
                          }
                          badges={[
                            {
                              icon: (
                                <Users2 className="size-4 text-muted-foreground" />
                              ),
                              visible: sharedUsers.length > 0,
                              tooltip: `Shared with ${sharedUsers?.length} users`,
                            },
                          ]}
                          actions={[
                            {
                              label: "Edit",
                              icon: <Pencil className="size-4" />,
                              visible: true,
                              onClick: (data) => (e) => {
                                e.stopPropagation();
                                openModal("edit", data);
                              },
                            },
                            {
                              label: "Select",
                              icon: <CheckSquare className="size-4" />,
                              visible: true,
                              onClick: () => (e) => {
                                e.stopPropagation();
                                enterSelectionMode(rag.id);
                              },
                            },
                            {
                              label: "Move to Folder",
                              icon: <FolderPlus className="size-4" />,
                              visible: true,
                              onClick: (data) => (e) => {
                                e.stopPropagation();
                                openModal("addToGroup", data);
                              },
                            },
                            {
                              label: "Share",
                              icon: <Share2 className="size-4" />,
                              visible:
                                isOrgMode(usage_data?.plan_name) &&
                                isActionable(rag),
                              onClick: (data) => (e) => {
                                e.stopPropagation();
                                openModal("share", data);
                              },
                            },
                            {
                              label: "Remove from Folder",
                              icon: <FolderMinus className="size-4" />,
                              visible: currentGroup !== null,
                              className: "text-destructive",
                              onClick: (data) => (e) => {
                                e.stopPropagation();
                                removeFromGroupHandler(data);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="size-4" />,
                              visible: isActionable(rag),
                              className: "text-destructive",
                              onClick: (data) => (e) => {
                                e.stopPropagation();
                                openModal("delete", data);
                              },
                            },
                          ]}
                          footer={
                            <div className="line-clamp-1 flex w-full items-center justify-between gap-2 px-4">
                              <p className="rounded-xl border border-muted-foreground/30 px-2 py-1 text-xs">
                                {rag.type}
                              </p>
                              <p className="text-xs">Vector Store</p>
                            </div>
                          }
                          key={rag.id}
                          onDragStart={(e) => handleDragStart(e, rag)}
                          onDragEnd={() => {
                            setDraggedKnowledgeBase(null);
                            setDragOverGroup(null);
                          }}
                        />
                      );
                    },
                  )
                : emptyState}
          </div>
        </div>
      </motion.div>

      {/* 🎯 10. Single Modal Rendering - Only One Modal at a Time */}
      <CreateNewKBModal
        open={modalState.type === "create"}
        onOpenChange={(open) => !open && closeModal()}
      />

      <KnowledgeBaseFormDialog
        open={modalState.type === "edit"}
        onOpen={(open) => !open && closeModal()}
        data={modalState.data}
        onSuccess={handleSuccess}
      />

      <DeleteKnowledgeBase
        open={modalState.type === "delete"}
        onOpenChange={(open) => !open && closeModal()}
        data={modalState.data}
        apiKey={apiKey}
        onSuccess={handleDeleteSuccess}
        currentGroup={currentGroup}
      />

      <ShareKnowledgeBase
        open={modalState.type === "share"}
        onOpen={(open) => !open && closeModal()}
        resource_id={modalState.data?.id ?? ""}
        agentPolicies={policies}
        currentUser={currentUser}
        team={team}
      />

      <AddToGroupDialog
        open={modalState.type === "addToGroup"}
        onOpenChange={(open) => !open && closeModal()}
        type="knowledge_base"
        currentGroupId={currentGroup?.group_id ?? null}
        asset={
          selectedKnowledgeBaseForGroup
            ? {
                id: selectedKnowledgeBaseForGroup.id,
                name: selectedKnowledgeBaseForGroup.collection_name,
                description: selectedKnowledgeBaseForGroup.description,
              }
            : null
        }
        assets={
          selectedKnowledgeBasesForGroup.length > 0
            ? selectedKnowledgeBasesForGroup.map((rag) => ({
                id: rag.id,
                name: rag.collection_name,
                description: rag.description,
              }))
            : undefined
        }
        onSuccess={handleGroupSuccess}
      />

      <CreateGroupDialog
        open={modalState.type === "createGroup"}
        group_type={"knowledge_base"}
        onOpenChange={(open) => !open && closeModal()}
        onSuccess={handleGroupSuccess}
      />

      <RenameGroupDialog
        open={modalState.type === "renameGroup"}
        onOpenChange={(open) => !open && closeModal()}
        group={groupToRename}
        onSuccess={handleGroupSuccess}
      />

      <DeleteGroupDialog
        open={modalState.type === "deleteGroup"}
        onOpenChange={(open) => !open && closeModal()}
        group={groupToDelete}
        onSuccess={() => {
          setCurrentGroup(null);
          handleGroupSuccess();
        }}
      />

      <UpgradePlan
        open={modalState.type === "upgradePricing"}
        onOpen={(open) => !open && closeModal()}
        title="Knowledge Base Limit Exceeded"
        description="Your current plan doesn't allow adding more knowledge bases. Upgrade your plan to increase your knowledge base limit."
      />

      <ConfirmDialog
        open={modalState.type === "bulkDelete"}
        onOpenChange={(open) => {
          if (!open && (isBulkDeletingRags || isDeletingMultiRag)) return;
          if (!open) {
            closeModal();
          } else {
            openModal("bulkDelete");
          }
        }}
        title="Delete Selected Knowledge Bases"
        description={
          selectedRagIds.length === 1
            ? "Are you sure you want to delete this knowledge base? This action cannot be undone."
            : `Are you sure you want to delete ${selectedRagIds.length} knowledge bases? This action cannot be undone.`
        }
        onConfirm={handleBulkDeleteSelected}
        isLoading={isBulkDeletingRags || isDeletingMultiRag}
      />
    </>
  );
}

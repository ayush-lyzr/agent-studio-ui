import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "../styles/grouping.css";
import { toast } from "sonner";
import {
  ZoomIn,
  ZoomOut,
  Group,
  MousePointer,
  Hand,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentSidebar from "./AgentSidebar";
import AgentNode from "./AgentNode";
import EdgeEditPanel from "./EdgeEditPanel";
import NodeEditPanel from "./NodeEditPanel";
import PublishBlueprintModal from "./PublishBlueprintModal";
import BlueprintReadme from "./BlueprintReadme";
import GroupLayer from "./GroupLayer";
import TextNote from "./TextNote";
import VettedAgentPopup from "./VettedAgentPopup";
// import GroupContextMenu from "./GroupContextMenu";
import useGrouping from "../hooks/useGrouping";
import { Agent } from "../types/agent";
import { getAgent, updateAgent, updateAgentComplete } from "../services/agentService";
import {
  TreeNode,
  DEFAULT_LAYOUT_CONFIG,
  calculateSimpleTreeLayout,
} from "../lib/treeLayoutUtils";
import { snapToNearestBand } from "../lib/bandSystem";
import { blueprintApiService, BlueprintData } from "@/services/blueprintApiService";
import useStore from "@/lib/store";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import Loader from "@/components/loader";
import { Path } from "@/lib/types";
import KnowledgeBaseConfig from "./KnowledgeBaseConfig";
import KnowledgeBaseNode from "./KnowledgeBaseNode";
import { useInfiniteAgents } from "../hooks/useInfiniteAgents";
import { UnifiedAsset } from "@/types/user-assets";

interface PendingUpdate {
  agentId: string;
  managedAgents: Array<{
    id: string;
    name: string;
    usage_description: string;
  }>;
  tool_usage_description?: string;
}

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

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Orchestration page visited");

// Helper function to convert UnifiedAsset to Agent type
const convertAssetToAgent = (asset: UnifiedAsset): Agent => {
  const meta = (asset.metadata ?? {}) as Record<string, any>;
  return {
    _id: asset.id,
    name: asset.name,
    description: meta.description || "",
    model: meta.model || "",
    agent_role: meta.agent_role || "",
    agent_instructions: meta.agent_instructions || "",
    agent_goal: meta.agent_goal || "",
    features: meta.features || [],
    tool: meta.tool || "",
    llm_credential_id: meta.llm_credential_id || "",
    temperature: meta.temperature ?? 0,
    top_p: meta.top_p ?? 0,
    provider_id: meta.provider_id || "",
    template_type: meta.template_type || "",
    tool_usage_description: meta.tool_usage_description || "",
    version: meta.version || "",
    examples: meta.examples || "",
    response_format: meta.response_format || { type: "text" },
    api_key: "",
    managed_agents:
      asset.type === "manager_agent" ? meta.managed_agents || [] : [],
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  };
};

const AgentFlowBuilder = () => {
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [hasBlueprintChanges, setHasBlueprintChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [showBands, _] = useState(true);
  const [glowingNodes, setGlowingNodes] = useState<Set<string>>(new Set());
  const [socketLogs, setSocketLogs] = useState<SocketEvent[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [blueprintReadme, setBlueprintReadme] = useState<{
    markdown?: string;
    name?: string;
  } | null>(null);
  const [showBlueprintReadme, setShowBlueprintReadme] = useState(true);
  const [isOwnBlueprint, setIsOwnBlueprint] = useState(false);
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | null>(
    null,
  );
  const [loadedBlueprintData, setLoadedBlueprintData] = useState<any>(null);
  const [openedViaPlayButton, setOpenedViaPlayButton] = useState(false);
  const [showVettedAgentPopup, setShowVettedAgentPopup] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingChatAgent, setPendingChatAgent] = useState<Agent | null>(null);
  const currentUser = useStore((state) => state.current_user);
  const apiKey = useStore((state) => state.api_key);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [selectedKBNode, setSelectedKBNode] = useState<Node | null>(null);

  // Use paginated agents hook - manager agents are returned first
  const {
    agents: agentAssets,
    total: totalAgents,
    hasMore,
    isLoading: loading,
    isFetching,
    isFetchingNextPage,
    loadMore,
    setSearchQuery,
    searchQuery,
    isSearching,
    refresh: refreshAgents,
  } = useInfiniteAgents({ apiKey, limit: 20 });

  // Convert UnifiedAsset[] to Agent[] for compatibility with existing code
  const agents: Agent[] = useMemo(
    () => agentAssets.map(convertAssetToAgent),
    [agentAssets],
  );

  // Refs to hold current values for saveAllChanges (to avoid stale closures)
  const pendingUpdatesRef = useRef<PendingUpdate[]>([]);
  const hasBlueprintChangesRef = useRef(false);
  const isOwnBlueprintRef = useRef(false);
  const loadedBlueprintIdRef = useRef<string | null>(null);
  const loadedBlueprintDataRef = useRef<any>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const reactFlowInstanceRef = useRef<any>(null);
  const agentsRef = useRef<Agent[]>([]);

  // Keep refs in sync with state
  useEffect(() => { pendingUpdatesRef.current = pendingUpdates; }, [pendingUpdates]);
  useEffect(() => { hasBlueprintChangesRef.current = hasBlueprintChanges; }, [hasBlueprintChanges]);
  useEffect(() => { isOwnBlueprintRef.current = isOwnBlueprint; }, [isOwnBlueprint]);
  useEffect(() => { loadedBlueprintIdRef.current = loadedBlueprintId; }, [loadedBlueprintId]);
  useEffect(() => { loadedBlueprintDataRef.current = loadedBlueprintData; }, [loadedBlueprintData]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { reactFlowInstanceRef.current = reactFlowInstance; }, [reactFlowInstance]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  // Grouping functionality
  const {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    // addNodesToGroup,
    // removeNodesFromGroup,
    getGroupsFromBlueprintData,
    // saveBlueprintGroups,
  } = useGrouping(nodes, setNodes);

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Note management functions
  const createNote = useCallback(
    (position: { x: number; y: number }) => {
      const noteId = `note_${Date.now()}`;
      const newNote = {
        id: noteId,
        type: "textNote",
        position,
        data: {
          id: noteId,
          text: "",
          color: "#fbbf24", // Default yellow
          width: 200,
          height: 150,
        },
        draggable: true,
        selectable: true,
      };
      setNodes((prevNodes) => [...prevNodes, newNote]);
      setSelectedNote(noteId);

      // Mark blueprint as having changes when notes are created
      // Enable save button for any note creation when user has edit permissions
      if (isOwnBlueprint) {
        setHasBlueprintChanges(true);
      }
      return noteId;
    },
    [setNodes, loadedBlueprintId, isOwnBlueprint],
  );

  const updateNote = useCallback(
    (noteId: string, updates: any) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === noteId && node.type === "textNote") {
            return {
              ...node,
              data: { ...node.data, ...updates },
            };
          }
          return node;
        }),
      );

      // Mark blueprint as having changes when notes are updated
      // Enable save button for any note update when user has edit permissions
      if (isOwnBlueprint) {
        setHasBlueprintChanges(true);
      }
    },
    [setNodes, loadedBlueprintId, isOwnBlueprint],
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== noteId));
      if (selectedNote === noteId) {
        setSelectedNote(null);
      }

      // Mark blueprint as having changes when notes are deleted
      // Enable save button for any note deletion when user has edit permissions
      if (isOwnBlueprint) {
        setHasBlueprintChanges(true);
      }
    },
    [setNodes, selectedNote, loadedBlueprintId, isOwnBlueprint],
  );

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should handle the delete key
      if (event.key === "Delete" || event.key === "Backspace") {
        // Don't delete if user is typing in an input/textarea
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement as HTMLElement).contentEditable === "true")
        ) {
          return;
        }

        // Delete selected group
        if (selectedGroup) {
          event.preventDefault();
          deleteGroup(selectedGroup);
          setSelectedGroup(null);
          toast.success("Group deleted");
          return;
        }

        // Delete selected note
        if (selectedNote) {
          event.preventDefault();
          deleteNote(selectedNote);
          setSelectedNote(null);
          toast.success("Note deleted");
          return;
        }

        // Delete selected agent/tool nodes
        const selectedNodes = nodes.filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          event.preventDefault();

          // Get all selected node IDs
          const selectedNodeIds = selectedNodes.map((node) => node.id);

          // Remove the selected nodes
          setNodes((prevNodes) =>
            prevNodes.filter((node) => !selectedNodeIds.includes(node.id)),
          );

          // Remove edges connected to the deleted nodes
          setEdges((prevEdges) =>
            prevEdges.filter(
              (edge) =>
                !selectedNodeIds.includes(edge.source) &&
                !selectedNodeIds.includes(edge.target),
            ),
          );

          // Update pending updates for agent connections
          selectedNodes.forEach((deletedNode) => {
            const deletedNodeData = deletedNode.data as any;

            // If it's a tool node, remove it from tool_usage_description of connected agents
            if (
              deletedNodeData.isToolNode ||
              deletedNodeData.agent_role === "Tool" ||
              deletedNodeData.agent_role === "Tool Action"
            ) {
              // Find agents connected to this tool
              const connectedEdges = edges.filter(
                (edge) => edge.target === deletedNode.id,
              );

              connectedEdges.forEach((edge) => {
                const parentNode = nodes.find((n) => n.id === edge.source);
                if (!parentNode || parentNode.data.isToolNode) return;

                const parentAgent = parentNode.data as Agent;

                // Parse and update tool_usage_description
                let toolUsageDescription: { [key: string]: any } = {};

                if (parentAgent.tool_usage_description) {
                  try {
                    toolUsageDescription = JSON.parse(
                      parentAgent.tool_usage_description,
                    );
                  } catch (error) {
                    console.error(
                      "Failed to parse tool_usage_description:",
                      error,
                    );
                  }
                }

                // Remove the tool action from the provider
                const toolProvider =
                  deletedNodeData.provider_id?.toLowerCase() || "unknown";
                const actionName = deletedNodeData.name
                  .toUpperCase()
                  .replace(/\s+/g, "_");

                if (
                  toolUsageDescription[toolProvider] &&
                  toolUsageDescription[toolProvider].actions
                ) {
                  toolUsageDescription[toolProvider].actions =
                    toolUsageDescription[toolProvider].actions.filter(
                      (action: string) => action !== actionName,
                    );

                  // If no actions left for this provider, remove the provider entirely
                  if (toolUsageDescription[toolProvider].actions.length === 0) {
                    delete toolUsageDescription[toolProvider];
                  }
                }

                const updatedToolUsageDescription = JSON.stringify(
                  toolUsageDescription,
                  null,
                  2,
                );

                // Add to pending updates
                setPendingUpdates((prev) => {
                  const existing = prev.find(
                    (p) => p.agentId === parentAgent._id,
                  );
                  if (existing) {
                    return prev.map((p) =>
                      p.agentId === parentAgent._id
                        ? {
                          ...p,
                          tool_usage_description: updatedToolUsageDescription,
                        }
                        : p,
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        agentId: parentAgent._id,
                        managedAgents: parentAgent.managed_agents || [],
                        tool_usage_description: updatedToolUsageDescription,
                      },
                    ];
                  }
                });
              });
            } else {
              // If it's an agent node, remove it from managed_agents of parent agents
              const parentEdges = edges.filter(
                (edge) => edge.target === deletedNode.id,
              );

              parentEdges.forEach((edge) => {
                const parentNode = nodes.find((n) => n.id === edge.source);
                if (!parentNode || parentNode.data.isToolNode) return;

                const parentAgent = parentNode.data as Agent;
                const currentManagedAgents = parentAgent.managed_agents || [];
                const updatedManagedAgents = currentManagedAgents.filter(
                  (ma) => ma.id !== deletedNodeData._id,
                );

                // Add to pending updates
                setPendingUpdates((prev) => {
                  const existing = prev.find(
                    (p) => p.agentId === parentAgent._id,
                  );
                  if (existing) {
                    return prev.map((p) =>
                      p.agentId === parentAgent._id
                        ? { ...p, managedAgents: updatedManagedAgents }
                        : p,
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        agentId: parentAgent._id,
                        managedAgents: updatedManagedAgents,
                        tool_usage_description:
                          parentAgent.tool_usage_description,
                      },
                    ];
                  }
                });
              });
            }
          });

          // Clear selection and show toast
          setSelectedAgent(null);
          const nodeTypes = selectedNodes.map((node) =>
            node.data.isToolNode ? "tool" : "agent",
          );
          const uniqueTypes = [...new Set(nodeTypes)];

          if (selectedNodes.length === 1) {
            toast.success(
              `Deleted ${selectedNodes[0].data.name} ${uniqueTypes[0]} - Click Save to apply changes`,
            );
          } else {
            toast.success(
              `Deleted ${selectedNodes.length} nodes - Click Save to apply changes`,
            );
          }
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedGroup,
    selectedNote,
    deleteGroup,
    deleteNote,
    nodes,
    edges,
    setNodes,
    setEdges,
    setPendingUpdates,
    setSelectedAgent,
  ]);

  // Handle agent play button click
  const handleAgentPlayClick = useCallback((agent: Agent) => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = pendingUpdates.length > 0 || hasBlueprintChanges;

    if (hasUnsavedChanges) {
      // Show modal instead of opening chat directly
      setPendingChatAgent(agent);
      setShowUnsavedChangesModal(true);
    } else {
      // No unsaved changes, proceed to chat
      setSelectedAgent(agent);
      setOpenedViaPlayButton(true);
      toast.success(`Opening chat with ${agent.name}`);
    }
  }, [pendingUpdates.length, hasBlueprintChanges]);

  const nodeTypes = useMemo(
    () => ({
      agent: (props: any) => (
        <AgentNode {...props} onPlayClick={handleAgentPlayClick} />
      ),
      group: (props: any) => {
        const isSelected = selectedGroup === props.id;
        console.log(
          "Rendering group:",
          props.id,
          "selected:",
          isSelected,
          "selectedGroup:",
          selectedGroup,
        );
        return (
          <GroupLayer
            {...props}
            selected={isSelected}
            onUpdateGroup={updateGroup}
            onDeleteGroup={deleteGroup}
          />
        );
      },
      textNote: (props: any) => {
        const isSelected = selectedNote === props.id;
        return (
          <TextNote
            {...props}
            selected={isSelected}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        );
      },
      knowledgeBase: (props: any) => {
        return <KnowledgeBaseNode {...props} />;
      },
    }),
    [
      handleAgentPlayClick,
      updateGroup,
      deleteGroup,
      selectedGroup,
      selectedNote,
      updateNote,
      deleteNote,
    ],
  );

  // Track selected nodes for grouping
  useEffect(() => {
    const currentSelected = nodes
      .filter((node) => node.selected && node.type === "agent")
      .map((node) => node.id);
    setSelectedNodes(currentSelected);
  }, [nodes]);

  useEffect(() => {
    if (!loading) {
      handleQueryParams();
    }
  }, [loading, agents]);

  // Update header buttons state
  useEffect(() => {
    const totalPendingUpdates = pendingUpdates.length + (hasBlueprintChanges ? 1 : 0);
    console.log("=== UPDATING HEADER BUTTONS ===");
    console.log("pendingUpdates.length:", pendingUpdates.length);
    console.log("hasBlueprintChanges:", hasBlueprintChanges);
    console.log("totalPendingUpdates:", totalPendingUpdates);
    console.log("isOwnBlueprint:", isOwnBlueprint);

    window.dispatchEvent(
      new CustomEvent("orchestration:update-header-buttons", {
        detail: {
          showButtons: nodes.length > 0 && !isOwnBlueprint,
          hasDocs: !!blueprintReadme,
          isPublicBlueprint: loadedBlueprintData?.share_type === "public",
          isOwnBlueprint: isOwnBlueprint,
          pendingUpdates: totalPendingUpdates,
          saving: saving,
          blueprintName: loadedBlueprintData?.name,
        },
      }),
    );
  }, [
    nodes.length,
    blueprintReadme,
    isOwnBlueprint,
    loadedBlueprintData,
    pendingUpdates.length,
    hasBlueprintChanges,
    saving,
  ]);

  // Listen for header button clicks
  useEffect(() => {
    const handlePublishClick = () => setShowPublishModal(true);
    const handleShowDocsClick = () => setShowBlueprintReadme(true);
    const handleSaveChangesClick = () => saveAllChanges();

    const handleAgentCreatedEvent = (event: CustomEvent) => {
      const newAgent = event.detail.agent;
      console.log("[AgentFlowBuilder] Agent created event received:", newAgent._id || newAgent.id);
      onAddAgent(newAgent);
    };

    // const agentType = loadedBlueprintData?.orchestration_type;
    const handleCloneClick = async (event: CustomEvent) => {
      if (loadedBlueprintId) {
        const blueprintName = event.detail.blueprintName;
        try {
          const clonedBlueprint = await blueprintApiService.cloneBlueprint(
            loadedBlueprintId,
            blueprintName,
          );
          console.log("Cloned blueprint response:", clonedBlueprint);

          // Extract the blueprint ID from the response
          const blueprintId = clonedBlueprint?._id || clonedBlueprint?.id || clonedBlueprint?.blueprint_id || clonedBlueprint;

          toast.success(
            "Blueprint cloned successfully! Redirecting to your new blueprint...",
          );
          const redirectUrl = `${Path.ORCHESTRATION}?blueprint=${blueprintId}`;
          
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        } catch (error) {
          console.error("Failed to clone blueprint:", error);
        } finally {
          window.dispatchEvent(new CustomEvent("orchestration:clone-complete"));
        }
      }
    };

    window.addEventListener(
      "orchestration:publish-blueprint",
      handlePublishClick,
    );
    window.addEventListener("orchestration:show-docs", handleShowDocsClick);
    window.addEventListener(
      "orchestration:save-changes",
      handleSaveChangesClick,
    );

    window.addEventListener(
      "orchestration:agent-created",
      handleAgentCreatedEvent as EventListener,
    );

    const handleClone = (e: Event) => handleCloneClick(e as CustomEvent);

    window.addEventListener("orchestration:clone-blueprint", handleClone);

    return () => {
      window.removeEventListener(
        "orchestration:publish-blueprint",
        handlePublishClick,
      );
      window.removeEventListener(
        "orchestration:show-docs",
        handleShowDocsClick,
      );
      window.removeEventListener(
        "orchestration:save-changes",
        handleSaveChangesClick,
      );
      window.removeEventListener(
        "orchestration:agent-created",
        handleAgentCreatedEvent as EventListener,
      );
      window.removeEventListener("orchestration:clone-blueprint", handleClone);
    };
  }, [loadedBlueprintId]);

  const getRagIdFromParent = (node: any) => {
    if (node?.features) {
      const knowledgeBaseFeature = node.features.find(
        (feature: any) =>
          feature.type === "KNOWLEDGE_BASE" && feature.config?.lyzr_rag?.rag_id,
      );
      return knowledgeBaseFeature?.config?.lyzr_rag?.rag_id;
    }
    return null;
  };

  const handleQueryParams = async () => {
    const blueprintId = searchParams.get("blueprint");
    const agentId = searchParams.get("agentId");

    if (blueprintId) {
      try {
        // Load blueprint by ID
        const blueprint = await blueprintApiService.getBlueprint(blueprintId);

        console.log("Blueprint data:", blueprint);
        console.log("Current user:", currentUser);

        // Store the loaded blueprint data
        setIsOwnBlueprint(blueprint?.is_owner);
        setIsViewOnlyMode(!blueprint?.is_owner); // Non-owners get view-only mode
        setLoadedBlueprintId(blueprintId);
        setLoadedBlueprintData(blueprint);

        // Dispatch event to show VettedAgentPopup
        window.dispatchEvent(
          new CustomEvent("orchestration:blueprint-loaded", {
            detail: {
              blueprintName: blueprint.name,
              blueprintId: blueprintId
            },
          }),
        );
        // Check if the current user owns this blueprint
        // The blueprint has user_id field, not owner_id
        // const userId = currentUser?.id;
        // const blueprintUserId = blueprint.user_id;

        // if (blueprintUserId && userId) {
        //   setIsOwnBlueprint(blueprintUserId === userId);
        //   console.log(
        //     "Is own blueprint:",
        //     blueprintUserId === userId,
        //     "Blueprint user_id:",
        //     blueprintUserId,
        //     "Current user id:",
        //     userId,
        //   );
        // }

        // Store blueprint documentation if available
        if (blueprint.blueprint_info?.documentation_data?.markdown) {
          setBlueprintReadme({
            markdown: blueprint.blueprint_info.documentation_data.markdown,
            name: blueprint.name,
          });
          // Only auto-show readme on first load of this blueprint, not when re-fetching after save
          if (loadedBlueprintId !== blueprintId) {
            setShowBlueprintReadme(true);
          }
        }

        // If blueprint has stored agents, load them directly
        if (blueprint.blueprint_data?.agents) {
          const storedAgents = Object.values(
            blueprint.blueprint_data.agents,
          ) as Agent[];

          // Add stored agents to the flow
          if (blueprint.blueprint_data?.nodes) {
            const isOwnBlueprint = blueprint?.is_owner ?? true;
            const flowNodes = blueprint.blueprint_data.nodes.map(
              (node: any) => {
                const nodeData =
                  storedAgents.find((a: Agent) => a._id === node.data._id) ||
                  node.data;
                return {
                  ...node,
                  type: node.type || "agent",
                  data: { ...nodeData, isOwnBlueprint },
                };
              },
            );

            // Load groups if they exist
            const groupNodes = getGroupsFromBlueprintData(
              blueprint.blueprint_data,
            );
            setNodes([...flowNodes, ...groupNodes]);
          }

          if (blueprint.blueprint_data?.edges) {
            setEdges(blueprint.blueprint_data.edges);
          }

          // Fit view to show all nodes
          setTimeout(() => {
            reactFlowInstance?.fitView({ padding: 0.2 });
          }, 100);
        }

        // Check if this is a vetted agent formation from Lyzr (specific organization ID)
        const targetOrgId = "1e24ff46-b9a9-4a12-b664-d228c51766de";
        console.log("Blueprint organization check:", {
          organization_id: blueprint.organization_id,
          org_id: blueprint.org_id,
          targetOrgId,
          shouldShowPopup: blueprint.organization_id === targetOrgId || blueprint.org_id === targetOrgId
        });

        if (blueprint.organization_id === targetOrgId || blueprint.org_id === targetOrgId) {
          console.log("Vetted agent formation detected! Will show popup in 1 second...");
          // Show the vetted agent popup after 1 second
          setTimeout(() => {
            console.log("Showing vetted agent popup now");
            setShowVettedAgentPopup(true);
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to load blueprint:", error);
        toast.error("Failed to load blueprint");
      }
    } else if (agentId) {
      // Always fetch by ID — never rely on the paginated cache,
      // since the agent may have just been created or not be on the first page.
      try {
        const agent = await getAgent(agentId);
        if (agent) {
          const agentPool = await fetchAgentWithChildren(agent);
          addAgentTreeToCanvas(agent, { x: 250, y: 100 }, agentPool);

        }
      } catch (error) {
        console.error("[AgentFlowBuilder] Failed to fetch agent:", error);
      }
      // Reset blueprint data when not loading a blueprint
      setIsOwnBlueprint(true); // User creating new content is always owner
      setIsViewOnlyMode(false); // Allow editing for new content
    } else {
      // Reset blueprint data when not loading anything
      setIsOwnBlueprint(true); // Default to owner for new/empty canvas
      setIsViewOnlyMode(false); // Allow editing for empty canvas
      setLoadedBlueprintId(null);
      setLoadedBlueprintData(null);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceIsToolNode =
        sourceNode.data.isToolNode ||
        sourceNode.data.agent_role === "Tool" ||
        sourceNode.data.agent_role === "Tool Action";
      const targetIsToolNode =
        targetNode.data.isToolNode ||
        targetNode.data.agent_role === "Tool" ||
        targetNode.data.agent_role === "Tool Action";

      // Prevent tool-to-tool connections
      if (sourceIsToolNode && targetIsToolNode) {
        toast.error("Cannot connect tool to tool");
        return;
      }

      // Prevent agent-to-agent connections when source is tool (tools can only connect to agents)
      if (sourceIsToolNode && !targetIsToolNode) {
        toast.error("Tools can only be connected from agents, not to agents");
        return;
      }

      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: "default",
        markerEnd: { type: MarkerType.ArrowClosed },
        markerStart: { type: MarkerType.ArrowClosed },
        label: targetIsToolNode
          ? `Tool: ${targetNode.data.name}`
          : `Connection to ${targetNode.data.name}`,
        data: {
          usageDescription: targetIsToolNode
            ? `Tool: ${targetNode.data.name}`
            : `Connection to ${targetNode.data.name}`,
        },
        style: {
          stroke: targetIsToolNode ? "#10b981" : "#6366f1",
          strokeWidth: 2,
        },
        labelStyle: {
          fill: "currentColor",
          fontWeight: 500,
          fontSize: "12px",
        },
        labelBgStyle: {
          fill: "hsl(var(--background))",
          fillOpacity: 0.9,
          stroke: "hsl(var(--border))",
          strokeWidth: 1,
          borderRadius: 6,
        },
        labelBgPadding: [8, 12] as [number, number],
      } as Edge;

      setEdges((eds) => addEdge(newEdge, eds));

      // Mark blueprint as having changes when connections are made
      // Enable save button for any connection when user has edit permissions
      if (isOwnBlueprint) {
        setHasBlueprintChanges(true);
      }

      if (targetIsToolNode) {
        // Handle tool connection
        addToolConnection(
          sourceNode.data as Agent,
          targetNode.data,
          `Tool: ${targetNode.data.name}`,
        );
      } else {
        // Handle agent connection
        addPendingUpdate(
          sourceNode.data as Agent,
          targetNode.data as Agent,
          `Connection to ${targetNode.data.name}`,
        );
      }

      const connectionType = targetIsToolNode ? "tool" : "agent";
      toast.success(
        `Connected ${targetNode.data.name} ${connectionType} to ${sourceNode.data.name} - Click Save to apply changes`,
      );
    },
    [nodes, setEdges],
  );

  const addPendingUpdate = (
    parentAgent: Agent,
    childAgent: Agent,
    usageDescription: string,
  ) => {
    const currentManagedAgents = parentAgent.managed_agents || [];
    const updatedManagedAgents = [
      ...currentManagedAgents,
      {
        id: childAgent._id,
        name: childAgent.name,
        usage_description: usageDescription,
      },
    ];

    setPendingUpdates((prev) => {
      const existing = prev.find((p) => p.agentId === parentAgent._id);
      let newUpdates;
      if (existing) {
        newUpdates = prev.map((p) =>
          p.agentId === parentAgent._id
            ? { ...p, managedAgents: updatedManagedAgents }
            : p,
        );
      } else {
        newUpdates = [
          ...prev,
          { agentId: parentAgent._id, managedAgents: updatedManagedAgents },
        ];
      }

      console.log("=== PENDING UPDATES AFTER CONNECTION ===");
      console.log("Connection added:", `${parentAgent.name} -> ${childAgent.name}`);
      console.log("pendingUpdates length:", newUpdates.length);
      console.log("pendingUpdates:", newUpdates);

      return newUpdates;
    });

    // Update local node data for visual feedback
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === parentAgent._id
          ? {
            ...node,
            data: { ...node.data, managed_agents: updatedManagedAgents },
          }
          : node,
      ),
    );
  };

  const addToolConnection = (
    parentAgent: Agent,
    toolNode: any,
    _usageDescription: string,
  ) => {
    // Parse existing tool_usage_description or create new one
    let toolUsageDescription: { [key: string]: any } = {};

    if (parentAgent.tool_usage_description) {
      try {
        toolUsageDescription = JSON.parse(parentAgent.tool_usage_description);
      } catch (error) {
        console.error("Failed to parse tool_usage_description:", error);
      }
    }

    // Extract tool provider and action name from the tool node
    const toolProvider = toolNode.provider_id?.toLowerCase() || "unknown";
    const actionName = toolNode.name.toUpperCase().replace(/\s+/g, "_");

    // Initialize provider object if it doesn't exist
    if (!toolUsageDescription[toolProvider]) {
      toolUsageDescription[toolProvider] = {
        actions: [],
        provider_icon: toolNode.providerLogo || toolNode.logo || null,
      };
    }

    // Ensure actions array exists
    if (!toolUsageDescription[toolProvider].actions) {
      toolUsageDescription[toolProvider].actions = [];
    }

    // Add the action if it doesn't already exist
    if (!toolUsageDescription[toolProvider].actions.includes(actionName)) {
      toolUsageDescription[toolProvider].actions.push(actionName);
    }

    // Update provider_icon if available
    if (toolNode.providerLogo || toolNode.logo) {
      toolUsageDescription[toolProvider].provider_icon =
        toolNode.providerLogo || toolNode.logo;
    }

    // Convert back to JSON string
    const updatedToolUsageDescription = JSON.stringify(
      toolUsageDescription,
      null,
      2,
    );

    // Update pending updates for tool_usage_description
    setPendingUpdates((prev) => {
      const existing = prev.find((p) => p.agentId === parentAgent._id);
      if (existing) {
        return prev.map((p) =>
          p.agentId === parentAgent._id
            ? { ...p, tool_usage_description: updatedToolUsageDescription }
            : p,
        );
      } else {
        return [
          ...prev,
          {
            agentId: parentAgent._id,
            managedAgents: parentAgent.managed_agents || [],
            tool_usage_description: updatedToolUsageDescription,
          },
        ];
      }
    });

    // Update local node data for visual feedback
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === parentAgent._id
          ? {
            ...node,
            data: {
              ...node.data,
              tool_usage_description: updatedToolUsageDescription,
            },
          }
          : node,
      ),
    );
  };

  const saveAllChanges = async () => {
    // Use refs to get current values (avoids stale closure issues)
    const currentPendingUpdates = [...pendingUpdatesRef.current];
    const currentHasBlueprintChanges = hasBlueprintChangesRef.current;
    const currentLoadedBlueprintId = loadedBlueprintIdRef.current;
    const currentIsOwnBlueprint = isOwnBlueprintRef.current;
    const currentLoadedBlueprintData = loadedBlueprintDataRef.current;
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const currentReactFlowInstance = reactFlowInstanceRef.current;
    const currentAgents = agentsRef.current;

    setHasBlueprintChanges(true);
    console.log("=== SAVE ALL CHANGES CALLED ===");
    console.log("pendingUpdates.length (from ref):", currentPendingUpdates.length);
    console.log("pendingUpdates details:", currentPendingUpdates);
    console.log("hasBlueprintChanges (from ref):", currentHasBlueprintChanges);
    console.log("loadedBlueprintId (from ref):", currentLoadedBlueprintId);
    console.log("isOwnBlueprint (from ref):", currentIsOwnBlueprint);
    console.log("nodes.length (from ref):", currentNodes.length);
    console.log("reactFlowInstance exists (from ref):", !!currentReactFlowInstance);

    console.log("Captured current state - pendingUpdates:", currentPendingUpdates.length, "hasBlueprintChanges:", currentHasBlueprintChanges);

    console.log("Starting save process...");
    setSaving(true);
    try {
      // FIRST: Save blueprint changes if we have a loaded blueprint (using our working hacky method)
      const blueprintId = searchParams.get("blueprint");
      if (blueprintId && currentLoadedBlueprintData && currentReactFlowInstance && currentIsOwnBlueprint) {
        console.log("=== SAVING BLUEPRINT FIRST ===");

        try {
          // Get FRESH nodes and edges directly from ReactFlow instance
          const freshNodes = currentReactFlowInstance.getNodes();
          const freshEdges = currentReactFlowInstance.getEdges();

          console.log("Fresh nodes count:", freshNodes.length);
          console.log("Fresh node positions:", freshNodes.slice(0, 2).map((n: any) => ({ id: n.id, position: n.position })));

          // Find manager agent from fresh nodes
          const nodeIds = freshNodes.map((n: any) => n.id);
          const targetIds = freshEdges.map((e: any) => e.target);
          const rootNodes = nodeIds.filter((id: string) => !targetIds.includes(id));
          // alert(rootNodes)

          let managerAgent = null;
          if (rootNodes.length > 0) {
            const rootNode = freshNodes.find((n: any) => n.id === rootNodes[0]);
            managerAgent = rootNode?.data as Agent;
          } else {
            // Fallback: return the first agent marked as MANAGER
            const managerNode = freshNodes.find(
              (n: any) => (n.data as Agent).template_type === "MANAGER",
            );
            managerAgent = managerNode?.data as Agent;
          }

          if (managerAgent) {
            // Prepare tree structure with FRESH data
            const agentsMap: { [key: string]: Agent } = {};

            freshNodes.forEach((node: any) => {
              const agent = node.data as Agent;
              agentsMap[agent._id] = agent;
            });

            const treeStructure = {
              nodes: freshNodes.map((node: any) => ({
                id: node.id,
                position: node.position,
                data: node.data,
              })),
              edges: freshEdges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                data: edge.data, // Preserve edge data including usageDescription
              })),
            };

            const isManagerAgent = managerAgent.managed_agents && managerAgent.managed_agents.length > 0;

            // Create complete BlueprintData structure
            const blueprintData: BlueprintData = {
              name: currentLoadedBlueprintData.name,
              description: currentLoadedBlueprintData.description,
              orchestration_type: isManagerAgent ? "Manager Agent" : "Single Agent",
              orchestration_name: currentLoadedBlueprintData.orchestration_name || currentLoadedBlueprintData.name,
              blueprint_data: {
                manager_agent_id: managerAgent._id,
                tree_structure: treeStructure,
                nodes: treeStructure.nodes,
                edges: treeStructure.edges,
                agents: agentsMap,
              },
              blueprint_info: currentLoadedBlueprintData.blueprint_info || {
                documentation_data: { markdown: "" },
                type: "markdown",
              },
              tags: currentLoadedBlueprintData.tags || [],
              category: currentLoadedBlueprintData.category || "general",
              is_template: currentLoadedBlueprintData.is_template || false,
              share_type: currentLoadedBlueprintData.share_type || "private",
              shared_with_users: currentLoadedBlueprintData.shared_with_users || [],
              shared_with_organizations: currentLoadedBlueprintData.shared_with_organizations || [],
            };

            console.log("Saving blueprint positions:", JSON.stringify(blueprintData.blueprint_data.tree_structure.nodes.map((n: any) => ({ id: n.id, position: n.position })), null, 2));

            await blueprintApiService.updateBlueprint(blueprintId, blueprintData);
            console.log("Blueprint saved successfully");
          }
        } catch (blueprintError) {
          console.error("Failed to save blueprint (continuing with agent updates):", blueprintError);
          // Don't stop - continue with agent updates
        }
      }

      // SECOND: Save agent changes (original logic)
      console.log("=== SAVING AGENT CHANGES ===");
      for (const update of currentPendingUpdates) {
        const agent = currentAgents.find((a) => a._id === update.agentId);
        if (agent) {
          const updatedAgent: Record<string, unknown> = {
            ...agent,
            managed_agents: update.managedAgents,
          };

          // Add tool_usage_description if it exists in the update
          if (update.tool_usage_description !== undefined) {
            updatedAgent.tool_usage_description = update.tool_usage_description;
          }

          console.log(`Updating agent ${agent.name} with:`, {
            managed_agents: update.managedAgents,
            tool_usage_description: update.tool_usage_description,
          });

          await updateAgent(agent._id, updatedAgent);
        }
      }

      // THIRD: Save all agents' current state using the standard v3/agents endpoint
      console.log("=== SAVING ALL AGENTS STATE ===");
      // Save agents if we have a blueprint OR if we have agents on the canvas (direct orchestration page access)
      console.log("reactFlowInstance exists (from ref):", !!currentReactFlowInstance);
      console.log("nodes.length (from ref):", currentNodes.length);

      const reactFlowNodes = currentReactFlowInstance?.getNodes() || [];
      const nodesForSave = reactFlowNodes.length > 0 ? reactFlowNodes : currentNodes;

      console.log("ReactFlow nodes count:", reactFlowNodes.length);
      console.log("Fallback nodes count (from ref):", currentNodes.length);
      console.log("Using nodes count:", nodesForSave.length);
      console.log("Nodes for save:", nodesForSave.map((n: any) => ({ id: n.id, type: n.type, hasId: !!n.data._id, name: n.data.name, isToolNode: n.data.isToolNode })));

      const hasAgentsOnCanvas = nodesForSave.some((node: any) =>
        node.type === "agent" && !node.data.isToolNode && node.data._id && node.data.name
      );

      console.log("hasAgentsOnCanvas:", hasAgentsOnCanvas);
      console.log("currentLoadedBlueprintId && currentIsOwnBlueprint:", currentLoadedBlueprintId && currentIsOwnBlueprint);
      console.log("Final condition:", (currentLoadedBlueprintId && currentIsOwnBlueprint) || hasAgentsOnCanvas);

      if ((currentLoadedBlueprintId && currentIsOwnBlueprint) || hasAgentsOnCanvas) {
        try {
          // Get fresh nodes from ReactFlow to ensure we have current state
          const freshNodes = currentReactFlowInstance?.getNodes() || currentNodes;

          // Filter out tool nodes and get only agent nodes
          const agentNodes = freshNodes.filter((node: any) =>
            node.type === "agent" &&
            !node.data.isToolNode &&
            node.data._id &&
            node.data.name
          );

          console.log(`Found ${agentNodes.length} agents to save:`, agentNodes.map((n: any) => ({ id: n.data._id, name: n.data.name })));

          // Save each agent using the complete update endpoint
          for (const node of agentNodes) {
            const agentData = node.data as Agent;

            try {
              console.log(`Saving agent: ${agentData.name} (${agentData._id})`);

              // Create a clean agent object without React Flow specific properties
              const cleanAgentData = {
                _id: agentData._id,
                api_key: agentData.api_key,
                template_type: agentData.template_type,
                name: agentData.name,
                description: agentData.description,
                agent_role: agentData.agent_role,
                agent_instructions: agentData.agent_instructions,
                agent_goal: agentData.agent_goal,
                agent_context: agentData.agent_context,
                agent_output: agentData.agent_output,
                examples: agentData.examples,
                features: agentData.features,
                tool: agentData.tool,
                tool_usage_description: agentData.tool_usage_description,
                response_format: agentData.response_format,
                provider_id: agentData.provider_id,
                model: agentData.model,
                top_p: agentData.top_p,
                temperature: agentData.temperature,
                managed_agents: agentData.managed_agents || [],
                version: agentData.version,
                llm_credential_id: agentData.llm_credential_id,
              };

              await updateAgentComplete(agentData._id, cleanAgentData);
              console.log(`✓ Successfully saved agent: ${agentData.name}`);

            } catch (agentError) {
              console.error(`Failed to save agent ${agentData.name}:`, agentError);
              // Continue with other agents even if one fails
            }
          }

          console.log("✓ Completed saving all agents");

          // FOURTH: Update blueprint with fresh agent data after agent updates
          if (blueprintId && currentIsOwnBlueprint) {
            try {
              console.log("=== UPDATING BLUEPRINT WITH FRESH AGENT DATA ===");

              const freshNodes = currentReactFlowInstance?.getNodes() || currentNodes;
              const freshEdges = currentReactFlowInstance?.getEdges() || currentEdges;

              // Build updated agents map with current state
              const updatedAgentsMap: { [key: string]: Agent } = {};
              freshNodes.forEach((node: any) => {
                if (node.type === "agent" && !node.data.isToolNode && node.data._id) {
                  updatedAgentsMap[node.data._id] = node.data as Agent;
                }
              });

              // Find manager agent
              const nodeIds = freshNodes.map((n: any) => n.id);
              const targetIds = freshEdges.map((e: any) => e.target);
              const rootNodes = nodeIds.filter((id: string) => !targetIds.includes(id));
              
              let managerAgent = null;
              if (rootNodes.length > 0) {
                const rootNode = freshNodes.find((n: any) => n.id === rootNodes[0]);
                managerAgent = rootNode?.data as Agent;
              } else {
                const managerNode = freshNodes.find(
                  (n: any) => (n.data as Agent).template_type === "MANAGER",
                );
                managerAgent = managerNode?.data as Agent;
              }

              if (managerAgent && Object.keys(updatedAgentsMap).length > 0) {
                const treeStructure = {
                  nodes: freshNodes.map((node: any) => ({
                    id: node.id,
                    position: node.position,
                    type: node.type,
                    data: node.data,
                  })),
                  edges: freshEdges.map((edge: any) => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    data: edge.data,
                  })),
                };

                const isManagerAgent = managerAgent.managed_agents && managerAgent.managed_agents.length > 0;

                const blueprintData: BlueprintData = {
                  name: currentLoadedBlueprintData.name,
                  description: currentLoadedBlueprintData.description,
                  orchestration_type: isManagerAgent ? "Manager Agent" : "Single Agent",
                  orchestration_name: currentLoadedBlueprintData.orchestration_name || currentLoadedBlueprintData.name,
                  blueprint_data: {
                    manager_agent_id: managerAgent._id,
                    tree_structure: treeStructure,
                    nodes: treeStructure.nodes,
                    edges: treeStructure.edges,
                    agents: updatedAgentsMap, // This now has fresh agent data
                  },
                  blueprint_info: currentLoadedBlueprintData.blueprint_info || {
                    documentation_data: { markdown: "" },
                    type: "markdown",
                  },
                  tags: currentLoadedBlueprintData.tags || [],
                  category: currentLoadedBlueprintData.category || "general",
                  is_template: currentLoadedBlueprintData.is_template || false,
                  share_type: currentLoadedBlueprintData.share_type || "private",
                  shared_with_users: currentLoadedBlueprintData.shared_with_users || [],
                  shared_with_organizations: currentLoadedBlueprintData.shared_with_organizations || [],
                };

                await blueprintApiService.updateBlueprint(blueprintId, blueprintData);
                console.log("✓ Blueprint updated with fresh agent data");
              }
            } catch (blueprintUpdateError) {
              console.error("Failed to update blueprint with fresh agent data:", blueprintUpdateError);
            }
          }

        } catch (agentsError) {
          console.error("Failed to save agents state (continuing):", agentsError);
        }
      }

      setPendingUpdates([]);
      setHasBlueprintChanges(false);
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Handle saving changes and then opening chat
  const handleSaveAndOpenChat = useCallback(async () => {
    if (!pendingChatAgent) return;

    try {
      // Save all changes first
      await saveAllChanges();

      // After saving, open chat with the pending agent
      setSelectedAgent(pendingChatAgent);
      setOpenedViaPlayButton(true);
      toast.success(`Opening chat with ${pendingChatAgent.name}`);

      // Close modal and clear pending agent
      setShowUnsavedChangesModal(false);
      setPendingChatAgent(null);
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  }, [pendingChatAgent, saveAllChanges]);

  // Handle proceeding to chat without saving
  const handleProceedWithoutSaving = useCallback(() => {
    if (!pendingChatAgent) return;

    setSelectedAgent(pendingChatAgent);
    setOpenedViaPlayButton(true);
    toast.warning(`Opening chat with ${pendingChatAgent.name} (unsaved changes remain)`);

    // Close modal and clear pending agent
    setShowUnsavedChangesModal(false);
    setPendingChatAgent(null);
  }, [pendingChatAgent]);

  // Handle canceling the chat
  const handleCancelChat = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setPendingChatAgent(null);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();

    // Handle group node selection
    if (node.type === "group") {
      console.log("Group node clicked in ReactFlow:", node.id);
      setSelectedAgent(null);
      setSelectedKBNode(null);
      setSelectedGroup(node.id);
      setSelectedNote(null);
      return;
    }

    // Handle text note selection
    if (node.type === "textNote") {
      console.log("Text note clicked in ReactFlow:", node.id);
      setSelectedAgent(null);
      setSelectedKBNode(null);
      setSelectedGroup(null);
      setSelectedNote(node.id);
      return;
    }

    if (node.type === "knowledgeBase") {
      setSelectedAgent(null);
      setSelectedGroup(null);
      setSelectedNote(null);
      setSelectedKBNode(node);
      return;
    }

    // Handle regular agent node selection
    setSelectedGroup(null);
    setSelectedNote(null);
    setSelectedKBNode(null);
    setSelectedAgent(node.data as Agent);
    setOpenedViaPlayButton(false); // Regular click, not play button
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedAgent(null);
    setSelectedKBNode(null);
    setSelectedEdge(null);
    setSelectedGroup(null);
    setSelectedNote(null);
  }, []);

  const updateAgentProperties = async (
    agentId: string,
    updates: Partial<Agent>,
  ) => {
    setUpdatingAgent(true);
    try {
      // Get connected child agents from edges
      const connectedChildAgents = edges
        .filter((edge) => edge.source === agentId)
        .map((edge) => {
          const targetNode = nodes.find((node) => node.id === edge.target);
          if (targetNode && !targetNode.data.isToolNode) {
            return {
              id: targetNode.data._id,
              name: targetNode.data.name,
              usage_description: edge.data?.usageDescription || `Connection to ${targetNode.data.name}`,
            };
          }
          return null;
        })
        .filter((item): item is { id: string; name: string; usage_description: string } =>
          item !== null
        );

      // Get the first connected tool (since tool is a string, not array)
      const connectedTool = edges
        .filter((edge) => edge.source === agentId)
        .map((edge) => {
          const targetNode = nodes.find((node) => node.id === edge.target);
          if (targetNode && targetNode.data.isToolNode && typeof targetNode.data.name === 'string') {
            return targetNode.data.name;
          }
          return null;
        })
        .filter((name): name is string => name !== null && typeof name === 'string')[0]; // Get the first tool

      // Prepare complete updates including managed agents and tools
      const completeUpdates: Partial<Agent> = {
        ...updates,
        managed_agents: connectedChildAgents,
      };

      // Add tool if connected
      if (connectedTool) {
        completeUpdates.tool = connectedTool;
      }

      await updateAgent(agentId, completeUpdates);

      // Update nodes data
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === agentId
            ? { ...node, data: { ...node.data, ...completeUpdates } }
            : node,
        ),
      );

      // Clear any related pending updates since we've now saved them
      setPendingUpdates((prev) =>
        prev.filter((update) => update.agentId !== agentId)
      );

      toast.success("Agent updated successfully");
      setSelectedAgent(null);
      // Refresh agents data from server
      await refreshAgents();
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast.error("Failed to update agent");
    } finally {
      setUpdatingAgent(false);
    }
  };

  /**
   * Fetches an agent's managed sub-agents by ID.
   * Returns an array containing the root agent + all resolved children.
   * Uses Promise.allSettled so one failed child fetch doesn't break the whole tree.
   */
  const fetchAgentWithChildren = async (agent: Agent): Promise<Agent[]> => {
    const allAgents: Agent[] = [agent];
    if (agent.managed_agents?.length) {
      const childResults = await Promise.allSettled(
        agent.managed_agents.map((ma: { id: string }) => getAgent(ma.id)),
      );
      childResults.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          allAgents.push(r.value);
        } else if (r.status === "rejected") {
          console.warn("[AgentFlowBuilder] Failed to fetch managed agent:", r.reason);
        }
      });
    }
    return allAgents;
  };

  /**
   * Shared logic: build tree layout, add nodes/edges to canvas, show toast, mark dirty.
   */
  const addAgentTreeToCanvas = (
    agent: Agent,
    position: { x: number; y: number },
    agentPool: Agent[],
  ) => {
    const { nodes: newNodes, edges: newEdges } = createTreeLayoutFromAgent(
      agent,
      position,
      agentPool,
    );

    console.log("[AgentFlowBuilder] Adding to canvas:", {
      agent: agent.name,
      nodes: newNodes.length,
      edges: newEdges.length,
    });

    setNodes((nds) => [...nds, ...newNodes]);
    if (newEdges.length > 0) {
      setEdges((eds) => [...eds, ...newEdges]);
    }

    if (isOwnBlueprint) {
      setHasBlueprintChanges(true);
    }

    // Show contextual toast
    const toolCount = newNodes.filter((n) => n.data.isToolNode).length;
    const agentCount = newNodes.length - toolCount;

    if (toolCount > 0) {
      toast.success(
        `Added ${agent.name} with ${toolCount} tool(s) and ${agentCount - 1} sub-agent(s) to canvas`,
      );
    } else if (agentCount > 1) {
      toast.success(
        `Added ${agent.name} and ${agentCount - 1} sub-agent(s) to canvas`,
      );
    } else {
      toast.success(`Added ${agent.name} to canvas`);
    }
  };

  const onAddAgent = async (agent: Agent) => {
    if (nodes.find((node) => node.id === agent._id)) {
      toast.error(`${agent.name} is already on the canvas`);
      return;
    }

    const randomX = Math.random() * 400 + 100;
    const randomY = Math.random() * 400 + 100;
    const position = {
      x: randomX,
      y: showBands ? snapToNearestBand(randomY) : randomY,
    };

    const agentPool = await fetchAgentWithChildren(agent);
    addAgentTreeToCanvas(agent, position, agentPool);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const parseToolUsageDescription = (toolUsageDescription: string) => {
    try {
      return JSON.parse(toolUsageDescription);
    } catch (error) {
      console.error("Failed to parse tool_usage_description:", error);
      return {};
    }
  };

  const createTreeLayoutFromAgent = (
    rootAgent: Agent,
    dropPosition: { x: number; y: number },
    extraAgents: Agent[] = [],
  ) => {
    // extraAgents are always provided by callers (fetched by ID via fetchAgentWithChildren).
    // Falls back to the paginated cache only as a safety net.
    const agentPool = extraAgents.length > 0 ? extraAgents : agents;
    const findAgent = (id: string): Agent | undefined =>
      agentPool.find((a) => (a._id || a.id) === id);

    const treeNodes: TreeNode[] = [];
    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    // Build tree structure recursively with improved spacing
    const buildTreeNode = (
      agent: Agent,
      parentId?: string,
      level: number = 0,
    ): TreeNode => {
      const agentId = agent._id || agent.id; // Try both formats
      if (!agentId) {
        console.error("Agent has no valid ID:", agent);
        return null as any;
      }

      const treeNode: TreeNode = {
        id: String(agentId),
        parentId,
        children: [],
        width: DEFAULT_LAYOUT_CONFIG.nodeWidth,
        height: DEFAULT_LAYOUT_CONFIG.nodeHeight,
        level,
      };

      // Add managed agents as children with proper sorting
      if (agent.managed_agents && agent.managed_agents.length > 0) {
        const sortedManagedAgents = [...agent.managed_agents].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        sortedManagedAgents.forEach((managedAgent) => {
          const subAgent = findAgent(managedAgent.id);
          if (subAgent) {
            const childNode = buildTreeNode(subAgent, agent._id, level + 1);
            treeNode.children.push(childNode);
          }
        });
      }

      treeNodes.push(treeNode);
      return treeNode;
    };

    // Build the tree starting from root
    buildTreeNode(rootAgent);

    // Use the improved tree layout algorithm with better spacing
    const layoutNodes = calculateSimpleTreeLayout(treeNodes, {
      ...DEFAULT_LAYOUT_CONFIG,
      verticalSpacing: 250, // Increased vertical spacing for better separation
      siblingSpacing: 120, // Better sibling spacing
      subtreeSpacing: 180, // Better subtree spacing
      horizontalSpacing: 180, // Better horizontal spacing
    });

    // Create ReactFlow nodes and edges with improved positioning
    layoutNodes.forEach((layoutNode) => {
      const agent = findAgent(layoutNode.id);
      if (!agent) return;

      const position = {
        x: dropPosition.x + (layoutNode.x || 0),
        y: dropPosition.y + (layoutNode.y || 0),
      };

      // Snap to band if enabled
      const finalPosition = {
        ...position,
        y: showBands ? snapToNearestBand(position.y) : position.y,
      };

      // Create main agent node
      const reactFlowNode: Node = {
        id: agent._id,
        type: "agent",
        position: finalPosition,
        data: agent,
      };
      reactFlowNodes.push(reactFlowNode);

      if (
        !layoutNode.parentId &&
        agent._id === rootAgent._id &&
        rootAgent.features?.some((f: any) => f.type === "KNOWLEDGE_BASE")
      ) {
        const kbId = getRagIdFromParent(rootAgent);
        const agentBandY = showBands
          ? snapToNearestBand(finalPosition.y)
          : finalPosition.y;
        const kbBandY = showBands
          ? snapToNearestBand(agentBandY + 200)
          : agentBandY + 200;

        const kbPosition = {
          x: finalPosition.x - 350,
          y: kbBandY,
        };

        const alreadyAdded =
          reactFlowNodes.some((n) => n.id === kbId) ||
          nodes.some((n) => n.id === kbId);

        if (!alreadyAdded) {
          const kbNode: Node = {
            id: kbId,
            type: "knowledgeBase",
            position: kbPosition,
            data: {
              _id: kbId,
              name: "Knowledge Base",
              description: "Knowledge base configuration",
              // agent_role: "Knowledge Base", // Commenting backend identification as an agent
              isKnowledgeBaseNode: true,
              parentAgent: rootAgent,
            },
            selectable: true,
          };

          reactFlowNodes.push(kbNode);

          const kbEdge: Edge = {
            id: `${rootAgent._id}-${kbId}`,
            source: rootAgent._id,
            target: kbId,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Knowledge Base Connection",
            data: { usageDescription: "Knowledge base connection" },
            style: { stroke: "#f59e0b", strokeWidth: 2 },
            labelStyle: {
              fill: "currentColor",
              fontWeight: 500,
              fontSize: "12px",
            },
            labelBgStyle: {
              fill: "hsl(var(--card))",
              fillOpacity: 0.95,
              stroke: "hsl(var(--border))",
              strokeWidth: 1,
              borderRadius: 6,
            },
            labelBgPadding: [8, 12],
          };

          reactFlowEdges.push(kbEdge);
        }
      }

      // Create tool nodes for this agent with improved positioning
      if (agent.tool_usage_description) {
        const toolsData = parseToolUsageDescription(
          agent.tool_usage_description,
        );
        let globalToolIndex = 0; // Global tool index across all providers

        Object.entries(toolsData).forEach(
          ([provider, providerData]: [string, any]) => {
            // Handle both old format (array) and new format (object with actions and provider_icon)
            const actions = Array.isArray(providerData)
              ? providerData
              : providerData?.actions || [];
            const providerIcon = Array.isArray(providerData)
              ? null
              : providerData?.provider_icon;

            if (Array.isArray(actions)) {
              actions.forEach((actionName: string) => {
                // Calculate tool position - place tools at the next band level below the agent
                const agentBandY = showBands
                  ? snapToNearestBand(finalPosition.y)
                  : finalPosition.y;
                const toolBandY = showBands
                  ? snapToNearestBand(agentBandY + 200)
                  : agentBandY + 200; // Move to next band

                // Calculate horizontal position with proper spacing
                const baseToolX = finalPosition.x + 300; // Base offset from agent
                const toolSpacing = 200; // Spacing between tools
                const toolPosition = {
                  x: baseToolX + globalToolIndex * toolSpacing,
                  y: toolBandY,
                };

                const toolNodeId = `tool-${agent._id}-${provider}-${actionName}-${Date.now()}`;

                const toolNode: Node = {
                  id: toolNodeId,
                  type: "agent",
                  position: toolPosition,
                  data: {
                    _id: toolNodeId,
                    name: actionName
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .split(" ")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" "),
                    description: `${provider} tool action`,
                    agent_role: "Tool",
                    provider_id: provider,
                    providerLogo: providerIcon,
                    providerName: provider,
                    isToolNode: true,
                  },
                };

                reactFlowNodes.push(toolNode);

                // Create edge from agent to tool
                const toolEdge: Edge = {
                  id: `${agent._id}-${toolNodeId}`,
                  source: agent._id,
                  target: toolNodeId,
                  type: "default",
                  markerEnd: { type: MarkerType.ArrowClosed },
                  label: `Tool: ${toolNode.data.name}`,
                  data: {
                    usageDescription: `Tool: ${toolNode.data.name}`,
                  },
                  style: {
                    stroke: "#10b981",
                    strokeWidth: 2,
                  },
                  labelStyle: {
                    fill: "currentColor",
                    fontWeight: 500,
                    fontSize: "12px",
                  },
                  labelBgStyle: {
                    fill: "hsl(var(--card))",
                    fillOpacity: 0.95,
                    stroke: "hsl(var(--border))",
                    strokeWidth: 1,
                    borderRadius: 6,
                  },
                  labelBgPadding: [8, 12] as [number, number],
                };

                reactFlowEdges.push(toolEdge);
                globalToolIndex++; // Increment global tool index
              });
            }
          },
        );
      }

      // Create edges between agents with proper parent-child relationships
      if (layoutNode.parentId) {
        const parentAgent = agents.find((a) => a._id === layoutNode.parentId);
        if (parentAgent) {
          const managedAgent = parentAgent.managed_agents?.find(
            (ma) => ma.id === agent._id,
          );

          const edge: Edge = {
            id: `${layoutNode.parentId}-${agent._id}`,
            source: layoutNode.parentId,
            target: agent._id,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
            markerStart: { type: MarkerType.ArrowClosed },
            label:
              managedAgent?.usage_description || `Connection to ${agent.name}`,
            data: {
              usageDescription:
                managedAgent?.usage_description ||
                `Connection to ${agent.name}`,
            },
            style: {
              stroke: "#6366f1",
              strokeWidth: 2,
            },
            labelStyle: {
              fill: "currentColor",
              fontWeight: 500,
              fontSize: "12px",
            },
            labelBgStyle: {
              fill: "hsl(var(--card))",
              fillOpacity: 0.95,
              stroke: "hsl(var(--border))",
              strokeWidth: 1,
              borderRadius: 6,
            },
            labelBgPadding: [8, 12] as [number, number],
          };
          reactFlowEdges.push(edge);
        }
      }
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  };

  // Add band snapping to node drag end
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Mark blueprint as having changes when any node is moved
      // Enable save button for any node movement when user has edit permissions
      if (isOwnBlueprint) {
        setHasBlueprintChanges(true);
      }

      if (!showBands) return;

      const snappedY = snapToNearestBand(node.position.y);
      if (snappedY !== node.position.y) {
        setNodes((nodes) =>
          nodes.map((n) =>
            n.id === node.id
              ? { ...n, position: { ...n.position, y: snappedY } }
              : n,
          ),
        );
      }
    },
    [showBands, setNodes, loadedBlueprintId, isOwnBlueprint],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const draggedData = event.dataTransfer.getData("application/reactflow");

      if (typeof draggedData === "undefined" || !draggedData) {
        return;
      }

      const parsedData = JSON.parse(draggedData);
      console.log("Dropped data:", parsedData);

      // Handle different types of dragged items
      if (parsedData.type === "tool") {
        // Handle tool provider drag
        const { provider, action } = parsedData;

        const position = reactFlowInstance?.screenToFlowPosition({
          x: event.clientX - 250,
          y: event.clientY,
        }) || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        };

        // Snap to band if enabled
        const snappedY = showBands ? snapToNearestBand(position.y) : position.y;

        const toolNode: Node = {
          id: `tool-${provider._id}-${action.name}-${Date.now()}`,
          type: "agent",
          position: { ...position, y: snappedY },
          data: {
            _id: `tool-${provider._id}-${action.name}`,
            name: action.name
              .replace(/_/g, " ")
              .toLowerCase()
              .split(" ")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" "),
            description: action.description || `${provider.provider_id} tool`,
            agent_role: "Tool",
            provider_id: provider.provider_id,
            providerLogo: provider.meta_data?.logo,
            providerName: provider.provider_id,
            isToolNode: true,
          },
        };

        setNodes((nds) => [...nds, toolNode]);

        // Mark blueprint as having changes when tools are added
        // Enable save button for any tool addition when user has edit permissions
        if (isOwnBlueprint) {
          setHasBlueprintChanges(true);
        }

        toast.success(`Added ${toolNode.data.name} tool to canvas`);
        return;
      }

      if (parsedData.type === "parsed-action") {
        // Handle parsed action drag
        const position = reactFlowInstance?.screenToFlowPosition({
          x: event.clientX - 250,
          y: event.clientY,
        }) || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        };

        // Snap to band if enabled
        const snappedY = showBands ? snapToNearestBand(position.y) : position.y;

        const actionNode: Node = {
          id: `action-${parsedData.agentId}-${parsedData.actionName}-${Date.now()}`,
          type: "agent",
          position: { ...position, y: snappedY },
          data: {
            _id: `action-${parsedData.agentId}-${parsedData.actionName}`,
            name: parsedData.actionName
              .replace(/_/g, " ")
              .toLowerCase()
              .split(" ")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" "),
            description: `${parsedData.toolName} action from ${parsedData.agentName}`,
            agent_role: "Tool Action",
            isToolNode: true,
          },
        };

        setNodes((nds) => [...nds, actionNode]);

        // Mark blueprint as having changes when actions are added
        // Enable save button for any action addition when user has edit permissions
        if (isOwnBlueprint) {
          setHasBlueprintChanges(true);
        }

        toast.success(`Added ${actionNode.data.name} action to canvas`);
        return;
      }

      // Handle regular agent drag with tree layout
      const agent = parsedData as Agent;

      if (nodes.find((node) => node.id === agent._id)) {
        toast.error(`${agent.name} is already on the canvas`);
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - 250,
        y: event.clientY,
      }) || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      };

      const snappedPosition = {
        ...position,
        y: showBands ? snapToNearestBand(position.y) : position.y,
      };

      const agentPool = await fetchAgentWithChildren(agent);
      addAgentTreeToCanvas(agent, snappedPosition, agentPool);
    },
    [reactFlowInstance, nodes, agents, setNodes, setEdges, showBands],
  );

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  };

  const updateEdgeDescription = (edgeId: string, newDescription: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? {
            ...e,
            data: { ...e.data, usageDescription: newDescription },
            label: newDescription,
            labelStyle: {
              fill: "currentColor",
              fontWeight: 500,
              fontSize: "12px",
            },
            labelBgStyle: {
              fill: "hsl(var(--card))",
              fillOpacity: 0.95,
              stroke: "hsl(var(--border))",
              strokeWidth: 1,
              borderRadius: 6,
            },
            labelBgPadding: [8, 12] as [number, number],
          }
          : e,
      ),
    );

    const parentAgent = sourceNode.data as Agent;
    const currentManagedAgents = parentAgent.managed_agents || [];
    const updatedManagedAgents = currentManagedAgents.map((ma: any) =>
      ma.id === (targetNode.data as Agent)._id
        ? { ...ma, usage_description: newDescription }
        : ma,
    );

    setPendingUpdates((prev) => {
      const existing = prev.find((p) => p.agentId === parentAgent._id);
      if (existing) {
        return prev.map((p) =>
          p.agentId === parentAgent._id
            ? { ...p, managedAgents: updatedManagedAgents }
            : p,
        );
      } else {
        return [
          ...prev,
          { agentId: parentAgent._id, managedAgents: updatedManagedAgents },
        ];
      }
    });

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === parentAgent._id
          ? {
            ...node,
            data: { ...node.data, managed_agents: updatedManagedAgents },
          }
          : node,
      ),
    );

    // Mark blueprint as having changes when edge descriptions are updated
    // Enable save button for any edge update when user has edit permissions
    if (isOwnBlueprint) {
      setHasBlueprintChanges(true);
    }

    toast.success(
      "Connection description updated - Click Save to apply changes",
    );
  };

  const deleteEdge = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    // Remove the edge
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));

    // Mark blueprint as having changes when edges are deleted
    // Enable save button for any edge deletion when user has edit permissions
    if (isOwnBlueprint) {
      setHasBlueprintChanges(true);
    }

    // Check if this is a connection to a tool node
    const targetIsToolNode = targetNode.data.isToolNode === true;

    if (targetIsToolNode) {
      // For tool nodes, update the parent agent's tool usage description
      const parentAgent = sourceNode.data as Agent;

      // Parse current tool usage description
      let toolsData: Record<string, any> = {};
      try {
        toolsData = parentAgent.tool_usage_description
          ? JSON.parse(parentAgent.tool_usage_description)
          : {};
      } catch (e) {
        console.error("Failed to parse tool usage description:", e);
      }

      // Remove the tool from the provider
      const providerId = targetNode.data.provider_id as string;
      if (toolsData[providerId]) {
        if (Array.isArray(toolsData[providerId])) {
          // Old format - array of actions
          toolsData[providerId] = toolsData[providerId].filter(
            (action: string) => action !== targetNode.data.name,
          );
          if (toolsData[providerId].length === 0) {
            delete toolsData[providerId];
          }
        } else {
          // New format - object with actions array
          toolsData[providerId].actions = toolsData[providerId].actions.filter(
            (action: string) => action !== targetNode.data.name,
          );
          if (toolsData[providerId].actions.length === 0) {
            delete toolsData[providerId];
          }
        }
      }

      const updatedToolUsageDescription =
        Object.keys(toolsData).length > 0 ? JSON.stringify(toolsData) : "";

      setPendingUpdates((prev) => {
        const existing = prev.find((p) => p.agentId === parentAgent._id);
        if (existing) {
          return prev.map((p) =>
            p.agentId === parentAgent._id
              ? { ...p, tool_usage_description: updatedToolUsageDescription }
              : p,
          );
        } else {
          return [
            ...prev,
            {
              agentId: parentAgent._id,
              managedAgents: parentAgent.managed_agents || [],
              tool_usage_description: updatedToolUsageDescription,
            },
          ];
        }
      });

      // Remove the tool node from the canvas
      setNodes((nds) => nds.filter((n) => n.id !== targetNode.id));

      toast.success("Tool connection deleted - Click Save to apply changes");
    } else {
      // For agent connections, update the parent agent's managed agents
      const parentAgent = sourceNode.data as Agent;
      const updatedManagedAgents = (parentAgent.managed_agents || []).filter(
        (ma: any) => ma.id !== targetNode.data._id,
      );

      setPendingUpdates((prev) => {
        const existing = prev.find((p) => p.agentId === parentAgent._id);
        if (existing) {
          return prev.map((p) =>
            p.agentId === parentAgent._id
              ? { ...p, managedAgents: updatedManagedAgents }
              : p,
          );
        } else {
          return [
            ...prev,
            { agentId: parentAgent._id, managedAgents: updatedManagedAgents },
          ];
        }
      });

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === parentAgent._id
            ? {
              ...node,
              data: { ...node.data, managed_agents: updatedManagedAgents },
            }
            : node,
        ),
      );

      toast.success("Agent connection deleted - Click Save to apply changes");
    }
  };

  // const handleUndo = () => {
  //   if (reactFlowInstance) {
  //     // This will trigger undo functionality
  //     document.dispatchEvent(
  //       new KeyboardEvent("keydown", {
  //         key: "z",
  //         ctrlKey: true,
  //         bubbles: true,
  //       }),
  //     );
  //   }
  // };

  // const handleRedo = () => {
  //   if (reactFlowInstance) {
  //     // This will trigger redo functionality
  //     document.dispatchEvent(
  //       new KeyboardEvent("keydown", {
  //         key: "y",
  //         ctrlKey: true,
  //         bubbles: true,
  //       }),
  //     );
  //   }
  // };

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  // const handleFitView = () => {
  //   if (reactFlowInstance) {
  //     reactFlowInstance.fitView();
  //   }
  // };

  // const handleReset = () => {
  //   if (reactFlowInstance) {
  //     reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  //   }
  // };

  const onNodesChange = useCallback(
    (changes: any[]) => {
      // Handle selections will be done in useEffect

      // Handle node deletions
      const deletions = changes.filter((change) => change.type === "remove");

      if (deletions.length > 0) {
        deletions.forEach((deletion) => {
          const deletedNode = nodes.find((n) => n.id === deletion.id);
          if (!deletedNode) return;

          const deletedNodeData = deletedNode.data as any;

          // If it's a tool node, remove it from tool_usage_description of connected agents
          if (
            deletedNodeData.isToolNode ||
            deletedNodeData.agent_role === "Tool" ||
            deletedNodeData.agent_role === "Tool Action"
          ) {
            // Find agents connected to this tool
            const connectedEdges = edges.filter(
              (edge) => edge.target === deletion.id,
            );

            connectedEdges.forEach((edge) => {
              const parentNode = nodes.find((n) => n.id === edge.source);
              if (!parentNode || parentNode.data.isToolNode) return;

              const parentAgent = parentNode.data as Agent;

              // Parse and update tool_usage_description
              let toolUsageDescription: { [key: string]: any } = {};

              if (parentAgent.tool_usage_description) {
                try {
                  toolUsageDescription = JSON.parse(
                    parentAgent.tool_usage_description,
                  );
                } catch (error) {
                  console.error(
                    "Failed to parse tool_usage_description:",
                    error,
                  );
                }
              }

              // Remove the tool action from the provider
              const toolProvider =
                deletedNodeData.provider_id?.toLowerCase() || "unknown";
              const actionName = deletedNodeData.name
                .toUpperCase()
                .replace(/\s+/g, "_");

              console.log(
                `Removing tool: ${actionName} from provider: ${toolProvider}`,
              );

              if (
                toolUsageDescription[toolProvider] &&
                toolUsageDescription[toolProvider].actions
              ) {
                toolUsageDescription[toolProvider].actions =
                  toolUsageDescription[toolProvider].actions.filter(
                    (action: string) => action !== actionName,
                  );

                // If no actions left for this provider, remove the provider entirely
                if (toolUsageDescription[toolProvider].actions.length === 0) {
                  delete toolUsageDescription[toolProvider];
                }
              }

              const updatedToolUsageDescription = JSON.stringify(
                toolUsageDescription,
                null,
                2,
              );

              console.log(
                `Updated tool_usage_description for ${parentAgent.name}:`,
                updatedToolUsageDescription,
              );

              // Add to pending updates
              setPendingUpdates((prev) => {
                const existing = prev.find(
                  (p) => p.agentId === parentAgent._id,
                );
                if (existing) {
                  return prev.map((p) =>
                    p.agentId === parentAgent._id
                      ? {
                        ...p,
                        tool_usage_description: updatedToolUsageDescription,
                      }
                      : p,
                  );
                } else {
                  return [
                    ...prev,
                    {
                      agentId: parentAgent._id,
                      managedAgents: parentAgent.managed_agents || [],
                      tool_usage_description: updatedToolUsageDescription,
                    },
                  ];
                }
              });

              // Update local node data for visual feedback
              setNodes((prevNodes) =>
                prevNodes.map((node) =>
                  node.id === parentAgent._id
                    ? {
                      ...node,
                      data: {
                        ...node.data,
                        tool_usage_description: updatedToolUsageDescription,
                      },
                    }
                    : node,
                ),
              );
            });
          } else {
            // If it's an agent node, remove it from managed_agents of parent agents
            const parentEdges = edges.filter(
              (edge) => edge.target === deletion.id,
            );

            parentEdges.forEach((edge) => {
              const parentNode = nodes.find((n) => n.id === edge.source);
              if (!parentNode || parentNode.data.isToolNode) return;

              const parentAgent = parentNode.data as Agent;
              const currentManagedAgents = parentAgent.managed_agents || [];
              const updatedManagedAgents = currentManagedAgents.filter(
                (ma) => ma.id !== deletedNodeData._id,
              );

              // Add to pending updates
              setPendingUpdates((prev) => {
                const existing = prev.find(
                  (p) => p.agentId === parentAgent._id,
                );
                if (existing) {
                  return prev.map((p) =>
                    p.agentId === parentAgent._id
                      ? { ...p, managedAgents: updatedManagedAgents }
                      : p,
                  );
                } else {
                  return [
                    ...prev,
                    {
                      agentId: parentAgent._id,
                      managedAgents: updatedManagedAgents,
                      tool_usage_description:
                        parentAgent.tool_usage_description,
                    },
                  ];
                }
              });

              // Update local node data for visual feedback
              setNodes((prevNodes) =>
                prevNodes.map((node) =>
                  node.id === parentAgent._id
                    ? {
                      ...node,
                      data: {
                        ...node.data,
                        managed_agents: updatedManagedAgents,
                      },
                    }
                    : node,
                ),
              );
            });
          }
        });

        // Show toast for deletions
        if (deletions.length === 1) {
          const deletedNode = nodes.find((n) => n.id === deletions[0].id);
          const nodeType = deletedNode?.data.isToolNode ? "tool" : "agent";
          toast.success(
            `Deleted ${deletedNode?.data.name} ${nodeType} - Click Save to apply changes`,
          );
        } else {
          toast.success(
            `Deleted ${deletions.length} items - Click Save to apply changes`,
          );
        }
      }

      // Apply the changes
      onNodesChangeInternal(changes);
    },
    [nodes, edges, onNodesChangeInternal, setPendingUpdates, setNodes],
  );

  const handleAgentGlow = useCallback(
    (agentId: string) => {
      console.log("Adding visual effect to agent:", agentId);

      // Find parent agent if this is a sub-agent
      const incomingEdge = edges.find((edge) => edge.target === agentId);
      const parentAgentId = incomingEdge?.source;

      setGlowingNodes((prev) => {
        const newSet = new Set(prev);
        newSet.add(agentId);

        // Also add parent agent if found
        if (parentAgentId) {
          console.log(
            "Also adding visual effect to parent agent:",
            parentAgentId,
          );
          newSet.add(parentAgentId);
        }

        console.log("Active nodes after add:", Array.from(newSet));
        return newSet;
      });
    },
    [edges],
  );

  const handleAgentStopGlow = useCallback(
    (agentId: string) => {
      console.log("Removing visual effect from agent:", agentId);

      // Find parent agent if this is a sub-agent
      const incomingEdge = edges.find((edge) => edge.target === agentId);
      const parentAgentId = incomingEdge?.source;

      setGlowingNodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(agentId);

        // Also remove parent agent if found
        if (parentAgentId) {
          console.log(
            "Also removing visual effect from parent agent:",
            parentAgentId,
          );
          newSet.delete(parentAgentId);
        }

        console.log("Active nodes after remove:", Array.from(newSet));
        return newSet;
      });
    },
    [edges],
  );

  // Helper function to find parent edges for glowing nodes
  const getAnimatedEdges = useCallback(() => {
    if (glowingNodes.size === 0) return edges;

    return edges.map((edge) => {
      const isTargetGlowing = glowingNodes.has(edge.target);

      if (isTargetGlowing) {
        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            strokeWidth: 3,
            stroke: edge.style?.stroke || "#facc15", // Use yellow for animated edges
          },
        };
      }

      return edge;
    });
  }, [edges, glowingNodes]);

  const handleSocketEvent = useCallback((event: SocketEvent) => {
    setSocketLogs((prev) => [...prev, event]);
    setIsSocketConnected(true);
  }, []);

  const handleEventReplay = useCallback(
    (eventIndex: number, event: SocketEvent) => {
      console.log("=== REPLAY EVENT ===");
      console.log("Event index:", eventIndex);
      console.log("Event type:", event.event_type);
      console.log("Full event:", event);

      // Extract agent ID from the event
      let agentId: string | null = null;

      try {
        // For tool_called events, check tool_input JSON
        if (event.event_type === "tool_called" && event.tool_input) {
          console.log("Parsing tool_input:", event.tool_input);
          const toolInput = JSON.parse(event.tool_input);
          agentId = toolInput.agent_id;
          console.log("Extracted agent_id from tool_input:", agentId);
        }

        // For tool_response events, check arguments
        if (event.event_type === "tool_response" && event.arguments) {
          console.log("Checking arguments:", event.arguments);
          agentId = event.arguments.agent_id;
          console.log("Extracted agent_id from arguments:", agentId);
        }

        // For other events, try both locations
        if (!agentId) {
          if (event.tool_input) {
            try {
              const toolInput = JSON.parse(event.tool_input);
              agentId = toolInput.agent_id || toolInput.id;
            } catch (e) {
              // Ignore parse errors
            }
          }
          if (!agentId && event.arguments) {
            agentId = event.arguments.agent_id || event.arguments.id;
          }
        }
      } catch (e) {
        console.error("Error parsing event data:", e);
      }

      console.log("Final extracted agent_id:", agentId);
      console.log(
        "Current nodes:",
        nodes.map((n) => ({ id: n.id, name: n.data.name, _id: n.data._id })),
      );
      console.log(
        "Current edges:",
        edges.map((e) => ({ source: e.source, target: e.target })),
      );

      // Find the node for this agent
      if (agentId) {
        const agentNode = nodes.find(
          (node) => node.id === agentId || node.data._id === agentId,
        );

        console.log(
          "Found agent node:",
          agentNode ? `${agentNode.id} (${agentNode.data.name})` : "NOT FOUND",
        );

        if (agentNode) {
          // Trigger glowing animation based on event type
          if (
            event.event_type === "tool_called" ||
            event.event_type === "tool_call_prepare"
          ) {
            console.log("Starting glow for agent:", agentNode.id);
            handleAgentGlow(agentNode.id); // This will automatically handle parent glowing

            // Auto-stop glow after a short duration for replay
            setTimeout(() => {
              console.log("Stopping glow for agent:", agentNode.id);
              handleAgentStopGlow(agentNode.id); // This will automatically handle parent stop glowing
            }, 1000);
          } else if (
            event.event_type === "tool_response" ||
            event.event_type === "coroutine_tool_response"
          ) {
            console.log("Stopping glow for agent:", agentNode.id);
            handleAgentStopGlow(agentNode.id); // This will automatically handle parent stop glowing
          }
        } else {
          console.log("No agent node found for agent_id:", agentId);
          console.log(
            "Available node IDs:",
            nodes.map((n) => n.id),
          );
          console.log(
            "Available node _ids:",
            nodes.map((n) => n.data._id),
          );
        }
      } else {
        console.log("No agent_id found in event");
      }

      console.log("=== END REPLAY EVENT ===");
    },
    [nodes, edges, handleAgentGlow, handleAgentStopGlow],
  );

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-950">
      {!isViewOnlyMode && (
        <AgentSidebar
          agents={agents}
          loading={loading}
          onAddAgent={onAddAgent}
          onRefresh={refreshAgents}
          selectedAgent={selectedAgent}
          socketLogs={socketLogs}
          isSocketConnected={isSocketConnected}
          onClearSelectedAgent={() => setSelectedAgent(null)}
          onEventReplay={handleEventReplay}
          // Pagination props
          hasMore={hasMore}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          loadMore={loadMore}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          totalAgents={totalAgents}
        />
      )}

      <div className="relative flex-1">
        {/* Band Toggle */}
        {/* <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 transform">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBands(!showBands)}
            className="border-border bg-secondary/90 text-foreground backdrop-blur-sm hover:bg-secondary/70"
          >
            {showBands ? "Hide Bands" : "Show Bands"}
          </Button>
        </div> */}

        {/* Custom Controls Bar */}
        <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
          {/* Control Buttons */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/90 p-2 backdrop-blur-sm">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFitView}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border" /> */}
            {/* Selection/Pan Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newMode = !isSelectionMode;
                setIsSelectionMode(newMode);
                console.log("Selection mode changed to:", newMode);
              }}
              disabled={isViewOnlyMode}
              className={`h-8 w-8 justify-center ${isSelectionMode
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              title={
                isSelectionMode
                  ? "Switch to Pan Mode"
                  : "Switch to Selection Mode"
              }
            >
              {isSelectionMode ? (
                <MousePointer className="h-4 w-4" />
              ) : (
                <Hand className="h-4 w-4" />
              )}
            </Button>

            {/* Grouping Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (selectedNodes.length >= 2) {
                    createGroup(selectedNodes);
                    setSelectedNodes([]);
                    toast.success("Group created successfully");
                  } else {
                    toast.info("Select 2 or more nodes to create a group");
                  }
                }}
                disabled={isViewOnlyMode}
                className={`h-8 w-8 justify-center text-muted-foreground hover:bg-accent hover:text-foreground ${selectedNodes.length >= 2
                  ? "text-blue-500 hover:text-blue-600"
                  : ""
                  }`}
                title={
                  selectedNodes.length >= 2
                    ? "Create Group"
                    : "Select 2+ nodes to group"
                }
              >
                <Group className="h-4 w-4" />
              </Button>
              {selectedNodes.length > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {selectedNodes.length}
                </div>
              )}
            </div>

            {/* Add Text Note Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Create note at center of viewport
                if (reactFlowInstance) {
                  const bounds = reactFlowInstance.getViewport();
                  const centerX =
                    (-bounds.x + window.innerWidth / 2) / bounds.zoom;
                  const centerY =
                    (-bounds.y + window.innerHeight / 2) / bounds.zoom;
                  createNote({ x: centerX - 100, y: centerY - 75 });
                } else {
                  createNote({ x: 400, y: 300 });
                }
                toast.success("Text note created");
              }}
              disabled={isViewOnlyMode}
              className="h-8 w-8 justify-center text-muted-foreground hover:bg-accent hover:text-foreground hover:text-yellow-600"
              title="Add Text Note"
            >
              <StickyNote className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8 justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8 justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            connectable: !isViewOnlyMode,
            selectable: !isViewOnlyMode,
            className: glowingNodes.has(node.id)
              ? "border-4 border-yellow-400 bg-yellow-100/20"
              : undefined,
            style: glowingNodes.has(node.id)
              ? {
                ...node.style,
                borderColor: "#facc15",
                borderWidth: "4px",
                borderStyle: "solid",
                backgroundColor: "rgba(254, 240, 138, 0.2)",
                animation: "pulse 1s infinite",
              }
              : node.style,
          }))}
          edges={getAnimatedEdges()}
          onNodesChange={isViewOnlyMode ? undefined : onNodesChange}
          onEdgesChange={isViewOnlyMode ? undefined : onEdgesChange}
          onConnect={isViewOnlyMode ? undefined : onConnect}
          onEdgeClick={isViewOnlyMode ? undefined : onEdgeClick}
          onNodeClick={isViewOnlyMode ? undefined : onNodeClick}
          onNodeDragStop={isViewOnlyMode ? undefined : onNodeDragStop}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDrop={isViewOnlyMode ? undefined : onDrop}
          onDragOver={isViewOnlyMode ? undefined : onDragOver}
          nodesDraggable={!isViewOnlyMode}
          nodesConnectable={!isViewOnlyMode}
          elementsSelectable={!isViewOnlyMode}
          panOnDrag={!isSelectionMode}
          selectionOnDrag={isSelectionMode}
          selectionMode={isSelectionMode ? SelectionMode.Partial : undefined}
          multiSelectionKeyCode={isSelectionMode ? null : "Meta"}
          deleteKeyCode={null}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Background
            color="#6B7280"
            gap={20}
            size={2}
            variant={BackgroundVariant.Dots}
            className="opacity-40 dark:opacity-50"
          />
          {/* <BandIndicators show={showBands} bands={DEFAULT_BANDS} /> */}
        </ReactFlow>

        {selectedEdge && (
          <EdgeEditPanel
            edge={selectedEdge}
            onClose={() => setSelectedEdge(null)}
            onUpdate={updateEdgeDescription}
            onDelete={deleteEdge}
          />
        )}

        {selectedAgent && (
          <NodeEditPanel
            agent={selectedAgent}
            onClose={() => {
              setSelectedAgent(null);
              setOpenedViaPlayButton(false);
            }}
            onUpdate={updateAgentProperties}
            isUpdating={updatingAgent}
            onAgentGlow={handleAgentGlow}
            onAgentStopGlow={handleAgentStopGlow}
            onSocketEvent={handleSocketEvent}
            openedViaPlayButton={openedViaPlayButton}
          />
        )}

        {selectedKBNode && (
          <KnowledgeBaseConfig
            node={selectedKBNode}
            onClose={() => setSelectedKBNode(null)}
          />
        )}

        <PublishBlueprintModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          nodes={nodes}
          edges={edges}
          groups={groups.map((group) => ({
            id: group.data.id,
            title: group.data.title,
            color: group.data.color,
            nodeIds: group.data.nodeIds,
            x: group.position.x,
            y: group.position.y,
            width: group.data.width,
            height: group.data.height,
          }))}
        />

        {/* Blueprint README Display */}
        <BlueprintReadme
          markdown={blueprintReadme?.markdown}
          blueprintName={blueprintReadme?.name}
          isOpen={showBlueprintReadme && !!blueprintReadme}
          onClose={() => setShowBlueprintReadme(false)}
        />

        {/* Vetted Agent Formation Popup */}
        <VettedAgentPopup
          isVisible={showVettedAgentPopup}
          onClose={() => setShowVettedAgentPopup(false)}
          blueprintName={loadedBlueprintData?.name}
          blueprintId={loadedBlueprintId || undefined}
        />

        {/* Unsaved Changes Modal */}
        {showUnsavedChangesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Unsaved Changes Detected
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  You have unsaved changes in your canvas. Please save your changes before proceeding to chat to preserve all connections and updates.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={handleCancelChat}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedWithoutSaving}
                  className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-orange-600 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900/70"
                >
                  Continue Anyway
                </button>
                <button
                  onClick={handleSaveAndOpenChat}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFlowBuilder;

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import {
  ReactFlow,
  Background,
  ReactFlowProvider,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { OGISidebar } from "./components/OGISidebar";
import { CreateOGIModal } from "./components/CreateOGIModal";
import { AddAgentModal } from "./components/AddAgentModal";
import { AgentNode } from "./components/nodes/AgentNode";
import { OGIChatBox } from "./components/OGIChatBox";
import { OGIInsightsPanel } from "./components/OGIInsightsPanel";
import type { OGI } from "./types";
import { ogiService } from "./ogi.service";
import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { toast } from "sonner";
import { fetchAgents } from "@/pages/evals/utils/api";

// Define custom node types
const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
};

function OGICanvas() {
  const [ogis, setOgis] = useState<OGI[]>([]);
  const [selectedOGI, setSelectedOGI] = useState<OGI | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const app_token = useStore((state) => state.app_token);
  const api_key = useStore((state) => state.api_key);
  const { current_organization } = useManageAdminStore((state) => state);

  useEffect(() => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
      mixpanel.track("Page Visit", {
        page: "OGI - Organizational General Intelligence",
      });
    }
  }, []);

  // Load OGIs
  const loadOGIs = useCallback(async () => {
    if (!current_organization?.org_id || !app_token) return;

    setLoading(true);
    try {
      const data = await ogiService.getOGIs(
        current_organization.org_id,
        app_token
      );
      setOgis(data);
    } catch (error) {
      console.error("Failed to load OGIs:", error);
      toast.error("Failed to load OGI networks");
    } finally {
      setLoading(false);
    }
  }, [current_organization?.org_id, app_token]);

  // Load agents for organization
  const loadAgents = useCallback(async () => {
    if (!api_key) return;

    try {
      const agentsData = await fetchAgents(api_key);
      setAgents(agentsData);
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  }, [api_key]);

  useEffect(() => {
    loadOGIs();
    loadAgents();
  }, [loadOGIs, loadAgents]);

  // Generate nodes and edges when OGI is selected
  useEffect(() => {
    if (!selectedOGI || agents.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Filter agents that are in this OGI
    const ogiAgents = agents.filter((agent) =>
      selectedOGI.agent_ids.includes(agent._id)
    );

    // Console log OGI name and agent names
    console.log('=== OGI Network ===');
    console.log('OGI Name:', selectedOGI.ogi_name);
    console.log('Agent Names:', ogiAgents.map(agent => agent.name));
    console.log('Total Agents:', ogiAgents.length);
    console.log('==================');

    if (ogiAgents.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Calculate positions in a circle with better spacing
    const centerX = 500;
    const centerY = 350;
    // Increase radius based on number of agents for better visibility
    const radius = Math.max(200, Math.min(150 + ogiAgents.length * 30, 350));

    const newNodes: Node[] = ogiAgents.map((agent, index) => {
      const angle = (index / ogiAgents.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: agent._id,
        type: "agentNode",
        position: { x, y },
        data: {
          name: agent.name,
          description: agent.description,
          agent_role: agent.agent_role,
          model: agent.model,
        },
        // Disable dragging during initial load to prevent stacking
        draggable: true,
      };
    });

    // Create edges between agents (creating a fully connected mesh network)
    const newEdges: Edge[] = [];

    // Connect each agent to every other agent (1:many relationships)
    for (let i = 0; i < ogiAgents.length; i++) {
      for (let j = i + 1; j < ogiAgents.length; j++) {
        // Randomly choose between straight and curved edges for organic look
        const isCurved = Math.random() > 0.5;

        newEdges.push({
          id: `edge-${i}-${j}`,
          source: ogiAgents[i]._id,
          target: ogiAgents[j]._id,
          type: isCurved ? 'default' : 'straight', // Random: curved or straight
          animated: true,
          style: {
            stroke: "#64748b",
            strokeWidth: 1.5,
            opacity: 1
          },
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [selectedOGI, agents, setNodes, setEdges]);

  const handleSelectOGI = (ogi: OGI) => {
    console.log('OGI selected:', ogi);
    console.log('Agent IDs in OGI:', ogi.agent_ids);
    console.log('Total agents available:', agents.length);
    setSelectedOGI(ogi);
  };

  const handleCreateOGI = async (name: string) => {
    if (!current_organization?.org_id || !app_token) {
      toast.error("Organization not found");
      return;
    }

    try {
      await ogiService.createOGI(
        {
          ogi_name: name,
          organization_id: current_organization.org_id,
          agent_ids: [],
          metadata: {},
        },
        app_token
      );
      toast.success("OGI network created successfully");
      await loadOGIs();
    } catch (error) {
      console.error("Failed to create OGI:", error);
      toast.error("Failed to create OGI network");
      throw error;
    }
  };

  const handleDeleteOGI = async (ogiId: string) => {
    if (!app_token) return;

    try {
      await ogiService.deleteOGI(ogiId, app_token);
      toast.success("OGI network deleted");
      if (selectedOGI?.ogi_id === ogiId) {
        setSelectedOGI(null);
      }
      await loadOGIs();
    } catch (error) {
      console.error("Failed to delete OGI:", error);
      toast.error("Failed to delete OGI network");
    }
  };

  const handleAddAgents = async (agentIds: string[]) => {
    if (!selectedOGI || !app_token) {
      toast.error("No OGI selected");
      return;
    }

    try {
      // Add each agent to the OGI
      for (const agentId of agentIds) {
        await ogiService.addAgentToOGI(
          selectedOGI.ogi_id,
          { agent_id: agentId },
          app_token
        );
      }

      toast.success(`${agentIds.length} agent${agentIds.length !== 1 ? 's' : ''} added successfully`);

      // Reload OGIs to get updated agent_ids
      await loadOGIs();

      // Update the selected OGI
      const updatedOGI = await ogiService.getOGI(selectedOGI.ogi_id, app_token);
      setSelectedOGI(updatedOGI);
    } catch (error) {
      console.error("Failed to add agents:", error);
      toast.error("Failed to add agents to OGI");
      throw error;
    }
  };

  return (
    <>
      <div className="flex-1 h-full relative p-8">
        {/* Canvas Title */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 px-6 py-3 shadow-xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Organizational General Intelligence
            </h1>
          </div>
        </div>

        {/* Transparent Sidebar Overlay */}
        <div className="absolute top-20 left-4 z-20 w-64">
          <OGISidebar
            ogis={ogis}
            selectedOGI={selectedOGI}
            onSelectOGI={handleSelectOGI}
            onCreateOGI={() => setIsCreateModalOpen(true)}
            onDeleteOGI={handleDeleteOGI}
            onAddAgents={() => setIsAddAgentModalOpen(true)}
            loading={loading}
          />
        </div>

        {/* Dashed border container when nodes are present */}
        {nodes.length > 0 && (
          <div className="absolute inset-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl pointer-events-none z-10" />
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          className="bg-gray-50 dark:bg-gray-900 rounded-2xl"
          fitView
          fitViewOptions={{ padding: 0.3, minZoom: 0.5, maxZoom: 1 }}
          minZoom={0.3}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Lines} />

          {/* Insights Panel - Show when OGI is selected */}
          {selectedOGI && nodes.length > 0 && (
            <div className="absolute right-0 top-0 h-full pointer-events-auto z-50">
              <OGIInsightsPanel />
            </div>
          )}

          {/* Stats Dashboard - Show when OGI is selected */}
          {selectedOGI && nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-xl min-w-[160px]">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Total Agents in Production
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {nodes.length}
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-xl min-w-[160px]">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Nodes Connected
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                  {edges.length}
                </div>
              </div>
            </div>
          )}

          {/* Chat Box - Show when OGI is selected */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="pointer-events-auto">
              {selectedOGI && <OGIChatBox />}
            </div>
          </div>

          {/* Empty state when no OGI selected */}
          {!selectedOGI && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4">
                <div className="text-gray-400 mb-3">
                  <svg
                    className="h-24 w-24 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Select an OGI network to view agents
                </p>
              </div>
            </div>
          )}

          {/* Empty state when OGI selected but no agents */}
          {selectedOGI && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4">
                <div className="text-gray-400 mb-3">
                  <svg
                    className="h-24 w-24 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  No agents in this OGI network
                </p>
                <p className="text-sm text-gray-400">
                  Add agents to see them visualized here
                </p>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>

      <CreateOGIModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateOGI={handleCreateOGI}
      />

      <AddAgentModal
        isOpen={isAddAgentModalOpen}
        onClose={() => setIsAddAgentModalOpen(false)}
        onAddAgents={handleAddAgents}
        availableAgents={agents}
        existingAgentIds={selectedOGI?.agent_ids || []}
      />
    </>
  );
}

export default function OGI() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full"
    >
      <ReactFlowProvider>
        <OGICanvas />
      </ReactFlowProvider>
    </motion.div>
  );
}

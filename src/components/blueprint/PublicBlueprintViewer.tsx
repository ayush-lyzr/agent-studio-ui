import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { Copy, Eye, LogIn, Share2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AgentNode from "@/pages/orchestration/app/components/AgentNode";
import TextNote from "@/pages/orchestration/app/components/TextNote";
import BlueprintReadme from "@/pages/orchestration/app/components/BlueprintReadme";
import { blueprintApiService, BlueprintData } from "@/services/blueprintApiService";
import Loader from "@/components/loader";

interface PublicBlueprintViewerProps {
  blueprintId: string;
}

const PublicBlueprintViewer: React.FC<PublicBlueprintViewerProps> = ({
  blueprintId,
}) => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [showReadme, setShowReadme] = useState(false);
  const [blueprintReadme, setBlueprintReadme] = useState<{
    markdown?: string;
    title?: string;
  }>({});

  const nodeTypes = useMemo(
    () => ({
      agent: (props: any) => (
        <AgentNode
          {...props}
          onPlayClick={() => {}} // Disabled for public view
          isPublicView={true}
          canEdit={false}
        />
      ),
      textNote: (props: any) => (
        <TextNote
          {...props}
          onUpdateNote={() => {}} // Disabled for public view
          onDeleteNote={() => {}} // Disabled for public view
          isPublicView={true}
          canEdit={false}
        />
      ),
    }),
    [],
  );

  const onConnect = () => {
    // Disabled for public view - show login prompt
    toast.error("Please log in to edit blueprints", {
      action: {
        label: "Log In",
        onClick: () => handleLoginRedirect(),
      },
    });
  };

  const onNodesChange = () => {
    // Disabled for public view - show login prompt if user tries to move nodes
    toast.error("Please log in to edit blueprints", {
      action: {
        label: "Log In",
        onClick: () => handleLoginRedirect(),
      },
    });
  };

  const onEdgesChange = () => {
    // Disabled for public view
  };

  const handleLoginRedirect = () => {
    const currentUrl = window.location.pathname + window.location.search;
    navigate(`/auth/sign-in?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleCloneBlueprint = () => {
    // Store the blueprint info in session storage for after login
    sessionStorage.setItem(
      "pendingBlueprintClone",
      JSON.stringify({
        blueprintId: blueprintId,
        blueprintName: blueprint?.title || "Untitled Blueprint",
        returnUrl: window.location.pathname + window.location.search,
      }),
    );
    handleLoginRedirect();
  };

  const handleShareBlueprint = () => {
    const blueprintUrl = `${window.location.origin}/blueprint?blueprint=${blueprintId}`;
    navigator.clipboard.writeText(blueprintUrl).then(() => {
      toast.success("Blueprint URL copied to clipboard!");
    });
  };

  useEffect(() => {
    const loadBlueprint = async () => {
      if (!blueprintId) return;

      try {
        setLoading(true);

        // Load blueprint data
        const response =
          await blueprintApiService.getPublicBlueprint(blueprintId);

        if (response.isSuccess && response.data) {
          const blueprintData = response.data;
          setBlueprint(blueprintData);

          // Set up agents - handle both blueprint_data format and direct agents array
          const agentList = blueprintData.agents || [];
          const blueprintNodes = blueprintData.blueprint_data?.nodes || [];

          // Use blueprint_data.nodes if available, otherwise fall back to agents array
          const sourceNodes =
            blueprintNodes.length > 0 ? blueprintNodes : agentList;

          // Create a Set to track used IDs and prevent duplicates
          const usedIds = new Set();

          // Set up nodes with duplicate prevention
          const nodeList = sourceNodes
            .filter((agent: any) => {
              const nodeId = agent.id || agent._id;
              if (usedIds.has(nodeId)) {
                return false; // Skip duplicate
              }
              usedIds.add(nodeId);
              return true;
            })
            .map((agent: any, index: number) => ({
              id: agent.id || agent._id,
              type: "agent",
              position: agent.position || { x: index * 300, y: index * 150 },
              data: {
                ...agent,
                ...agent.data, // Include nested data if present
                isPublicView: true,
              },
            }));

          // Add text notes if they exist
          if (blueprintData.textNotes) {
            const noteNodes = blueprintData.textNotes.map((note: any) => ({
              id: note.id,
              type: "textNote",
              position: note.position,
              data: {
                ...note,
                isPublicView: true,
              },
            }));
            nodeList.push(...noteNodes);
          }

          setNodes(nodeList);

          // Set up edges - handle both blueprint_data format and direct edges array
          const directEdges = blueprintData.edges || [];
          const blueprintEdges = blueprintData.blueprint_data?.edges || [];

          // Use blueprint_data.edges if available, otherwise fall back to direct edges array
          const sourceEdges =
            blueprintEdges.length > 0 ? blueprintEdges : directEdges;

          const edgeList = sourceEdges.map((edge: any) => ({
            ...edge,
            style: { strokeWidth: 2 },
            markerEnd: { type: "arrowclosed" as any },
          }));
          setEdges(edgeList);

          // Set up readme if it exists
          if (blueprintData.readme) {
            setBlueprintReadme({
              markdown: blueprintData.readme,
              title: blueprintData.title || "Blueprint README",
            });
          }
        } else {
          toast.error("Failed to load blueprint");
          navigate("/404");
        }
      } catch (error) {
        console.error("Error loading blueprint:", error);
        toast.error("Error loading blueprint");
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };

    loadBlueprint();
  }, [blueprintId]);

  const handleShowReadme = () => {
    if (blueprintReadme.markdown) {
      setShowReadme(true);
    }
  };

  if (loading) {
    return <Loader loadingText="Loading blueprint..." />;
  }

  if (!blueprint) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Blueprint Not Found</CardTitle>
            <CardDescription>
              The blueprint you're looking for doesn't exist or is not publicly
              accessible.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold">
              {blueprint.title || "Untitled Blueprint"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Public Blueprint • Created by {blueprint.created_by || "Unknown"}
            </p>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-600">
            Public
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* README Button */}
          {blueprintReadme.markdown && (
            <Button
              onClick={handleShowReadme}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary/40"
            >
              <Eye className="mr-2 h-4 w-4" />
              README
            </Button>
          )}

          {/* Share Button */}
          <Button
            onClick={handleShareBlueprint}
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          {/* Clone Button */}
          <Button
            onClick={handleCloneBlueprint}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Copy className="mr-2 h-4 w-4" />
            Clone Blueprint
          </Button>

          {/* Login Button */}
          <Button
            onClick={handleLoginRedirect}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-2">
        <div className="flex items-center space-x-2 text-sm text-amber-800">
          <Lock className="h-4 w-4" />
          <span>
            You're viewing a public blueprint. Log in to clone, edit, or create
            your own blueprints.
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex-1 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          zoomOnScroll={true}
          panOnScroll={false}
          className="h-full w-full bg-muted/30"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="opacity-50"
          />
        </ReactFlow>
      </div>

      {/* README Modal */}
      {showReadme && blueprintReadme.markdown && (
        <BlueprintReadme
          isOpen={showReadme}
          onClose={() => setShowReadme(false)}
          markdown={blueprintReadme.markdown}
        />
      )}
    </div>
  );
};

export default PublicBlueprintViewer;

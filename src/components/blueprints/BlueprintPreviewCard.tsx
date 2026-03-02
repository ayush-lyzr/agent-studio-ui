import React, { useState, useMemo } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ellipsis, Trash2, Copy, Network } from "lucide-react";
import SimpleTreeRenderer from "./SimpleTreeRenderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { blueprintApiService } from "@/services/blueprintApiService";
import { toast } from "sonner";
import { CloneBlueprintDialog } from "@/pages/orchestration/app/components/CloneBlueprintDialog";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";

interface BlueprintPreviewCardProps {
  blueprint: {
    _id: string;
    name: string;
    description: string;
    is_owner: boolean;
    orchestration_type: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    usage_count: number;
    share_type: "private" | "public" | "organization";
    owner_id: string;
    owner_name: string | null;
    owner_email: string | null;
    organization_id: string;
    organization_name: string | null;
    is_template: boolean;
    status: string;
    blueprint_data?: {
      nodes?: any[];
      edges?: any[];
      tree_structure?: {
        nodes?: any[];
        edges?: any[];
      };
    };
  };
  onClick?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  className?: string;
}

const BlueprintPreviewCard: React.FC<BlueprintPreviewCardProps> = ({
  blueprint,
  onClick,
  onDelete,
  onClone,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCloneNameDialog, setShowCloneNameDialog] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const { nodes, edges } = useMemo(() => {
    // Extract nodes and edges from blueprint data
    const blueprintNodes =
      blueprint.blueprint_data?.tree_structure?.nodes ||
      blueprint.blueprint_data?.nodes ||
      [];
    const blueprintEdges =
      blueprint.blueprint_data?.tree_structure?.edges ||
      blueprint.blueprint_data?.edges ||
      [];

    if (blueprintNodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Return nodes and edges in format expected by SimpleTreeRenderer
    return {
      nodes: blueprintNodes.map((node: any) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      })),
      edges: blueprintEdges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };
  }, [blueprint.blueprint_data]);

  const hasWorkflow = nodes.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await blueprintApiService.deleteBlueprint(blueprint._id);
      toast.success("Blueprint deleted successfully");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete blueprint:", error);
      toast.error("Failed to delete blueprint");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async (blueprintName: string) => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Clone blueprint clicked", {
        blueprintId: blueprint._id,
        nameOfBlueprint: blueprint.name,
      });
    try {
      await blueprintApiService.cloneBlueprint(blueprint._id, blueprintName);
      toast.success("Blueprint cloned successfully");
      onClone?.();
      setShowCloneNameDialog(false);
    } catch (error) {
      setIsCloning(false);
      console.error("Failed to clone blueprint:", error);
    }
  };

  return (
    <>
      <Card
        className="relative flex h-[280px] cursor-pointer flex-col border hover:border-primary"
        onClick={onClick}
      >
        {/* Graph at the top - takes flexible space */}
        {hasWorkflow && (
          <div className="relative min-h-[120px] flex-1 overflow-hidden bg-gray-50/30 dark:bg-gray-900/30">
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <SimpleTreeRenderer
                nodes={nodes}
                edges={edges}
                width={320}
                height={180}
                className="h-full w-full"
              />
            </div>
            <div className="absolute right-2 top-2 rounded-md bg-background/90 p-1 backdrop-blur-sm">
              <Network className="h-3 w-3 text-muted-foreground" />
            </div>
            {/* Dropdown menu positioned over graph */}
            <div className="absolute left-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 justify-center rounded-full bg-background/90 backdrop-blur-sm"
                  >
                    <Ellipsis className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  onClick={(e) => e.stopPropagation()}
                >
                  {blueprint.share_type === "public" && (
                    <DropdownMenuItem
                      onClick={() => setShowCloneNameDialog(true)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                  )}
                  {blueprint?.is_owner && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Header Name */}
        <div className="px-4">
          <CardTitle className="flex w-full items-center justify-between text-sm font-semibold">
            <span className="truncate pr-2">{blueprint.name}</span>
            {!hasWorkflow && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 justify-center rounded-full"
                  >
                    <Ellipsis className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {blueprint.share_type === "public" && (
                    <DropdownMenuItem
                      onClick={() => setShowCloneNameDialog(true)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                  )}
                  {blueprint?.is_owner && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardTitle>
        </div>

        {/* Description (2 lines) */}
        <div className="px-4 pb-2">
          <CardDescription className="line-clamp-2 text-xs text-muted-foreground">
            {blueprint.description}
          </CardDescription>
        </div>

        {/* Tags one after other */}
        <div className="flex items-center justify-between rounded-b-xl border-t bg-background p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {blueprint.tags.slice(0, 1).map((tag) => (
              <Badge
                key={tag}
                className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="text-right text-sm font-medium">
            {blueprint.orchestration_type}
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blueprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blueprint.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CloneBlueprintDialog
        open={showCloneNameDialog}
        onOpenChange={setShowCloneNameDialog}
        onClone={handleClone}
        initialName={blueprint.name}
        isCloning={isCloning}
        setIsCloning={setIsCloning}
      />
    </>
  );
};

export default BlueprintPreviewCard;

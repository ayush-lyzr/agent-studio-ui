import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { getToolLogo, ToolId } from "@/assets/images";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, Ellipsis, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import { useTools } from "./tools-service";
import useStore from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";

export interface ConnectedAccountParams {
  credential_id: string;
  credential_name?: string;
  provider_uuid?: string;
  [key: string]: unknown;
}

interface ToolConnection {
  tool_id?: string;
  tool_name: string;
  tool_source?: string;
  custom_app?: boolean;
  app_id?: string;
  connectedAccounts?: ConnectedAccountParams[];
}

interface MyToolsListProps {
  userTools: ToolConnection[];
  onSuccess: () => void;
  isSelectionMode?: boolean;
  isToolSelected?: (toolId: string) => boolean;
  onToggleSelect?: (toolId: string) => void;
  onEnterSelectionMode?: (toolId: string) => void;
  onEdit?: (toolData: { name: string; providerId: string }) => void;
}

const formatName = (name: string) =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function MyToolsList({
  userTools,
  onSuccess,
  onEdit,
  isSelectionMode = false,
  isToolSelected,
  onToggleSelect,
  onEnterSelectionMode,
}: MyToolsListProps) {
  const [selectedTool, setSelectedTool] = useState<ToolConnection | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const apiKey = useStore((state) => state.api_key);
  const {
    unlinkACITool,
    deleteExternalTool,
    deleteCustomAciTool,
    deleteACITool,
    deleteCustomTool,
    deleteProviderCreds,
  } = useTools({
    apiKey,
  });
  // Disabling composio serach
  const composioTool = selectedTool?.tool_name === "composio_search";

  const handleCardClick = (tool: ToolConnection) => {
    setSelectedTool(tool);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedTool?.tool_source === "aci" && selectedTool.tool_id) {
        if (selectedTool?.custom_app) {
          await deleteACITool(selectedTool.app_id ?? "");
          await deleteCustomAciTool(selectedTool.app_id ?? "");
        } else {
          await unlinkACITool(selectedTool.tool_id);
          await deleteACITool(selectedTool.app_id ?? "");
        }
      } else if (
        selectedTool?.tool_source === "composio" &&
        selectedTool.tool_id
      ) {
        await deleteExternalTool(selectedTool.tool_id);
      } else if (selectedTool?.tool_source === "openapi") {
        const credentialId =
          selectedTool.connectedAccounts?.[0]?.credential_id ??
          selectedTool.tool_id ??
          "";
        if (selectedTool?.connectedAccounts === undefined) {
          await deleteCustomTool(selectedTool?.tool_id ?? "");
        } else {
          await deleteProviderCreds(credentialId);
        }
      }
      onSuccess();
    } catch (error) {
      console.error("Error deleting tool:", error);
    }
    setIsDeleteDialogOpen(false);
    setSelectedTool(null);
  };

  const handleSelectToggle = (toolId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleSelect?.(toolId);
  };

  const handleEditClick = (tool: ToolConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool.tool_source === "openapi" && onEdit) {
      onEdit({
        name: tool.tool_name,
        providerId: tool.tool_id ?? tool.tool_name,
      });
    }
  };

  const handleEnterSelectionMode = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEnterSelectionMode?.(toolId);
  };

  if (userTools.length === 0) {
    return null;
  }

  return (
    <>
      {userTools.map((tool) => (
        <Card
          key={tool.tool_id}
          className="flex h-[12rem] cursor-pointer flex-col"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            if (tool.tool_source === "openapi" && e.shiftKey) {
              if (!isSelectionMode) {
                onEnterSelectionMode?.(tool.tool_id ?? "");
              } else {
                handleSelectToggle(tool.tool_id ?? "", e);
              }
            }

            if (isSelectionMode && tool.tool_source === "openapi") {
              handleSelectToggle(tool.tool_id ?? "", e);
            } else {
              handleCardClick(tool);
            }
            // handleCardClick(tool)
          }}
        >
          <CardContent className="flex h-full flex-col p-4">
            <div className="min-h-0 flex-1 space-y-2">
              <div className="mb-5 flex h-8 items-center justify-between gap-2">
                {isSelectionMode && tool.tool_source === "openapi" && (
                  <Checkbox
                    checked={isToolSelected?.(tool.tool_id ?? "") ?? false}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() =>
                      handleSelectToggle(tool.tool_id ?? "")
                    }
                  />
                )}
                <div className="flex min-w-0 flex-1 items-center">
                  <LazyImage
                    src={getToolLogo(
                      (tool.tool_name || "").toLocaleLowerCase() as ToolId,
                    )}
                    alt={tool.tool_name || "Tool Logo"}
                    width={30}
                    height={30}
                    className="h-[30px] w-[30px] flex-shrink-0 object-contain"
                  />
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="ml-2 line-clamp-1 min-w-0 flex-1 font-semibold">
                        {formatName(tool.tool_name)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatName(tool.tool_name)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {tool.tool_source === "openapi" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div
                        className="rounded-full p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Ellipsis className="size-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isSelectionMode && onEnterSelectionMode && (
                        <DropdownMenuItem
                          onClick={(e) =>
                            handleEnterSelectionMode(tool.tool_id ?? "", e)
                          }
                        >
                          <CheckSquare className="mr-2 size-4" />
                          Select
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => handleEditClick(tool, e)}
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="mt-2 flex h-6 flex-wrap justify-between gap-1 overflow-hidden">
              <Badge variant="secondary" className="text-xs capitalize">
                {`${tool.tool_source === "openapi" ? "Custom" : tool.tool_source === "aci" ? "Open-source" : tool.tool_source === "composio" ? "Composio" : "Custom"}`}
              </Badge>
              <div className="flex flex-col items-center gap-2">
                <Badge variant="success" className="rounded-full">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setSelectedTool(null);
          }
        }}
        title="Delete Tool"
        description={
          selectedTool
            ? `Are you sure you want to delete ${formatName(selectedTool.tool_name)}? This action cannot be undone.`
            : "Are you sure you want to delete this tool? This action cannot be undone."
        }
        onConfirm={handleDelete}
        confirmButtonDisabled={composioTool}
      />
    </>
  );
}

import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import { getToolLogo, ToolId } from "@/assets/images";
import { ToolForm } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, Ellipsis, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

const formatName = (name: string) =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const ToolCard = ({
  name,
  description,
  providerId,
  categories = [],
  isUserTool,
  form,
  onToolConnected,
  onClick,
  onEdit,
  // isLimitReached,
  toolSource,
  connectionId,
  securityScheme,
  customACIApp,
  appId,
  isMCPTool,
  authTypeMCP,
  isMCPConnected,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectionMode,
  toolId,
  customToolId,
}: {
  name: string;
  description: string;
  icon: ReactNode;
  providerId: string;
  categories?: string[];
  isUserTool?: boolean;
  form?: ToolForm;
  onToolConnected?: () => void;
  onClick: (toolData: {
    name: string;
    description: string;
    providerId: string;
    categories?: string[];
    form?: ToolForm;
    toolSource?: string;
    connectionId?: string;
    securityScheme?: string;
    customACIApp?: boolean;
    appId?: string;
    isMCPTool?: boolean;
    authTypeMCP?: string;
    isMCPConnected?: boolean;
    toolId?: string;
    customToolId?: string;
  }) => void;
  onEdit?: (toolData: { name: string; providerId: string }) => void;
  onDelete?: () => void;
  // isLimitReached?: boolean;
  toolSource?: string;
  connectionId?: string;
  securityScheme?: string;
  customACIApp?: boolean;
  appId?: string;
  isMCPTool?: boolean;
  authTypeMCP?: string;
  isMCPConnected?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEnterSelectionMode?: () => void;
  toolId?: string;
  customToolId?: string;
}) => {
  const defaultOnToolConnected = () => {};
  onToolConnected = onToolConnected || defaultOnToolConnected;
  const isCustomTool = categories?.includes("Custom");

  const handleCardClick = () => {
    // if (form) {
    //   setShowApiKeyDialog(true);
    // }

    if (onClick) {
      onClick({
        name,
        description,
        providerId,
        categories,
        form,
        toolSource,
        connectionId,
        securityScheme,
        customACIApp,
        appId,
        isMCPTool,
        authTypeMCP,
        isMCPConnected,
        toolId,
        customToolId,
      });
    }
  };

  const handleSelectToggle = (e?: React.MouseEvent) => {
    if (!isCustomTool) return;
    e?.stopPropagation();
    onToggleSelect?.();
  };

  const handleEnterSelectionMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnterSelectionMode?.();
  };

  const handleEditClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onEdit) {
      onEdit({
        name,
        providerId,
      });
    }
  };

  return (
    <>
      <Card
        key={name}
        className="flex h-[12rem] cursor-pointer flex-col"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          if (isCustomTool && e.shiftKey) {
            if (!isSelectionMode) {
              onEnterSelectionMode?.();
            } else {
              handleSelectToggle(e);
            }
            return;
          }

          if (isSelectionMode) {
            handleSelectToggle(e);
          } else {
            handleCardClick();
          }
        }}
      >
        <CardContent className="flex h-full flex-col p-4">
          <div className="min-h-0 flex-1 space-y-2">
            <div className="mb-5 flex h-8 items-center justify-between gap-2">
              {isSelectionMode && isCustomTool && (
                <Checkbox
                  checked={isSelected}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => handleSelectToggle()}
                />
              )}
              <div className="flex min-w-0 flex-1 items-center">
                <LazyImage
                  src={getToolLogo(providerId.toLocaleLowerCase() as ToolId)}
                  alt={name || "Provider Logo"}
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px] flex-shrink-0 object-contain"
                />
                <Tooltip>
                  <TooltipTrigger>
                    <span className="ml-2 line-clamp-1 min-w-0 flex-1 font-semibold">
                      {formatName(name)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatName(name)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {isCustomTool && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="rounded-full p-1">
                      <Ellipsis className="size-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isSelectionMode && onEnterSelectionMode && (
                      <DropdownMenuItem onClick={handleEnterSelectionMode}>
                        <CheckSquare className="mr-2 size-4" />
                        Select
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleEditClick}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardDescription className="line-clamp-3 h-16">
              {description}
            </CardDescription>
          </div>

          <div className="mt-2 flex h-6 flex-wrap justify-between gap-1 overflow-hidden">
            {categories.slice(0, 2).map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs capitalize"
              >
                {category
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())}
              </Badge>
            ))}
            {/* {categories.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{categories.length - 2}
              </Badge>
            )} */}
            <div className="flex flex-col items-center gap-2">
              {isUserTool && (
                <Badge variant="success" className="rounded-full">
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* {form && !connectionId && (
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          providerId={providerId}
          form={form}
          onSuccess={onToolConnected}
          toolName={formatName(name)}
          isLimitReached={isLimitReached ?? false}
          toolId={toolId}
        />
      )} */}
    </>
  );
};

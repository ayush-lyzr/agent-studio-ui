import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Ellipsis,
  Pencil,
  Share2,
  Trash2,
  FolderPlus,
  CheckSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isOrgMode } from "@/lib/utils";
import { RAGConfig } from "../rag.service";
import { cn } from "@/lib/utils";
import { Group } from "@/services/groupsApiService";
import { Checkbox } from "@/components/ui/checkbox";

interface RAGListCardProps {
  rag: RAGConfig;
  isActionable: boolean;
  usageData?: { plan_name?: string };
  onEdit: (rag: RAGConfig) => (e: React.MouseEvent) => void;
  onDelete: (rag: RAGConfig) => (e: React.MouseEvent) => void;
  onShare: (rag: RAGConfig) => (e: React.MouseEvent) => void;
  onAddToGroup?: (rag: RAGConfig) => (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onRemoveFromGroup?: (rag: RAGConfig) => (e: React.MouseEvent) => void;
  currentGroup?: Group | null;
  index?: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (rag: RAGConfig) => void;
  onEnterSelectionMode?: (rag: RAGConfig) => void;
}

const listVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 20,
    },
  }),
};

export const RAGListCard = ({
  rag,
  isActionable,
  usageData,
  onEdit,
  onDelete,
  onShare,
  onAddToGroup,
  onClick,
  onRemoveFromGroup,
  currentGroup,
  index = 0,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectionMode,
}: RAGListCardProps) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const typeTag = rag?.semantic_data_model
    ? "Semantic Data Model"
    : rag?.vector_store_provider?.toLowerCase()?.includes("neo4j")
      ? "Knowledge Graph"
      : "Knowledge Base";

  const databaseTag = rag?.semantic_data_model
    ? (rag?.meta_data?.database_name ?? rag?.vector_store_provider)
    : rag?.vector_store_provider;

  const checkTruncation = () => {
    if (descriptionRef.current) {
      setIsTruncated(
        descriptionRef.current.scrollHeight >
          descriptionRef.current.clientHeight ||
          descriptionRef.current.scrollWidth >
            descriptionRef.current.clientWidth,
      );
    }
  };

  return (
    <motion.div
      custom={index}
      variants={listVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <div
        className={cn(
          "group relative flex items-center justify-between rounded-lg border p-4",
          "cursor-pointer transition-all hover:border-primary hover:shadow-sm",
          "min-h-[80px]",
        )}
        onClick={(e) => {
          if (isSelectionMode) {
            e.stopPropagation();
            onToggleSelect?.(rag);
            return;
          }
          onClick(e);
        }}
      >
        {/* Left section - Knowledge base info */}
        <div className="flex flex-1 items-center gap-4">
          {isSelectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(rag)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {/* Icon placeholder */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <span className="text-lg font-semibold text-muted-foreground">
              {rag.collection_name.slice(0, -4).charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Knowledge base details */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {rag.collection_name.slice(0, -4)}
              </h3>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {typeTag}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {databaseTag}
                </Badge>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="block w-full text-left" asChild>
                  <p
                    ref={descriptionRef}
                    onLoad={checkTruncation}
                    className="line-clamp-1 text-sm text-muted-foreground"
                  >
                    {rag.description || "No description available"}
                  </p>
                </TooltipTrigger>
                {isTruncated && (
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{rag.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right section - Actions dropdown */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Ellipsis className="size-4" />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isSelectionMode && onEnterSelectionMode && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterSelectionMode(rag);
                  }}
                >
                  <CheckSquare className="mr-2 size-4" />
                  Select
                </DropdownMenuItem>
              )}
              {isSelectionMode && onToggleSelect && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(rag);
                  }}
                >
                  <CheckSquare className="mr-2 size-4" />
                  {isSelected ? "Remove from Selection" : "Add to Selection"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit(rag)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              {onAddToGroup && (
                <DropdownMenuItem onClick={onAddToGroup(rag)}>
                  <FolderPlus className="mr-2 size-4" />
                  {currentGroup === null ? "Add to Group" : "Move to Group"}
                </DropdownMenuItem>
              )}
              {currentGroup !== null && onRemoveFromGroup && (
                <DropdownMenuItem
                  onClick={onRemoveFromGroup(rag)}
                  className="text-red-600"
                >
                  <FolderPlus className="mr-2 size-4" />
                  Remove from Folder
                </DropdownMenuItem>
              )}
              {isOrgMode(usageData?.plan_name) && isActionable && (
                <DropdownMenuItem onClick={onShare(rag)}>
                  <Share2 className="mr-2 size-4" />
                  Share
                </DropdownMenuItem>
              )}
              {isActionable && (
                <DropdownMenuItem
                  onClick={onDelete(rag)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

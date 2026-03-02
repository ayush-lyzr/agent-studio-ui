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

import { Card, CardTitle } from "@/components/ui/card";
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
import { Group } from "@/services/groupsApiService";
import { Checkbox } from "@/components/ui/checkbox";

interface RAGCardProps {
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

const cardVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
    scale: 1,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 10,
    },
  }),
};

export const RAGCard = ({
  rag,
  isActionable,
  usageData,
  onEdit,
  onDelete,
  onShare,
  onAddToGroup,
  onClick,
  index = 0,
  onRemoveFromGroup,
  currentGroup,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectionMode,
}: RAGCardProps) => {
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
      variants={cardVariants}
      transition={{
        delay: index / 20,
      }}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      layout
    >
      <Card
        className="relative h-[180px] cursor-pointer space-y-4 border p-4 transition-all hover:border-primary"
        onClick={(e) => {
          if (isSelectionMode) {
            e.stopPropagation();
            onToggleSelect?.(rag);
            return;
          }
          onClick(e);
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.(rag)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <CardTitle className="text-base font-semibold">
              {rag.collection_name.slice(0, -4)}
            </CardTitle>
          </div>
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="block w-full text-left" asChild>
              <p
                ref={descriptionRef}
                onLoad={checkTruncation}
                className="line-clamp-3 h-[3.6rem] overflow-hidden text-ellipsis text-sm text-muted-foreground"
              >
                {rag.description}
              </p>
            </TooltipTrigger>
            {isTruncated && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{rag.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <div className="line-clamp-1 flex gap-2">
          <Badge variant="secondary">{typeTag}</Badge>
          <Badge variant="secondary">{databaseTag}</Badge>
        </div>
      </Card>
    </motion.div>
  );
};

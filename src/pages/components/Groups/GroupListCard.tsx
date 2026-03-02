import { useState } from "react";
import { motion } from "framer-motion";
import { Folder, FolderOpen, Ellipsis, Trash2, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Group } from "@/services/groupsApiService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GenericGroupListCardProps {
  group: Group;
  index: number;
  onOpen: (group: Group) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onDrop?: (group: Group) => void;
  isDragOver?: boolean;
  type?: "agent" | "knowledge_base";
  showSharedColumn?: boolean;
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

export function GroupListCard({
  group,
  index,
  onOpen,
  onEdit,
  onDelete,
  onDrop,
  isDragOver,
  type = "agent",
  showSharedColumn = true,
}: GenericGroupListCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(group);
  };

  const createdDate = group?.created_at
    ? format(new Date(group.created_at), "MMM d, yyyy")
    : "-";

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
          "group relative flex items-center border-b px-4 py-2",
          "cursor-pointer transition-colors hover:bg-muted/50",
          "text-sm",
          isDragOver && "bg-primary/5",
        )}
        onClick={() => onOpen(group)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Name column */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            {isHovered || isDragOver ? (
              <FolderOpen className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            ) : (
              <Folder className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{group.group_name}</span>
              <Badge variant="secondary" className="text-xs">
                {group.assets.length} {type}
                {group.assets.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">Folder</p>
          </div>
        </div>

        {/* Created At column */}
        <div className="w-32 px-4 text-muted-foreground">{createdDate}</div>

        {/* Owner column */}
        {/* <div className="w-40 truncate px-4 text-muted-foreground">Folder</div> */}

        {/* Optional shared column */}
        {showSharedColumn && (
          <div className="flex w-40 justify-center px-4">
            {isDragOver ? (
              <Badge variant="secondary" className="text-xs">
                Drop here to add
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        )}

        {/* Actions column */}
        <div className="flex w-16 items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded p-1 hover:bg-muted">
                <Ellipsis className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(group);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(group);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

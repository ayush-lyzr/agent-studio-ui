import { useState } from "react";
import { Folder, FolderOpen, Ellipsis, Trash2, Edit2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Group } from "@/services/groupsApiService";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GroupCardProps {
  group: Group;
  index: number;
  label: string;
  onOpen: (group: Group) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onDrop?: (group: Group) => void;
  isDragOver?: boolean;
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

export function GroupCard({
  group,
  index = 0,
  label,
  onOpen,
  onEdit,
  onDelete,
  onDrop,
  isDragOver,
}: GroupCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(group);
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
        className={cn(
          "relative h-[200px] cursor-pointer space-y-4 border p-4 transition-all hover:border-primary",
          "bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50",
          isDragOver && "scale-105 border-primary bg-primary/5",
        )}
        style={{
          backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0,0,0,0.015) 10px,
            rgba(0,0,0,0.015) 20px
          )
        `,
        }}
        onClick={() => onOpen(group)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardTitle className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {isHovered || isDragOver ? (
              <FolderOpen className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            ) : (
              <Folder className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            )}
            {group.group_name}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ellipsis className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(group);
                }}
              >
                <Edit2 className="mr-2 size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(group);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>

        <CardDescription>
          <p className="text-sm text-muted-foreground">
            {group.assets.length} {label}
            {group.assets.length > 1 ? "s" : ""}
          </p>
        </CardDescription>

        <CardFooter className="absolute bottom-4 left-4 right-4 p-0">
          {isDragOver && (
            <Badge variant="secondary" className="w-full justify-center">
              Drop here to add to group
            </Badge>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

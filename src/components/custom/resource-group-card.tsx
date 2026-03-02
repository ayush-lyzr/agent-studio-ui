import {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Edit2, Ellipsis, FolderClosed, Trash2 } from "lucide-react";

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
import { Group } from "@/services/groupsApiService";
import { Badge } from "../ui/badge";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface ResourceGroupCardProps {
  index: number;
  type: "grid" | "list";
  group: Group;
  isDragOver?: boolean;
  badges?: {
    label?: string;
    icon: ReactElement;
    visible: boolean;
    tooltip?: string | ReactNode;
  }[];
  listColumns?: (string | ReactNode)[];
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onDrop?: (e: React.DragEvent<Element>) => Promise<void> | void;
  onDragOver?: (e: React.DragEvent<Element>) => void;
  onDragLeave?: () => void;
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
      delay: index / 100,
    },
  }),
};

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
      delay: index / 100,
    },
  }),
};

export const ResourceGroupCard: React.FC<
  ResourceGroupCardProps & HTMLAttributes<HTMLDivElement>
> = ({ group, index, listColumns = [], ...props }) => {
  const isList = props.type === "list";

  // Destructure drag handlers and other special props to avoid conflicts
  const { onDragOver, onDragLeave, onDrop, onClick, onEdit, onDelete, isDragOver, badges, ...restProps } = props;

  const superRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [visibleTags, setVisibleTags] = useState<typeof group.assets>([]);
  const [hiddenCount, setHiddenCount] = useState<number>(0);

  const OptionsMenu = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div
            className={cn(
              "rounded-full p-1 hover:bg-gray-100 group-hover:visible dark:hover:bg-gray-700",
              isList ? "visible" : "invisible",
            )}
          >
            <Ellipsis className="size-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-xs"
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
            className="text-xs text-red-600"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    onDragOver?.(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop?.(e);
  };

  const Timestamp = () => {
    const timestamp = group?.updated_at ?? group?.created_at;
    const date = timestamp
      ? new Date(
          timestamp.endsWith("Z") || timestamp.includes("+")
            ? timestamp
            : `${timestamp}Z`,
        )
      : new Date();

    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger className="text-xs text-muted-foreground">
          {formatTimeAgo(date)}
        </TooltipTrigger>
        <TooltipContent>
          Last updated:{" "}
          {new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }).format(date)}
        </TooltipContent>
      </Tooltip>
    );
  };

  const Badges = () =>
    visibleTags?.length > 0 ? (
      <div
        ref={superRef}
        className="flex h-[35%] w-full flex-wrap items-center gap-2"
      >
        <div ref={containerRef} className="flex flex-wrap gap-2 text-xs">
          {visibleTags?.map((item) => (
            <Badge variant="outline" size="sm" className="h-fit">
              <p className="max-w-64 overflow-hidden truncate break-words text-muted-foreground">
                {item.asset_name}
              </p>
            </Badge>
          ))}
        </div>
        {hiddenCount > 0 && (
          <Badge variant="outline" size="sm" className="max-w-5/6 h-fit">
            <p className="truncate text-muted-foreground">
              +{hiddenCount} more
            </p>
          </Badge>
        )}
      </div>
    ) : (
      <CardDescription className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
        Empty Folder
      </CardDescription>
    );

  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current || !superRef.current) {
        console.log("Refs not ready yet");
        return;
      }

      // const superWidth = superRef.current.offsetWidth;
      // const superHeight = superRef.current.offsetHeight;

      // console.log("Container dimensions:", { superWidth, superHeight });

      // const tagElements = Array.from(
      //   containerRef.current.children,
      // ) as HTMLElement[];

      // if (tagElements.length === 0) {
      //   setVisibleTags([]);
      //   setHiddenCount(0);
      //   return;
      // }

      // // Get dimensions of first badge to estimate height
      // const firstBadgeHeight = tagElements[0]?.offsetHeight ?? 0;
      // const gapSize = 8; // gap-2 = 8px

      // // Calculate how many rows can fit
      // const maxRows = Math.floor(
      //   (superHeight + gapSize) / (firstBadgeHeight + gapSize),
      // );
      // const availableHeight = maxRows * (firstBadgeHeight + gapSize) - gapSize;

      // console.log("Height calculations:", {
      //   firstBadgeHeight,
      //   maxRows,
      //   availableHeight,
      // });

      // let currentRow = 0;
      // let currentRowWidth = 0;
      // let lastVisibleIndex = 0;

      // // Reserve space for "+X more" badge
      // const moreBadgeWidth = 70; // Approximate width of "+X more" badge

      // for (let i = 0; i < tagElements.length; i++) {
      //   const tagWidth = tagElements[i]?.offsetWidth ?? 0;
      //   const widthWithGap =
      //     currentRowWidth > 0 ? tagWidth + gapSize : tagWidth;

      //   // Check if this badge would fit in current row
      //   if (currentRowWidth + widthWithGap <= superWidth) {
      //     currentRowWidth += widthWithGap;
      //     lastVisibleIndex = i + 1;
      //   } else {
      //     // Move to next row
      //     currentRow++;

      //     // Check if we've exceeded max rows
      //     if (currentRow >= maxRows) {
      //       break;
      //     }

      //     currentRowWidth = tagWidth;
      //     lastVisibleIndex = i + 1;
      //   }

      //   // If this is the last few items, check if we need space for "+X more"
      //   if (i < tagElements.length - 1) {
      //     const remainingItems = tagElements.length - lastVisibleIndex;
      //     if (remainingItems > 0) {
      //       // Check if "+X more" badge would fit in current row
      //       if (currentRowWidth + gapSize + moreBadgeWidth > superWidth) {
      //         // Need to remove last badge to make room for "+X more"
      //         if (currentRow >= maxRows - 1) {
      //           lastVisibleIndex = Math.max(0, lastVisibleIndex - 1);
      //           break;
      //         }
      //       }
      //     }
      //   }
      // }

      // console.log("Final calculations:", {
      //   lastVisibleIndex,
      //   totalItems: group.assets.length,
      // });
      const lastVisibleIndex = 1;
      setVisibleTags(group.assets.slice(0, lastVisibleIndex));
      setHiddenCount(group.assets.length - lastVisibleIndex);
    };

    // Use ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure layout is stable
      requestAnimationFrame(() => {
        calculateVisibleTags();
      });
    });

    if (superRef.current) {
      resizeObserver.observe(superRef.current);
    }

    // Initial calculation
    const timeoutId = setTimeout(calculateVisibleTags, 100);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [group.assets]);

  // Initialize with all assets
  useEffect(() => {
    setVisibleTags(group.assets);
    setHiddenCount(0);
  }, [group.assets]);

  if (isList) {
    return (
      <motion.div
        custom={index}
        variants={listVariants}
        key={`resource-group-list-${index}`}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "group relative flex items-center border-b px-4 py-2",
            "cursor-pointer transition-colors hover:bg-muted/50",
            "text-sm",
          )}
          onClick={onClick}
          {...restProps}
        >
          {/* Name column */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <FolderClosed className="text-blue-500" />

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {group.group_name}
            </span>
            <div className="max-w-[45%] shrink-0 overflow-hidden">
              <Badges />
            </div>
          </div>

          {/* Created At column */}
          <div className="w-24 px-4 text-muted-foreground">
            {listColumns?.[0]}
          </div>

          {/* Owner column */}
          <div className="w-32 px-4">
            <Timestamp />
          </div>

          {/* Shared With column */}
          {/* <div className="w-40 px-4">
            <span className="text-muted-foreground">-</span>
          </div> */}

          {/* Actions column */}
          <div className="flex w-16 items-center justify-end">
            <OptionsMenu />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={index}
      key={`resource-group-grid-${index}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileDrag={{
        scale: 0.5,
        cursor: "grab",
      }}
    >
      <Card
        className={cn(
          "group relative z-20 cursor-pointer space-y-2 border p-4 transition-all hover:-translate-y-2 hover:border-primary sm:h-[160px] 2xl:h-[180px]",
          isDragOver && "scale-75 border-primary opacity-60",
        )}
        onClick={onClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...restProps}
      >
        <div className="flex items-center justify-between gap-2">
          <FolderClosed className="text-blue-500" />
          <OptionsMenu />
        </div>
        <CardTitle className="flex w-full items-start justify-between text-sm">
          <span className="line-clamp-2 break-words">{group.group_name}</span>
        </CardTitle>

        <div className="">
          <Badges />
        </div>
        <CardFooter className="absolute bottom-4 left-4 right-4 p-0">
          <div className="flex w-full items-center justify-between">
            <Timestamp />
            {isDragOver && (
              <p className="justify-self-end text-xs text-muted-foreground">
                Drop here to add to group
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

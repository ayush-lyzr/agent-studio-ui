import {
  HTMLAttributes,
  ReactNode,
  ReactElement,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Ellipsis, Folder, CornerDownLeft } from "lucide-react";

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
import { cn, formatTimeAgo } from "@/lib/utils";
import { GradientTextCard } from "./gradient-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";

interface ResourceCardProps<T> {
  index: number;
  title: string;
  description?: string;
  type?: string;
  timestamp?: string;
  viewMode: "grid" | "list";
  withGradientIcon?: boolean;
  folderName?: string;
  onFolderClick?: () => void;
  actions?: {
    label: string;
    icon: ReactElement;
    visible: boolean;
    className?: string;
    onClick?: (item: T) => (e: React.MouseEvent<Element, MouseEvent>) => void;
  }[];
  badges?: {
    label?: string;
    icon: ReactElement;
    visible: boolean;
    tooltip?: string | ReactNode;
  }[];
  item: T;
  sharedUsers?: string[];
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  listColumns?: (string | ReactNode)[];
  footer?: ReactNode;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onEnterSelectionMode?: (e: React.MouseEvent) => void;
  dropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 50,
    },
  }),
};

const listVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 50,
    },
  }),
};

export function ResourceCard<T>({
  index,
  title,
  description,
  item,
  footer,
  actions,
  listColumns,
  sharedUsers,
  withGradientIcon = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectionMode,
  dropdownOpen,
  onDropdownOpenChange,
  ...props
}: ResourceCardProps<T> & HTMLAttributes<HTMLDivElement>) {
  const isList = props.viewMode === "list";
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Only trigger onClick if there was no drag
    if (!hasDragged.current) {
      if (isSelectionMode) {
        if (onToggleSelect) {
          onToggleSelect(e);
        }
      } else if (props.onClick) {
        props.onClick(e);
      }
    }
  };

  const handleCheckboxChange = () => {
    if (onToggleSelect) {
      const event = {
        stopPropagation: () => {},
        preventDefault: () => {},
      } as React.MouseEvent<Element, MouseEvent>;
      onToggleSelect(event);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Record initial mouse position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    props?.onDragStart?.(e);
    setIsDragging(true);
    hasDragged.current = true;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    // Mark as dragged if mouse moved significantly
    if (dragStartPos.current && e.clientX !== 0 && e.clientY !== 0) {
      const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
      if (deltaX > 5 || deltaY > 5) {
        hasDragged.current = true;
      }
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    props?.onDragEnd?.(e);
    setIsDragging(false);
    // Reset drag flag after a brief delay to prevent click from firing
    setTimeout(() => {
      hasDragged.current = false;
      dragStartPos.current = null;
    }, 100);
  };

  const OptionsMenu = () => {
    if (isSelectionMode) return null;
    if (!actions?.length) return null;

    const isControlled =
      dropdownOpen !== undefined && onDropdownOpenChange !== undefined;

    return (
      <DropdownMenu
        open={isControlled ? dropdownOpen : undefined}
        onOpenChange={isControlled ? onDropdownOpenChange : undefined}
      >
        <DropdownMenuTrigger
          className={cn(
            "cursor-default focus:outline-none group-hover:visible",
            isList ? "visible" : "invisible",
          )}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Ellipsis className="size-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions
            ?.filter((action) => action?.visible)
            ?.map((action_item) => (
              <DropdownMenuItem
                key={action_item.label}
                onClick={action_item?.onClick?.(item)}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  action_item?.className,
                )}
              >
                {action_item?.icon}
                {action_item.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const Badges = () => (
    <div className="flex items-center gap-2">
      {props?.badges
        ?.filter((badge) => badge?.visible)
        ?.map((badge) =>
          badge?.tooltip ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                {badge.label}
                {badge.icon}
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge?.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              {badge.label} {badge.icon}
            </div>
          ),
        )}
    </div>
  );

  const Timestamp = () => {
    const date = props?.timestamp
      ? new Date(
          props.timestamp.endsWith("Z") || props.timestamp.includes("+")
            ? props.timestamp
            : `${props.timestamp}Z`,
        )
      : new Date();

    return (
      <div className="flex items-center gap-2">
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
        {props.folderName && (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div
                className="group/folder flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onFolderClick?.();
                }}
              >
                <Folder className="size-3 flex-shrink-0" />
                <span className="max-w-[80px] truncate group-hover/folder:underline">
                  {props.folderName}
                </span>
                <CornerDownLeft className="size-3 flex-shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Open folder: {props.folderName}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  if (isList) {
    return (
      <>
        <motion.div
          key={`resource-list-${index}`}
          custom={index}
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <div
            draggable
            className={cn(
              "group relative flex items-center px-4 py-2",
              "cursor-pointer transition-colors hover:bg-muted/50",
              "text-sm",
              isDragging && "scale-75 cursor-grabbing",
            )}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            {...props}
          >
            {isSelectionMode && (
              <div
                className="flex items-center pr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleCheckboxChange}
                />
              </div>
            )}

            {/* Name column */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="size-6">
                {withGradientIcon && (
                  <GradientTextCard
                    key={index}
                    text={title}
                    displayText=""
                    size="md"
                    className="size-6 rounded-sm transition-colors"
                  />
                )}
              </div>
              <div className="w-4/5 min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate font-medium">{title}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger className="w-[90%] truncate text-left text-xs text-muted-foreground">
                    {description || ""}
                  </TooltipTrigger>
                  <TooltipContent className="w-1/2">
                    {description || ""}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 text-muted-foreground">
              {props?.badges
                ?.filter((badge) => badge?.visible)
                ?.map((badge) =>
                  badge?.tooltip ? (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger>
                        {badge.label}
                        {badge.icon}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge?.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center gap-2">
                      {badge.label} {badge.icon}
                    </div>
                  ),
                )}
            </div>

            {/* Owner column */}
            <div className="w-36 px-4 text-xs">{props?.type}</div>

            {/* Created At column */}
            <div className="w-32 px-4 text-muted-foreground">
              <Timestamp />
            </div>

            {/* Actions column */}
            <div className="flex w-16 items-center justify-end">
              <OptionsMenu />
            </div>
          </div>
        </motion.div>
        <Separator />
      </>
    );
  }

  return (
    <motion.div
      key={`resource-grid-${index}`}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      whileDrag="drag"
      className="z-25"
    >
      <Card
        draggable
        className={cn(
          "group relative z-25 rounded-lg border p-4 active:cursor-grabbing sm:h-[160px] 2xl:h-[180px]",
          isDragging && "scale-75 cursor-grabbing",
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <div
                className="cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleCheckboxChange}
                />
              </div>
            )}
            {withGradientIcon && (
              <GradientTextCard
                key={index}
                text={title}
                displayText=""
                size="md"
                className="size-6 rounded-sm transition-colors"
              />
            )}
          </div>
          <OptionsMenu />
        </div>
        <CardTitle
          title={title}
          className="mb-1 mt-2 flex w-full min-w-0 items-center justify-between"
        >
          <p className="line-clamp-1 min-w-0 flex-1 text-ellipsis text-sm">
            {title}
          </p>
        </CardTitle>
        <CardDescription className="mb-2 h-1/4">
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                title={description}
                className="line-clamp-2 overflow-hidden text-ellipsis text-xs text-muted-foreground"
              >
                {description}
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </CardDescription>
        <CardFooter className="absolute bottom-0 left-0 right-0 flex h-12 items-center justify-between rounded-b-lg !p-0">
          <div className="line-clamp-1 flex w-full items-center justify-between gap-2 px-4">
            <Timestamp />

            <div className="flex items-center gap-2">
              <Badges />
              {props?.type && (
                <Badge size="sm" variant="secondary" className="rounded-full">
                  {props?.type}
                </Badge>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

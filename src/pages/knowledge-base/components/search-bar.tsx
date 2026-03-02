import {
  Search,
  XCircleIcon,
  LayoutGrid,
  List,
  FolderPlus,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Group } from "@/services/groupsApiService";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateGroup?: () => void;
  currentGroup?: Group | null;
  isSelectionMode?: boolean;
  selectedCount?: number;
  onCancelSelectionMode?: () => void;
  onMoveToFolder: () => void;
  onBulkDelete?: () => void;
  isBulkDeleting?: boolean;
  onEnterSelectionMode?: () => void;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  viewMode,
  onViewModeChange,
  onCreateGroup,
  currentGroup,
  isSelectionMode = false,
  selectedCount = 0,
  onCancelSelectionMode,
  onMoveToFolder,
  onBulkDelete,
  isBulkDeleting = false,
  onEnterSelectionMode,
}: SearchBarProps) => {
  return (
    <div className="grid w-full grid-cols-12 place-content-between">
      <div className="col-span-4 flex items-center justify-between gap-2">
        <span className="flex w-full items-center rounded-md border border-input px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-8 max-w-xs border-none bg-transparent shadow-none"
          />
          <XCircleIcon
            className={cn(
              "size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
              searchQuery.length > 0 ? "visible" : "invisible",
            )}
            onClick={() => onSearchChange("")}
          />
        </span>
        <Button
          variant="outline"
          size="icon"
          withTooltip="Refresh"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("size-4", isRefreshing ? "animate-spin" : "")}
          />
        </Button>
      </div>

      <div className="col-span-5" />
      <div className="col-span-3 flex items-center justify-end space-x-2">
        {isSelectionMode ? (
          <>
            <Button
              variant="outline"
              onClick={onCancelSelectionMode}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={onMoveToFolder}
              disabled={isBulkDeleting || selectedCount === 0}
            >
              {currentGroup ? "Remove from Folder" : "Move to Folder"}
            </Button>
            <Button
              variant="destructive"
              onClick={onBulkDelete}
              disabled={isBulkDeleting || selectedCount === 0}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              {`Delete Selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => onEnterSelectionMode?.()}>
              <CheckSquare className="mr-2 size-4" />
              Select
            </Button>
            {onCreateGroup && currentGroup === null && (
              <>
                <Button variant="outline" onClick={onCreateGroup}>
                  <FolderPlus className="mr-1 size-4" />
                  Create Folder
                </Button>
              </>
            )}
            <TooltipProvider>
              <div className="flex items-center rounded-md border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-r-none"
                      onClick={() => onViewModeChange("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => onViewModeChange("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  );
};

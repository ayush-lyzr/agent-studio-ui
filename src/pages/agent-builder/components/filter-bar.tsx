import { Link } from "react-router-dom";
import { Code, Package, Trash2, CheckSquare, Loader2 } from "lucide-react";
import { Search, XCircleIcon, RefreshCw, LayoutGrid, List } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Path } from "@/lib/types";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isDevEnv } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dispatch, SetStateAction } from "react";

type FilterBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  loading: boolean;
  isSearchLoading?: boolean;
  viewMode: "grid" | "list";
  setViewMode: Dispatch<SetStateAction<"grid" | "list">>;
  onCreateAgent: () => void;
  handleIDE: () => void;
  handleFolder: () => void;
  isGroupMode: boolean;
  isSelectionMode: boolean;
  onCancelSelectionMode: () => void;
  onMoveToFolder: () => void;
  onBulkDelete: () => void;
  selectedCount: number;
  isBulkDeleting: boolean;
  onEnterSelectionMode: () => void;
  onImport: () => void;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onRefresh,
  // onCreateAgent,
  loading,
  isSearchLoading,
  isGroupMode,
  // handleFolder,
  handleIDE,
  isSelectionMode,
  onCancelSelectionMode,
  onMoveToFolder,
  onBulkDelete,
  selectedCount,
  isBulkDeleting,
  onEnterSelectionMode,
}) => {
  return (
    <div className="mb-8 grid w-full grid-cols-12 place-content-between">
      <div className="col-span-3 flex items-center gap-2">
        <span className="flex w-2/3 items-center rounded-md border border-input px-2">
          {isSearchLoading ? (
            <Loader2 className="size-5 animate-spin text-primary/80" />
          ) : (
            <Search className="size-5 text-primary/80" />
          )}
          <div className="flex-1">
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-8 w-full border-none bg-transparent shadow-none"
            />
          </div>
          <XCircleIcon
            className={cn(
              "ml-2 size-4 cursor-pointer text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
              searchQuery.length > 0 ? "visible" : "invisible",
            )}
            onClick={() => setSearchQuery("")}
          />
        </span>

        <Button
          variant="outline"
          size="icon"
          withTooltip="Refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw
            className={cn(
              "size-4 text-primary/80",
              loading ? "animate-spin" : "",
            )}
          />
        </Button>
      </div>
      <div className="col-span-6" />
      <div className="col-span-3 flex items-center gap-2 place-self-end">
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <Button
                variant="outline"
                size="default"
                onClick={onCancelSelectionMode}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={onMoveToFolder}
                disabled={selectedCount === 0 || loading || isBulkDeleting}
              >
                {isGroupMode ? "Remove from Folder" : "Move to Folder"}
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={onBulkDelete}
                disabled={selectedCount === 0 || loading || isBulkDeleting}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                {`Delete Selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary/80">
                {isDevEnv && (
                  <Button variant="outline" onClick={handleIDE}>
                    <Code className="mr-2 size-4" />
                    Open IDE
                  </Button>
                )}
                {/* {!isGroupMode && (
                  <Button
                    variant="outline"
                    onClick={handleFolder}
                    className="place-self-end"
                  >
                    <FolderPlus className="mr-2 size-4" />
                    Create Folder
                  </Button>
                )} */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => window.location.href}
                >
                  <Link to={Path.BLUEPRINTS} className="flex w-full flex-row">
                    <Package className="mr-2 h-5 w-5" />
                    Explore Blueprints
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEnterSelectionMode?.()}
                >
                  <CheckSquare className="mr-2 size-4" />
                  Select
                </Button>
              </div>
              <div className="flex items-center rounded-md border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-r-none"
                      onClick={() => {
                        setViewMode("grid");
                        localStorage.setItem("agentBuilderViewMode", "grid");
                      }}
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
                      onClick={() => {
                        setViewMode("list");
                        localStorage.setItem("agentBuilderViewMode", "list");
                      }}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
              </div>
              {/* <Button size="default" onClick={onCreateAgent}>
                <Plus className="mr-2 h-5 w-5" />
                Create Agent
              </Button> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

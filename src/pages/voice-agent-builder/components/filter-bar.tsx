import { Link } from "react-router-dom";
import { Plus, Package } from "lucide-react";
import {
  Search,
  XCircleIcon,
  RefreshCw,
  FolderPlus,
  LayoutGrid,
  List,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Path } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dispatch, SetStateAction } from "react";

type FilterBarProps = {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  onRefresh: () => void;
  loading: boolean;
  viewMode: "grid" | "list";
  setViewMode: Dispatch<SetStateAction<"grid" | "list">>;
  onCreateAgent: () => void;
  handleFolder: () => void;
  isGroupMode: boolean;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onRefresh,
  onCreateAgent,
  loading,
  isGroupMode,
  handleFolder,
}) => {
  return (
    <div className="mb-8 grid w-full grid-cols-12 place-content-between gap-2">
      <span className="col-span-4 flex items-center rounded-md border border-input px-2">
        <Search className="size-5" />
        <div className="flex-1">
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full border-none bg-transparent shadow-none"
          />
        </div>
        <XCircleIcon
          className={cn(
            "ml-2 size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
            searchQuery.length > 0 ? "visible" : "invisible",
          )}
          onClick={() => setSearchQuery("")}
        />
      </span>

      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw
          className={cn("mr-2 size-4", loading ? "animate-spin" : "")}
        />
        Refresh
      </Button>
      <div className="col-span-4" />
      <div className="col-span-3 flex items-center gap-2 place-self-end">
        {/* View Toggle */}
        <div className="flex items-center gap-2">
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
          {!isGroupMode && (
            <Button
              variant="outline"
              onClick={handleFolder}
              className="place-self-end"
            >
              <FolderPlus className="mr-1 size-4" />
              Create Folder
            </Button>
          )}
          <Button
            variant="outline"
            size="default"
            onClick={() => window.location.href}
          >
            <Link to={Path.BLUEPRINTS} className="flex w-full flex-row">
              <Package className="mr-2 h-5 w-5" />
              Blueprints
            </Link>
          </Button>
        </div>

        <Button size="default" onClick={onCreateAgent}>
          <Plus className="mr-2 h-5 w-5" />
          Create Agent
        </Button>
      </div>
    </div>
  );
};

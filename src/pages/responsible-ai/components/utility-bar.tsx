import { Plus, RefreshCw, Search, XCircleIcon } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IUtilityBar = {
  onRefresh: () => void;
  openForm: () => void;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
};

const UtilityBar: React.FC<IUtilityBar> = ({
  onRefresh: refresh,
  openForm,
  searchQuery,
  setSearchQuery,
}) => {
  const isRefreshing = false;

  return (
    <div className="col-span-4 grid w-full grid-cols-12 place-content-between gap-2">
      <span className="col-span-3 flex items-center rounded-md border border-input px-2">
        <Search className="size-5" />
        <Input
          placeholder="Search policies..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="max-w-xs border-none bg-transparent shadow-none"
        />
        <XCircleIcon
          className={cn(
            "size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
            searchQuery.length > 0 ? "visible" : "invisible",
          )}
          onClick={() => setSearchQuery("")}
        />
      </span>

      <Button
        variant="outline"
        onClick={refresh}
        disabled={isRefreshing}
        className="mr-2"
      >
        <RefreshCw
          className={cn("mr-1 size-4", isRefreshing ? "animate-spin" : "")}
        />
        Refresh
      </Button>
      <div className="col-span-5" />
      <div className="col-span-3 flex items-center justify-end space-x-2">
        <Button onClick={openForm}>
          <Plus className="mr-1 size-4" />
          Create New
        </Button>
      </div>
    </div>
  );
};

export default UtilityBar;

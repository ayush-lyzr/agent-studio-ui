import { useEffect, useState } from "react";
import { X, Wrench, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { ToolsProps } from "../types";

const ToolsListSkeleton = () => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-32 rounded-full" />
      <Skeleton className="h-10 w-28 rounded-full" />
    </div>
  </div>
);

export const Tools: React.FC<ToolsProps> = ({
  form,
  onEnabledCountChange,
  apiTools,
  userTools,
  loading,
  error,
  apiKey,
  setApiTools,
  setUserTools,
}) => {
  const selectedTools = form.watch("tools");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    onEnabledCountChange(selectedTools.length);
  }, [selectedTools, onEnabledCountChange]);

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const toolsList = (() => {
    const result = [];

    if (apiTools?.length > 0) {
      const apiToolsItems = apiTools.map((tool) => ({
        value: tool.provider_id,
        label: tool.meta_data.schema.info.title,
        icon: () => <Wrench className="mr-1 size-4" />,
        description:
          tool.meta_data.schema.info.description?.slice(0, 50) +
          (tool.meta_data.schema.info.description?.length > 50 ? "..." : ""),
      }));
      result.push(...apiToolsItems);
    }

    if (userTools?.length > 0) {
      const userToolsItems = userTools.map((tool) => ({
        value: tool,
        label: capitalize(tool),
        icon: () => <Wrench className="mr-1 size-4" />,
      }));
      result.push(...userToolsItems);
    }

    return result;
  })();

  const filteredToolsList = toolsList.filter((tool) =>
    tool.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToolToggle = (toolValue: string) => {
    const newTools = selectedTools.includes(toolValue)
      ? selectedTools.filter((tool: string) => tool !== toolValue)
      : [...selectedTools, toolValue];

    form.setValue("tools", newTools, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const userToolsResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/v3/tools/composio/user`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      setApiTools([]);
      setUserTools(userToolsResponse.data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="h-full">
      <div className="flex gap-2">
        <div className="sticky top-0 z-10 mb-4 flex flex-1 items-center rounded-md border border-slate-300 px-2">
          <Search className="size-5" />
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
          />
          {searchQuery && (
            <X
              className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>

      {loading || isRefreshing ? (
        <ToolsListSkeleton />
      ) : apiTools.length === 0 && userTools.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-muted-foreground">
            Explore a wide range of tools to augment your agent's capabilities
          </p>
          <Link
            to={`${window.location.origin}/configure/tools`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" type="button">
              <Plus className="mr-2 size-4" />
              Add Tools
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="mt-4 flex flex-wrap gap-2">
            {loading || isRefreshing ? (
              <ToolsListSkeleton />
            ) : (
              filteredToolsList.map((item) => {
                const isSelected = selectedTools.includes(item.value);
                return (
                  <Badge
                    key={item.value}
                    variant="outline"
                    className={cn(
                      "cursor-pointer rounded-full px-4 py-2 transition-all",
                      isSelected && "bg-secondary ring-1 ring-primary",
                      "hover:bg-secondary",
                    )}
                    onClick={() => handleToolToggle(item.value)}
                  >
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <X
                          className="size-5 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolToggle(item.value);
                          }}
                        />
                      )}
                      {item.icon()}
                      {item.label}
                    </div>
                  </Badge>
                );
              })
            )}
          </div>
          {error && !loading && (
            <div className="mt-2 text-sm text-muted-foreground">{error}</div>
          )}
          <div className="flex justify-center">
            <Link
              to={`${window.location.origin}/configure/tools`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Button variant="link" type="button" className="gap-2">
                <Plus className="size-4" />
                Add more tools
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;

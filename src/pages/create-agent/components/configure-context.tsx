import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAllContexts, Context } from "@/services/contextsApiService";
import { useToast } from "@/components/ui/use-toast";

interface ConfigureContextProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      context_id?: string;
      [key: string]: any;
    },
  ) => void;
  featureName: string;
  openDialog?: boolean;
}

export const ConfigureContext: React.FC<ConfigureContextProps> = ({
  updateFeatures,
  featureName,
  openDialog,
}) => {
  const [open, setOpen] = useState(false);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContextId, setSelectedContextId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchContexts = async () => {
    setIsLoading(true);
    try {
      const fetchedContexts = await getAllContexts();
      setContexts(fetchedContexts);
    } catch (error) {
      console.error("Failed to fetch contexts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contexts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContexts();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (open) {
      fetchContexts();
    }
  }, [open]);

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  const handleSave = () => {
    if (selectedContextId) {
      const selectedContext = contexts.find((c) => c._id === selectedContextId);
      updateFeatures(featureName, true, undefined, undefined, {
        context_id: selectedContextId,
        context_name: selectedContext?.name,
      });
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedContextId("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>
      <DialogContent
        className={cn("gap-0 pb-0 sm:max-w-lg")}
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Context Configuration</span>
            <Link
              to="/global-contexts"
              target="_blank"
              className={cn(
                buttonVariants({ variant: "link" }),
                "p-0 text-xs text-blue-500",
              )}
            >
              Manage Contexts
              <ArrowTopRightIcon className="ml-1 h-3 w-3" />
            </Link>
          </DialogTitle>
          <p
            id="dialog-description"
            className="mt-2 text-sm text-muted-foreground"
          >
            Select a context to provide additional information to your agent.
          </p>
        </DialogHeader>
        <Separator className="mt-4" />

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between">
                <LabelWithTooltip tooltip="Choose a context to provide additional information to your agent">
                  Select Context
                </LabelWithTooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing || isLoading}
                      className="h-8 w-8 justify-center"
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          isRefreshing && "animate-spin",
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh contexts list</TooltipContent>
                </Tooltip>
              </div>

              <Select
                onValueChange={setSelectedContextId}
                value={selectedContextId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoading ? "Loading contexts..." : "Select a context"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {contexts.length === 0 && !isLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No contexts available
                    </div>
                  ) : (
                    contexts.map((context) => (
                      <SelectItem key={context._id} value={context._id}>
                        {context.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContextId && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-1 text-sm font-medium">Selected Context</p>
              <p className="text-xs text-muted-foreground">
                {contexts.find((c) => c._id === selectedContextId)?.name}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!selectedContextId}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

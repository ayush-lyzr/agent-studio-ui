import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { ChevronUp } from "lucide-react";
import { CircleDollarSign } from "lucide-react";
import { Zap } from "lucide-react";
import { Brain } from "lucide-react";
import { Globe } from "lucide-react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IProvider } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModelHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: IProvider[];
};

type SortDirection = "asc" | "desc" | null;
type SortKey = "model" | "provider" | "cost" | "speed" | "context";

interface ModelInfo {
  model: string;
  provider: string;
  cost?: number;
  speed?: number;
  context?: number;
  special?: string[];
}

const ModelHelpDialog: React.FC<ModelHelpDialogProps> = ({
  open,
  onOpenChange,
  providers,
}) => {
  const [sortColumn, setSortColumn] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Memoize models computation to avoid recalculating on every render
  const models = useMemo<ModelInfo[]>(() => {
    if (!providers.length) return [];

    return providers.flatMap((provider) => {
      const providerModels = provider.meta_data?.models;
      let modelsList: any[] = [];

      if (Array.isArray(providerModels)) {
        modelsList = providerModels;
      } else {
        const regionModels = providerModels ?? {};
        modelsList = [
          ...(regionModels["us"] || []),
          ...(regionModels["eu"] || []),
        ];
      }

      return modelsList.map((modelData: any) => {
        if (Array.isArray(modelData)) {
          const [modelName, cost, speed, context, ...specialProps] = modelData;
          return {
            model: typeof modelName === "string" ? modelName : modelName[0],
            provider: provider.display_name || provider.provider_id,
            cost: typeof cost === "number" ? cost : undefined,
            speed: typeof speed === "number" ? speed : undefined,
            context: typeof context === "number" ? context : undefined,
            special: specialProps.filter(
              (prop: any): prop is string => typeof prop === "string",
            ),
          };
        }
        return {
          model: modelData,
          provider: provider.display_name || provider.provider_id,
        };
      });
    });
  }, [providers]);

  // Memoize sort handler to prevent unnecessary re-renders
  const handleSort = useCallback((key: SortKey) => {
    setSortColumn((prevColumn) => {
      setSortDirection((prevDirection) => {
        if (prevColumn === key) {
          if (prevDirection === "asc") {
            return "desc";
          } else if (prevDirection === "desc") {
            setSortColumn(null);
            return null;
          } else {
            return "asc";
          }
        } else {
          return "asc";
        }
      });
      return prevColumn === key ? prevColumn : key;
    });
  }, []);

  // Memoize sorted models to avoid sorting on every render
  const sortedModels = useMemo(() => {
    if (!sortColumn || !sortDirection) return models;

    return [...models].sort((a, b) => {
      if (sortColumn === "model" || sortColumn === "provider") {
        const valueA = a[sortColumn].toLowerCase();
        const valueB = b[sortColumn].toLowerCase();
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        const valueA = a[sortColumn] ?? -1;
        const valueB = b[sortColumn] ?? -1;
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
    });
  }, [models, sortColumn, sortDirection]);

  // Memoize sort icon rendering
  const renderSortIcon = useCallback(
    (key: SortKey) => {
      if (sortColumn !== key) {
        return <ArrowUpDown className="ml-2 size-4" aria-hidden="true" />;
      }

      if (sortDirection === "asc") {
        return <ChevronUp className="ml-2 size-4" aria-hidden="true" />;
      }

      return <ChevronDown className="ml-2 size-4" aria-hidden="true" />;
    },
    [sortColumn, sortDirection],
  );

  // Memoize model name truncation
  const truncateModelName = useCallback((modelName: string) => {
    const parts = modelName.split("/");
    return parts.length > 1 ? parts[parts.length - 1] : modelName;
  }, []);

  // Memoize cost text rendering
  const getCostText = useCallback((cost?: number) => {
    if (cost === undefined) return "-";

    const icons = Array.from({ length: cost }, (_, index) => (
      <CircleDollarSign
        key={index}
        className={cn(
          "inline-block size-4",
          cost <= 2
            ? "text-green-500"
            : cost >= 4
              ? "text-destructive"
              : "text-primary",
        )}
        aria-hidden="true"
      />
    ));
    return (
      <div
        className="flex justify-center"
        role="img"
        aria-label={`Cost level: ${cost} out of 5`}
      >
        {icons}
      </div>
    );
  }, []);

  // Memoize speed text rendering
  const getSpeedText = useCallback((speed?: number) => {
    if (speed === undefined) return "-";

    const icons = Array.from({ length: speed }, (_, index) => (
      <Zap
        key={index}
        className={`inline-block size-4 ${speed >= 4
          ? "text-green-500"
          : speed <= 2
            ? "text-destructive"
            : "text-yellow-500"
          }`}
        aria-hidden="true"
      />
    ));
    return (
      <div
        className="flex justify-center"
        role="img"
        aria-label={`Speed level: ${speed} out of 5`}
      >
        {icons}
      </div>
    );
  }, []);

  // Memoize speed text rendering
  const getContextText = useCallback((context?: number) => {
    if (context === undefined) return "-";

    const parsedText = new Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
    }).format(context);

    return (
      <p
        className={cn(
          "flex justify-center",
          context < 100000
            ? "text-destructive"
            : context > 100000 && context < 150000
              ? "text-yellow-500"
              : context > 150000
                ? "text-emerald-500"
                : "text-primary",
        )}
        role="img"
        aria-label={`Context tokens limit: ${context}`}
      >
        {parsedText}
      </p>
    );
  }, []);

  // Memoize special badges rendering
  const getSpecialBadges = useCallback((special?: string[]) => {
    if (!special || special.length === 0) return "-";

    return (
      <div className="flex flex-wrap justify-center gap-2">
        {special.map((prop, index) => (
          <TooltipProvider key={`${prop}-${index}`} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help" tabIndex={0}>
                  {prop === "Reasoning" ? (
                    <Brain
                      className="size-4"
                      aria-label="Reasoning capability"
                    />
                  ) : prop === "Internet Search" ? (
                    <Globe
                      className="size-4"
                      aria-label="Internet search capability"
                    />
                  ) : (
                    <Info
                      className="size-4"
                      aria-label={`Special feature: ${prop}`}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{prop}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl"
        aria-describedby="model-help-description"
      >
        <DialogHeader>
          <DialogTitle>Available Models</DialogTitle>
          <DialogDescription
            id="model-help-description"
            className="text-foreground/80"
          >
            List of available models from different providers. Click column
            headers to sort.
          </DialogDescription>
        </DialogHeader>
        <div
          className="h-[500px] overflow-y-auto py-4"
          role="region"
          aria-label="Models table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("model")}
                    className="flex w-full font-medium"
                    aria-label={`Sort by model ${sortColumn === "model"
                      ? sortDirection === "asc"
                        ? "descending"
                        : "ascending"
                      : "ascending"
                      }`}
                  >
                    Model {renderSortIcon("model")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("provider")}
                    className="flex w-full items-center justify-center font-medium"
                    aria-label={`Sort by provider ${sortColumn === "provider"
                      ? sortDirection === "asc"
                        ? "descending"
                        : "ascending"
                      : "ascending"
                      }`}
                  >
                    Provider {renderSortIcon("provider")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("cost")}
                    className="flex w-full items-center justify-center font-medium"
                    aria-label={`Sort by cost ${sortColumn === "cost"
                      ? sortDirection === "asc"
                        ? "descending"
                        : "ascending"
                      : "ascending"
                      }`}
                  >
                    Cost {renderSortIcon("cost")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("speed")}
                    className="flex w-full items-center justify-center font-medium"
                    aria-label={`Sort by speed ${sortColumn === "speed"
                      ? sortDirection === "asc"
                        ? "descending"
                        : "ascending"
                      : "ascending"
                      }`}
                  >
                    Speed {renderSortIcon("speed")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("context")}
                    className="flex w-full items-center justify-center font-medium"
                    aria-label={`Sort by speed ${sortColumn === "speed"
                      ? sortDirection === "asc"
                        ? "descending"
                        : "ascending"
                      : "ascending"
                      }`}
                  >
                    Context {renderSortIcon("context")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex w-full items-center justify-center font-medium"
                    disabled
                    aria-label="Special features - not sortable"
                  >
                    Special
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map((model, index) => (
                <TableRow key={`${model.provider}-${model.model}-${index}`}>
                  <TableCell className="pl-6 font-medium">
                    <span title={model.model}>
                      {truncateModelName(model.model)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {model.provider}
                  </TableCell>
                  <TableCell className="text-center">
                    {getCostText(model.cost)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getSpeedText(model.speed)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getContextText(model.context)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getSpecialBadges(model.special)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelHelpDialog;

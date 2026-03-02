import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration } from "./gantt-utils";
import { SpanTreeNode } from "../trace-view.service";
import { useTraceViewStore } from "../trace-view.store";
import { getSpanDisplay } from "@/lib/span-utils";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, Activity, Layers } from "lucide-react";

interface SpanBarProps {
  span: SpanTreeNode;
  parentSpan?: SpanTreeNode | null;
  globalStart: number;
  globalSpread: number;
}

const SpanBar: React.FC<SpanBarProps> = ({
  span,
  parentSpan = null,
  globalStart,
  globalSpread,
}) => {
  const selectedSpan = useTraceViewStore((state) => state.selectedSpan);
  const hoveredSpanId = useTraceViewStore((state) => state.hoveredSpanId);

  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent
  );
  const setDetailsSheetOpen = useTraceViewStore(
    (state) => state.setDetailsSheetOpen
  );
  const isSelected = selectedSpan?.span_id === span.span_id;
  const isHovered = hoveredSpanId === span.span_id;

  const leftOffset = ((span.startTime - globalStart) * 100) / globalSpread;
  const width = (span.duration * 100) / globalSpread;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSpan(span);
    setSelectedSpanParent(parentSpan);
    setDetailsSheetOpen(true);
  };

  // Get span display info
  const agentName = span.tags?.agent_name;
  const spanDisplay = getSpanDisplay(span.span_name, agentName);
  const SpanIcon = spanDisplay.icon;

  // Determine bar color based on span type and status - using theme colors
  const getBarStyle = (): { className: string; textClassName?: string } => {
    // Red for errors
    if (span.hasError) {
      return {
        className: "bg-destructive",
      };
    }

    // Use trace-span color for both light and dark modes
    return {
      className: "bg-[hsl(var(--trace-span))]",
      textClassName: "text-white",
    };
  };

  const barStyle = getBarStyle();
  const minWidth = Math.max(0.4, width);

  // Get important tags for tooltip
  const importantTags = Object.entries(span.tags)
    .filter(([key]) =>
      ["agent_name", "model", "status", "tool_name", "query"].includes(key)
    )
    .slice(0, 4);

  return (
    <div className="relative flex h-full items-center px-1">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
              delay: 0.05,
            }}
            style={{
              left: `${leftOffset}%`,
              width: `${minWidth}%`,
              originX: 0,
            }}
            className={cn(
              "absolute h-5 rounded-md cursor-pointer border border-border/30",
              "transition-all duration-200",
              barStyle.className,
              isHovered && "brightness-110",
              isSelected && "ring-2 ring-background/50 ring-offset-1 ring-offset-background"
            )}
            onClick={handleClick}
          >
            {/* Inner highlight effect */}
            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/15 to-transparent" />

            {/* Duration text - only show if bar is wide enough */}
            {width > 3 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "text-[10px] font-semibold drop-shadow-sm tabular-nums",
                    barStyle.textClassName || "text-primary-foreground"
                  )}
                >
                  {formatDuration(span.duration)}
                </span>
              </div>
            )}

            {/* Pulse animation for active/selected state */}
            {isSelected && (
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-md",
                  barStyle.className,
                  "opacity-50"
                )}
                animate={{ opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="start"
          className="w-72 p-0 overflow-hidden bg-popover border border-border"
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded",
                  barStyle.className
                )}
              >
                <SpanIcon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {spanDisplay.name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {span.service_name}
                </div>
              </div>
              {span.hasError && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Error</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="px-3 py-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground">
                  Duration
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums">
                  {formatDuration(span.duration)}
                </div>
              </div>
            </div>
            <div className="px-3 py-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground">
                  Start Offset
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums">
                  +{formatDuration(span.startTime - globalStart)}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {importantTags.length > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1 mb-1.5">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Attributes
                </span>
              </div>
              <div className="space-y-1">
                {importantTags.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center gap-2"
                  >
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-medium text-foreground truncate max-w-[140px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events indicator */}
          {span.events.length > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Events
                </span>
                <span className="text-[10px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted">
                  {span.events.length}
                </span>
              </div>
            </div>
          )}

          {/* Click hint */}
          <div className="px-3 py-1.5 bg-muted/30">
            <span className="text-[10px] text-muted-foreground">
              Click to view details
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SpanBar;

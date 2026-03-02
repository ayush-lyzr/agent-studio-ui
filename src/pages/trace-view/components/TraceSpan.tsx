import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SpanTreeNode } from "../trace-view.service";
import { useTraceViewStore } from "../trace-view.store";
import SpanBar from "./SpanBar";
import { getSpanDisplay } from "@/lib/span-utils";
import { formatDuration } from "./gantt-utils";
import { cn } from "@/lib/utils";

interface TraceSpanProps {
  span: SpanTreeNode;
  parentSpan?: SpanTreeNode | null;
  globalStart: number;
  globalSpread: number;
  level: number;
  activeSpanPath: string[];
  isExpandAll: boolean;
  isLastChild?: boolean;
}


const SPAN_NAME_WIDTH = 280;

const TraceSpan: React.FC<TraceSpanProps> = ({
  span,
  parentSpan = null,
  globalStart,
  globalSpread,
  level,
  activeSpanPath,
  isExpandAll,
  isLastChild = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(
    activeSpanPath.includes(span.span_id)
  );

  const selectedSpan = useTraceViewStore((state) => state.selectedSpan);
  const hoveredSpanId = useTraceViewStore((state) => state.hoveredSpanId);
  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent
  );
  const setDetailsSheetOpen = useTraceViewStore(
    (state) => state.setDetailsSheetOpen
  );
  const setHoveredSpanId = useTraceViewStore((state) => state.setHoveredSpanId);

  const hasChildren = span.children.length > 0;
  const isSelected = selectedSpan?.span_id === span.span_id;
  const isHovered = hoveredSpanId === span.span_id;

  useEffect(() => {
    if (isExpandAll) {
      setIsOpen(true);
    } else {
      setIsOpen(activeSpanPath.includes(span.span_id));
    }
  }, [isExpandAll, activeSpanPath, span.span_id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = () => {
    setSelectedSpan(span);
    setSelectedSpanParent(parentSpan);
    setDetailsSheetOpen(true);
  };

  const handleMouseEnter = () => {
    setHoveredSpanId(span.span_id);
  };

  const handleMouseLeave = () => {
    setHoveredSpanId(null);
  };

  const indentWidth = level * 20;

  const panelWidth = SPAN_NAME_WIDTH - indentWidth - 12;

  // Get readable display name and icon for the span
  const agentName = span.tags?.agent_name;
  const spanDisplay = getSpanDisplay(span.span_name, agentName);
  const SpanIcon = spanDisplay.icon;

  const getIconStyle = () => {
    // Red for errors
    if (span.hasError) return "bg-destructive/15 text-destructive";

    // Use trace-span color for both light and dark modes
    return "bg-[hsl(var(--trace-span))]/15 text-[hsl(var(--trace-span))]";
  };

  return (
    <div className="relative">
      {/* Tree connector lines */}
      {level > 0 && (
        <>
          {/* Vertical line from parent */}
          {!isLastChild && (
            <div
              className="absolute top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600"
              style={{ left: `${indentWidth + 2}px` }}
            />
          )}
          {/* Horizontal connector with rounded corner */}
          <div
            className="absolute top-[18px] h-px bg-slate-300 dark:bg-slate-600"
            style={{
              left: `${indentWidth + 2}px`,
              width: "12px",
            }}
          />
          {/* Vertical line segment for this item */}
          <div
            className="absolute top-0 w-px bg-slate-300 dark:bg-slate-600"
            style={{
              left: `${indentWidth + 2}px`,
              height: "18px",
            }}
          />
        </>
      )}

      {/* Main span row */}
      <motion.div
        initial={false}
        className={cn(
          "flex cursor-pointer items-center h-9 relative group",
          "transition-colors duration-200",
          isSelected
            ? "bg-slate-100 dark:bg-slate-800/60"
            : isHovered
              ? "bg-muted/40 dark:bg-slate-800/30"
              : "hover:bg-muted/30 dark:hover:bg-slate-800/20",
          isSelected && "ring-1 ring-inset ring-slate-300 dark:ring-slate-600"
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left panel: Span name and controls */}
        <div
          className="flex items-center shrink-0 border-r border-border"
          style={{ width: `${SPAN_NAME_WIDTH}px` }}
        >
          <div
            className="flex items-center gap-1.5 overflow-hidden py-1"
            style={{
              paddingLeft: `${indentWidth + 12}px`,
              width: `${panelWidth}px`,
            }}
          >
            {/* Expand/collapse toggle */}
            {hasChildren ? (
              <motion.button
                type="button"
                onClick={handleToggle}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                  "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                  "hover:bg-slate-200 dark:hover:bg-slate-700",
                  "transition-colors duration-150"
                )}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? "Collapse children" : "Expand children"}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.div>
              </motion.button>
            ) : (
              <div className="w-5 shrink-0" />
            )}

            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                getIconStyle()
              )}
            >
              <SpanIcon className="h-3.5 w-3.5" />
            </div>

            {/* Span name */}
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  isSelected ? "text-foreground" : "text-foreground/80"
                )}
                title={`${spanDisplay.name} (${span.span_name})`}
              >
                {span.tags.name ? span.tags.name : spanDisplay.name}
              </span>

              {/* Child count badge */}
              {hasChildren && (
                <span className="shrink-0 text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {span.children.length}
                </span>
              )}
            </div>

            {/* Duration pill */}
            <div
              className={cn(
                "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums",
                span.hasError
                  ? "bg-destructive/10 text-destructive"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {formatDuration(span.duration)}
            </div>
          </div>
        </div>

        {/* Right panel: Timeline bar */}
        <div className="h-full flex-1 relative">
          {/* Grid lines for visual alignment */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 25, 50, 75, 100].map((pos) => (
              <div
                key={pos}
                className="absolute top-0 bottom-0 w-px bg-slate-200/50 dark:bg-slate-700/50"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>

          <SpanBar
            span={span}
            parentSpan={parentSpan}
            globalStart={globalStart}
            globalSpread={globalSpread}
          />
        </div>
      </motion.div>

      {/* Children with animation */}
      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative overflow-hidden"
          >
            {span.children.map((child, index) => (
              <TraceSpan
                key={child.span_id}
                span={child}
                parentSpan={span}
                globalStart={globalStart}
                globalSpread={globalSpread}
                level={level + 1}
                activeSpanPath={activeSpanPath}
                isExpandAll={isExpandAll}
                isLastChild={index === span.children.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TraceSpan;

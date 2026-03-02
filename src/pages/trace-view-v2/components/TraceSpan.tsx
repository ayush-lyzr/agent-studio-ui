import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { SpanTreeNode } from "../trace-view.service";
import { useTraceViewStore } from "../trace-view.store";
import SpanBar from "./SpanBar";
import { Button } from "@/components/ui/button";
import { getSpanDisplay } from "@/lib/span-utils";

interface TraceSpanProps {
  span: SpanTreeNode;
  parentSpan?: SpanTreeNode | null;
  globalStart: number;
  globalSpread: number;
  level: number;
  activeSpanPath: string[];
  isExpandAll: boolean;
  activeSelectedId: string;
  activeHoverId: string;
  setActiveSelectedId: (id: string) => void;
  setActiveHoverId: (id: string) => void;
  isLastChild?: boolean;
}

const SPAN_NAME_WIDTH = 300;

const TraceSpan: React.FC<TraceSpanProps> = ({
  span,
  parentSpan = null,
  globalStart,
  globalSpread,
  level,
  activeSpanPath,
  isExpandAll,
  activeSelectedId,
  activeHoverId,
  setActiveSelectedId,
  setActiveHoverId,
  isLastChild = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(
    activeSpanPath.includes(span.id),
  );
  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent,
  );
  const setDetailsSheetOpen = useTraceViewStore(
    (state) => state.setDetailsSheetOpen,
  );
  const hasChildren = span.children.length > 0;

  useEffect(() => {
    if (isExpandAll) {
      setIsOpen(true);
    } else {
      setIsOpen(activeSpanPath.includes(span.id));
    }
  }, [isExpandAll, activeSpanPath, span.id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = () => {
    setActiveSelectedId(span.id);
    setSelectedSpan(span);
    setSelectedSpanParent(parentSpan);
    setDetailsSheetOpen(true);
  };

  const handleMouseEnter = () => {
    setActiveHoverId(span.id);
  };

  const handleMouseLeave = () => {
    setActiveHoverId("");
  };

  const indentWidth = level * 45;
  const panelWidth = SPAN_NAME_WIDTH - indentWidth;

  // Get readable display name and icon for the span
  // For inference spans, pass the agent_name from tags if available
  const agentName = span.tags?.agent_name;
  const spanDisplay = getSpanDisplay(span.span_name, agentName);
  const SpanIcon = spanDisplay.icon;

  return (
    <div className="relative">
      {/* Tree structure lines */}
      {level > 0 && (
        <>
          {/* Vertical line from parent - only if not last child */}
          {!isLastChild && (
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-border"
              style={{
                left: `${indentWidth - 20}px`,
              }}
            />
          )}
          {/* Rounded corner connector */}
          <div
            className="absolute top-0 border-l border-b border-border rounded-bl-md"
            style={{
              left: `${indentWidth - 20}px`,
              width: "20px",
              height: "24px",
            }}
          />
        </>
      )}

      {/* Main span row */}
      <div
        className="flex cursor-pointer items-center h-12 relative"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left panel: Span name and service */}
        <div
          className="flex items-center overflow-hidden border-r border-border"
          style={{ width: `${SPAN_NAME_WIDTH}px` }}
        >
          <div
            className="flex items-center gap-1 overflow-hidden"
            style={{
              paddingLeft: `${indentWidth}px`,
              width: `${panelWidth}px`,
            }}
          >
            {/* Expand/collapse button */}
            {hasChildren && (
              <Button
                variant="ghost"
                onClick={handleToggle}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-secondary"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {span.children.length}
                </span>
              </Button>
            )}

            {/* Span icon and name */}
            <div className="min-w-0 flex-1 overflow-hidden px-2 flex items-center gap-2">
              <SpanIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div
                className="truncate font-semibold text-xs"
                title={`${spanDisplay.name} (${span.span_name})`}
              >
                {span.tags.name ? span.tags.name : spanDisplay.name}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: Timeline */}
        <div className="h-full flex-1 border-b border-border">
          <SpanBar
            span={span}
            parentSpan={parentSpan}
            globalStart={globalStart}
            globalSpread={globalSpread}
          />
        </div>
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="relative">
          {span.children.map((child, index) => (
            <TraceSpan
              key={child.id}
              span={child}
              parentSpan={span}
              globalStart={globalStart}
              globalSpread={globalSpread}
              level={level + 1}
              activeSpanPath={activeSpanPath}
              isExpandAll={isExpandAll}
              activeSelectedId={activeSelectedId}
              activeHoverId={activeHoverId}
              setActiveSelectedId={setActiveSelectedId}
              setActiveHoverId={setActiveHoverId}
              isLastChild={index === span.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TraceSpan;

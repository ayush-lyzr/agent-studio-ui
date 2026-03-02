import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "@/lib/store";
import { getTraceDetails, getTraceSummary } from "./trace-view.service";
import GanttChart from "./components/GanttChart";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Layers,
  GitBranch,
} from "lucide-react";
import {
  formatDuration,
  getMetadataFromSpanTree,
} from "./components/gantt-utils";
import { useTraceViewStore } from "./trace-view.store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import LogsContent from "../traces/Traces/components/LogsContent";
import type { SpanTreeNode } from "./trace-view.service";
import { Path } from "@/lib/types";
import { getSpanDisplay } from "@/lib/span-utils";
import { cn } from "@/lib/utils";
import AgentReporter from "./components/AgentReporter";
import { Badge } from "@/components/ui/badge";

type TreeNodeProps = {
  node: SpanTreeNode;
  level?: number;
  selectedSpanId?: string;
  onSpanClick?: (span: SpanTreeNode) => void;
  isLastChild?: boolean;
};

const TreeNode = ({
  node,
  level = 0,
  selectedSpanId,
  onSpanClick,
  isLastChild = false,
}: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children?.length > 0;
  const indentWidth = level * 20;

  const agentName = node.tags?.agent_name;
  const spanDisplay = getSpanDisplay(node.span_name, agentName);
  const SpanIcon = spanDisplay.icon;

  const isSelected = selectedSpanId === node.span_id;

  return (
    <div className="relative">
      {/* Tree structure lines */}
      {level > 0 && (
        <>
          {!isLastChild && (
            <div
              className="absolute top-0 bottom-0 w-px bg-border/40"
              style={{ left: `${indentWidth - 8}px` }}
            />
          )}
          <div
            className="absolute top-[16px] h-px bg-border/40"
            style={{
              left: `${indentWidth - 8}px`,
              width: "8px",
            }}
          />
          <div
            className="absolute top-0 w-px bg-border/40"
            style={{
              left: `${indentWidth - 8}px`,
              height: "16px",
            }}
          />
        </>
      )}

      {/* Main row */}
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isSelected
            ? "hsl(var(--primary) / 0.1)"
            : "transparent",
        }}
        transition={{ duration: 0.15 }}
        className={cn(
          "flex items-center h-8 cursor-pointer hover:bg-muted/50 transition-colors relative select-none rounded-md mx-1",
          isSelected && "ring-1 ring-primary/30"
        )}
        style={{ paddingLeft: `${indentWidth}px` }}
        onClick={() => onSpanClick?.(node)}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            aria-label={isOpen ? "Collapse children" : "Expand children"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          </button>
        )}

        {!hasChildren && <div className="w-5 shrink-0" />}

        {/* Span icon and name */}
        <div className="min-w-0 flex-1 flex items-center gap-2 px-1.5">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded",
              node.hasError
                ? "bg-red-500/10 text-red-500"
                : "bg-muted/60 text-muted-foreground"
            )}
          >
            <SpanIcon className="h-3 w-3" />
          </div>
          <span
            className="truncate text-xs font-medium"
            title={`${spanDisplay.name} (${node.span_name})`}
          >
            {node.tags?.name || spanDisplay.name}
          </span>
          {hasChildren && (
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="whitespace-nowrap text-[10px] font-medium text-muted-foreground pr-2 tabular-nums">
          {formatDuration(node.duration)}
        </div>
      </motion.div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="relative">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.span_id}
              node={child}
              level={level + 1}
              selectedSpanId={selectedSpanId}
              onSpanClick={onSpanClick}
              isLastChild={index === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to flatten span tree
const flattenSpanTree = (node: SpanTreeNode): SpanTreeNode[] => {
  const result: SpanTreeNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenSpanTree(child));
  }
  return result;
};

const TraceView = () => {
  const navigate = useNavigate();
  const apiKey = useStore((store) => store.api_key);
  const { traceId } = useParams();
  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent
  );
  const selectedSpan = useTraceViewStore((state) => state.selectedSpan);
  const isDetailsSheetOpen = useTraceViewStore(
    (state) => state.isDetailsSheetOpen
  );
  const setDetailsSheetOpen = useTraceViewStore(
    (state) => state.setDetailsSheetOpen
  );

  const { data, loading, error } = getTraceDetails(apiKey, traceId || "");
  const { data: summary, loading: summaryLoading } = getTraceSummary(
    apiKey,
    traceId || ""
  );
  const timeLineData = getMetadataFromSpanTree(data?.span_tree);

  // Flatten span tree for the logs panel
  const allSpans = useMemo(() => {
    if (data?.span_tree) {
      return flattenSpanTree(data.span_tree);
    }
    return [];
  }, [data?.span_tree]);

  // Set root span as default when data loads
  useEffect(() => {
    if (data?.span_tree) {
      setSelectedSpan(data.span_tree);
      setSelectedSpanParent(null);
    }
  }, [data, setSelectedSpan, setSelectedSpanParent]);

  if (loading || summaryLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-full w-full p-6"
      >
        <div className="text-destructive">
          Error loading trace details: {error.message}
        </div>
      </motion.div>
    );
  }

  if (!data || !data.span_tree) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-full w-full p-6"
      >
        <div className="text-muted-foreground">No trace data found</div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex w-full flex-col space-y-5 p-6"
      >
        <div className="flex flex-col gap-5">
          {/* Agent Reporter - Summary Card */}
          <AgentReporter
            summary={summary}
            spanTree={data.span_tree}
            startTime={data.start_time}
            onBack={() => {
              // Preserve search params when navigating back to traces list
              const searchParams = new URLSearchParams(window.location.search);
              const tracesUrl = searchParams.toString()
                ? `${Path.TRACES}?${searchParams.toString()}`
                : Path.TRACES;
              navigate(tracesUrl);
            }}
          />

          {/* Timeline Section */}
          <div className="flex flex-col">
            {/* Timeline Header */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <GitBranch className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Trace Timeline</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      <Layers className="h-2.5 w-2.5 mr-1" />
                      {timeLineData.totalSpans} spans
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {timeLineData.levels} levels deep
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsSheetOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Layers className="h-3.5 w-3.5" />
                View Logs
              </Button>
            </div>

            {/* Gantt Chart */}
            <div>
              <GanttChart data={data.span_tree} isExpandAll={true} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent className="w-full overflow-hidden sm:max-w-6xl p-0 bg-background">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-lg text-foreground">Detailed Logs</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Explore the detailed execution logs and events for this trace
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-[calc(100vh-120px)] flex-row">
            {/* Left Panel - Span Tree */}
            <div className="w-80 shrink-0 border-r border-border bg-background flex flex-col">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Trace Timeline</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {data?.span_tree ? (
                  <TreeNode
                    node={data.span_tree}
                    selectedSpanId={selectedSpan?.span_id}
                    onSpanClick={(span) => {
                      setSelectedSpan(span);
                      setSelectedSpanParent(null);
                      const findParent = (
                        node: SpanTreeNode,
                        targetId: string,
                        parent: SpanTreeNode | null = null
                      ): SpanTreeNode | null => {
                        if (node.span_id === targetId) return parent;
                        for (const child of node.children) {
                          const found = findParent(child, targetId, node);
                          if (found !== null) return found;
                        }
                        return null;
                      };
                      if (data?.span_tree) {
                        const parent = findParent(data.span_tree, span.span_id);
                        setSelectedSpanParent(parent);
                      }
                    }}
                  />
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    No spans available
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Span Details */}
            <div className="flex-1 bg-background overflow-hidden">
              <LogsContent
                activities={allSpans}
                isFetchingActivities={false}
                selectedSpanId={selectedSpan?.span_id}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TraceView;

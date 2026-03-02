import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "@/lib/store";
import { getTraceDetails, getTraceSummary } from "./trace-view.service";
import GanttChart from "./components/GanttChart";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  formatDuration,
  getMetadataFromSpanTree,
} from "./components/gantt-utils";
import { useTraceViewStore } from "./trace-view.store";
import SpanDetails from "./components/SpanDetails";
import type { SpanTreeNode } from "./trace-view.service";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Path } from "@/lib/types";

type TreeNodeProps = {
  node: SpanTreeNode;
  level?: number;
};

const TreeNode = ({ node, level = 0 }: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children?.length > 0;
  const paddingLeft = level * 40;

  return (
    <div>
      <div
        className="flex items-center border-b border-border py-1"
        style={{ paddingLeft }}
      >
        {hasChildren && (
          <Button
            type="button"
            variant="ghost"
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-secondary"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            aria-label={isOpen ? "Collapse children" : "Expand children"}
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span className="ml-1 text-[10px] text-muted-foreground">
              {node.children.length}
            </span>
          </Button>
        )}
        <div className="min-w-0 flex-1 px-2">
          <div
            className="truncate text-sm font-semibold"
            title={node.span_name}
          >
            {node.span_name}
          </div>
          <div
            className="truncate text-xs text-muted-foreground"
            title={node.service_name}
          >
            {node.service_name}
          </div>
        </div>
        <div className="whitespace-nowrap text-xs font-medium text-muted-foreground">
          {formatDuration(node.duration)}
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="relative">
          <div
            className="absolute bottom-0 top-0 w-[1px] bg-border"
            style={{ left: `${paddingLeft + 10}px` }}
          />
          <div className="space-y-1">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TraceView = () => {
  const navigate = useNavigate();
  const apiKey = useStore((store) => store.api_key);
  const { traceId } = useParams();
  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent,
  );

  const [isExpandAll, setIsExpandAll] = useState<boolean>(true);

  const { data, loading, error } = getTraceDetails(apiKey, traceId || "");
  const { data: summary, loading: summaryLoading } = getTraceSummary(
    apiKey,
    traceId || "",
  );
  const timeLineData = getMetadataFromSpanTree(data?.span_tree);
  // Set root span as default when data loads
  useEffect(() => {
    if (data?.span_tree) {
      setSelectedSpan(data.span_tree);
      setSelectedSpanParent(null);
    }
  }, [data, setSelectedSpan, setSelectedSpanParent]);

  const handleExpandAll = () => {
    setIsExpandAll(!isExpandAll);
  };

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full overflow-hidden"
    >
      {/* Left Side - Main Content (70%) */}
      <div className="flex w-[70%] flex-col space-y-4 overflow-auto p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(Path.TRACES)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {data.span_tree?.tags.agent_name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="success" className="capitalize">
              {data.span_tree.tags.status}
            </Badge>
            <div className="text-sm">
              <span className="text-muted-foreground">Start: </span>
              <span className="font-mono text-xs">
                {new Date(data.start_time).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-row gap-4">
            <div className="w-full rounded-lg border border-border bg-card p-4 text-muted-foreground">
              <p className="mb-3 font-semibold text-foreground">
                Agent Information
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Agent Name:</span>
                  <span className="text-foreground">
                    {summary?.agent_name || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Agent ID:</span>
                  <span className="font-mono text-xs text-foreground">
                    {summary?.agent_id || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">LLM Provider:</span>
                  <span className="text-foreground">
                    {summary?.llm_provider || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">LLM Model:</span>
                  <span className="text-foreground">
                    {summary?.llm_model || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Duration:</span>
                  <span className="text-foreground">
                    {formatDuration(summary?.total_duration_ms || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full rounded-lg border border-border bg-card p-4 text-muted-foreground">
              <p className="mb-3 font-semibold text-foreground">
                Token & Tool Metrics
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Input Tokens:</span>
                  <span className="text-foreground">
                    {summary?.total_input_tokens?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Output Tokens:</span>
                  <span className="text-foreground">
                    {summary?.total_output_tokens?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Total Tokens:</span>
                  <span className="text-foreground">
                    {summary?.total_tokens?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Total Cost:</span>
                  <span className="text-foreground">
                    ${summary?.total_cost?.toFixed(4) || "0.0000"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Tool Calls:</span>
                  <span className="text-foreground">
                    {summary?.tool_call_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Trace Timeline</p>
                <div className="text-xs text-muted-foreground">
                  {timeLineData.totalSpans} spans · {timeLineData.levels} levels
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="h-7 gap-1"
              >
                {isExpandAll ? (
                  <>
                    <Minimize2 className="h-3 w-3" />
                    <span className="text-xs">Collapse All</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3 w-3" />
                    <span className="text-xs">Expand All</span>
                  </>
                )}
              </Button>
            </div>
            <GanttChart data={data.span_tree} isExpandAll={isExpandAll} />
          </div>
        </div>
      </div>

      {/* Right Side - Span Details (30%) */}
      <div className="w-[30%] overflow-hidden p-6 pl-0">
        <SpanDetails />
      </div>
    </motion.div>
  );
};

export default TraceView;

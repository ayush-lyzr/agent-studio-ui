import React, { useEffect, useState, useRef } from "react";
import { useWorkflow } from "@/contexts/WorkflowContext";
import {
  ZoomIn,
  ZoomOut,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskNode {
  taskName: string;
  startTime: number;
  endTime?: number;
  status: "started" | "completed" | "failed";
  id: string;
  dependencies: string[];
  message?: string;
  details?: any;
}

interface TimelineMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageDuration: number;
}

interface TimelineViewProps { }

const TimelineView: React.FC<TimelineViewProps> = () => {
  const { taskExecutions } = useWorkflow();
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [taskNodes, setTaskNodes] = useState<TaskNode[]>([]);
  const [timeRange, setTimeRange] = useState<{
    minTime: number;
    maxTime: number;
    totalDuration: number;
  }>({
    minTime: 0,
    maxTime: 0,
    totalDuration: 0,
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [metrics, setMetrics] = useState<TimelineMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageDuration: 0,
  });
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {},
  );

  // Toggle expanded state for a task node
  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Get appropriate icon for event type
  const getEventIcon = (status: string) => {
    switch (status) {
      case "started":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Build task nodes and identify dependencies
  useEffect(() => {
    if (Object.keys(taskExecutions).length === 0) return;

    // First, collect all task executions into nodes
    const nodes: TaskNode[] = [];
    const executionMap = new Map<string, TaskNode>();

    // Build nodes for each task
    Object.entries(taskExecutions).forEach(([taskName, executions]) => {
      executions.forEach((exec) => {
        const node: TaskNode = {
          taskName,
          startTime: exec.startTime ?? Date.now(),
          endTime: exec.endTime,
          status: exec.endTime
            ? exec.status === "completed"
              ? "completed"
              : "failed"
            : "started",
          id: exec.id,
          dependencies: [],
          // Safely access properties that might not exist on the TaskExecution interface
          message: (exec as any).message,
          details: (exec as any).details,
        };
        nodes.push(node);
        executionMap.set(exec.id, node);
      });
    });

    // Calculate dependencies based on start times
    nodes.sort((a, b) => a.startTime - b.startTime);

    // Calculate time range
    if (nodes.length > 0) {
      const minTime = Math.min(...nodes.map((n) => n.startTime));
      const maxTime = Math.max(...nodes.map((n) => n.endTime || Date.now()));
      setTimeRange({
        minTime,
        maxTime,
        totalDuration: maxTime - minTime,
      });
    }

    // Calculate metrics
    const completedTasks = nodes.filter((n) => n.status === "completed").length;
    const failedTasks = nodes.filter((n) => n.status === "failed").length;
    const durations = nodes
      .filter((n) => n.endTime)
      .map((n) => (n.endTime as number) - n.startTime);

    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length
        : 0;

    setMetrics({
      totalTasks: nodes.length,
      completedTasks,
      failedTasks,
      averageDuration: avgDuration,
    });

    setTaskNodes(nodes);
  }, [taskExecutions]);

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  // Convert timestamp to timeline position
  const getTimePosition = (time: number): string => {
    if (timeRange.totalDuration === 0) return "0%";
    const percentage =
      ((time - timeRange.minTime) / timeRange.totalDuration) * 100;
    return `${percentage}%`;
  };

  // Format time difference as a readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  // Format timestamp as readable date/time
  const formatTimestamp = (timestamp: number): string => {
    return format(new Date(timestamp), "HH:mm:ss.SSS");
  };

  // Timeline scale marks
  const getTimeMarks = () => {
    if (timeRange.totalDuration === 0) return [];

    const markCount = 5;
    const interval = timeRange.totalDuration / markCount;

    return Array.from({ length: markCount + 1 }, (_, i) => {
      const time = timeRange.minTime + interval * i;
      const align = i === 0 ? "left" : i === markCount ? "right" : "center";
      return {
        time,
        position: getTimePosition(time),
        align,
        label:
          i === 0
            ? "Start"
            : i === markCount
              ? "End"
              : formatDuration(time - timeRange.minTime),
      };
    });
  };

  if (Object.keys(taskExecutions).length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No execution data available
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-2">
      {/* Timeline controls */}
      <div className="mb-4 flex items-center justify-between rounded-md bg-accent px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="w-32">
            <Slider
              value={[zoomLevel]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={handleZoomChange}
            />
          </div>

          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Completed: {metrics.completedTasks}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span>
              Running:{" "}
              {metrics.totalTasks -
                metrics.completedTasks -
                metrics.failedTasks}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Failed: {metrics.failedTasks}</span>
          </div>
          <div className="border-l pl-2">
            <span>Avg Duration: {formatDuration(metrics.averageDuration)}</span>
          </div>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="flex-1 overflow-hidden" ref={timelineContainerRef}>
        {/* Time scale */}
        <div className="relative mb-2 h-6 border-b">
          {getTimeMarks().map((mark, i) => (
            <div
              key={i}
              className={cn(
                "absolute top-0 transform",
                mark.align === "center" && "-translate-x-1/2",
                mark.align === "left" && "translate-x-0",
                mark.align === "right" && "-translate-x-full",
              )}
              style={{ left: mark.position }}
            >
              <div className="mx-auto h-2 w-0.5 bg-gray-300"></div>
              <div className="text-xs">{mark.label}</div>
            </div>
          ))}
        </div>

        {/* Timeline tasks */}
        <div
          className="space-y-1 overflow-y-auto pb-4"
          style={{ maxHeight: "calc(100% - 2rem)" }}
        >
          {taskNodes.map((node) => {
            const isExpanded = expandedEvents[node.id] || false;
            const startPosition = getTimePosition(node.startTime);
            const endPosition = node.endTime
              ? getTimePosition(node.endTime)
              : "100%";
            const duration = node.endTime
              ? formatDuration(node.endTime - node.startTime)
              : "Running...";

            const width = node.endTime
              ? `calc(${endPosition} - ${startPosition})`
              : `calc(100% - ${startPosition})`;

            // Determine status colors
            let bgColor;
            switch (node.status) {
              case "completed":
                bgColor = "bg-success-background border-green-300 text-success";
                break;
              case "failed":
                bgColor = "bg-red-100 border-red-300";
                break;
              default:
                bgColor = "bg-blue-100 border-blue-300";
                break;
            }

            return (
              <div key={node.id} className="relative mb-1 h-12">
                <div
                  className="absolute top-1/2 h-8 -translate-y-1/2 transform rounded-md border"
                  style={{
                    left: startPosition,
                    width,
                    minWidth: "50px",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => toggleEvent(node.id)}
                >
                  <div
                    className={`flex h-full cursor-pointer items-center justify-between rounded-md px-2 py-1 ${bgColor}`}
                    style={{ width: "100%" }}
                  >
                    <div className="flex items-center truncate">
                      {getEventIcon(node.status)}
                      <span className="ml-2 truncate font-medium">
                        {node.taskName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 whitespace-nowrap text-xs">
                      <span>{duration}</span>
                      {node.message &&
                        (isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        ))}
                    </div>
                  </div>
                </div>

                {/* Event details when expanded */}
                {isExpanded && node.message && (
                  <div
                    className="absolute z-10 w-full max-w-md rounded-md border bg-white p-3 text-sm shadow-lg"
                    style={{
                      top: "100%",
                      left: startPosition,
                      marginTop: "0.5rem",
                    }}
                  >
                    <div className="mb-2">
                      <span className="text-gray-500">Start: </span>
                      <span>{formatTimestamp(node.startTime)}</span>
                    </div>
                    {node.endTime && (
                      <div className="mb-2">
                        <span className="text-gray-500">End: </span>
                        <span>{formatTimestamp(node.endTime)}</span>
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="text-gray-500">Message: </span>
                      <span>{node.message}</span>
                    </div>
                    {node.details && (
                      <div>
                        <span className="text-gray-500">Details: </span>
                        <pre className="mt-1 overflow-auto rounded bg-gray-50 p-2 text-xs">
                          {JSON.stringify(node.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;

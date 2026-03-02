import React, { useEffect, useState, useRef } from "react";
import {
  getWebSocketUrl,
  WS_CONNECTION_TIMEOUT,
} from "@/services/workflowService";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Logs,
  ChevronUp,
  ChevronDown,
  Clock,
  ChevronRight,
  FileOutput,
} from "lucide-react";
import { useWorkflow, TaskExecution } from "@/contexts/WorkflowContext";
import TimelineView from "./TimelineView";
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from "@/components/custom/markdown";
import { toast } from "sonner";

interface WorkflowEventsProps {
  flowName: string;
  runName: string;
  isRunning: boolean;
}

interface LogEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  task?: string;
  level?: "info" | "error" | "warning" | "debug";
  event_type?: string;
  task_name?: string;
  flow_name?: string;
  run_name?: string;
  task_id?: string;
  output?: any;
}

// List of event types to ignore
const IGNORED_EVENT_TYPES = ["keepalive", "ping", "pong"];

// Loading dots animation component
const LoadingDots = () => {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="animate-pulse">{".".repeat(dots)}</span>;
};

// Check if this message should show the loading animation
const shouldShowLoadingAnimation = (message: string) => {
  return message.includes(
    "Workflow execution started. Connecting to execution server",
  );
};

// Render message text with potential loading animation
const renderMessageText = (message: string) => {
  if (shouldShowLoadingAnimation(message)) {
    // Split the message to place the animation at the end
    const baseMessage =
      "Workflow execution started. Connecting to execution server";
    return (
      <>
        {baseMessage}
        <LoadingDots />
      </>
    );
  }
  return message;
};

const WorkflowEvents: React.FC<WorkflowEventsProps> = ({
  flowName,
  runName,
  isRunning,
}) => {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("logs");
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [collapsedEvents, setCollapsedEvents] = useState<
    Record<string, boolean>
  >({});
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const [outputCollapsed, setOutputCollapsed] = useState<
    Record<string, boolean>
  >({});
  const maxRetries = 3; // Maximum number of reconnection attempts
  const wsRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialConnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setTaskActive,
    clearActiveTasks,
    clearTaskExecutions,
    addTaskExecution,
  } = useWorkflow();

  // Process event to update active tasks in the workflow
  const processWorkflowEvent = (data: any) => {
    if (!data.event_type || !data.task_name) return;

    // Create task execution record
    if (
      data.event_type === "task_started" ||
      data.event_type === "task_completed" ||
      data.event_type === "task_failed"
    ) {
      const execution: TaskExecution = {
        id: data.task_id || `${data.task_name}-${Date.now()}`,
        taskName: data.task_name,
        status:
          data.event_type === "task_started"
            ? "started"
            : data.event_type === "task_completed"
              ? "completed"
              : "failed",
        startTime:
          data.event_type === "task_started" ? data.timestamp : undefined,
        endTime:
          data.event_type === "task_completed" ||
          data.event_type === "task_failed"
            ? data.timestamp
            : undefined,
        eventType: data.event_type,
      };

      addTaskExecution(execution);
    }

    // Update task state based on event type
    if (data.event_type === "task_started") {
      setTaskActive(data.task_name, true);
    } else if (
      data.event_type === "task_completed" ||
      data.event_type === "task_failed"
    ) {
      setTaskActive(data.task_name, false);
    } else if (data.event_type === "flow_completed") {
      clearActiveTasks(); // Only reset active tasks, not the task execution history
    }
  };

  // Filter function to remove unwanted events
  const shouldShowEvent = (event: any): boolean => {
    // Skip keepalive, ping/pong messages
    if (IGNORED_EVENT_TYPES.includes(event.event_type)) return false;

    // Skip echoing messages
    if (
      typeof event.message === "string" &&
      event.message.startsWith("Echoing:")
    )
      return false;

    // Skip connection messages
    if (
      event.type === "system" &&
      (event.message?.includes("Connected to workflow") ||
        event.message?.includes("WebSocket connection established"))
    ) {
      return false;
    }

    return true;
  };

  // Clean up WebSocket resources
  const cleanupWebSocket = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

    if (initialConnectTimeoutRef.current) {
      clearTimeout(initialConnectTimeoutRef.current);
      initialConnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    setConnected(false);
    setIsConnecting(false);
  };

  // Function to create WebSocket connection - now with retry capability
  const connectWebSocket = (retryAttempt = 0) => {
    // Don't connect if already connecting or already connected
    if (
      isConnecting ||
      (connected && wsRef.current?.readyState === WebSocket.OPEN)
    ) {
      console.log(
        "WebSocket already connected or connecting, skipping new connection",
      );
      return;
    }

    // Clean up any existing connection first
    cleanupWebSocket();

    // Set is connecting state
    setIsConnecting(true);

    const wsUrl = getWebSocketUrl(flowName, runName);
    console.log(
      `Connecting to WebSocket: ${wsUrl} (Attempt: ${retryAttempt + 1}/${maxRetries + 1})`,
    );

    // Add a connecting message
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "system",
        message: `Connecting to workflow execution server${retryAttempt > 0 ? ` (Attempt ${retryAttempt + 1}/${maxRetries + 1})` : ""}...`,
        level: "info",
      },
    ]);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Add connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log("WebSocket connection timeout");

          setEvents((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "error",
              message: "WebSocket connection timed out after 15 seconds",
              level: "warning",
            },
          ]);

          cleanupWebSocket();
        }
      }, WS_CONNECTION_TIMEOUT);

      ws.onopen = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        console.log("WebSocket connected");
        setConnected(true);
        setIsConnecting(false);

        // Setup keep-alive interval
        keepAliveIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
            console.log("Sent ping to keep connection alive");
          }
        }, 30000); // Send ping every 30 seconds

        // Add system message about successful connection
        setEvents((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "system",
            message: "WebSocket connection established successfully",
            level: "info",
          },
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Update active tasks in the workflow
          processWorkflowEvent(data);

          if (data.event_type === "flow_completed" && data.output) {
            cleanupWebSocket();
            setFinalOutput(data.output);
            setActiveTab("output");
            toast.success("Workflow execution complete!");
          }

          // Only add message to UI if it passes our filter
          if (shouldShowEvent(data)) {
            setEvents((prev) => [
              ...prev,
              {
                id: data.id || data.task_id || Date.now().toString(),
                timestamp: data.timestamp
                  ? new Date(data.timestamp * 1000).toISOString()
                  : new Date().toISOString(),
                type: data.event_type || "unknown",
                message:
                  typeof data.output === "string"
                    ? data.output
                    : JSON.stringify(data, null, 2),
                task: data.task_name,
                level:
                  data.event_type?.includes("error") ||
                  data.event_type?.includes("failed")
                    ? "error"
                    : "info",
                output: data.output,
                ...data,
              },
            ]);
          }
        } catch (error) {
          // Handle plain text messages
          const message = event.data;
          // Only add non-echoing, non-connection messages
          if (
            !message.includes("Echoing:") &&
            !message.includes("connection established")
          ) {
            setEvents((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                type: "raw",
                message: event.data,
                level: "info",
              },
            ]);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);

        // Clean up any existing timeouts
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setEvents((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "error",
            message: "WebSocket connection error",
            level: "error",
          },
        ]);

        cleanupWebSocket();
      };

      ws.onclose = (event) => {
        console.log(
          `WebSocket closed with code ${event.code}. Clean: ${event.wasClean}`,
        );

        // Only show closing message if this wasn't triggered by a retry
        setEvents((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "system",
            message: `Disconnected from the execution server. ${retryAttempt < maxRetries ? "Attempting to reconnect..." : ""}`,
            level: "warning",
          },
        ]);

        cleanupWebSocket();

        // Attempt to reconnect if we haven't hit the max retry count
        // Use exponential backoff for retry timing (1s, 2s, 4s, etc.)
        if (retryAttempt < maxRetries && isRunning) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
          console.log(`Scheduling reconnection attempt in ${retryDelay}ms`);

          setTimeout(() => {
            if (isRunning) {
              // Double-check we're still running before reconnecting
              connectWebSocket(retryAttempt + 1);
            }
          }, retryDelay);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);

      setEvents((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: "error",
          message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`,
          level: "error",
        },
      ]);

      cleanupWebSocket();
    }
  };

  // Function to connect WebSocket and return a promise
  const connectWebSocketAsync = async (): Promise<boolean> => {
    // If already connected, return immediately
    if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected, returning success");
      return Promise.resolve(true);
    }

    // If already connecting, wait for that connection to complete
    if (isConnecting) {
      console.log("WebSocket already connecting, waiting for result");
      return new Promise<boolean>((resolve) => {
        // Create an interval to check connection status
        const checkInterval = setInterval(() => {
          if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (
            !isConnecting &&
            (!connected || wsRef.current?.readyState !== WebSocket.OPEN)
          ) {
            // If no longer connecting but still not connected, connection failed
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 500);

        // Set a timeout in case the connection attempt hangs
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, WS_CONNECTION_TIMEOUT);
      });
    }

    console.log("Initiating new WebSocket connection asynchronously");
    // Add a connecting message
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "system",
        message: "Connecting to workflow execution server...",
        level: "info",
      },
    ]);

    return new Promise<boolean>((resolve) => {
      // Clean up any existing connection first
      cleanupWebSocket();

      // Set is connecting state
      setIsConnecting(true);

      const wsUrl = getWebSocketUrl(flowName, runName);
      console.log(`Connecting to WebSocket: ${wsUrl}`);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Add connection timeout
        const timeoutId = setTimeout(() => {
          console.log("WebSocket connection timeout");
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "error",
              message: "WebSocket connection timed out after 15 seconds",
              level: "warning",
            },
          ]);

          cleanupWebSocket();
          resolve(false);
        }, WS_CONNECTION_TIMEOUT);

        ws.onopen = () => {
          clearTimeout(timeoutId);

          console.log("WebSocket connected");
          setConnected(true);
          setIsConnecting(false);

          // Setup keep-alive interval
          keepAliveIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
              console.log("Sent ping to keep connection alive");
            }
          }, 30000); // Send ping every 30 seconds

          // Add system message about successful connection
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "system",
              message: "WebSocket connection established successfully",
              level: "info",
            },
          ]);

          resolve(true);
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutId);

          console.error("WebSocket error:", error);
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "error",
              message: "WebSocket connection error",
              level: "error",
            },
          ]);

          cleanupWebSocket();
          resolve(false);
        };

        ws.onclose = (event) => {
          clearTimeout(timeoutId);

          console.log(
            `WebSocket closed with code ${event.code}. Clean: ${event.wasClean}`,
          );
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "system",
              message: `Flow Completed`,
              level: "warning",
            },
          ]);

          cleanupWebSocket();
          resolve(false);
        };

        // Setup message handlers (same as in connectWebSocket)
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Update active tasks in the workflow
            processWorkflowEvent(data);

            // Store final output when workflow completes
            if (data.event_type === "flow_completed" && data.output) {
              cleanupWebSocket();
              setFinalOutput(data.output);
              // Switch to output tab when flow completes
              setActiveTab("output");
              toast.success("Workflow execution complete!");
            }

            // Only add message to UI if it passes our filter
            if (shouldShowEvent(data)) {
              setEvents((prev) => [
                ...prev,
                {
                  id: data.id || data.task_id || Date.now().toString(),
                  timestamp: data.timestamp
                    ? new Date(data.timestamp * 1000).toISOString()
                    : new Date().toISOString(),
                  type: data.event_type || "unknown",
                  message:
                    typeof data.output === "string"
                      ? data.output
                      : JSON.stringify(data, null, 2),
                  task: data.task_name,
                  level:
                    data.event_type?.includes("error") ||
                    data.event_type?.includes("failed")
                      ? "error"
                      : "info",
                  output: data.output,
                  ...data,
                },
              ]);
            }
          } catch (error) {
            // Handle plain text messages
            const message = event.data;
            // Only add non-echoing, non-connection messages
            if (
              !message.includes("Echoing:") &&
              !message.includes("connection established")
            ) {
              setEvents((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  timestamp: new Date().toISOString(),
                  type: "raw",
                  message: event.data,
                  level: "info",
                },
              ]);
            }
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setEvents((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "error",
            message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`,
            level: "error",
          },
        ]);

        cleanupWebSocket();
        resolve(false);
      }
    });
  };

  // Create a function to disconnect any active WebSocket connection and reset all states
  const disconnectWebSocket = async (): Promise<boolean> => {
    try {
      console.log(
        "Disconnecting WebSocket connection and resetting all states...",
      );

      // First clean up WebSocket resources
      cleanupWebSocket();

      // Clear all events, active tasks, and executions
      clearEvents();

      // Reset connection states
      setConnected(false);
      setIsConnecting(false);
      setActiveTab("logs"); // Reset to logs tab
      setFinalOutput(null);

      // Add a disconnection message
      setEvents([
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: "system",
          message:
            "Reset all connection states and prepared for new workflow run",
          level: "info",
        },
      ]);

      return true;
    } catch (error) {
      console.error(
        "Error disconnecting WebSocket and resetting states:",
        error,
      );
      return false;
    }
  };

  // Function to clear all workflow events
  const clearWorkflowEvents = () => {
    console.log("Clearing all workflow events...");
    setEvents([]);
    setFinalOutput(null);
    setCollapsedEvents({});
    setOutputCollapsed({});
    clearTaskExecutions();
    // Don't disconnect the WebSocket, but add a message that events were cleared
    setEvents([
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "system",
        message:
          "Previous workflow events have been cleared. Ready for new workflow execution.",
        level: "info",
      },
    ]);
    return true;
  };

  // Expose the connect, disconnect, and clear events functions for external access
  React.useEffect(() => {
    // Make all necessary functions available globally
    if (window) {
      (window as any).connectWorkflowWebSocket = connectWebSocketAsync;
      (window as any).disconnectWorkflowWebSocket = disconnectWebSocket;
      (window as any).clearWorkflowEvents = clearWorkflowEvents;
    }

    return () => {
      // Cleanup when component unmounts
      if (window) {
        if ((window as any).connectWorkflowWebSocket) {
          delete (window as any).connectWorkflowWebSocket;
        }
        if ((window as any).disconnectWorkflowWebSocket) {
          delete (window as any).disconnectWorkflowWebSocket;
        }
        if ((window as any).clearWorkflowEvents) {
          delete (window as any).clearWorkflowEvents;
        }
      }
    };
  }, [flowName, runName]); // Re-initialize when flow or run name changes

  // Modified useEffect for immediate connection when isRunning changes to true
  useEffect(() => {
    console.log("WorkflowEvents useEffect - isRunning:", isRunning);

    // When workflow starts running
    if (isRunning) {
      // Clear all previous events when a new run starts
      clearEvents();

      // Open panel automatically
      if (!isOpen) {
        setIsOpen(true);
      }
      // Add a message about initializing
      setEvents((prev) => {
        // Only add the initialization message if it doesn't already exist
        if (
          !prev.some((e) => e.message?.includes("Workflow execution started"))
        ) {
          return [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: "system",
              message:
                "Workflow execution started. Connecting to execution server...",
              level: "info",
            },
          ];
        }
        return prev;
      });

      // Only attempt to connect if not already connected
      if (
        !connected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        console.log("Initiating WebSocket connection due to workflow run");
        // Add a small delay to ensure the backend is ready to accept connections
        setTimeout(() => {
          connectWebSocket();
        }, 2000); // Increased from 2000ms to 5000ms
      } else {
        console.log("WebSocket already connected, no need to reconnect");
      }
    }

    return () => {
      // Only clean up when component unmounts, not when isRunning changes
      if (!isRunning) {
        console.log(
          "Component unmounting or workflow stopped, cleaning up WebSocket",
        );
      }
    };
  }, [flowName, runName, isRunning, connected, isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current && events.length > 0 && shouldScrollRef.current) {
      const scrollElement = scrollAreaRef.current;
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 50); // Small delay to ensure DOM update is complete
    }
  }, [events]);

  // Handle scroll to detect if user has manually scrolled up
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    // If user scrolls up more than 100px from bottom, disable auto-scroll
    // Re-enable when they scroll back to bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldScrollRef.current = isNearBottom;
  };

  const formatTime = (timestamp: string | number) => {
    try {
      let date: Date;
      if (typeof timestamp === "number") {
        date = new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  // Clear all events
  const clearEvents = () => {
    setEvents([]);
    // Also reset any collapsed states
    setCollapsedEvents({});
    setOutputCollapsed({});
    // Clear timeline data
    clearTaskExecutions();
    // Clear active tasks
    clearActiveTasks();
    // Clear final output
    setFinalOutput(null);
    setActiveTab("logs");
  };

  // Function to manually connect the WebSocket
  const handleConnect = () => {
    // Don't attempt if already connecting or connected
    if (isConnecting || connected) {
      return;
    }

    // Add message about manual connection
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "system",
        message: "Manual connection initiated...",
        level: "info",
      },
    ]);

    // Attempt connection
    connectWebSocket();
  };

  // Toggle event collapse state
  const toggleEventCollapse = (eventId: string) => {
    setCollapsedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Toggle output field collapse state
  const toggleOutputCollapse = (key: string) => {
    setOutputCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Check if an event should be collapsible
  const isEventCollapsible = (event: LogEvent) => {
    return (
      event.event_type === "flow_completed" ||
      event.event_type === "task_started"
    );
  };

  // Check if an event is collapsed
  const isEventCollapsed = (event: LogEvent) => {
    // Only flow_completed and task_started events can be collapsed
    if (!isEventCollapsible(event)) {
      return false; // Non-collapsible events are always shown
    }
    return !!collapsedEvents[event.id];
  };

  // Visual indicator for collapsible events
  const showCollapseIndicator = (event: LogEvent) => {
    return isEventCollapsible(event);
  };

  return (
    <div className="fixed bottom-0 right-0 z-10 w-full max-w-4xl shadow-lg">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="overflow-hidden rounded-t-lg border bg-white dark:bg-gray-800"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
          <div className="flex items-center space-x-2">
            <Logs className="h-4 w-4" />
            <span className="font-medium dark:text-white">Workflow Events</span>
            {connected && (
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            )}
            {isConnecting && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500"></span>
            )}
            {!connected && !isConnecting && isRunning && (
              <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
            )}
            {events.length > 0 && !finalOutput && (
              <Badge className="ml-2">Running</Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 dark:text-white" />
          ) : (
            <ChevronUp className="h-4 w-4 dark:text-white" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex items-center justify-between p-3 dark:bg-gray-800 dark:text-white">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              {flowName}/{runName}{" "}
              {connected
                ? "(Connected)"
                : isConnecting
                  ? "(Connecting...)"
                  : "(Disconnected)"}
            </span>
            <div className="flex space-x-2">
              {!connected && !isConnecting && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`px-2 py-1 text-xs ${isConnecting ? "cursor-not-allowed bg-gray-300 dark:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"} rounded text-white`}
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearEvents();
                }}
                className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
              >
                Clear logs
              </button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full dark:bg-gray-800"
          >
            <div className="border-b px-3 dark:border-gray-700">
              <TabsList className="grid w-[600px] grid-cols-3 dark:bg-gray-700">
                <TabsTrigger
                  value="logs"
                  className="flex items-center gap-1 dark:text-gray-200 dark:data-[state=active]:bg-gray-600"
                >
                  <Logs className="h-4 w-4" /> Event Logs
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-1 dark:text-gray-200 dark:data-[state=active]:bg-gray-600"
                >
                  <Clock className="h-4 w-4" /> Timeline View
                </TabsTrigger>
                <TabsTrigger
                  value="output"
                  className="flex items-center gap-1 dark:text-gray-200 dark:data-[state=active]:bg-gray-600"
                >
                  <FileOutput className="h-4 w-4" /> Output
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="logs" className="mt-0">
              <div
                className="h-[500px] overflow-auto dark:bg-gray-800"
                ref={scrollAreaRef}
                onScroll={handleScroll}
              >
                <div className="space-y-2 p-4">
                  {events.length === 0 ? (
                    <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                      No events yet. Start a workflow to see logs.
                    </div>
                  ) : (
                    events.map((event, index) => (
                      <div
                        key={index}
                        className={`rounded p-2 text-sm ${
                          event.level === "error"
                            ? "border-l-2 border-red-500 bg-red-50 dark:bg-red-900/20"
                            : event.level === "warning"
                              ? "border-l-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                              : event.type === "system"
                                ? "border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : event.type === "task_started"
                                  ? "border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : event.type === "task_completed"
                                    ? "border-l-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : event.type === "flow_completed"
                                      ? "border-l-2 border-blue-600 bg-blue-50 font-medium dark:bg-blue-900/20"
                                      : "bg-gray-50 dark:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {showCollapseIndicator(event) && (
                              <button
                                onClick={() => toggleEventCollapse(event.id)}
                                className="mr-1 focus:outline-none"
                              >
                                {isEventCollapsed(event) ? (
                                  <ChevronRight className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                )}
                              </button>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(event.timestamp)}
                            </span>
                            {event.event_type && (
                              <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-600 dark:text-gray-200">
                                {event.event_type}
                              </span>
                            )}
                            {event.task_name && (
                              <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                                {event.task_name}
                              </span>
                            )}
                          </div>
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-600 dark:text-gray-200">
                            {event.type}
                          </span>
                        </div>

                        {!isEventCollapsed(event) && (
                          <div className="mt-1 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-200">
                            {renderMessageText(event.message)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="timeline"
              className="mt-0 h-[500px] overflow-auto dark:bg-gray-800"
            >
              <TimelineView />
            </TabsContent>

            <TabsContent value="output" className="mt-0">
              <div
                className="h-[500px] overflow-auto p-4 dark:bg-gray-800"
                ref={scrollAreaRef}
              >
                {!finalOutput ? (
                  <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                    No output data available. Complete a workflow run to see the
                    final output.
                  </div>
                ) : (
                  <div className="rounded-md border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                    <h3 className="mb-4 text-lg font-medium dark:text-white">
                      Workflow Output
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(finalOutput).map(
                        ([key, value], index) => {
                          const isCollapsed = outputCollapsed[key] ?? false;
                          const isObject =
                            typeof value === "object" && value !== null;

                          return (
                            <div
                              key={key}
                              className="overflow-hidden rounded-md border dark:border-gray-600"
                            >
                              <div
                                className="flex cursor-pointer items-center justify-between bg-gray-100 p-2 dark:bg-gray-600"
                                onClick={() =>
                                  isObject && toggleOutputCollapse(key)
                                }
                              >
                                <div className="flex items-center">
                                  <span className="inline-block rounded-md bg-orange-200/60 px-2 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                                    Node {index + 1}
                                  </span>
                                  {"\u00A0"} {"\u00A0"}
                                  <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {key}
                                  </span>
                                </div>
                                {isObject &&
                                  (isCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  ))}
                              </div>
                              {(!isObject || !isCollapsed) && (
                                <div className="break-words">
                                  {isObject ? (
                                    <div className="whitespace-pre-wrap">
                                      <pre className="overflow-auto text-sm">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </div>
                                  ) : (
                                    <MarkdownRenderer
                                      maxWidth="100%"
                                      content={String(value)}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default WorkflowEvents;

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Phone,
  MessageSquare,
  PhoneIncoming,
  PhoneOff,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface LiveTranscriptViewProps {
  agentId: string;
  broadcastUrl: string;
}

interface TranscriptEvent {
  id: string;
  transcript: string;
  role: "user" | "assistant";
  isFinal: boolean;
  sessionId: string;
  callSid: string;
  from: string;
  to: string | null;
  source: "twilio" | "browser";
  timestamp: string;
  agentId: string;
}

interface CallEvent {
  id: string;
  callSid: string;
  sessionId: string;
  from: string;
  to: string | null;
  source: "twilio" | "browser";
  timestamp: string;
  agentId: string;
  type: "started" | "ended";
}

type Event = (TranscriptEvent | CallEvent) & {
  eventType: "transcript" | "call:started" | "call:ended";
};

export function LiveTranscriptView({
  agentId,
  broadcastUrl,
}: LiveTranscriptViewProps) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeCalls, setActiveCalls] = useState<Map<string, CallEvent>>(
    new Map(),
  );
  const socketRef = useRef<Socket | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to broadcast server
    const socket = io(broadcastUrl, {
      query: { agentId },
      transports: ["polling", "websocket"], // Force polling first for handshake
      upgrade: true, // Then upgrade to websocket
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to broadcast server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from broadcast server");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnected(false);
    });

    socket.on("subscribed", (data) => {
      console.log("Subscribed to agent events:", data);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Transcript events
    socket.on("transcript", (data: TranscriptEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          ...data,
          id: `${data.sessionId}-${Date.now()}`,
          eventType: "transcript",
        },
      ]);
    });

    // Call lifecycle events
    socket.on("call:started", (data: CallEvent) => {
      setActiveCalls((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.sessionId, { ...data, type: "started" });
        return newMap;
      });
      setEvents((prev) => [
        ...prev,
        {
          ...data,
          id: `${data.sessionId}-started-${Date.now()}`,
          eventType: "call:started",
        },
      ]);
    });

    socket.on("call:ended", (data: CallEvent) => {
      setActiveCalls((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.sessionId);
        return newMap;
      });
      setEvents((prev) => [
        ...prev,
        {
          ...data,
          id: `${data.sessionId}-ended-${Date.now()}`,
          eventType: "call:ended",
        },
      ]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [agentId, broadcastUrl]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const renderEvent = (event: Event) => {
    const isBrowser = event.source === "browser";

    if (event.eventType === "transcript") {
      const transcriptEvent = event as TranscriptEvent;
      return (
        <div className="flex items-start gap-3 border-b px-3 py-3">
          {/* Icon */}
          <div
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              transcriptEvent.role === "user"
                ? "bg-purple-100 dark:bg-purple-950"
                : "bg-blue-100 dark:bg-blue-950",
            )}
          >
            <MessageSquare
              className={cn(
                "h-3.5 w-3.5",
                transcriptEvent.role === "user"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-blue-600 dark:text-blue-400",
              )}
            />
          </div>

          {/* Type */}
          <div className="w-20 shrink-0 text-xs font-medium">
            {transcriptEvent.role === "user" ? "User" : "Agent"}
          </div>

          {/* Message */}
          <div className="min-w-0 flex-1 text-sm">
            <p className="break-words">{transcriptEvent.transcript}</p>
          </div>

          {/* Source */}
          <div className="w-24 shrink-0 text-center">
            <Badge
              variant={isBrowser ? "default" : "secondary"}
              className="text-xs"
            >
              {isBrowser ? "Browser" : "Phone"}
            </Badge>
          </div>

          {/* From/To */}
          <div className="w-32 shrink-0 truncate text-xs text-muted-foreground">
            {transcriptEvent.from || "N/A"}
          </div>

          {/* Time */}
          <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(transcriptEvent.timestamp), {
              addSuffix: true,
            })}
          </div>
        </div>
      );
    }

    if (event.eventType === "call:started") {
      const callEvent = event as CallEvent;
      return (
        <div className="flex items-center gap-3 border-b bg-green-50 px-3 py-3 dark:bg-green-950/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <PhoneIncoming className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <div className="w-20 shrink-0 text-xs font-medium text-green-700 dark:text-green-400">
            Call Start
          </div>
          <div className="min-w-0 flex-1 text-sm text-green-700 dark:text-green-300">
            Call initiated
          </div>
          <div className="w-24 shrink-0 text-center">
            <Badge
              variant={isBrowser ? "default" : "secondary"}
              className="text-xs"
            >
              {isBrowser ? "Browser" : "Phone"}
            </Badge>
          </div>
          <div className="w-32 shrink-0 truncate text-xs text-muted-foreground">
            {callEvent.from}
          </div>
          <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(callEvent.timestamp), {
              addSuffix: true,
            })}
          </div>
        </div>
      );
    }

    if (event.eventType === "call:ended") {
      const callEvent = event as CallEvent;
      return (
        <div className="flex items-center gap-3 border-b bg-red-50 px-3 py-3 dark:bg-red-950/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <PhoneOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="w-20 shrink-0 text-xs font-medium text-red-700 dark:text-red-400">
            Call End
          </div>
          <div className="min-w-0 flex-1 text-sm text-red-700 dark:text-red-300">
            Call terminated
          </div>
          <div className="w-24 shrink-0 text-center">
            <Badge
              variant={isBrowser ? "default" : "secondary"}
              className="text-xs"
            >
              {isBrowser ? "Browser" : "Phone"}
            </Badge>
          </div>
          <div className="w-32 shrink-0 truncate text-xs text-muted-foreground">
            {callEvent.from}
          </div>
          <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(callEvent.timestamp), {
              addSuffix: true,
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Status Bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "animate-pulse bg-green-500" : "bg-red-500",
              )}
            />
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{events.length} events</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{activeCalls.size} active calls</span>
          </div>
        </div>

        {activeCalls.size > 0 && (
          <div className="flex gap-2">
            {Array.from(activeCalls.values()).map((call) => (
              <Badge key={call.sessionId} variant="outline" className="text-xs">
                {call.from} ({call.source})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b-2 bg-muted/30 px-3 py-2">
        <div className="h-7 w-7 shrink-0"></div>
        <div className="w-20 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
          Type
        </div>
        <div className="min-w-0 flex-1 text-xs font-semibold uppercase text-muted-foreground">
          Content
        </div>
        <div className="w-24 shrink-0 text-center text-xs font-semibold uppercase text-muted-foreground">
          Source
        </div>
        <div className="w-32 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
          From
        </div>
        <div className="w-24 shrink-0 text-right text-xs font-semibold uppercase text-muted-foreground">
          Time
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto bg-card">
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Activity className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm">Waiting for live events...</p>
            <p className="mt-1 text-xs">Events will appear here in real-time</p>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <div key={event.id}>{renderEvent(event)}</div>
            ))}
            <div ref={eventsEndRef} />
          </>
        )}
      </div>
    </div>
  );
}

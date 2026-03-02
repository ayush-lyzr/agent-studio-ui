import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    Copy,
    Check,
    Clock,
    Bot,
    User,
    ArrowRight,
    Zap,
    MessageSquare,
    Mic,
    XCircle,
    ChevronDown,
    ChevronRight,
    ArrowRightLeft,
    Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type {
    StoredTranscript,
    ConversationItem,
    ConversationMessageItem,
    SessionEvent,
    SessionReportOptions,
} from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SessionDetailDrawerProperties {
    transcript: StoredTranscript | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestampSec: number, sessionStartSec: number): string {
    const diff = Math.max(0, Math.floor(timestampSec - sessionStartSec));
    const mm = String(Math.floor(diff / 60)).padStart(2, "0");
    const ss = String(diff % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function formatDuration(ms: number | null): string {
    if (ms === null || ms <= 0) return "—";
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function closeReasonVariant(reason: string | null) {
    if (!reason) return { label: "Unknown", color: "bg-muted text-muted-foreground" };
    if (reason === "participant_disconnected") {
        return { label: "Participant disconnected", color: "bg-green-500/15 text-green-400" };
    }
    return { label: reason, color: "bg-red-500/15 text-red-400" };
}

function getSessionStartSec(transcript: StoredTranscript): number {
    const events = transcript.sessionReport.events;
    if (events.length > 0) return events[0].created_at;
    if (transcript.chatHistory.length > 0) return transcript.chatHistory[0].created_at;
    return new Date(transcript.startedAt).getTime() / 1000;
}

function extractTextContent(content: (string | Record<string, unknown>)[]): string {
    return content
        .map((c) => {
            if (typeof c === "string") return c;
            if (c && typeof c === "object" && "text" in c) return String(c.text);
            return "";
        })
        .filter(Boolean)
        .join(" ");
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [text]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top">{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
    );
}

// ---------------------------------------------------------------------------
// Tab 1: Transcript
// ---------------------------------------------------------------------------

function TranscriptTab({
    items,
    sessionStartSec,
}: {
    items: ConversationItem[];
    sessionStartSec: number;
}) {
    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No conversation items recorded.
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {items.map((item) => (
                <ConversationRow key={item.id} item={item} sessionStartSec={sessionStartSec} />
            ))}
        </div>
    );
}

function ConversationRow({
    item,
    sessionStartSec,
}: {
    item: ConversationItem;
    sessionStartSec: number;
}) {
    switch (item.type) {
        case "message": {
            return <MessageRow item={item} sessionStartSec={sessionStartSec} />;
        }
        case "agent_handoff": {
            return <HandoffBanner item={item} sessionStartSec={sessionStartSec} />;
        }
        case "function_call": {
            return <FunctionCallRow item={item} sessionStartSec={sessionStartSec} />;
        }
        case "function_call_output": {
            return <FunctionCallOutputRow item={item} sessionStartSec={sessionStartSec} />;
        }
    }
}

function MessageRow({
    item,
    sessionStartSec,
}: {
    item: ConversationMessageItem;
    sessionStartSec: number;
}) {
    const isAgent = item.role === "assistant";
    const isSystem = item.role === "system" || item.role === "developer";
    const text = extractTextContent(item.content);
    const ts = formatRelativeTime(item.created_at, sessionStartSec);

    let roleLabel = "User";
    let roleColor = "text-foreground";
    if (isAgent) {
        roleLabel = "Agent";
        roleColor = "text-violet-400";
    } else if (isSystem) {
        roleLabel = "System";
        roleColor = "text-amber-400";
    }

    return (
        <div className="group grid grid-cols-[52px_72px_1fr] gap-x-2 border-b border-border/40 px-2 py-2.5 hover:bg-muted/30 transition-colors">
            <span className="font-mono text-xs text-muted-foreground pt-0.5">{ts}</span>
            <span className={cn("text-xs font-medium pt-0.5", roleColor)}>{roleLabel}</span>
            <div className="min-w-0">
                <span className="text-sm leading-relaxed break-words">{text}</span>
                <span className="ml-2 inline-flex items-center gap-1.5">
                    {item.interrupted && (
                        <Badge variant="outline" size="sm" className="text-amber-400 border-amber-400/40">
                            Interrupted
                        </Badge>
                    )}
                    {item.transcript_confidence != undefined && (
                        <span className="text-[10px] text-muted-foreground">
                            {Math.round(item.transcript_confidence * 100)}%
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}

function HandoffBanner({
    item,
    sessionStartSec,
}: {
    item: Extract<ConversationItem, { type: "agent_handoff" }>;
    sessionStartSec: number;
}) {
    const ts = formatRelativeTime(item.created_at, sessionStartSec);
    return (
        <div className="grid grid-cols-[52px_1fr] gap-x-2 border-b border-border/40 px-2 py-2">
            <span className="font-mono text-xs text-muted-foreground pt-0.5">{ts}</span>
            <div className="flex items-center gap-2 rounded-md bg-blue-500/10 px-3 py-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="text-xs text-blue-300">
                    Agent handoff to: <strong>{item.new_agent_id}</strong>
                </span>
            </div>
        </div>
    );
}

function FunctionCallRow({
    item,
    sessionStartSec,
}: {
    item: Extract<ConversationItem, { type: "function_call" }>;
    sessionStartSec: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const ts = formatRelativeTime(item.created_at, sessionStartSec);

    return (
        <div className="border-b border-border/40 px-2 py-2">
            <button
                type="button"
                onClick={() => setExpanded((p) => !p)}
                className="grid w-full grid-cols-[52px_1fr] gap-x-2 text-left"
            >
                <span className="font-mono text-xs text-muted-foreground pt-0.5">{ts}</span>
                <div className="flex items-center gap-1.5">
                    {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-300">
                        Function call: <span className="font-medium">{item.name}</span>
                    </span>
                </div>
            </button>
            <AnimatePresence>
                {expanded && item.arguments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        <pre className="ml-[68px] mt-1.5 rounded-md bg-muted/50 p-2 text-[11px] leading-relaxed overflow-x-auto max-h-48">
                            {formatJson(item.arguments)}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FunctionCallOutputRow({
    item,
    sessionStartSec,
}: {
    item: Extract<ConversationItem, { type: "function_call_output" }>;
    sessionStartSec: number;
}) {
    const ts = formatRelativeTime(item.created_at, sessionStartSec);
    return (
        <div className="grid grid-cols-[52px_1fr] gap-x-2 border-b border-border/40 px-2 py-2">
            <span className="font-mono text-xs text-muted-foreground pt-0.5">{ts}</span>
            <div>
                <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-300">
                        Function output{item.name ? `: ${item.name}` : ""}
                    </span>
                    {item.is_error && (
                        <Badge variant="destructive" size="sm">
                            Error
                        </Badge>
                    )}
                </div>
                {item.output && (
                    <pre
                        className={cn(
                            "rounded-md p-2 text-[11px] leading-relaxed overflow-x-auto max-h-48",
                            item.is_error ? "bg-red-500/10 text-red-300" : "bg-muted/50",
                        )}
                    >
                        {formatJson(item.output)}
                    </pre>
                )}
            </div>
        </div>
    );
}

function formatJson(raw: string): string {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
}

// ---------------------------------------------------------------------------
// Tab 2: Events Timeline
// ---------------------------------------------------------------------------

function EventsTab({
    events,
    sessionStartSec,
}: {
    events: SessionEvent[];
    sessionStartSec: number;
}) {
    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No events recorded.
            </div>
        );
    }

    return (
        <div className="relative ml-4 border-l border-border/50 pl-5">
            {events.map((event, index) => (
                <EventRow key={index} event={event} sessionStartSec={sessionStartSec} />
            ))}
        </div>
    );
}

function EventRow({
    event,
    sessionStartSec,
}: {
    event: SessionEvent;
    sessionStartSec: number;
}) {
    const ts = formatRelativeTime(event.created_at, sessionStartSec);
    const { icon, label, detail, color } = describeEvent(event);

    return (
        <div className="relative pb-4 last:pb-0">
            <div
                className={cn(
                    "absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background",
                    color,
                )}
            >
                {icon}
            </div>
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted-foreground shrink-0">{ts}</span>
                <span className="text-xs font-medium">{label}</span>
            </div>
            {detail && <p className="mt-0.5 text-xs text-muted-foreground break-words">{detail}</p>}
        </div>
    );
}

function describeEvent(event: SessionEvent): {
    icon: React.ReactNode;
    label: string;
    detail?: string;
    color: string;
} {
    switch (event.type) {
        case "agent_state_changed": {
            return {
                icon: <Bot className="h-2.5 w-2.5 text-violet-400" />,
                label: "Agent state changed",
                detail: `${event.old_state} → ${event.new_state}`,
                color: "bg-violet-500/20",
            };
        }
        case "user_state_changed": {
            return {
                icon: <User className="h-2.5 w-2.5 text-blue-400" />,
                label: "User state changed",
                detail: `${event.old_state} → ${event.new_state}`,
                color: "bg-blue-500/20",
            };
        }
        case "speech_created": {
            return {
                icon: <Activity className="h-2.5 w-2.5 text-cyan-400" />,
                label: "Speech created",
                detail: event.source ? `Source: ${event.source}` : undefined,
                color: "bg-cyan-500/20",
            };
        }
        case "conversation_item_added": {
            return {
                icon: <MessageSquare className="h-2.5 w-2.5 text-emerald-400" />,
                label: "Message added",
                detail:
                    event.item && typeof event.item.role === "string"
                        ? `Role: ${event.item.role}`
                        : undefined,
                color: "bg-emerald-500/20",
            };
        }
        case "user_input_transcribed": {
            const finalLabel = event.is_final ? "(final)" : "(interim)";
            return {
                icon: <Mic className="h-2.5 w-2.5 text-amber-400" />,
                label: `User input transcribed ${finalLabel}`,
                detail: event.transcript,
                color: "bg-amber-500/20",
            };
        }
        case "function_tools_executed": {
            const callCount = event.function_calls?.length ?? 0;
            const outputCount = event.function_call_outputs?.length ?? 0;
            return {
                icon: <Zap className="h-2.5 w-2.5 text-fuchsia-400" />,
                label: "Tools executed",
                detail: `${callCount} call${callCount === 1 ? "" : "s"}, ${outputCount} output${outputCount === 1 ? "" : "s"}`,
                color: "bg-fuchsia-500/20",
            };
        }
        case "close": {
            return {
                icon: <XCircle className="h-2.5 w-2.5 text-red-400" />,
                label: "Session closed",
                detail: event.reason || event.error || undefined,
                color: "bg-red-500/20",
            };
        }
        default: {
            const rawType = String((event as { type?: unknown }).type ?? "unknown_event");
            return {
                icon: <Activity className="h-2.5 w-2.5 text-muted-foreground" />,
                label: `Event: ${rawType}`,
                detail: "This event type is not yet mapped in the UI.",
                color: "bg-muted",
            };
        }
    }
}

// ---------------------------------------------------------------------------
// Tab 3: Session Config
// ---------------------------------------------------------------------------

function SessionConfigTab({
    options,
    transcript,
}: {
    options?: SessionReportOptions;
    transcript: StoredTranscript;
}) {
    const report = transcript.sessionReport;

    return (
        <div className="space-y-4">
            <Card className="border-border/50 bg-muted/20">
                <CardContent className="pt-4 pb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Session Metadata
                    </h4>
                    <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                        <MetaRow label="Job ID" value={report.job_id} mono />
                        <MetaRow label="Room ID" value={report.room_id} mono />
                        <MetaRow label="Room name" value={report.room} />
                        <MetaRow label="Messages" value={String(transcript.messageCount)} />
                        <MetaRow label="Duration" value={formatDuration(transcript.durationMs)} />
                    </dl>
                </CardContent>
            </Card>

            {options && Object.keys(options).length > 0 && (
                <Card className="border-border/50 bg-muted/20">
                    <CardContent className="pt-4 pb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Agent Options
                        </h4>
                        <dl className="grid grid-cols-[200px_1fr] gap-y-2 text-sm">
                            {Object.entries(options).map(([key, value]) => (
                                <OptionRow key={key} label={key} value={value} />
                            ))}
                        </dl>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={cn("truncate", mono && "font-mono text-xs pt-0.5")}>{value}</dd>
        </>
    );
}

function OptionRow({ label, value }: { label: string; value: unknown }) {
    const formatted = formatOptionValue(value);
    return (
        <>
            <dt className="text-muted-foreground font-mono text-xs pt-0.5">
                {label}
            </dt>
            <dd>{formatted}</dd>
        </>
    );
}

function formatOptionValue(value: unknown): React.ReactNode {
    if (typeof value === "boolean") {
        return (
            <Badge variant={value ? "success" : "secondary"} size="sm">
                {value ? "Yes" : "No"}
            </Badge>
        );
    }
    if (typeof value === "number") {
        return <span className="text-sm">{formatNumericOption(value)}</span>;
    }
    return <span className="text-sm">{String(value)}</span>;
}

function formatNumericOption(n: number): string {
    if (Number.isInteger(n) && n >= 1 && n <= 50) return `${n} steps`;
    return `${n}s`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SessionDetailDrawer({ transcript, open, onOpenChange }: SessionDetailDrawerProperties) {
    if (!transcript) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-2xl" />
            </Sheet>
        );
    }

    const sessionStartSec = getSessionStartSec(transcript);
    const reason = closeReasonVariant(transcript.closeReason);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-2xl flex flex-col p-0 gap-0">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50 space-y-3">
                    <SheetHeader className="space-y-1">
                        <SheetTitle className="text-base">Session Detail</SheetTitle>
                    </SheetHeader>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                                    {transcript.sessionId}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{transcript.sessionId}</TooltipContent>
                        </Tooltip>
                        <CopyButton text={transcript.sessionId} />
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant="outline" size="sm" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(transcript.durationMs)}
                        </Badge>
                        <Badge size="sm" className={cn("border-0", reason.color)}>
                            {reason.label}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                            Started{" "}
                            {format(new Date(transcript.startedAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span>
                            Ended {format(new Date(transcript.endedAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="transcript" className="flex flex-col flex-1 min-h-0">
                    <div className="px-6 pt-3">
                        <TabsList className="w-full">
                            <TabsTrigger value="transcript" className="flex-1">
                                Transcript
                            </TabsTrigger>
                            <TabsTrigger value="events" className="flex-1">
                                Events
                            </TabsTrigger>
                            <TabsTrigger value="config" className="flex-1">
                                Session Config
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <TabsContent value="transcript" className="px-4 pb-6 mt-0 pt-2">
                            <TranscriptTab
                                items={transcript.chatHistory}
                                sessionStartSec={sessionStartSec}
                            />
                        </TabsContent>

                        <TabsContent value="events" className="px-6 pb-6 mt-0 pt-2">
                            <EventsTab
                                events={transcript.sessionReport.events}
                                sessionStartSec={sessionStartSec}
                            />
                        </TabsContent>

                        <TabsContent value="config" className="px-6 pb-6 mt-0 pt-2">
                            <SessionConfigTab
                                options={transcript.sessionReport.options}
                                transcript={transcript}
                            />
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Path } from "@/lib/types";
import useStore from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ArrowLeft,
    Bot,
    Check,
    Clock,
    Copy,
    User,
    Zap,
    ArrowRightLeft,
    Activity,
    MessageSquare,
    XCircle,
    Settings2,
    Radio,
    Mic,
    X,
} from "lucide-react";
import { transcriptApi } from "./api";
import type {
    StoredTranscript,
    ConversationItem,
    ConversationMessageItem,
    ConversationFunctionCallItem,
    ConversationFunctionCallOutputItem,
    SessionEvent,
    SessionReportOptions,
} from "./types";

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

function closeReasonLabel(reason: string | null): string {
    if (!reason) return "Unknown";
    return reason
        .replaceAll("_", " ")
        .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

function formatJson(raw: string): string {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------

function CopyButton({ text, className }: { text: string; className?: string }) {
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
                    className={cn(
                        "inline-flex items-center text-muted-foreground hover:text-foreground transition-colors",
                        className,
                    )}
                >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top">{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
    );
}

// ---------------------------------------------------------------------------
// Chat Bubble – Messages (black & white)
// ---------------------------------------------------------------------------

function MessageBubble({
    item,
    sessionStartSec,
    onInspect,
}: {
    item: ConversationMessageItem;
    sessionStartSec: number;
    onInspect?: (item: ConversationItem) => void;
}) {
    const isAgent = item.role === "assistant";
    const isSystem = item.role === "system" || item.role === "developer";
    const text = extractTextContent(item.content);
    const ts = formatRelativeTime(item.created_at, sessionStartSec);

    let roleLabel = "User";
    let avatar = <User className="h-4 w-4" />;
    if (isAgent) {
        roleLabel = "Agent";
        avatar = <Bot className="h-4 w-4" />;
    } else if (isSystem) {
        roleLabel = "System";
        avatar = <Settings2 className="h-4 w-4" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn("flex gap-3 group", isAgent ? "flex-row" : "flex-row-reverse")}
        >
            {/* Avatar */}
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                {avatar}
            </div>

            {/* Bubble */}
            <div className={cn("max-w-[75%] min-w-0", isAgent ? "" : "flex flex-col items-end")}>
                {/* Role & timestamp header */}
                <div
                    className={cn(
                        "flex items-center gap-2 mb-1 px-1",
                        !isAgent && "flex-row-reverse",
                    )}
                >
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {roleLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{ts}</span>
                </div>

                {/* Message body */}
                <button
                    type="button"
                    onClick={() => onInspect?.(item)}
                    className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-left transition-colors",
                        isAgent
                            ? "bg-muted/80 rounded-tl-md"
                            : "border border-border/60 bg-foreground/5 rounded-tr-md",
                        onInspect && "cursor-pointer hover:border-foreground/20",
                    )}
                >
                    <span className="break-words whitespace-pre-wrap">{text}</span>

                    {item.interrupted && (
                        <span className="mt-1.5 block text-xs text-purple-400">interrupted</span>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Chat Bubble – Agent Handoff (centered)
// ---------------------------------------------------------------------------

function HandoffBubble({
    item,
    sessionStartSec,
    onInspect,
}: {
    item: Extract<ConversationItem, { type: "agent_handoff" }>;
    sessionStartSec: number;
    onInspect?: (item: ConversationItem) => void;
}) {
    const ts = formatRelativeTime(item.created_at, sessionStartSec);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
        >
            <button
                type="button"
                onClick={() => onInspect?.(item)}
                className={cn(
                    "flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5",
                    "text-xs text-muted-foreground transition-colors",
                    onInspect && "cursor-pointer hover:border-foreground/20",
                )}
            >
                <ArrowRightLeft className="h-3 w-3" />
                <span>
                    Handoff to <span className="font-mono font-medium">{item.new_agent_id}</span>
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">{ts}</span>
            </button>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Chat Bubble – Function Call (centered box)
// ---------------------------------------------------------------------------

function FunctionCallBubble({
    item,
    sessionStartSec,
    onInspect,
}: {
    item: ConversationFunctionCallItem;
    sessionStartSec: number;
    onInspect?: (item: ConversationItem) => void;
}) {
    const ts = formatRelativeTime(item.created_at, sessionStartSec);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
        >
            <button
                type="button"
                onClick={() => onInspect?.(item)}
                className={cn(
                    "flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5",
                    "text-xs text-muted-foreground transition-colors",
                    onInspect && "cursor-pointer hover:border-foreground/20",
                )}
            >
                <Zap className="h-3 w-3" />
                <span className="font-mono font-medium">{item.name}()</span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">{ts}</span>
            </button>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Chat Bubble – Function Call Output (centered box)
// ---------------------------------------------------------------------------

function FunctionCallOutputBubble({
    item,
    sessionStartSec,
    onInspect,
}: {
    item: ConversationFunctionCallOutputItem;
    sessionStartSec: number;
    onInspect?: (item: ConversationItem) => void;
}) {
    const ts = formatRelativeTime(item.created_at, sessionStartSec);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
        >
            <button
                type="button"
                onClick={() => onInspect?.(item)}
                className={cn(
                    "flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5",
                    "text-xs text-muted-foreground transition-colors",
                    onInspect && "cursor-pointer hover:border-foreground/20",
                )}
            >
                {item.is_error ? (
                    <XCircle className="h-3 w-3 text-destructive" />
                ) : (
                    <Check className="h-3 w-3" />
                )}
                <span className="font-mono font-medium">
                    Result{item.name ? `: ${item.name}` : ""}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">{ts}</span>
            </button>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Conversation Renderer
// ---------------------------------------------------------------------------

function ConversationBubble({
    item,
    sessionStartSec,
    onInspect,
}: {
    item: ConversationItem;
    sessionStartSec: number;
    onInspect?: (item: ConversationItem) => void;
}) {
    switch (item.type) {
        case "message": {
            return (
                <MessageBubble
                    item={item}
                    sessionStartSec={sessionStartSec}
                    onInspect={onInspect}
                />
            );
        }
        case "agent_handoff": {
            return (
                <HandoffBubble
                    item={item}
                    sessionStartSec={sessionStartSec}
                    onInspect={onInspect}
                />
            );
        }
        case "function_call": {
            return (
                <FunctionCallBubble
                    item={item}
                    sessionStartSec={sessionStartSec}
                    onInspect={onInspect}
                />
            );
        }
        case "function_call_output": {
            return (
                <FunctionCallOutputBubble
                    item={item}
                    sessionStartSec={sessionStartSec}
                    onInspect={onInspect}
                />
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Inspect Panel (right sidebar content when an item is selected)
// ---------------------------------------------------------------------------

function InspectPanel({
    item,
    onClose,
}: {
    item: ConversationItem;
    onClose: () => void;
}) {
    const renderContent = () => {
        switch (item.type) {
            case "function_call": {
                return (
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                Function
                            </p>
                            <p className="font-mono text-sm">{item.name}()</p>
                        </div>
                        {item.arguments && (
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                    Query / Arguments
                                </p>
                                <pre className="rounded-lg bg-muted/40 border border-border/30 p-3 text-xs font-mono leading-relaxed overflow-x-auto max-h-56 text-muted-foreground">
                                    {formatJson(item.arguments)}
                                </pre>
                            </div>
                        )}
                    </div>
                );
            }
            case "function_call_output": {
                return (
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                Result{item.name ? ` — ${item.name}` : ""}
                            </p>
                            {item.is_error && (
                                <span className="text-xs text-destructive font-medium">Error</span>
                            )}
                        </div>
                        {item.output && (
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                    Output
                                </p>
                                <pre
                                    className={cn(
                                        "rounded-lg border p-3 text-xs font-mono leading-relaxed overflow-x-auto max-h-56",
                                        item.is_error
                                            ? "bg-destructive/5 border-destructive/15 text-destructive"
                                            : "bg-muted/40 border-border/30 text-muted-foreground",
                                    )}
                                >
                                    {formatJson(item.output)}
                                </pre>
                            </div>
                        )}
                    </div>
                );
            }
            default: {
                return (
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                        {JSON.stringify(item, null, 2)}
                    </pre>
                );
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inspect
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            {renderContent()}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Events Timeline (compact sidebar-style)
// ---------------------------------------------------------------------------

function EventTimeline({
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
        <div className="relative ml-3 border-l border-border/40 pl-4 space-y-0.5">
            {events.map((event, index) => {
                const ts = formatRelativeTime(event.created_at, sessionStartSec);
                const desc = describeEvent(event);
                return (
                    <div key={index} className="relative py-1.5">
                        <div
                            className={cn(
                                "absolute -left-[22px] top-2.5 h-3 w-3 rounded-full border-2 border-background flex items-center justify-center",
                                desc.color,
                            )}
                        >
                            {desc.icon}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-10">
                                {ts}
                            </span>
                            <span className="text-xs">{desc.label}</span>
                        </div>
                        {desc.detail && (
                            <p className="ml-12 text-[11px] text-muted-foreground truncate">
                                {desc.detail}
                            </p>
                        )}
                    </div>
                );
            })}
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
                icon: <Bot className="h-2 w-2 text-violet-400" />,
                label: "Agent state",
                detail: `${event.old_state} → ${event.new_state}`,
                color: "bg-violet-500/25",
            };
        }
        case "user_state_changed": {
            return {
                icon: <User className="h-2 w-2 text-blue-400" />,
                label: "User state",
                detail: `${event.old_state} → ${event.new_state}`,
                color: "bg-blue-500/25",
            };
        }
        case "speech_created": {
            return {
                icon: <Radio className="h-2 w-2 text-cyan-400" />,
                label: "Speech created",
                detail: event.source ? `Source: ${event.source}` : undefined,
                color: "bg-cyan-500/25",
            };
        }
        case "conversation_item_added": {
            return {
                icon: <MessageSquare className="h-2 w-2 text-emerald-400" />,
                label: "Message added",
                detail:
                    event.item && typeof event.item.role === "string"
                        ? `Role: ${event.item.role}`
                        : undefined,
                color: "bg-emerald-500/25",
            };
        }
        case "user_input_transcribed": {
            const finalLabel = event.is_final ? "(final)" : "(interim)";
            return {
                icon: <Mic className="h-2 w-2 text-amber-400" />,
                label: `Transcribed ${finalLabel}`,
                detail: event.transcript,
                color: "bg-amber-500/25",
            };
        }
        case "function_tools_executed": {
            const callCount = event.function_calls?.length ?? 0;
            const outputCount = event.function_call_outputs?.length ?? 0;
            return {
                icon: <Zap className="h-2 w-2 text-fuchsia-400" />,
                label: "Tools executed",
                detail: `${callCount} call${callCount === 1 ? "" : "s"}, ${outputCount} output${outputCount === 1 ? "" : "s"}`,
                color: "bg-fuchsia-500/25",
            };
        }
        case "close": {
            return {
                icon: <XCircle className="h-2 w-2 text-red-400" />,
                label: "Session closed",
                detail: event.reason || event.error || undefined,
                color: "bg-red-500/25",
            };
        }
        default: {
            const rawType = String((event as { type?: unknown }).type ?? "unknown_event");
            return {
                icon: <Activity className="h-2 w-2 text-muted-foreground" />,
                label: `Event: ${rawType}`,
                detail: "This event type is not yet mapped in the UI.",
                color: "bg-muted",
            };
        }
    }
}

// ---------------------------------------------------------------------------
// Session Config Panel
// ---------------------------------------------------------------------------

function SessionConfigPanel({
    options,
    transcript,
}: {
    options?: SessionReportOptions;
    transcript: StoredTranscript;
}) {
    const report = transcript.sessionReport;

    return (
        <div className="space-y-5">
            <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Session Metadata
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <MetaCard label="Job ID" value={report.job_id} mono />
                    <MetaCard label="Room ID" value={report.room_id} mono />
                    <MetaCard label="Room Name" value={report.room} />
                    <MetaCard label="Messages" value={String(transcript.messageCount)} />
                    <MetaCard label="Duration" value={formatDuration(transcript.durationMs)} />
                    <MetaCard
                        label="Close Reason"
                        value={closeReasonLabel(transcript.closeReason)}
                    />
                </div>
            </div>

            {options && Object.keys(options).length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Agent Options
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(options).map(([key, value]) => (
                            <MetaCard
                                key={key}
                                label={key.replaceAll("_", " ")}
                                value={formatOptionValue(value)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetaCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                {label}
            </p>
            <p className={cn("text-sm truncate", mono && "font-mono text-xs")}>{value}</p>
        </div>
    );
}

function formatOptionValue(value: unknown): string {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") {
        if (Number.isInteger(value) && value >= 1 && value <= 50) return `${value} steps`;
        return `${value}s`;
    }
    return String(value);
}

// ---------------------------------------------------------------------------
// Stats Bar (no interruption count)
// ---------------------------------------------------------------------------

function StatsBar({ transcript }: { transcript: StoredTranscript }) {
    const messageCount = transcript.chatHistory.filter((index) => index.type === "message").length;
    const userMessages = transcript.chatHistory.filter(
        (index) => index.type === "message" && index.role === "user",
    ).length;
    const toolCalls = transcript.chatHistory.filter((index) => index.type === "function_call").length;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <StatChip icon={<MessageSquare className="h-3.5 w-3.5" />} label="Messages" value={messageCount} />
            <StatChip icon={<User className="h-3.5 w-3.5" />} label="User turns" value={userMessages} />
            <StatChip icon={<Zap className="h-3.5 w-3.5" />} label="Tool calls" value={toolCalls} />
            <StatChip
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Duration"
                value={formatDuration(transcript.durationMs)}
            />
        </div>
    );
}

function StatChip({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-muted-foreground">
            {icon}
            <span className="text-xs">{label}:</span>
            <span className="text-xs font-semibold text-foreground">{value}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const apiKey = useStore((state) => state.api_key ?? "");
    const hasApiKey = Boolean(apiKey.trim());
    const [transcript, setTranscript] = useState<StoredTranscript | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inspectedItem, setInspectedItem] = useState<ConversationItem | null>(null);

    useEffect(() => {
        if (!sessionId || !hasApiKey) return;

        let cancelled = false;
        void (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await transcriptApi.getTranscript(sessionId);
                if (!cancelled) setTranscript(response.transcript);
            } catch (error_) {
                if (!cancelled) {
                    setError(error_ instanceof Error ? error_.message : "Failed to load");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hasApiKey, sessionId]);

    const sessionStartSec = useMemo(
        () => (transcript ? getSessionStartSec(transcript) : 0),
        [transcript],
    );

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Loading session...</span>
                </div>
            </div>
        );
    }

    if (error || !transcript) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <XCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm text-muted-foreground">{error ?? "Session not found"}</p>
                <Button variant="outline" size="sm" onClick={() => navigate(Path.VOICE_NEW)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sessions
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full w-full flex-col overflow-hidden"
        >
            {/* ── Top Bar ──────────────────────────────────────────────── */}
            <div className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center gap-4 mb-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(Path.VOICE_NEW)}
                        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Sessions
                    </Button>

                    <Separator orientation="vertical" className="h-5" />

                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                                    {transcript.sessionId}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>{transcript.sessionId}</TooltipContent>
                        </Tooltip>
                        <CopyButton text={transcript.sessionId} />
                    </div>

                    <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                        <span>
                            {format(new Date(transcript.startedAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
                        <span>→</span>
                        <span>{format(new Date(transcript.endedAt), "HH:mm:ss")}</span>
                    </div>
                </div>

                <StatsBar transcript={transcript} />
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left: Conversation */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    <div className="mx-auto max-w-3xl px-6 py-6 space-y-5">
                        {transcript.chatHistory.length === 0 ? (
                            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                                No conversation items recorded.
                            </div>
                        ) : (
                            transcript.chatHistory.map((item) => (
                                <ConversationBubble
                                    key={item.id}
                                    item={item}
                                    sessionStartSec={sessionStartSec}
                                    onInspect={setInspectedItem}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="w-[340px] shrink-0 border-l border-border/50 overflow-y-auto bg-muted/5">
                    <AnimatePresence mode="wait">
                        {inspectedItem ? (
                            <motion.div
                                key="inspect"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="p-4"
                            >
                                <InspectPanel
                                    item={inspectedItem}
                                    onClose={() => setInspectedItem(null)}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tabs"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Tabs defaultValue="events" className="flex flex-col h-full">
                                    <div className="px-4 pt-4 shrink-0">
                                        <TabsList className="w-full">
                                            <TabsTrigger value="events" className="flex-1 text-xs">
                                                <Activity className="mr-1.5 h-3 w-3" />
                                                Events
                                            </TabsTrigger>
                                            <TabsTrigger value="config" className="flex-1 text-xs">
                                                <Settings2 className="mr-1.5 h-3 w-3" />
                                                Config
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="events" className="flex-1 px-4 pb-6 mt-0 pt-3">
                                        <EventTimeline
                                            events={transcript.sessionReport.events}
                                            sessionStartSec={sessionStartSec}
                                        />
                                    </TabsContent>

                                    <TabsContent value="config" className="flex-1 px-4 pb-6 mt-0 pt-3">
                                        <SessionConfigPanel
                                            options={transcript.sessionReport.options}
                                            transcript={transcript}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

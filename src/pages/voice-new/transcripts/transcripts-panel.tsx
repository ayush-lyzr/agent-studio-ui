import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChevronRight,
  FileText,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  MessageSquare,
  Activity,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useStore from "@/lib/store";
import { backendClient } from "@/lib/livekit/backend-client";
import type { StoredAgent } from "@/lib/livekit/types";

import type {
  StoredTranscript,
  AgentTranscriptStats,
  PaginatedResult,
} from "./types";
import { transcriptApi } from "./api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return "< 1s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatCloseReason(reason: string | null): string {
  if (!reason) return "N/A";
  return reason
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(reason: string | null): string {
  if (!reason) return "bg-muted-foreground";
  const r = reason.toLowerCase();
  if (r.includes("error") || r.includes("fail")) return "bg-red-500";
  if (r.includes("disconnect") || r.includes("timeout")) return "bg-yellow-500";
  return "bg-green-500";
}

function closeReasonVariant(
  reason: string | null,
): "default" | "destructive" | "secondary" | "outline" {
  if (!reason) return "secondary";
  const r = reason.toLowerCase();
  if (r.includes("error") || r.includes("fail")) return "destructive";
  return "outline";
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
      delay: index * 0.03,
    },
  }),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

export function TranscriptsPanel() {
  const navigate = useNavigate();
  const apiKey = useStore((state) => state.api_key ?? "");
  const hasApiKey = Boolean(apiKey.trim());
  // ── Agents ──────────────────────────────────────────────────────────────
  const [agents, setAgents] = useState<StoredAgent[]>([]);

  useEffect(() => {
    if (!hasApiKey) {
      setAgents([]);
      return;
    }
    backendClient
      .listAgents()
      .then((response) => setAgents(response.agents ?? []))
      .catch(() => {});
  }, [hasApiKey]);

  const agentMap = useMemo(
    () => new Map(agents.map((a) => [a.id, a])),
    [agents],
  );

  // ── Filters ─────────────────────────────────────────────────────────────
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchSessionId, setSearchSessionId] = useState("");

  // ── Data ────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<PaginatedResult<StoredTranscript> | null>(null);
  const [stats, setStats] = useState<AgentTranscriptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchTranscripts = useCallback(
    async (offset = 0, append = false) => {
      if (!hasApiKey) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        return;
      }

      if (append) {setIsLoadingMore(true);}
      else {setIsLoading(true);}
      setError(null);

      try {
        const filters: Record<string, string | undefined> = {
          agentId: selectedAgentId === "all" ? undefined : selectedAgentId,
          sessionId: searchSessionId.trim() || undefined,
        };
        const data = await transcriptApi.listTranscripts(filters, {
          limit: PAGE_SIZE,
          offset,
          sort: sortOrder,
        });

        if (append && result) {
          setResult({
            ...data,
            items: [...result.items, ...data.items],
          });
        } else {
          setResult(data);
        }

        if (selectedAgentId === "all") {
          setStats(null);
        } else {
          transcriptApi
            .getAgentStats(selectedAgentId)
            .then(setStats)
            .catch(() => setStats(null));
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Failed to load transcripts");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [hasApiKey, selectedAgentId, sortOrder, searchSessionId, result],
  );

  useEffect(() => {
    if (!hasApiKey) {
      setError(null);
      setStats(null);
      setResult(null);
      setIsLoading(false);
      return;
    }
    fetchTranscripts(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, selectedAgentId, sortOrder, searchSessionId]);

  const handleRefresh = () => {
    if (!hasApiKey) return;
    setIsRefreshing(true);
    fetchTranscripts(0, false);
  };

  const handleLoadMore = () => {
    if (result?.nextOffset !== null && result?.nextOffset !== undefined) {
      fetchTranscripts(result.nextOffset, true);
    }
  };

  // ── Computed stats ──────────────────────────────────────────────────────
  const totalSessions = result?.total ?? 0;

  const avgDuration = useMemo(() => {
    if (!result?.items.length) return null;
    const durations = result.items
      .map((t) => t.durationMs)
      .filter((d): d is number => d !== null);
    if (durations.length === 0) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }, [result]);

  const topCloseReason = useMemo(() => {
    if (!result?.items.length) return null;
    const counts = new Map<string, number>();
    for (const t of result.items) {
      const r = t.closeReason ?? "unknown";
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    let top = "unknown";
    let max = 0;
    for (const [reason, count] of counts) {
      if (count > max) {
        max = count;
        top = reason;
      }
    }
    return top;
  }, [result]);

  // ── Agent name resolver ─────────────────────────────────────────────────
  const agentName = useCallback(
    (agentId: string | null): string => {
      if (!agentId) return "—";
      const agent = agentMap.get(agentId);
      return agent?.config?.agent_name?.trim() || agentId.slice(0, 8);
    },
    [agentMap],
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pb-8 pr-1">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <p className="mt-1 text-xs text-muted-foreground">All recorded</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatDuration(avgDuration)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Per session</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Avg Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(() => {
                    if (
                      stats?.avgMessages !== null &&
                      stats?.avgMessages !== undefined
                    ) {
                      return stats.avgMessages.toFixed(1);
                    }

                    if (result?.items.length) {
                      return (
                        result.items.reduce((s, t) => s + t.messageCount, 0) /
                        result.items.length
                      ).toFixed(1);
                    }

                    return "—";
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Per session</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4" />
              Close Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCloseReason(topCloseReason)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Most common</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2">
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.config?.agent_name?.trim() || a.id.slice(0, 12)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-1 items-center rounded-md border border-input px-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search by session ID…"
            value={searchSessionId}
            onChange={(event) => setSearchSessionId(event.target.value)}
            className="border-none bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={!hasApiKey || isLoading || isRefreshing}
        >
          <RefreshCw
            className={cn("size-4", (isLoading || isRefreshing) && "animate-spin")}
          />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="flex-1 text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`skel-${index}`} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && result?.items.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">No transcripts yet</p>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Transcripts will appear here after voice sessions are completed.
          </p>
        </div>
      )}

      {/* Sessions Table */}
      {!isLoading && !error && result && result.items.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Session</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Close Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((transcript, index) => (
                  <motion.tr
                    key={transcript.id}
                    custom={index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    onClick={() => navigate(`/voice-new/session/${encodeURIComponent(transcript.sessionId)}`)}
                  >
                    <TableCell className="px-3">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          statusColor(transcript.closeReason),
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {transcript.sessionId.slice(0, 12)}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {agentName(transcript.agentId)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {transcript.messageCount}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(transcript.durationMs)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={closeReasonVariant(transcript.closeReason)}>
                        {formatCloseReason(transcript.closeReason)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transcript.startedAt), {
                            addSuffix: true,
                          })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(transcript.startedAt), "PPpp")}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="px-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {result.items.length} of {result.total} sessions
            </p>
            {result.nextOffset !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TranscriptsPanel;

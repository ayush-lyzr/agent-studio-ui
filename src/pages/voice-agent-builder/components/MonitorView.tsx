import { useEffect, useState } from "react";
import {
  RefreshCw,
  MessageSquare,
  Phone,
  Monitor,
  TrendingUp,
  Filter,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  transcriptsService,
  TranscriptDocument,
  AgentStats,
} from "@/services/transcriptsService";
import { TranscriptCard } from "./TranscriptCard";
import { LiveTranscriptView } from "./LiveTranscriptView";
import { IAgent } from "@/lib/types";

interface MonitorViewProps {
  agents: IAgent[];
}

export function MonitorView({ agents }: MonitorViewProps) {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [transcripts, setTranscripts] = useState<TranscriptDocument[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [channelFilter, setChannelFilter] = useState<
    "all" | "browser" | "phone"
  >("all");
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false,
  });

  // Auto-select first agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0]._id);
    }
  }, [agents, selectedAgentId]);

  const loadTranscripts = async (agentId: string, skip = 0) => {
    if (!agentId) return;

    try {
      setIsLoading(skip === 0);
      setIsRefreshing(skip > 0);

      // Load transcripts
      const transcriptsResponse =
        await transcriptsService.getTranscriptsByAgent(agentId, {
          limit: pagination.limit,
          skip,
          sortBy: "createdAt",
          sortOrder: -1,
        });

      // Load stats
      const statsResponse = await transcriptsService.getAgentStats(agentId);

      setTranscripts(transcriptsResponse.transcripts);
      setStats(statsResponse.stats);
      setPagination(transcriptsResponse.pagination);
    } catch (error) {
      console.error("Failed to load transcripts:", error);
      toast({
        title: "Error",
        description: "Failed to load transcripts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedAgentId) {
      loadTranscripts(selectedAgentId);
    }
  }, [selectedAgentId]);

  const handleRefresh = () => {
    if (selectedAgentId) {
      setIsRefreshing(true);
      loadTranscripts(selectedAgentId);
    }
  };

  const handleLoadMore = () => {
    if (selectedAgentId && pagination.hasMore) {
      loadTranscripts(selectedAgentId, pagination.skip + pagination.limit);
    }
  };

  // Filter transcripts by channel
  const filteredTranscripts = transcripts.filter((t) => {
    if (channelFilter === "browser") return t.accountSid === "browser";
    if (channelFilter === "phone") return t.accountSid !== "browser";
    return true;
  });

  const browserCount = transcripts.filter(
    (t) => t.accountSid === "browser",
  ).length;
  const phoneCount = transcripts.filter(
    (t) => t.accountSid !== "browser",
  ).length;

  // Get broadcast URL from environment
  const broadcastUrl =
    import.meta.env.VITE_BROADCAST_URL || "http://localhost:4444";

  // If live mode is active, render live view
  if (isLiveMode && selectedAgentId) {
    return (
      <div className="flex h-full flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Live Trailing</h2>
            <p className="text-sm text-muted-foreground">
              Real-time conversation monitoring for your voice agents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsLiveMode(false)}>
              Exit Live Mode
            </Button>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No voice agents available
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live View */}
        <div className="flex-1 overflow-hidden rounded-lg border">
          <LiveTranscriptView
            agentId={selectedAgentId}
            broadcastUrl={broadcastUrl}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Monitor Transcripts</h2>
          <p className="text-sm text-muted-foreground">
            View conversation logs and analytics for your voice agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setIsLiveMode(true)}
            disabled={!selectedAgentId}
            className="bg-green-600 hover:bg-green-700"
          >
            <Radio className="mr-2 h-4 w-4" />
            Live Trailing
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading || !selectedAgentId}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Agent and Channel Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
              <SelectValue placeholder="Select an agent..." />
            </SelectTrigger>
            <SelectContent>
              {agents.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No voice agents available
                </div>
              ) : (
                agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Select
          value={channelFilter}
          onValueChange={(v) => setChannelFilter(v as any)}
        >
          <SelectTrigger className="w-48 focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="browser">Browser Only</SelectItem>
            <SelectItem value="phone">Phone Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {!isLoading && stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                All conversations
              </p>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Monitor className="h-4 w-4" />
                Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {browserCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Web sessions</p>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {phoneCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Twilio calls</p>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Avg Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgTranscriptsPerCall.toFixed(1)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Per conversation
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transcripts List */}
      <div className="flex-1 overflow-y-auto">
        {!isLoading && selectedAgentId && filteredTranscripts.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                SESSIONS
              </h3>
              <span className="text-xs text-muted-foreground">
                Click on a session to view conversation details
              </span>
            </div>
          </>
        )}

        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </>
        ) : !selectedAgentId ? (
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                Select a voice agent to view transcripts
              </p>
            </CardContent>
          </Card>
        ) : filteredTranscripts.length === 0 ? (
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                No transcripts found for this agent
                {channelFilter !== "all" && (
                  <>
                    <br />
                    Try changing the channel filter
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table containerClassname="overflow-visible" className="border-0">
                <TableHeader className="sticky top-0 z-10 border-b bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 w-7"></TableHead>
                    <TableHead className="w-32 text-xs font-semibold uppercase text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="w-36 text-xs font-semibold uppercase text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="w-24 text-xs font-semibold uppercase text-muted-foreground">
                      Messages
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                      Channel
                    </TableHead>
                    <TableHead className="h-10 w-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranscripts.map((transcript) => (
                    <TranscriptCard
                      key={transcript._id}
                      transcript={transcript}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Load More Button */}
            {pagination.hasMore && channelFilter === "all" && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {/* Showing count */}
            <div className="py-4 text-center text-sm text-muted-foreground">
              Showing {filteredTranscripts.length} of {pagination.total}{" "}
              transcripts
            </div>
          </>
        )}
      </div>
    </div>
  );
}

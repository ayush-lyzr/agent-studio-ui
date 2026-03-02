import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import useStore from "@/lib/store";
import {
  useSchedulerService,
  ExecutionResponse,
} from "@/pages/create-agent/components/automation.service";
import axios from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { formatTimeAgo, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/custom/markdown";

const getColumns = (
  agentNameMap: Record<string, string>,
): ColumnDef<ExecutionResponse>[] => [
  {
    accessorKey: "executed_at",
    header: "Time",
    cell: (props) => {
      const date = formatTime(props.row.original.executed_at);
      return <p className="text-sm">{formatTimeAgo(date)}</p>;
    },
  },
  {
    accessorKey: "success",
    header: "Status",
    cell: (props) => {
      const success = props.row.original.success;
      return (
        <Badge variant={success ? "default" : "destructive"}>
          {success ? "Success" : "Failed"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "agent_id",
    header: "Agent Name",
    cell: (props) => {
      const agentId = props.row.original.agent_id;
      const agentName = agentNameMap[agentId] ?? "";
      return <p className="text-sm">{agentName}</p>;
    },
  },
  {
    accessorKey: "error_message",
    header: "Error",
    cell: (props) => {
      const error = props.row.original.error_message;
      return (
        <p className="max-w-[300px] truncate text-sm text-muted-foreground">
          {error || "-"}
        </p>
      );
    },
  },
];

type FilterType = "all" | "success" | "failure" | "scheduler" | "trigger";
type TimeframeFilter = "all" | "1h" | "6h" | "24h" | "7d";

const STATUS_FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "failure", label: "Failure" },
  { key: "scheduler", label: "Scheduler" },
  { key: "trigger", label: "Trigger" },
];

const Executions = () => {
  const navigate = useNavigate();
  const apiKey = useStore((state) => state?.api_key ?? "");
  const agents = useStore((state) => state.agents ?? []);

  const [filter, setFilter] = useState<FilterType>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] =
    useState<TimeframeFilter>("all");
  // const [searchQuery, setSearchQuery] = useState("");
  // const [searchExpanded, setSearchExpanded] = useState(false);
  const [agentNameMap, setAgentNameMap] = useState<Record<string, string>>({});
  const [selectedExecution, setSelectedExecution] =
    useState<ExecutionResponse | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const {
    executions,
    executionsTotal,
    isFetchingExecutions,
    getWebhooksLogs,
    isFetchingWebhookLogs,
    webhooksLogsData,
  } = useSchedulerService({
    apiKey,
    executionsPagination: {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
  });

  const webhookExecutions = useMemo(
    () => webhooksLogsData?.data?.executions ?? [],
    [webhooksLogsData],
  );
  const webhookExecutionsTotal = useMemo(
    () =>
      webhooksLogsData?.data?.total ??
      webhooksLogsData?.data?.total_count ??
      null,
    [webhooksLogsData],
  );
  const triggerCount = useMemo(
    () =>
      webhooksLogsData?.data?.total ?? webhooksLogsData?.data?.total_count ?? 0,
    [webhooksLogsData],
  );

  // Server-side total pages (when API returns total)
  const totalPages =
    filter === "trigger"
      ? webhookExecutionsTotal != null
        ? Math.ceil(webhookExecutionsTotal / pagination.pageSize)
        : null
      : executionsTotal != null
        ? Math.ceil(executionsTotal / pagination.pageSize)
        : null;
  const hasNextPage =
    totalPages != null
      ? pagination.pageIndex + 1 < totalPages
      : filter === "trigger"
        ? webhookExecutions.length === pagination.pageSize
        : executions.length === pagination.pageSize;
  const hasPreviousPage = pagination.pageIndex > 0;

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };
  // Get unique agent IDs from executions (current page)
  const uniqueAgentIds = useMemo(() => {
    const agentIds = new Set<string>();

    // Add agent IDs from scheduler executions
    if (executions && executions.length > 0) {
      executions.forEach((exec: ExecutionResponse) => {
        agentIds.add(exec.agent_id);
      });
    }

    // Add agent IDs from webhook executions
    if (webhookExecutions && webhookExecutions.length > 0) {
      webhookExecutions.forEach((exec: any) => {
        if (exec.agent_id) {
          agentIds.add(exec.agent_id);
        }
      });
    }

    return Array.from(agentIds);
  }, [executions, webhookExecutions]);

  // Get agent names from store first
  const agentNamesFromStore = useMemo(() => {
    const nameMap: Record<string, string> = {};
    uniqueAgentIds.forEach((agentId) => {
      const agent = agents.find(
        (a: any) => a.id === agentId || a._id === agentId,
      );
      if (agent?.name) {
        nameMap[agentId] = agent.name;
      }
    });
    return nameMap;
  }, [uniqueAgentIds, agents]);

  // Get agent IDs that need to be fetched (not in store)
  const agentIdsToFetch = useMemo(() => {
    return uniqueAgentIds.filter((id) => !agentNamesFromStore[id]);
  }, [uniqueAgentIds, agentNamesFromStore]);

  // Fetch missing agent names using useQueries (stable query config to avoid unnecessary re-runs)
  const agentQueriesConfig = useMemo(
    () =>
      agentIdsToFetch.map((agentId) => ({
        queryKey: ["getAgentById", agentId, apiKey] as const,
        queryFn: () =>
          axios.get(`/agents/${agentId}`, {
            headers: { "x-api-key": apiKey },
          }),
        select: (res: AxiosResponse) => res.data,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!apiKey && agentIdsToFetch.length > 0,
      })),
    [agentIdsToFetch, apiKey],
  );
  const agentQueries = useQueries({ queries: agentQueriesConfig });

  useEffect(() => {
    const nameMap: Record<string, string> = { ...agentNamesFromStore };

    agentQueries.forEach((query, index) => {
      const agentId = agentIdsToFetch[index];
      const agentData = query.data as any;
      if (agentData?.name) {
        nameMap[agentId] = agentData.name;
      } else if (!nameMap[agentId]) {
        nameMap[agentId] = agentId;
      }
    });

    setAgentNameMap((prev) => {
      const prevKeys = Object.keys(prev).sort().join();
      const nextKeys = Object.keys(nameMap).sort().join();
      if (prevKeys !== nextKeys) return nameMap;
      for (const k of Object.keys(nameMap)) {
        if (prev[k] !== nameMap[k]) return nameMap;
      }
      return prev;
    });
  }, [agentQueries, agentIdsToFetch, agentNamesFromStore]);

  // Get unique agents with names for dropdown
  const uniqueAgents = useMemo(() => {
    return uniqueAgentIds.map((agentId) => ({
      id: agentId,
      name: agentNameMap[agentId] || agentId.slice(0, 8) + "...",
    }));
  }, [uniqueAgentIds, agentNameMap]);

  useEffect(() => {
    if (!apiKey) return;
    if (filter === "trigger") {
      getWebhooksLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
    } else {
      getWebhooksLogs({ page: 1, limit: 15 });
    }
  }, [
    apiKey,
    filter,
    pagination.pageIndex,
    pagination.pageSize,
    getWebhooksLogs,
  ]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!executions || executions.length === 0) {
      return {
        all: 0,
        success: 0,
        failure: 0,
        scheduler: 0,
        trigger: triggerCount,
      };
    }

    return {
      all: executions.length,
      success: executions.filter((e: ExecutionResponse) => e.success).length,
      failure: executions.filter((e: ExecutionResponse) => !e.success).length,
      scheduler: executions.filter(
        (e: ExecutionResponse) => e.schedule_id && e.schedule_id.trim() !== "",
      ).length,
      trigger: triggerCount,
    };
  }, [executions, triggerCount]);

  const getTimeframeCutoff = (
    timeframe: Exclude<TimeframeFilter, "all">,
    from = new Date(),
  ): Date => {
    const ms = from.getTime();
    switch (timeframe) {
      case "1h":
        return new Date(ms - 60 * 60 * 1000);
      case "6h":
        return new Date(ms - 6 * 60 * 60 * 1000);
      case "24h":
        return new Date(ms - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(ms - 7 * 24 * 60 * 60 * 1000);
    }
  };

  // Filter and search executions
  const filteredExecutions = useMemo(() => {
    // If trigger filter is selected, use webhook executions
    if (filter === "trigger") {
      let webhookFiltered = webhookExecutions.map((exec: any) => ({
        id: exec.id,
        schedule_id: "",
        agent_id: exec.agent_id,
        user_id: "",
        session_id: exec.session_id,
        executed_at: exec.triggered_at,
        attempt: 1,
        max_attempts: 1,
        success: exec.success,
        response_status: exec.response_status,
        error_message: exec.error_message,
        payload_message: exec.payload ? JSON.stringify(exec.payload) : null,
        response_output: exec.response_output,
        webhook_id: exec.webhook_id,
      }));

      // Apply agent filter to webhook executions
      if (agentFilter !== "all") {
        webhookFiltered = webhookFiltered.filter(
          (e: any) => e.agent_id === agentFilter,
        );
      }

      // Apply timeframe filter to webhook executions
      if (timeframeFilter !== "all") {
        const cutoffTime = getTimeframeCutoff(timeframeFilter);
        webhookFiltered = webhookFiltered.filter((e: any) => {
          const executedAt = formatTime(e.executed_at);
          if (isNaN(executedAt.getTime()) || isNaN(cutoffTime.getTime())) {
            return false;
          }
          return executedAt >= cutoffTime;
        });
      }

      return webhookFiltered;
    }

    if (!executions || executions.length === 0) return [];

    let filtered = [...executions];

    // Apply status filter
    if (filter !== "all") {
      switch (filter) {
        case "success":
          filtered = filtered.filter((e) => e.success);
          break;
        case "failure":
          filtered = filtered.filter((e) => !e.success);
          break;
        case "scheduler":
          filtered = filtered.filter(
            (e) => e.schedule_id && e.schedule_id.trim() !== "",
          );
          break;
      }
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      // agentFilter is the agent ID, filter by matching agent_id
      filtered = filtered.filter((e) => e.agent_id === agentFilter);
    }

    // Apply timeframe filter
    if (timeframeFilter !== "all") {
      const cutoffTime = getTimeframeCutoff(timeframeFilter);
      filtered = filtered.filter((e) => {
        const executedAt = formatTime(e.executed_at);
        if (isNaN(executedAt.getTime()) || isNaN(cutoffTime.getTime())) {
          return false;
        }
        return executedAt >= cutoffTime;
      });
    }

    // Apply search query
    // if (searchQuery.trim() !== "") {
    //   const query = searchQuery.toLowerCase();
    //   filtered = filtered.filter((e) => {
    //     return (
    //       e.id.toLowerCase().includes(query) ||
    //       e.schedule_id.toLowerCase().includes(query) ||
    //       e.agent_id.toLowerCase().includes(query) ||
    //       e.session_id.toLowerCase().includes(query) ||
    //       (e.error_message && e.error_message.toLowerCase().includes(query))
    //     );
    //   });
    // }

    return filtered;
  }, [executions, filter, agentFilter, timeframeFilter, webhookExecutions]);

  const columns = useMemo(() => getColumns(agentNameMap), [agentNameMap]);

  const table = useReactTable({
    data: filteredExecutions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const getPageNumbers = (current: number, total: number) => {
    const delta = 2;
    const range: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }

    return range;
  };

  const currentPage = pagination.pageIndex + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 px-8 py-4"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <PageTitle
          title="Executions"
          description="View and manage agent execution history and performance metrics"
        />
      </div>

      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTER_OPTIONS.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(f.key as FilterType)}
                className="h-7 text-xs"
              >
                {f.label}
                <Badge
                  variant="secondary"
                  className="ml-1.5 px-1.5 py-0 text-[10px]"
                >
                  {filterCounts[f.key as keyof typeof filterCounts]}
                </Badge>
              </Button>
            ))}

            {/* Agent Filter */}
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="h-7 w-[140px] text-xs">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {uniqueAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Timeframe Filter */}
            <Select
              value={timeframeFilter}
              onValueChange={(v) => setTimeframeFilter(v as TimeframeFilter)}
            >
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="6h">Last 6 hours</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Icons */}
          {/* <div className="flex items-center gap-1">
            {searchExpanded ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search executions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setSearchExpanded(false)}
                  autoFocus
                  className="h-9 w-64 pl-9"
                />
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-secondary"
                    onClick={() => setSearchExpanded(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Search executions</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-secondary"
                  onClick={() => {
                    getRecentExecutions();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Refresh</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-secondary"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Filter options</p>
              </TooltipContent>
            </Tooltip>
          </div> */}
        </div>

        {/* Data Table */}
        {isFetchingExecutions ||
        (filter === "trigger" && isFetchingWebhookLogs) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading executions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      className="rounded-t-md border-none bg-secondary"
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            style={{
                              minWidth: header.column.columnDef.size,
                              maxWidth: header.column.columnDef.size,
                            }}
                            key={header.id}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer border-b hover:bg-muted/50"
                        onClick={() => {
                          setSelectedExecution(row.original);
                          setIsSheetOpen(true);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell className="border-none py-2" key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-none">
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls (server-side) */}
            {(filteredExecutions.length > 0 ||
              pagination.pageIndex > 0 ||
              hasNextPage) && (
              <div className="flex items-center justify-between p-2">
                {/* Page Size Selector */}
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) => {
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: Number(value),
                      pageIndex: 0,
                    }));
                  }}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="15">15 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: Math.max(0, prev.pageIndex - 1),
                      }))
                    }
                    disabled={!hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {totalPages != null &&
                    getPageNumbers(currentPage, totalPages).map(
                      (page, index) =>
                        page === "..." ? (
                          <div key={`ellipsis-${index}`} className="px-2">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <Button
                            key={`page-${page}`}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                pageIndex: Number(page) - 1,
                              }))
                            }
                            className="hidden sm:inline-flex"
                          >
                            {page}
                          </Button>
                        ),
                    )}

                  {totalPages == null && (
                    <span className="px-2 text-xs text-muted-foreground">
                      Page {currentPage}
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex + 1,
                      }))
                    }
                    disabled={!hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execution Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedExecution && (
            <ExecutionDetailsSheet
              execution={selectedExecution}
              agentName={agentNameMap[selectedExecution.agent_id] ?? ""}
            />
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

// Execution Details Sheet Component
interface ExecutionDetailsSheetProps {
  execution: ExecutionResponse;
  agentName: string;
}

const ExecutionDetailsSheet = memo(function ExecutionDetailsSheet({
  execution,
  agentName,
}: ExecutionDetailsSheetProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Check if this is a webhook execution
  const isWebhookExecution = !!(execution as any).webhook_id;

  // Safely format date
  const getFormattedDate = () => {
    try {
      if (!execution.executed_at) return "N/A";
      const date = formatTime(execution.executed_at);
      if (isNaN(date.getTime())) return "Invalid date";
      return formatTimeAgo(date);
    } catch (error) {
      return "Invalid date";
    }
  };

  // Parse input data - handle both webhook and scheduler executions
  const getInputContent = () => {
    if (!execution.payload_message) return "No input data";

    try {
      if (typeof execution.payload_message === "string") {
        const parsed = JSON.parse(execution.payload_message);
        return typeof parsed === "object"
          ? JSON.stringify(parsed, null, 2)
          : String(parsed);
      }
      return typeof execution.payload_message === "object"
        ? JSON.stringify(execution.payload_message, null, 2)
        : String(execution.payload_message);
    } catch {
      return String(execution.payload_message);
    }
  };

  // Parse output data safely
  const getOutputContent = () => {
    if (!execution.response_output) return "No output data";

    try {
      const parsed =
        typeof execution.response_output === "string"
          ? JSON.parse(execution.response_output)
          : execution.response_output;

      // Try to extract the response field if it exists
      if (parsed?.response) {
        return String(parsed.response);
      }

      // Otherwise return the whole parsed object as formatted JSON
      return typeof parsed === "object"
        ? JSON.stringify(parsed, null, 2)
        : String(parsed);
    } catch {
      return String(execution.response_output);
    }
  };

  const getOutputForCopy = () => {
    if (!execution.response_output) return "";

    try {
      const parsed =
        typeof execution.response_output === "string"
          ? JSON.parse(execution.response_output)
          : execution.response_output;

      if (parsed?.response) {
        return String(parsed.response);
      }

      return typeof parsed === "object"
        ? JSON.stringify(parsed, null, 2)
        : String(execution.response_output);
    } catch {
      return String(execution.response_output);
    }
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Execution Details</SheetTitle>
        <SheetDescription>
          View detailed information about this execution
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-6 pr-4">
          {/* Execution Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Execution Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">TIME</p>
                <p className="text-sm font-medium">{getFormattedDate()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">STATUS</p>
                <Badge
                  variant={execution.success ? "default" : "destructive"}
                  className="w-fit"
                >
                  {execution.success ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Success
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Agent & Schedule Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Agent Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent Name:</span>
                <span className="font-medium">{agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent ID:</span>
                <span className="font-mono text-xs">{execution.agent_id}</span>
              </div>
              {isWebhookExecution && (execution as any).webhook_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Webhook ID:</span>
                  <span className="font-mono text-xs">
                    {(execution as any).webhook_id}
                  </span>
                </div>
              )}
              {!isWebhookExecution && execution.schedule_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule ID:</span>
                  <span className="font-mono text-xs">
                    {execution.schedule_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution ID:</span>
                <span className="font-mono text-xs">{execution.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-xs">
                  {execution.session_id}
                </span>
              </div>
              {execution.response_status != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Response Status:
                  </span>
                  <Badge
                    variant={
                      execution.response_status >= 200 &&
                      execution.response_status < 300
                        ? "default"
                        : execution.response_status >= 400
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {execution.response_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">INPUT</h3>
            </div>
            <div className="rounded-md border bg-muted/50 p-2">
              <MarkdownRenderer content={getInputContent()} />
            </div>
          </div>

          <Separator />

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">OUTPUT</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => copyToClipboard(getOutputForCopy())}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            </div>
            <div className="rounded-md border bg-muted/50 p-2">
              <MarkdownRenderer content={getOutputContent()} />
            </div>
          </div>

          {/* Error Message */}
          {execution.error_message && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-destructive">
                  ERROR MESSAGE
                </h3>
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    {execution.error_message}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default Executions;

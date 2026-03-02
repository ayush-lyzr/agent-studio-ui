import { useEffect, useMemo, useState } from "react";
import type { AxiosResponse } from "axios";
import { useQueries } from "@tanstack/react-query";
import {
  Loader2,
  PauseIcon,
  PlayIcon,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  ScheduleResponse,
  useSchedulerService,
} from "@/pages/create-agent/components/automation.service";

type SchedulerItem = ScheduleResponse & {
  id?: string;
  _id?: string;
  is_active?: boolean;
  next_run_time?: string | null;
  last_run_at?: string | null;
};

const EMPTY_AGENTS: any[] = [];

const getScheduleId = (schedule: SchedulerItem) =>
  schedule.id || schedule._id || "";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export default function ViewScheduler() {
  const apiKey = useStore((s) => s?.api_key ?? "");
  const agents = useStore((s) => s.agents ?? EMPTY_AGENTS);

  const {
    getAllSchedulers,
    scheduleAction,
    isSchedulingAction,
    deleteSchedule,
    isDeletingSchedule,
  } = useSchedulerService({ apiKey });

  const [schedules, setSchedules] = useState<SchedulerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!apiKey) return;
    setIsLoading(true);
    try {
      const response = (await getAllSchedulers()) as AxiosResponse<any>;
      const maybeList =
        response?.data?.schedules ??
        response?.data?.data?.schedules ??
        response?.data ??
        [];
      setSchedules(Array.isArray(maybeList) ? maybeList : []);
    } catch (e) {
      toast.error("Failed to load schedules");
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const uniqueAgentIds = useMemo(() => {
    const ids = new Set<string>();
    schedules.forEach((s) => {
      if (s.agent_id) ids.add(s.agent_id);
    });
    return Array.from(ids);
  }, [schedules]);

  const agentNamesFromStore = useMemo(() => {
    const map: Record<string, string> = {};
    uniqueAgentIds.forEach((agentId) => {
      const agent = agents.find(
        (a: any) => a.id === agentId || a._id === agentId,
      );
      if (agent?.name) map[agentId] = agent.name;
    });
    return map;
  }, [agents, uniqueAgentIds]);

  const agentIdsToFetch = useMemo(
    () => uniqueAgentIds.filter((id) => !agentNamesFromStore[id]),
    [uniqueAgentIds, agentNamesFromStore],
  );

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

  const agentNameMap = useMemo(() => {
    const map: Record<string, string> = { ...agentNamesFromStore };
    agentQueries.forEach((query, index) => {
      const agentId = agentIdsToFetch[index];
      const agentData = query.data as any;
      if (agentId && agentData?.name) map[agentId] = agentData.name;
      if (agentId && !map[agentId]) map[agentId] = agentId.slice(0, 8) + "...";
    });
    return map;
  }, [agentIdsToFetch, agentNamesFromStore, agentQueries]);

  const handleToggleActive = async (schedule: SchedulerItem) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) return;

    const isActive = schedule.is_active ?? false;
    try {
      await scheduleAction({
        scheduleId,
        action: isActive ? "pause" : "resume",
      });
      toast.success(isActive ? "Schedule paused" : "Schedule resumed");
      await refresh();
    } catch (e) {
      toast.error("Failed to update schedule");
    }
  };

  const handleDelete = async (schedule: SchedulerItem) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) return;
    try {
      await deleteSchedule(scheduleId);
      toast.success("Schedule deleted");
      await refresh();
    } catch (e) {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 px-8 py-4">
      <div className="flex items-center justify-between gap-3">
        <PageTitle
          title="Schedulers"
          description="View and manage schedules."
        />

        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={!apiKey || isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {!apiKey ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          API key is missing. Please configure an API key to view schedules.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Max retries</TableHead>
                <TableHead>Retry delay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next run time</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading schedules...
                    </div>
                  </TableCell>
                </TableRow>
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="text-sm text-muted-foreground">
                      No schedules found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const scheduleId = getScheduleId(schedule);
                  const isActive = schedule.is_active ?? false;
                  const agentName =
                    agentNameMap[schedule.agent_id] ||
                    schedule.agent_id?.slice(0, 8) + "...";

                  return (
                    <TableRow
                      key={
                        scheduleId ||
                        `${schedule.agent_id}-${schedule.cron_expression}`
                      }
                    >
                      <TableCell className="font-medium">{agentName}</TableCell>
                      <TableCell>{schedule.max_retries ?? "-"}</TableCell>
                      <TableCell>
                        {schedule.retry_delay != null
                          ? `${schedule.retry_delay}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "success" : "secondary"}>
                          {isActive ? "Active" : "Paused"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(schedule.next_run_time)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleActive(schedule)}
                            disabled={
                              !scheduleId || isSchedulingAction || isLoading
                            }
                          >
                            {isSchedulingAction ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isActive ? (
                              <PauseIcon className="mr-2 h-4 w-4" />
                            ) : (
                              <PlayIcon className="mr-2 h-4 w-4" />
                            )}
                            {isActive ? "Pause" : "Resume"}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={
                                  !scheduleId || isDeletingSchedule || isLoading
                                }
                              >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete schedule?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the schedule for{" "}
                                  <span className="font-medium">
                                    {agentName}
                                  </span>
                                  .
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => void handleDelete(schedule)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

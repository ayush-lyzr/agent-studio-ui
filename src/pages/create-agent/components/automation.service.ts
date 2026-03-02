import { AxiosResponse } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { SCHEDULER_URL } from "@/lib/constants";

export interface CreateSchedulePayload {
  agent_id: string;
  cron_expression: string;
  max_retries?: number;
  message: string;
  retry_delay?: number;
  timezone?: string;
  user_id: string;
}

export interface ScheduleResponse {
  _id?: string;
  id?: string;
  agent_id: string;
  cron_expression: string;
  max_retries: number;
  message: string;
  retry_delay: number;
  timezone: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  next_run_time?: string | null;
  last_run_at?: string | null;
}

export interface ExecutionResponse {
  id: string;
  schedule_id: string;
  agent_id: string;
  user_id: string;
  session_id: string;
  executed_at: string;
  attempt: number;
  max_attempts: number;
  success: boolean;
  response_status: number;
  error_message: string | null;
  payload_message: string | null;
  response_output: string | null;
}

export interface CreateWebhookPayload {
  agent_id: string;
  user_id: string;
}

type ScheduleAction = "pause" | "resume" | "trigger";

type WebhookAction = "pause" | "resume" | "regenerate-secret";

export type ExecutionsPagination = {
  page: number;
  limit: number;
};

export const useSchedulerService = ({
  apiKey,
  executionsPagination,
}: {
  apiKey: string;
  executionsPagination?: ExecutionsPagination;
}) => {
  const params = { headers: { "x-api-key": apiKey } };

  const { data: schedule, mutateAsync: getScheduleByAgentId } =
    useMutation({
      mutationKey: ["getScheduleByAgentId"],
      mutationFn: ({
        agentId,
      }: {
        agentId: string;
      }) =>
        axios.get(`/schedules/by-agent/${agentId}`, {
          baseURL: SCHEDULER_URL,
          headers: { "x-api-key": apiKey },
        }),
    });

  const { data: allSchedulers, mutateAsync: getAllSchedulers } =
    useMutation({
      mutationKey: ["getAllSchedulers"],
      mutationFn: () =>
        axios.get(`/schedules/`, {
          baseURL: SCHEDULER_URL,
          headers: { "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: scheduleAction, isPending: isSchedulingAction } =
    useMutation({
      mutationKey: ["scheduleAction", apiKey],
      mutationFn: ({ scheduleId, action }: { scheduleId: string; action: ScheduleAction }) =>
        axios.post(
          `/schedules/${scheduleId}/${action}`,
          {},
          {
            baseURL: SCHEDULER_URL,
            ...params,
          },
        ),
    });

  const { mutateAsync: createSchedule, isPending: isCreatingSchedule } =
    useMutation({
      mutationKey: ["createSchedule", apiKey],
      mutationFn: (payload: CreateSchedulePayload) =>
        axios.post(
          "/schedules/",
          payload,
          {
            baseURL: SCHEDULER_URL,
            ...params,
          },
        ),
      onSuccess: (res: AxiosResponse) => {
        toast.success("Schedule created successfully");
        return res.data;
      },
    });

  // Bulk pause schedules accepts an array of schedule ids
  const { mutateAsync: bulkPauseSchedules, isPending: isBulkPausing } =
    useMutation({
      mutationKey: ["bulkPauseSchedules", apiKey],
      mutationFn: (scheduleIds: string[]) =>
        axios.post(
          `/schedules/pause-bulk/`,
scheduleIds,
          {
            baseURL: SCHEDULER_URL,
            ...params,
          },
        ),
    });

  const { mutateAsync: deleteSchedule, isPending: isDeletingSchedule } =
    useMutation({
      mutationKey: ["deleteSchedule"],
      mutationFn: (scheduleId: string) =>
        axios.delete(`/schedules/${scheduleId}`, {
          baseURL: SCHEDULER_URL,
          ...params,
        }),
    });

  const page = executionsPagination?.page ?? 1;
  const limit = executionsPagination?.limit ?? 50;

  const {
    isFetching: isFetchingExecutions,
    refetch: getRecentExecutions,
    data: executionsData,
  } = useQuery({
    queryKey: ["getRecentExecutions", apiKey, page, limit],
    queryFn: async () => {
      const response = await axios.get(
        `/schedules/executions/recent`,
        {
          baseURL: SCHEDULER_URL,
          ...params,
          params: { page, limit },
        },
      );

      return {
        executions: response.data?.executions ?? [],
        total: response.data?.total ?? response.data?.total_count ?? null,
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!apiKey,
  });

  const { mutateAsync: createWebhook, isPending: isCreatingWebhook } =
    useMutation({
      mutationKey: ["createWebhook", apiKey],
      mutationFn: (payload: CreateWebhookPayload) =>
        axios.post(
          "/agent-webhooks/",
          payload,
          {
            baseURL: SCHEDULER_URL,
            ...params,
          },
        ),
    });

  const { mutateAsync: getWebhooks } = useMutation({
    mutationKey: ["getWebhooks", apiKey],
    mutationFn: () =>
      axios.get(`/agent-webhooks/`, {
        baseURL: SCHEDULER_URL,
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: getWebhooksByAgentId } = useMutation({
    mutationKey: ["getWebhooksByAgentId", apiKey],
    mutationFn: ({ agentId }: { agentId: string }) =>
      axios.get(`/agent-webhooks/`, {
        baseURL: SCHEDULER_URL,
        headers: { "x-api-key": apiKey },
        params: { agent_id: agentId },
      }),
  });

  const { mutateAsync: webhookAction } =
    useMutation({
      mutationKey: ["webhookAction", apiKey],
      mutationFn: ({ webhookId, action }: { webhookId: string; action: WebhookAction }) =>
        axios.post(
          `/agent-webhooks/${webhookId}/${action}`,
          {},
          {
            baseURL: SCHEDULER_URL,
            ...params,
          }),
    });

  const { data: webhooksLogsData, mutateAsync: getWebhooksLogs, isPending: isFetchingWebhookLogs } =
    useMutation({
      mutationKey: ["getWebhooksLogs"],
      mutationFn: ({
        page,
        limit,
      }: {
        page: number;
        limit: number;
      }) =>
        axios.get(`/agent-webhooks/executions/recent`, {
          baseURL: SCHEDULER_URL,
          ...params,
          params: { page, limit },
        }),
    });

  const { mutateAsync: deleteWebhook, isPending: isDeletingWebhook } =
    useMutation({
      mutationKey: ["deleteWebhook"],
      mutationFn: (webhookId: string) =>
        axios.delete(`/agent-webhooks/${webhookId}`, {
          ...params,
          baseURL: SCHEDULER_URL,
        }),
    });


  const executions = executionsData?.executions ?? [];
  const executionsTotal = executionsData?.total ?? null;

  return {
    bulkPauseSchedules,
    isBulkPausing,
    createSchedule,
    isCreatingSchedule,
    deleteSchedule,
    isDeletingSchedule,
    executions,
    executionsTotal,
    isFetchingExecutions,
    getRecentExecutions,
    getScheduleByAgentId,
    schedule,
    scheduleAction,
    isSchedulingAction,
    getAllSchedulers,
    allSchedulers,

    // Triggers
    createWebhook,
    isCreatingWebhook,
    getWebhooksByAgentId,
    getWebhooks,
    webhookAction,
    getWebhooksLogs,
    isFetchingWebhookLogs,
    webhooksLogsData,
    deleteWebhook,
    isDeletingWebhook,
  };
};

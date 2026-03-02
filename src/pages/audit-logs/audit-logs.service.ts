import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import {
  AuditLogListResponse,
  AuditStatsResponse,
  AuditLogResponse,
  AuditLogFilters,
} from "./types";

export const useAuditLogs = (
  apiKey: string,
  filters: AuditLogFilters = {},
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: () =>
      axios.get<AuditLogListResponse>("/audit-logs/", {
        headers: { "x-api-key": apiKey },
        params: {
          ...filters,
          limit: filters.limit ?? 100,
          offset: filters.offset ?? 0,
        },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useMyAuditLogs = (
  apiKey: string,
  filters: Omit<AuditLogFilters, "user_id"> = {},
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["myAuditLogs", filters],
    queryFn: () =>
      axios.get<AuditLogListResponse>("/audit-logs/me", {
        headers: { "x-api-key": apiKey },
        params: {
          ...filters,
          limit: filters.limit ?? 100,
          offset: filters.offset ?? 0,
        },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useUserAuditLogs = (
  apiKey: string,
  userId: string,
  filters: Omit<AuditLogFilters, "user_id"> = {},
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["userAuditLogs", userId, filters],
    queryFn: () =>
      axios.get<AuditLogListResponse>(`/audit-logs/user/${userId}`, {
        headers: { "x-api-key": apiKey },
        params: {
          ...filters,
          limit: filters.limit ?? 100,
          offset: filters.offset ?? 0,
        },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && !!userId && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useResourceAuditLogs = (
  apiKey: string,
  resourceType: string,
  resourceId: string,
  filters: Omit<AuditLogFilters, "resource_type" | "resource_id"> = {},
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["resourceAuditLogs", resourceType, resourceId, filters],
    queryFn: () =>
      axios.get<AuditLogListResponse>(
        `/audit-logs/resource/${resourceType}/${resourceId}`,
        {
          headers: { "x-api-key": apiKey },
          params: {
            ...filters,
            limit: filters.limit ?? 50,
            offset: filters.offset ?? 0,
          },
        }
      ),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && !!resourceType && !!resourceId && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useSessionAuditLogs = (
  apiKey: string,
  sessionId: string,
  limit = 100,
  offset = 0,
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["sessionAuditLogs", sessionId, limit, offset],
    queryFn: () =>
      axios.get<AuditLogListResponse>(`/audit-logs/session/${sessionId}`, {
        headers: { "x-api-key": apiKey },
        params: { limit, offset },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && !!sessionId && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useAuditStats = (
  apiKey: string,
  startTime?: string,
  endTime?: string,
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["auditStats", startTime, endTime],
    queryFn: () =>
      axios.get<AuditStatsResponse>("/audit-logs/stats", {
        headers: { "x-api-key": apiKey },
        params: {
          ...(startTime && { start_time: startTime }),
          ...(endTime && { end_time: endTime }),
        },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

export const useAuditLogById = (
  apiKey: string,
  logId: string,
  enabled = true
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["auditLog", logId],
    queryFn: () =>
      axios.get<AuditLogResponse>(`/audit-logs/${logId}`, {
        headers: { "x-api-key": apiKey },
      }),
    select: (res) => res.data,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!apiKey && !!logId && enabled,
  });

  return { data, isLoading, error, refetch, isRefetching };
};

import { useQuery } from "@tanstack/react-query";
import axios from '@/lib/axios';

export interface Trace {
    trace_id: string;
    name: string;
    trace_start_time: string;
    trace_end_time: string;
    trace_duration: number;
    agent_id: string;
    action_cost: number | null;
    llm_input_tokens: number;
    llm_output_tokens: number;
    total_spans: number;
}

export interface DailyMetric {
    date: string;
    credits_consumed: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    total_traces: number;
    total_spans: number;
    success_count: number;
    error_count: number;
    error_rate: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
}

export interface TopAgent {
    name: string;
    count: number;
    credits: number;
}

export interface TopTool {
    name: string;
    count: number;
}

export interface TopModule {
    name: string;
    count: number;
}

export interface DashboardData {
    daily_metrics: DailyMetric[];
    total_credits_consumed: number;
    total_traces: number;
    total_spans: number;
    total_input_tokens: number;
    total_output_tokens: number;
    avg_latency_ms: number;
    avg_error_rate: number;
    top_agents: TopAgent[];
    top_tools: TopTool[];
    top_modules: TopModule[];
}

export interface TraceFilters {
    agent_id?: string;
    trace_id?: string;
    session_id?: string;
    query_user_id?: string;
    start_time?: string;
    end_time?: string;
}

export interface AnalyticsFilters {
    days?: number;
    agent_id?: string;
    session_id?: string;
    query_user_id?: string;
    start_time?: string;
    end_time?: string;
}

export const getRootSpans = (
    apiKey: string,
    limit: number = 10,
    offset: number = 0,
    filters?: TraceFilters
) => {
    const { data, isLoading: loading, error, refetch, isRefetching } = useQuery({
        queryKey: ["getCredits", limit, offset, filters],
        queryFn: () => axios.get("/traces", {
            headers: {
                'x-api-key': apiKey
            },
            params: {
                limit,
                offset,
                ...filters
            }
        }),
        select: (res) => res.data,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !!apiKey, // Only fetch when API key is available
    });

    return { data, loading, error, refetch, isRefetching };
}

export const getTraceDashboard = (apiKey: string, filters?: AnalyticsFilters) => {
    const { data, isLoading: loading, error, refetch, isRefetching } = useQuery({
        queryKey: ["getTraceDashboard", filters],
        queryFn: () => axios.get("/traces/dashboard", {
            headers: {
                'x-api-key': apiKey
            },
            params: {
                ...filters
            }
        }),
        select: (res) => res.data as DashboardData,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !!apiKey, // Only fetch when API key is available
    });

    return { data, loading, error, refetch, isRefetching };
}
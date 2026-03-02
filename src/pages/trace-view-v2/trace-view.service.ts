import { useQuery } from "@tanstack/react-query";
import axios from '@/lib/axios';

export interface SpanEvent {
    timestamp: string;
    name: string;
    attributes: {
        [key: string]: any;
    };
}

export interface SpanTreeNode {
    id: string;
    span_name: string;
    service_name: string;
    startTime: number; // Unix timestamp in milliseconds
    duration: number; // Duration in ms
    hasError: boolean;
    spanKind: string;
    statusCode: string;
    tags: {
        [key: string]: any;
    };
    events: SpanEvent[];
    children: SpanTreeNode[];
}

export interface TraceGanttData {
    trace_id: string;
    total_duration_ms: number;
    start_time: string;
    end_time: string;
    span_tree: SpanTreeNode;
}

export interface TraceMetadata {
    globalStart: number;
    globalEnd: number;
    spread: number;
    totalSpans: number;
    levels: number;
}

export interface TraceDetailedSummary {
    trace_id: string;
    agent_id?: string | null;
    agent_name?: string | null;
    llm_provider?: string | null;
    llm_model?: string | null;

    // Tool call counts
    tool_call_count: number;
    mcp_tool_call_count: number;
    aci_tool_call_count: number;

    // Token and cost information
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost: number;

    // Duration
    total_duration_ms: number;
}

export const getTraceDetails = (apiKey: string, traceId: string) => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["getTraceDetails", traceId],
        queryFn: () => axios.get(`/traces/${traceId}/gantt`, {
            headers: {
                'x-api-key': apiKey
            }
        }),
        select: (res) => res.data,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !!traceId && !!apiKey,
    });

    return { data, loading, error };
};

export const getTraceSummary = (apiKey: string, traceId: string) => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["getTraceSummary", traceId],
        queryFn: () => axios.get(`/traces/${traceId}/summary`, {
            headers: {
                'x-api-key': apiKey
            }
        }),
        select: (res) => res.data as TraceDetailedSummary,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !!traceId && !!apiKey,
    });

    return { data, loading, error };
};

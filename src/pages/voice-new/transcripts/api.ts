import type {
  AgentTranscriptStats,
  PaginatedResult,
  PaginationParameters,
  StoredTranscript,
  TranscriptListFilters,
} from "./types";
import { getOrgApiKey } from "@/lib/livekit/org-api-key";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function toHeaderObject(input: HeadersInit | undefined): Record<string, string> {
  if (!input) return {};
  return Object.fromEntries(new Headers(input).entries());
}

const BACKEND_URL = normalizeBaseUrl(
  import.meta.env.VITE_LIVEKIT_BACKEND_URL ||
    "https://ba-dc3c74596474493fba4d44a9ea25b57f.ecs.us-east-1.on.aws",
);

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getOrgApiKey();
  if (!apiKey) {
    throw new Error("Missing API key (x-api-key) for transcripts");
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...toHeaderObject(init?.headers),
    },
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const errorData = (await response.json().catch(() => ({}))) as {
    error?: string;
    details?: string;
  };
  const message = errorData.error || `Request failed (${response.status})`;
  throw new Error(
    errorData.details ? `${message}: ${errorData.details}` : message,
  );
}

function toSearchParameters(
  parameters: Record<string, string | number | boolean | undefined>,
): string {
  const entries = Object.entries(parameters).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined,
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ---------------------------------------------------------------------------
// Transcript API
// ---------------------------------------------------------------------------

export const transcriptApi = {
  listTranscripts(
    filters?: TranscriptListFilters,
    pagination?: PaginationParameters,
  ): Promise<PaginatedResult<StoredTranscript>> {
    const qs = toSearchParameters({ ...filters, ...pagination });
    return jsonFetch<PaginatedResult<StoredTranscript>>(
      `/api/transcripts${qs}`,
      { method: "GET" },
    );
  },

  getTranscript(
    sessionId: string,
  ): Promise<{ transcript: StoredTranscript }> {
    return jsonFetch<{ transcript: StoredTranscript }>(
      `/api/transcripts/${encodeURIComponent(sessionId)}`,
      { method: "GET" },
    );
  },

  getTranscriptsByAgent(
    agentId: string,
    pagination?: PaginationParameters,
  ): Promise<PaginatedResult<StoredTranscript>> {
    const qs = toSearchParameters({ ...pagination });
    return jsonFetch<PaginatedResult<StoredTranscript>>(
      `/api/transcripts/agent/${encodeURIComponent(agentId)}${qs}`,
      { method: "GET" },
    );
  },

  getAgentStats(agentId: string): Promise<AgentTranscriptStats> {
    return jsonFetch<AgentTranscriptStats>(
      `/api/transcripts/agent/${encodeURIComponent(agentId)}/stats`,
      { method: "GET" },
    );
  },
};

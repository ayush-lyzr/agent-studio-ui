import type {
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentResponse,
  GetAgentResponse,
  ListAgentsResponse,
  PipelineOptionsResponse,
  RealtimeOptionsResponse,
  SessionRequest,
  SessionResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
} from "./types";
import { getOrgApiKey } from "@/lib/livekit/org-api-key";

function assertNonEmptyAgentName(input: { config?: { agent_name?: string } }) {
  const name = input.config?.agent_name?.trim() ?? "";
  if (!name) {
    throw new Error("Agent name is required");
  }
}

function normalizeBaseUrl(url: string): string {
  // Avoid `//path` when callers provide a trailing slash.
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
    throw new Error("Missing API key (x-api-key) for LiveKit backend");
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

export const backendClient = {
  // --- sessions ---
  createSession(input: SessionRequest): Promise<SessionResponse> {
    return jsonFetch<SessionResponse>("/session", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  endSession(roomName: string): Promise<void> {
    return jsonFetch<void>("/session/end", {
      method: "POST",
      body: JSON.stringify({ roomName }),
    });
  },

  // --- agents ---
  listAgents(): Promise<ListAgentsResponse> {
    return jsonFetch<ListAgentsResponse>("/agents", { method: "GET" });
  },

  getAgent(agentId: string): Promise<GetAgentResponse> {
    return jsonFetch<GetAgentResponse>(`/agents/${agentId}`, { method: "GET" });
  },

  createAgent(input: CreateAgentRequest): Promise<CreateAgentResponse> {
    assertNonEmptyAgentName(input);
    return jsonFetch<CreateAgentResponse>("/agents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateAgent(
    agentId: string,
    input: UpdateAgentRequest,
  ): Promise<UpdateAgentResponse> {
    assertNonEmptyAgentName(input);
    return jsonFetch<UpdateAgentResponse>(`/agents/${agentId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteAgent(agentId: string): Promise<DeleteAgentResponse> {
    return jsonFetch<DeleteAgentResponse>(`/agents/${agentId}`, {
      method: "DELETE",
    });
  },

  // --- config ---
  getRealtimeOptions(): Promise<RealtimeOptionsResponse> {
    return jsonFetch<RealtimeOptionsResponse>("/config/realtime-options", {
      method: "GET",
    });
  },

  getPipelineOptions(): Promise<PipelineOptionsResponse> {
    return jsonFetch<PipelineOptionsResponse>("/config/pipeline-options", {
      method: "GET",
    });
  },
};

import { env } from "@/lib/env";

export interface TranscriptMessage {
  transcript: string;
  role: "assistant" | "user";
  isFinal: boolean;
  transcriptTimestamp: string;
}

export interface TranscriptDocument {
  _id: string;
  callSid: string;
  accountSid: string; // "AC..." for Twilio, "browser" for browser sessions
  sessionId: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
  transcripts: TranscriptMessage[];
}

export interface PaginationInfo {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export interface GetTranscriptsByAgentResponse {
  success: boolean;
  agent_id: string;
  transcripts: TranscriptDocument[];
  pagination: PaginationInfo;
}

export interface AgentStats {
  totalCalls: number;
  totalTranscripts: number;
  avgTranscriptsPerCall: number;
}

export interface GetAgentStatsResponse {
  success: boolean;
  agent_id: string;
  stats: AgentStats;
}

export interface GetTranscriptResponse {
  success: boolean;
  transcript: TranscriptDocument;
}

export interface GetAllTranscriptsResponse {
  success: boolean;
  filters: {
    agentId: string | null;
    accountSid: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  transcripts: TranscriptDocument[];
  pagination: PaginationInfo;
}

const VOICE_API_URL = env.VITE_VOICE_API_URL;

export const transcriptsService = {
  /**
   * Get all transcripts for a specific agent with pagination
   */
  async getTranscriptsByAgent(
    agentId: string,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: string;
      sortOrder?: 1 | -1;
    }
  ): Promise<GetTranscriptsByAgentResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.skip) params.append("skip", options.skip.toString());
    if (options?.sortBy) params.append("sortBy", options.sortBy);
    if (options?.sortOrder)
      params.append("sortOrder", options.sortOrder.toString());

    const response = await fetch(
      `${VOICE_API_URL}/api/transcripts/agent/${agentId}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcripts");
    }

    return response.json();
  },

  /**
   * Get aggregate statistics for an agent's transcripts
   */
  async getAgentStats(
    agentId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<GetAgentStatsResponse> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);

    const response = await fetch(
      `${VOICE_API_URL}/api/transcripts/agent/${agentId}/stats?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch agent stats");
    }

    return response.json();
  },

  /**
   * Get a specific transcript by call SID or session ID
   */
  async getTranscript(callSid: string): Promise<GetTranscriptResponse> {
    const response = await fetch(
      `${VOICE_API_URL}/api/transcripts/${callSid}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcript");
    }

    return response.json();
  },

  /**
   * Get all transcripts with optional filters
   */
  async getAllTranscripts(
    filters?: {
      agentId?: string;
      accountSid?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
      sortBy?: string;
      sortOrder?: 1 | -1;
    }
  ): Promise<GetAllTranscriptsResponse> {
    const params = new URLSearchParams();
    if (filters?.agentId) params.append("agentId", filters.agentId);
    if (filters?.accountSid) params.append("accountSid", filters.accountSid);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.skip) params.append("skip", filters.skip.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder)
      params.append("sortOrder", filters.sortOrder.toString());

    const response = await fetch(
      `${VOICE_API_URL}/api/transcripts?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcripts");
    }

    return response.json();
  },
};

// ---------------------------------------------------------------------------
// Transcript types – mirrors backend StoredTranscript & related schemas
// ---------------------------------------------------------------------------

// ── Session Report Options ──────────────────────────────────────────────────

export interface SessionReportOptions {
  allow_interruptions?: boolean;
  discard_audio_if_uninterruptible?: boolean;
  min_interruption_duration?: number;
  min_interruption_words?: number;
  min_endpointing_delay?: number;
  max_endpointing_delay?: number;
  max_tool_steps?: number;
  user_away_timeout?: number;
  min_consecutive_speech_delay?: number;
  preemptive_generation?: boolean;
}

// ── Conversation Items (discriminated union) ────────────────────────────────

export interface ConversationMessageItem {
  id: string;
  created_at: number;
  type: "message";
  role: "developer" | "system" | "user" | "assistant";
  content: (string | Record<string, unknown>)[];
  interrupted?: boolean;
  transcript_confidence?: number | null;
  metrics?: Record<string, unknown>;
}

export interface ConversationAgentHandoffItem {
  id: string;
  created_at: number;
  type: "agent_handoff";
  new_agent_id: string;
  old_agent_id?: string;
}

export interface ConversationFunctionCallItem {
  id: string;
  created_at: number;
  type: "function_call";
  name: string;
  call_id?: string;
  arguments?: string;
  group_id?: string;
}

export interface ConversationFunctionCallOutputItem {
  id: string;
  created_at: number;
  type: "function_call_output";
  name?: string;
  call_id?: string;
  output?: string;
  is_error?: boolean;
}

export type ConversationItem =
  | ConversationMessageItem
  | ConversationAgentHandoffItem
  | ConversationFunctionCallItem
  | ConversationFunctionCallOutputItem;

// ── Session Events (discriminated union) ────────────────────────────────────

export interface AgentStateChangedEvent {
  type: "agent_state_changed";
  old_state: string;
  new_state: string;
  created_at: number;
}

export interface UserStateChangedEvent {
  type: "user_state_changed";
  old_state: string;
  new_state: string;
  created_at: number;
}

export interface SpeechCreatedEvent {
  type: "speech_created";
  user_initiated?: boolean;
  source?: string;
  created_at: number;
}

export interface ConversationItemAddedEvent {
  type: "conversation_item_added";
  item: Record<string, unknown>;
  created_at: number;
}

export interface UserInputTranscribedEvent {
  type: "user_input_transcribed";
  transcript: string;
  is_final: boolean;
  speaker_id?: string;
  language?: string;
  created_at: number;
}

export interface CloseEvent {
  type: "close";
  error?: string;
  reason?: string;
  created_at: number;
}

export interface FunctionToolsExecutedEvent {
  type: "function_tools_executed";
  function_calls?: Record<string, unknown>[];
  function_call_outputs?: Record<string, unknown>[];
  created_at: number;
}

export type SessionEvent =
  | AgentStateChangedEvent
  | UserStateChangedEvent
  | SpeechCreatedEvent
  | ConversationItemAddedEvent
  | UserInputTranscribedEvent
  | FunctionToolsExecutedEvent
  | CloseEvent;

// ── Session Report ──────────────────────────────────────────────────────────

export interface SessionReport {
  job_id: string;
  room_id: string;
  room: string;
  events: SessionEvent[];
  audio_recording_path?: string | null;
  audio_recording_started_at?: number | null;
  options?: SessionReportOptions;
  chat_history?: { items: ConversationItem[] };
  timestamp: number;
}

// ── Stored Transcript ───────────────────────────────────────────────────────

export interface StoredTranscript {
  id: string;
  sessionId: string;
  roomName: string;
  agentId: string | null;
  orgId: string;
  createdByUserId: string | null;
  sessionReport: SessionReport;
  chatHistory: ConversationItem[];
  closeReason: string | null;
  durationMs: number | null;
  messageCount: number;
  startedAt: string;
  endedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Agent Stats ─────────────────────────────────────────────────────────────

export interface AgentTranscriptStats {
  totalCalls: number;
  browserCalls: number;
  phoneCalls: number;
  avgMessages: number | null;
}

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
}

// ── Query helpers ───────────────────────────────────────────────────────────

export interface TranscriptListFilters {
  agentId?: string;
  orgId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}

export interface PaginationParameters {
  limit?: number;
  offset?: number;
  sort?: "asc" | "desc";
}

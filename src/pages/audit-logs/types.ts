// Audit Log Types based on API specification

export enum AuditAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  EXECUTE = "execute",
  LOGIN = "login",
  LOGOUT = "logout",
  ACCESS_DENIED = "access_denied",
  EXPORT = "export",
  IMPORT = "import",
  PARSE = "parse",
  TRAIN = "train",
  UPLOAD = "upload",
  DOWNLOAD = "download",
  RESET = "reset",
  SHARE = "share",
  AUTH = "auth",
  CLONE = "clone",
  ADD = "add",
}

export enum AuditResource {
  AGENT = "agent",
  API = "api",
  VOICE_AGENT = "voice_agent",
  TOOL = "tool",
  PROVIDER = "provider",
  SESSION = "session",
  MESSAGE = "message",
  KNOWLEDGE_BASE = "knowledge_base",
  KNOWLEDGE_BASE_CREDENTIAL = "knowledge_base_credential",
  KNOWLEDGE_GRAPH = "knowledge_graph",
  SEMANTIC_DATA_MODEL = "semantic_data_model",
  MEMORY = "memory",
  ARTIFACT = "artifact",
  WORKFLOW = "workflow",
  CREDENTIAL = "credential",
  USER = "user",
  ORGANIZATION = "organization",
  API_KEY = "api_key",
  INFERENCE = "inference",
  GUARDRAIL = "guardrail",
  RAI_POLICY = "rai_policy",
  HM_POLICY = "hm_policy",
  FOLDER = "folder",
  CONTEXT = "context",
  BLUEPRINT = "blueprint",
  ENVIRONMENT = "environment",
  PERSONA = "persona",
  SCENARIO = "scenario",
  SIMULATION = "simulation",
  JOB = "job",
  EVALUATION = "evaluation",
}

export enum AuditResult {
  SUCCESS = "success",
  FAILURE = "failure",
  BLOCKED = "blocked",
  PARTIAL = "partial",
}

export interface AuditActorResponse {
  user_id: string | null;
  org_id: string;
  api_key_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuditTargetResponse {
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
}

export interface AuditChangeResponse {
  field: string;
  old_value: unknown | null;
  new_value: unknown | null;
}

export interface GuardrailViolationResponse {
  violation_type: string;
  severity: string;
  details: Record<string, unknown> | null;
}

export interface AuditLogResponse {
  _id: string;
  timestamp: string;
  actor: AuditActorResponse;
  action: AuditAction | string;
  target: AuditTargetResponse;
  result: AuditResult | string;
  error_message: string | null;
  session_id: string | null;
  request_id: string | null;
  permission_required: string | null;
  changes: AuditChangeResponse[] | null;
  guardrail_violations: GuardrailViolationResponse[] | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogListResponse {
  logs: AuditLogResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface AuditStatsResponse {
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  events_by_result: Record<string, number>;
  time_range: {
    start_time: string;
    end_time: string;
  } | null;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction | string;
  resource_type?: AuditResource | string;
  resource_id?: string;
  result?: AuditResult | string;
  start_time?: string;
  end_time?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

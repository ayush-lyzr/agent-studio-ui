import { ManagedAgent } from "@/pages/create-agent/types";
import { PlanType } from "./constants";

export enum Path {
  HOME = "/",
  UNAUTHORIZED = "/401",
  NOT_FOUND = "/404",
  AUTH = "auth",
  LOGIN = "/auth/sign-in/",
  REGISTER = "/auth/sign-up/",
  FORGOT_PASSWORD = "/forgot-password/",
  VERIFY_EMAIL = "/verify-email",
  AGENT = "/agent",
  AGENT_BUILDER = "/agent-builder",
  AGENT_CREATE = "/agent-create",
  VOICE_AGENT_BUILDER = "/voice-agent-builder",
  VOICE_AGENT_CREATE = "/voice-agent-create",
  VOICE_NEW = "/voice-new",
  VOICE_NEW_CREATE = "/voice-new-create",
  KNOWLEDGE_BASE = "/knowledge-base",
  MODELS = "/configure/models",
  TOOLS = "/configure/tools",
  DATA_CONNECTORS = "/configure/data-connectors",
  MEMORY = "/configure/memory",
  GUARDRAILS = "/configure/guardrails",
  APP_STORE = "/agent-marketplace",
  WORKFLOW_BUILDER = "/multi-agent-workflow",
  NEW_WORKFLOW_BUILDER = "/multi-agent-workflow/new",
  PLAYTGROUND = "playground",
  RESET = "/reset-password/",
  UPGRADE_PLAN = "/upgrade-plan",
  MANAGE = "/manage",
  RAI = "/responsible-ai",
  VOICE_BUILDER = "/voice-builder",
  CREDIT_REPORT = "/credit-report",
  ONBOARDING = "/onboarding",
  RESPONSIBLE_AI = "/responsible-ai",
  AGENT_POLICIES = "/agent-policies",
  GROUPS = "/groups",
  CODE_IDE = "/agent-builder/ide",
  AGENT_EVAL = "/agent-eval",
  EVALS = "/agent-simulation-engine",
  OGI = "/ogi",
  ORCHESTRATION = "/lyzr-manager",
  BLUEPRINTS = "/blueprints",
  TRACES = "/traces-v2",
  GLOBAL_CONTEXTS = "/global-contexts",
  EXECUTIONS = "/executions",
  AUDIT_LOGS = "/audit-logs",
  PRODUCT_ROADMAP = "/product-roadmap",
}

export interface AppData {
  id: string;
  name: string;
  description: string;
  creator: string;
  user_id: string;
  agent_id?: string;
  public: boolean;
  categories: string[];
  created_at: string;
  updated_at: string;
  upvotes: number;
  tags?: string[];
}

export interface LeaderboardData {
  leaderboard: AppData[];
}

export interface IModelCredential {
  name: string;
  provider_id: string;
  type: string;
  credentials: object;
  meta_data: object;
}

export type FormProperty = {
  type: "string" | "number" | "boolean";
  title: string;
  default: string;
};

export type ProviderForm = {
  title: string;
  description: string;
  type: string;
  help_link: string;
  required: string[];
  properties: Record<string, FormProperty>;
};

export interface Model {
  [key: string]:
  | {
    type: string;
    items?: string;
    options?: any[];
    default?: string;
    format?: string;
    example?: any;
    properties?: Record<string, any>;
  }
  | string
  | string[]
  | number;
}
export type IModel = Model[] | Record<"us" | "eu", string[]>;
export interface IProvider {
  _id: string;
  provider_id: string;
  display_name: string;
  credentials: Record<string, string>;
  type: string;
  form: ProviderForm;
  priority: number;
  createdAt: string;
  updatedAt: string;
  meta_data: {
    models: IModel;
    logo: string;
    credential_id?: string;
    display_names?: Record<string, string>;
  };
  disabled: boolean;
  name?: string;
}

export interface IAgent {
  _id: string;
  name: string;
  api_key: string;
  agent_role: string;
  agent_instructions: string;
  features: Array<{
    type: string;
    config: Record<string, any>;
    priority: number;
  }>;
  tool: string | null;
  agent_type?: "a2a";
  llm_credential_id: string;
  model: string;
  temperature: string;
  top_p: string;
  system_prompt: string;
  provider_id: string;
  description: string;
  tools?: any[];
  managed_agents?: ManagedAgent[];
  template_type: string;
  tool_usage_description: string;
  version: string;
  examples: string;
  response_format:
  | { type: "json_schema"; json_schema: { strict: boolean; schema: any } }
  | { type: "text" };
  created_at?: string;
  updated_at?: string;
  voice_config?: any;
}

export type ToolForm = {
  [key: string]: {
    value: string;
    type: string;
    description: string;
    display_name: string;
    required: boolean;
    expected_from_customer: boolean;
  };
};

export type ToolConnection = {
  credential_name: string;
  user_id: string;
  provider_uuid: string;
  redirect_url: string;
};

export interface ICredential {
  _id: string;
  credential_id: string;
  name: string;
  credentials: Record<string, string>;
  type: string;
  meta_data: Record<string, unknown>;
  provider_id: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberstackCurrentUser {
  id: string;
  verified: boolean;
  profileImage: string;
  auth: {
    email: string;
    hasPassword: boolean;
    providers: { provider: string }[];
  };
  loginRedirect: string;
  stripeCustomerId: string;
  createdAt: string;
  metaData: object;
  customFields: any;
  permissions: string[] | [];
  planConnections: {
    id: string;
    active: boolean;
    status: string;
    planId: string;
    type: string;
    payment: {
      amount: number;
      currency: string;
      status: string;
      lastBillingDate: number | null;
      nextBillingDate: number | null;
      cancelAtDate: number | null;
      priceId: string;
    } | null;
  }[];
}

export interface IUsage {
  _id: string;
  recurring_credits: number;
  paid_credits: number;
  used_credits: number;
  total_seats: number;
  updated_at: string;
  created_at: string;
  limits: Record<string, { limit: number }>;
  cycle_at: "monthly" | "quarterly" | "yearly";
  is_active: boolean;
  plan_id: string;
  plan_name: PlanType;
}

export type CurrentUserProps = {
  currentUser: Partial<MemberstackCurrentUser>;
  userId: string;
  loadingAuth: boolean;
};

export interface IOrganizationRoot {
  organizations: IOrganization[];
  owner_of: string;
  part_of: string[];
  onboarded: boolean;
}

export interface SubOrganization {
  name: string;
  organization_id: string;
  limit: number;
}

export interface IOrganization {
  _id: string;
  org_id?: string;
  admin_user_id: string;
  name: string;
  domain: any;
  user_ids: string[];
  usage_id: string;
  usage_history: any[];
  about_organization: string;
  industry: string;
  policy: IPolicy;
  parent_organization_id?: string;
  vpas_enabled: boolean;
  sub_organizations: SubOrganization[];
  role?: string;
}

export interface IPolicy {
  _id: string;
  id: string;
  permission_ids: IPermissionId[];
  user_id: string;
  org_id: string;
  resource_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface IPermissionId {
  id: string;
  name: string;
  created_at: any;
  type: string;
  resource_id: string;
  owner_id: any;
  disabled: boolean;
  modes: any;
}

export enum UserRole {
  admin = "admin",
  member = "member",
  owner = "owner",
  role_member = "role_member",
  role_builder = "role_builder",
  role_admin = "role_admin",
  role_owner = "role_owner",
}

export interface IOrganizationRoot {
  organizations: IOrganization[];
  owner_of: string;
  part_of: string[];
}

export interface IOrganization {
  _id: string;
  org_id?: string;
  admin_user_id: string;
  name: string;
  domain: any;
  user_ids: string[];
  usage_id: string;
  usage_history: any[];
  about: string;
  industry: string;
  policy: IPolicy;
  parent_organization_id?: string;
  vpas_enabled: boolean;
  sub_organizations: SubOrganization[];
  role?: string;
}

export interface IPolicy {
  _id: string;
  id: string;
  permission_ids: IPermissionId[];
  permissions?: string[];
  user_id: string;
  org_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  is_new_rbac: boolean
}

export interface IPermissionId {
  id: string;
  name: string;
  created_at: any;
  type: string;
  resource_id: string;
  owner_id: any;
  disabled: boolean;
  modes: any;
}

export type ITeamMember = {
  current_org_id: string;
  name: string;
  email: string;
  user_id: string;
  role: string;
  _id: string;
};

export type IAgentPolicy = { user_id: string; resource_id: string };

export interface DataConnectorForm {
  title: string;
  description: string;
  type: string;
  help_link: string;
  required: string[];
  properties: Record<
    string,
    {
      type: string;
      title: string;
      description?: string;
      default?: string;
      accepted_formats?: string[];
      multiple?: boolean;
    }
  >;
}

export interface DataConnector {
  _id: string;
  provider_id: string;
  type: string;
  form: DataConnectorForm;
  meta_data: {
    provider_name: string;
    documentation_link: string;
    icon: string;
  };
}

export interface ISchemaTable {
  has_schemas: boolean;
  schemas: Record<string, ISemanticTable[]>;
  tables: ISemanticTable[];
}

export interface ISemanticTable {
  name: string;
  included: boolean;
}

export interface ISchemaTableConfig {
  table_name: string;
  table_description: string;
  columns: ISchemaTableColumn[];
}

export interface ISchemaTableColumn {
  name: string;
  description: string;
  type: string;
}

export type ISemanticTableMeta = {
  database_id: string;
  database_name: string;
  database_provider_id: string;
  documentation_agent_id: string;
  documentation_agent_name: string;
};

export type PatternType = "literal" | "regex" | "cucumber_expression";

export type KeywordRule = {
  keyword: string;
  action: "block" | "redact";
  replacement: string;
  pattern_type?: PatternType;
};

// Bedrock Guardrails types
export type ContentFilterType =
  | "SEXUAL"
  | "VIOLENCE"
  | "HATE"
  | "INSULTS"
  | "MISCONDUCT"
  | "PROMPT_ATTACK";

export type FilterStrength = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type ContentFilterConfig = {
  type: ContentFilterType;
  input_strength: FilterStrength;
  output_strength: FilterStrength;
};

export type TopicConfig = {
  name: string;
  definition: string;
  examples?: string[];
};

export type ManagedWordListType = "PROFANITY";

export type PIIEntityAction = "BLOCK" | "ANONYMIZE";

export type BedrockPIIEntityType =
  | "ADDRESS"
  | "AGE"
  | "AWS_ACCESS_KEY"
  | "AWS_SECRET_KEY"
  | "CA_HEALTH_NUMBER"
  | "CA_SOCIAL_INSURANCE_NUMBER"
  | "CREDIT_DEBIT_CARD_CVV"
  | "CREDIT_DEBIT_CARD_EXPIRY"
  | "CREDIT_DEBIT_CARD_NUMBER"
  | "DRIVER_ID"
  | "EMAIL"
  | "INTERNATIONAL_BANK_ACCOUNT_NUMBER"
  | "IP_ADDRESS"
  | "LICENSE_PLATE"
  | "MAC_ADDRESS"
  | "NAME"
  | "PASSWORD"
  | "PHONE"
  | "PIN"
  | "SWIFT_CODE"
  | "UK_NATIONAL_HEALTH_SERVICE_NUMBER"
  | "UK_NATIONAL_INSURANCE_NUMBER"
  | "UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER"
  | "URL"
  | "USERNAME"
  | "US_BANK_ACCOUNT_NUMBER"
  | "US_BANK_ROUTING_NUMBER"
  | "US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER"
  | "US_PASSPORT_NUMBER"
  | "US_SOCIAL_SECURITY_NUMBER"
  | "VEHICLE_IDENTIFICATION_NUMBER";

export type PIIEntityConfig = {
  type: BedrockPIIEntityType;
  action: PIIEntityAction;
};

export type RegexConfig = {
  name: string;
  pattern: string;
  action: "BLOCK" | "ANONYMIZE";
};

export type ContextualGroundingFilterType = "GROUNDING" | "RELEVANCE";

export type ContextualGroundingFilterConfig = {
  type: ContextualGroundingFilterType;
  threshold: number;
};

export type BedrockGuardrailConfig = {
  enabled: boolean;
  // Content filters (SEXUAL, VIOLENCE, HATE, etc.)
  content_filters?: ContentFilterConfig[];
  // Topics to DENY
  topics?: TopicConfig[];
  // Custom blocked words
  blocked_words?: string[];
  // Managed word lists (e.g., PROFANITY)
  managed_word_lists?: ManagedWordListType[];
  // PII entities with BLOCK/ANONYMIZE
  pii_entities?: PIIEntityConfig[];
  // Custom regex patterns
  regex_patterns?: RegexConfig[];
  // Contextual grounding filters
  contextual_grounding_filters?: ContextualGroundingFilterConfig[];
  // Messaging when blocked
  blocked_input_messaging?: string;
  blocked_output_messaging?: string;
  // AWS metadata (auto-populated after creation)
  guardrail_id?: string;
  guardrail_arn?: string;
  guardrail_version?: string;
  // Credential reference for cross-account access
  credential_id?: string;
};

export type IRAIPolicy = {
  _id: string;
  name: string;
  description: string;
  allowed_topics: { enabled: boolean; topics: any[] } | null;
  banned_topics: { enabled: boolean; topics: any[] } | null;
  keywords: { enabled: boolean; keywords: KeywordRule[] } | null;
  toxicity_check: {
    enabled: boolean;
    threshold: number;
  } | null;
  prompt_injection: {
    enabled: boolean;
    threshold: number;
  } | null;
  secrets_detection: {
    enabled: boolean;
    action: string;
  } | null;
  pii_detection: {
    enabled: boolean;
    types: Record<string, any>;
    custom_pii: any[];
  };
  fairness_and_bias?: {
    enabled: boolean;
    model: string;
    temperature: number;
    top_p: number;
    credential_id: string;
    provider_id: string;
  };
  nsfw_check?: {
    enabled: boolean;
    threshold: number;
    validation_method: "sentence" | "full";
  };
  bedrock_guardrail?: BedrockGuardrailConfig;
  created_at: string;
  updated_at: string;
};

export type PatternValidationResult = {
  valid: boolean;
  error: string | null;
  error_position: number | null;
};

export type MatchResult = {
  matched: boolean;
  matched_text: string | null;
  start: number | null;
  end: number | null;
  parameters: Record<string, string>;
};

export type PatternTestResponse = {
  match_result: MatchResult;
  validation: PatternValidationResult;
};

export type PatternExample = {
  pattern: string;
  pattern_type: PatternType;
  description: string;
  example_matches: string[];
  example_non_matches: string[];
};

export type PatternExamplesResponse = {
  literal_examples: PatternExample[];
  regex_examples: PatternExample[];
  cucumber_expression_examples: PatternExample[];
};

export type IOnboardingQuestion = {
  priority: number;
  question: string;
  sub_question: string;
  options: { label: string; value: string }[];
  answer: string | null;
  required: boolean;
  multiple: boolean;
  type: string;
};

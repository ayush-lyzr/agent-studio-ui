export interface MemoryFormField {
  name: string;
  label: string;
  type: "text" | "select" | "number" | "password";
  required: boolean;
  placeholder?: string;
  description?: string;
  default?: string;
  options?: { value: string; label: string }[];
}

export interface MemoryProviderForm {
  title: string;
  description: string;
  fields: MemoryFormField[];
}

export interface MemoryProviderMetaData {
  icon: string;
  category: string;
  supports_role_based_auth: boolean;
  lambda_registration_required: boolean;
  provisioning_time_seconds: number;
  documentation_url: string;
  features?: string[];
}

export interface IMemoryProvider {
  _id: string;
  provider_id: string;
  type: "memory";
  form: MemoryProviderForm;
  meta_data: MemoryProviderMetaData;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMemoryCredential {
  _id: string;
  credential_id: string;
  name: string;
  provider_id: string;
  type: "memory";
  credentials: Record<string, any>;
  meta_data: {
    memory_id?: string;
    memory_name?: string;
    memory_status?: string;
    provisioning_started_at?: string;
  };
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMemoryResource {
  memory_id: string;
  name: string;
  status: "ACTIVE" | "CREATING" | "DELETING" | "FAILED";
  arn?: string;
  created_at?: string;
  event_expiry_days?: number;
  strategies?: string[];
}

export interface IMemoryCardProps {
  provider: IMemoryProvider;
  className?: string;
}

export interface ProvisioningStatus {
  credential_id: string;
  status: "pending" | "creating" | "active" | "failed" | "validated";
  memory_id?: string;
  progress?: {
    percent: number;
    estimated_seconds_remaining: number;
    message: string;
  };
  error?: string;
}

/** Frontend display name overrides for memory providers */
export const MEMORY_PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  lyzr: "Avanade Memory",
  cognis: "Avanade Cognis",
};

/** Tag badges for each provider (e.g. "Default", "BYOM") */
export const MEMORY_PROVIDER_TAGS: Record<string, string> = {
  cognis: "Default",
  "aws-agentcore": "BYOM",
};

/** Providers that show a green "Default" tag with checkmark */
export const DEFAULT_PROVIDERS = new Set(["cognis"]);

/** Providers that show a "Ready to Use" badge */
export const READY_TO_USE_PROVIDERS = new Set(["cognis","lyzr"]);

/** Helper to get display name, falling back to form.title or provider_id */
export function getMemoryProviderDisplayName(
  providerId: string,
  fallback?: string,
): string {
  return MEMORY_PROVIDER_DISPLAY_NAMES[providerId] ?? fallback ?? providerId;
}

// Types for Agent Endpoint Policy management

export interface AuditInfo {
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface Tags {
  department?: string;
  compliance?: string;
  [key: string]: string | undefined;
}

export interface Metadata {
  name: string | null;
  description: string | null;
  status: string;
  parent_policy_id?: string | null;
  tags?: Tags;
  audit: AuditInfo;
}

export interface AllowedConnections {
  sensitivities: string[];
  network_groups: string[];
  functional_groups: string[];
}

export interface ConnectionRules {
  inference: {
    allowed: AllowedConnections;
  };
}

export interface IAEPPolicy {
  schema_version: string;
  policy_version: number;
  policy_id: string;
  metadata: Metadata;
  parent_policy_id?: string | null;
  organization_id: string;
  properties: {
    sensitivity: string;
    functional_group: string;
    [key: string]: string;
  };
  connection_rules: ConnectionRules;
}

export interface CreateAEPPolicyRequest {
  name: string;
  description: string;
  sensitivity: string;
  functional_group: string;
  allowed_sensitivities: string[];
  allowed_network_groups: string[];
  allowed_functional_groups: string[];
  parent_policy_id?: string;
  organization_id?: string;
  tags?: Record<string, string>;
}

export interface UpdateAEPPolicyRequest {
  name?: string;
  description?: string;
  status?: string;
  sensitivity?: string;
  functional_group?: string;
  allowed_sensitivities?: string[];
  allowed_network_groups?: string[];
  allowed_functional_groups?: string[];
  parent_policy_id?: string;
  tags?: Record<string, string>;
}

export interface ValidationResult {
  allowed: boolean;
  checks?: {
    sensitivity: boolean;
    network_group: boolean;
    functional_group: boolean;
  };
  reason?: string;
}

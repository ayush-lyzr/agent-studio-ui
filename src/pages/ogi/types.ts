export interface OGI {
  ogi_id: string;
  ogi_name: string;
  owner_id: string;
  organization_id: string;
  agent_ids: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateOGIRequest {
  ogi_name: string;
  organization_id: string;
  agent_ids: string[];
  metadata?: Record<string, any>;
}

export interface AddAgentToOGIRequest {
  agent_id: string;
}

export interface OGIAgent {
  _id: string;
  name: string;
  description?: string;
  agent_role?: string;
  model?: string;
}

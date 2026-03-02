// Types for the User Assets API - unified endpoint for folders, agents, workflows

export type UserAssetType =
  | "all"
  | "folder"
  | "agent"
  | "manager_agent"
  | "workflow";

export interface FolderMetadata {
  group_type: string;
  owner_id: string;
  organization_id: string;
  assets_count: number;
}

export interface AgentMetadata {
  provider_id: string;
  model: string;
  version: string;
}

export interface WorkflowMetadata {
  flow_data_summary: string;
}

export type AssetMetadata =
  | FolderMetadata
  | AgentMetadata
  | WorkflowMetadata
  | Record<string, any>
  | null;

export interface UnifiedAsset {
  id: string;
  name: string;
  type: Exclude<UserAssetType, "all">;
  created_at: string;
  updated_at: string;
  metadata: AssetMetadata;
  shared: boolean;
}

export interface UserAssetListResponse {
  assets: UnifiedAsset[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface UserAssetsParams {
  page?: number;
  limit?: number;
  type?: UserAssetType;
}

// Search-specific types
export interface SearchUserAssetsParams {
  q: string;
  page?: number;
  limit?: number;
  type?: UserAssetType;
}

export interface SearchUserAssetsResponse {
  assets: UnifiedAsset[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Type guard functions
export function isFolderMetadata(
  metadata: AssetMetadata,
): metadata is FolderMetadata {
  return (
    metadata !== null &&
    typeof metadata === "object" &&
    "assets_count" in metadata
  );
}

export function isAgentMetadata(
  metadata: AssetMetadata,
): metadata is AgentMetadata {
  return (
    metadata !== null &&
    typeof metadata === "object" &&
    "provider_id" in metadata &&
    "model" in metadata
  );
}

export function isWorkflowMetadata(
  metadata: AssetMetadata,
): metadata is WorkflowMetadata {
  return (
    metadata !== null &&
    typeof metadata === "object" &&
    "flow_data_summary" in metadata
  );
}

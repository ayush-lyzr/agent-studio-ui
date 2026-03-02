import useStore from "@/lib/store";

const API_BASE_URL = `${import.meta.env.VITE_PAGOS_URL}views/groups/`;

// Get API key from store
const getApiKey = (): string => {
  return useStore.getState().api_key || "";
};

export interface Group {
  group_id: string;
  group_name: string;
  group_type: string;
  owner_id: string;
  organization_id: string;
  assets: Asset[];
  created_at: string;
  updated_at: string;
}

export interface Asset {
  asset_id: string;
  asset_type: string;
  asset_name: string;
  metadata?: Record<string, any>;
}

export interface CreateGroupParams {
  group_name: string;
  group_type: string;
  organization_id: string;
}

export interface AddAssetParams {
  asset_id: string;
  asset_type: string;
  asset_name: string;
  metadata?: Record<string, any>;
}

export interface MoveAssetParams {
  to_group_name: string;
  to_group_type: string;
}

export interface RenameGroupParams {
  new_group_name: string;
}

/**
 * Create a new group
 */
export const createGroup = async (
  params: CreateGroupParams,
  token: string,
): Promise<string> => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to create group");
  }

  return response.json();
};

/**
 * Get all groups, optionally filtered by type
 */
export const getGroups = async (
  organizationId: string,
  groupType: string | undefined,
  token: string,
): Promise<Group[]> => {
  let url = `${API_BASE_URL}?organization_id=${organizationId}`;
  if (groupType) {
    url += `&group_type=${groupType}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }

  return response.json();
};

/**
 * Get a specific group by name and type
 */
export const getGroup = async (
  groupName: string,
  groupType: string,
  organizationId: string,
  token: string,
): Promise<Group> => {
  const response = await fetch(
    `${API_BASE_URL}${groupName}/${groupType}?organization_id=${organizationId}`,
    {
      method: "GET",
      headers: {
        "x-api-key": getApiKey(),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch group");
  }

  return response.json();
};

/**
 * Add an asset to a group
 */
export const addAssetToGroup = async (
  groupName: string,
  groupType: string,
  organizationId: string,
  params: AddAssetParams,
  token: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}${groupName}/${groupType}/assets?organization_id=${organizationId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to add asset to group");
  }

  return response.json();
};

/**
 * Remove an asset from a group
 */
export const removeAssetFromGroup = async (
  groupName: string,
  groupType: string,
  assetId: string,
  organizationId: string,
  token: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}${groupName}/${groupType}/assets/${assetId}?organization_id=${organizationId}`,
    {
      method: "DELETE",
      headers: {
        "x-api-key": getApiKey(),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to remove asset from group");
  }

  return response.json();
};

/**
 * Move an asset between groups
 */
export const moveAssetBetweenGroups = async (
  fromGroupName: string,
  fromGroupType: string,
  assetId: string,
  organizationId: string,
  params: MoveAssetParams,
  token: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}${fromGroupName}/${fromGroupType}/assets/${assetId}/move?organization_id=${organizationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to move asset between groups");
  }

  return response.json();
};

/**
 * Rename a group
 */
export const renameGroup = async (
  groupName: string,
  groupType: string,
  organizationId: string,
  params: RenameGroupParams,
  token: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}${groupName}/${groupType}/rename?organization_id=${organizationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to rename group");
  }

  return response.json();
};

/**
 * Delete a group and ungroup its assets
 */
export const deleteGroup = async (
  groupName: string,
  groupType: string,
  organizationId: string,
  token: string,
): Promise<string> => {
  const url = `${API_BASE_URL}${groupName}/${groupType}?organization_id=${organizationId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete group");
  }

  return response.json();
};

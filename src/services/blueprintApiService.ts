import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

export interface BlueprintData {
  id?: string;
  name: string;
  title?: string;
  description: string;
  orchestration_type: "Manager Agent" | "Single Agent";
  orchestration_name: string;
  blueprint_data: {
    manager_agent_id?: string;
    tree_structure: any;
    nodes: any[];
    edges: any[];
    agents?: { [key: string]: any }; // Store complete agent documents
  };
  blueprint_info: {
    documentation_data: {
      markdown?: string;
    };
    type: string;
  };
  tags: string[];
  category: string;
  is_template: boolean;
  parent_blueprint_id?: string;
  share_type: "private" | "public" | "organization";
  shared_with_users: string[];
  shared_with_organizations: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Fields that might come from public API
  agents?: any[];
  edges?: any[];
  textNotes?: any[];
  readme?: string;
}

export interface BlueprintUpdateData {
  name?: string;
  description?: string;
  orchestration_name?: string;
  blueprint_data?: any;
  blueprint_info?: any;
  tags?: string[];
  category?: string;
  status?: "draft" | "published";
  version?: string;
}

export interface BlueprintShareData {
  share_type: "private" | "public" | "organization";
  user_ids?: string[];
  organization_ids?: string[];
}

export interface BlueprintDuplicateData {
  new_name: string;
  new_description?: string;
  target_organization_id?: string;
}

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const getCurrentOrganizationId = () => {
  return useManageAdminStore.getState().current_organization?.org_id || "";
};

const getOrgId = () => {
  return useManageAdminStore.getState().current_organization?._id ?? "";
};

const getToken = () => {
  return useStore.getState().app_token || "";
};

const getApiKey = () => {
  return useStore.getState().api_key || "";
};

export const blueprintApiService = {
  // Create a new blueprint
  createBlueprint: async (data: BlueprintData) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.post("/blueprints/blueprints", data, {
      baseURL: PAGOS_URL,
      headers: getAuthHeaders(token),
      params: { organization_id: organizationId },
    });
    return response.data;
  },

  // List blueprints
  listBlueprints: async (params?: {
    orchestration_type?: string;
    status?: string;
    category?: string;
    tags?: string;
    owner_id?: string;
    organization_id?: string;
    share_type?: string;
    search?: string;
    is_template?: boolean;
    sort_by?:
    | "created_at"
    | "updated_at"
    | "name"
    | "usage_count"
    | "last_used_at";
    page?: number;
    page_size?: number;
  }) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.get("/blueprints/blueprints", {
      baseURL: PAGOS_URL,
      headers: getAuthHeaders(token),
      params: {
        user_organization_id: organizationId,
        ...params,
      },
    });
    return response.data;
  },

  // Get a single blueprint
  getBlueprint: async (blueprintId: string) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.get(`/blueprints/blueprints/${blueprintId}`, {
      baseURL: PAGOS_URL,
      headers: getAuthHeaders(token),
      params: { organization_id: organizationId },
    });
    return response.data;
  },

  // Update a blueprint
  updateBlueprint: async (blueprintId: string, data: BlueprintUpdateData) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.put(
      `/blueprints/blueprints/${blueprintId}`,
      data,
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: { organization_id: organizationId },
      },
    );
    return response.data;
  },

  // Delete a blueprint
  deleteBlueprint: async (blueprintId: string) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.delete(
      `/blueprints/blueprints/${blueprintId}`,
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: { organization_id: organizationId },
      },
    );
    return response.data;
  },

  // Share a blueprint
  shareBlueprint: async (blueprintId: string, data: BlueprintShareData) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.post(
      `/blueprints/blueprints/${blueprintId}/share`,
      data,
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: { organization_id: organizationId },
      },
    );
    return response.data;
  },

  // Duplicate a blueprint
  duplicateBlueprint: async (
    blueprintId: string,
    data: BlueprintDuplicateData,
  ) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.post(
      `/blueprints/blueprints/${blueprintId}/duplicate`,
      data,
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: { organization_id: organizationId },
      },
    );
    return response.data;
  },

  // Track blueprint usage
  useBlueprint: async (blueprintId: string, eventType: string = "executed") => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.post(
      `/blueprints/blueprints/${blueprintId}/use`,
      {},
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: {
          organization_id: organizationId,
          event_type: eventType,
        },
      },
    );
    return response.data;
  },

  // Get blueprints shared with the current user
  getSharedBlueprints: async (page = 1, pageSize = 20) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.get("/blueprints/blueprints/shared/with-me", {
      baseURL: PAGOS_URL,
      headers: getAuthHeaders(token),
      params: {
        organization_id: organizationId,
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  },

  // Browse public blueprints
  browsePublicBlueprints: async (params?: {
    orchestration_type?: string;
    category?: string;
    tags?: string;
    search?: string;
    sort_by?:
    | "created_at"
    | "updated_at"
    | "name"
    | "usage_count"
    | "last_used_at";
    page?: number;
    page_size?: number;
  }) => {
    const token = getToken();
    const organizationId = getCurrentOrganizationId();

    const response = await axios.get("/blueprints/blueprints/public/browse", {
      baseURL: PAGOS_URL,
      headers: getAuthHeaders(token),
      params: {
        organization_id: organizationId,
        ...params,
      },
    });
    return response.data;
  },

  // Clone a public blueprint
  cloneBlueprint: async (blueprintId: string, blueprintName: string) => {
    const token = getToken();
    const organizationId = getOrgId();
    const apiKey = getApiKey();

    const response = await axios.post(
      "/blueprints/blueprints/clone",
      {
        blueprint_id: blueprintId,
        blueprint_name: blueprintName,
        api_key: apiKey,
      },
      {
        baseURL: PAGOS_URL,
        headers: getAuthHeaders(token),
        params: { organization_id: organizationId },
      },
    );
    return response.data;
  },

  // Get a public blueprint (unauthenticated access)
  getPublicBlueprint: async (blueprintId: string) => {
    try {
      const response = await axios.get(
        `/blueprints/blueprints/public/${blueprintId}`,
        {
          baseURL: PAGOS_URL,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "sk-admin-hvipmykbBg4fDugFuVGwzXKolbsfUj35",
          },
          params: {
            organization_id: "public",
          },
        },
      );
      return {
        isSuccess: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Error fetching public blueprint:", error);
      return {
        isSuccess: false,
        error: error.response?.data?.message || "Failed to fetch blueprint",
      };
    }
  },
};

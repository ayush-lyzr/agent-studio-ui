import { apiClient } from "@/utils/apiClient";
import { WorkflowResponse, Workflow } from "@/types/workflow";
import useStore from "@/lib/store";
import { RUN_API_URL } from "@/lib/constants";

const API_BASE_URL = "/v3/workflows";

// Get API key from store
const getApiKey = (): string => {
  return useStore.getState().api_key || "";
};

/**
 * Save a workflow to the backend
 * @param flowName The name of the workflow
 * @param flowData The workflow data
 * @returns The saved workflow response
 */
export const saveWorkflow = async (
  flowName: string,
  flowData: any,
): Promise<WorkflowResponse> => {
  try {
    const apiKey = getApiKey();
    const response = await apiClient.post(
      API_BASE_URL + "/",
      {
        flow_name: flowName,
        flow_data: flowData,
      },
      {
        headers: {
          "x-api-key": apiKey,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error saving workflow:", error);
    throw error;
  }
};

/**
 * Update an existing workflow
 * @param flowId The ID of the workflow to update
 * @param flowName The new name of the workflow
 * @param flowData The new workflow data
 * @returns The updated workflow response
 */
export const updateWorkflow = async (
  flowId: string,
  flowName: string,
  flowData: Workflow | Record<string, unknown>,
): Promise<WorkflowResponse> => {
  try {
    const apiKey = getApiKey();
    const response = await apiClient.put(
      `${API_BASE_URL}/${flowId}`,
      {
        flow_name: flowName,
        flow_data: flowData,
      },
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating workflow:", error);
    throw error;
  }
};

/**
 * Get a workflow by its ID
 * @param flowId The ID of the workflow to get
 * @returns The workflow response
 */
export const getWorkflow = async (
  flowId: string,
): Promise<WorkflowResponse> => {
  try {
    const apiKey = getApiKey();
    const response = await apiClient.get(`${API_BASE_URL}/${flowId}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting workflow:", error);
    throw error;
  }
};

/**
 * Get all workflows for the current user
 * @returns A list of workflows
 */
export const listWorkflows = async (): Promise<WorkflowResponse[]> => {
  try {
    const apiKey = getApiKey();
    const response = await apiClient.get(API_BASE_URL + "/", {
      headers: {
        "x-api-key": apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error listing workflows:", error);
    throw error;
  }
};

/**
 * Delete a workflow
 * @param flowId The ID of the workflow to delete
 */
export const deleteWorkflow = async (flowId: string): Promise<void> => {
  try {
    const apiKey = getApiKey();
    await apiClient.delete(`${API_BASE_URL}/${flowId}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    throw error;
  }
};

/**
 * Execute a workflow
 * @param flowId The ID of the workflow to execute (not used in current implementation)
 * @param inputData Optional input data for the workflow
 * @returns The result of the workflow execution
 */
export const executeWorkflow = async (
  // @ts-ignore - Parameter is kept for API compatibility
  flowId?: string,
  inputData?: any,
): Promise<any> => {
  try {
    const response = await fetch(`${RUN_API_URL}run-dag/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to run workflow");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error running workflow:", error);
    throw new Error(error.message || "Failed to run workflow");
  }
};

/**
 * Share a workflow with other users
 * @param workflowId The ID of the workflow to share
 * @param emailIds Array of email addresses to share with
 * @param orgId Organization ID
 * @param userToken User authentication token (memberstack bearer token)
 * @returns The share response
 */
export const shareWorkflow = async (
  workflowId: string,
  emailIds: string[],
  orgId: string,
  userToken: string,
): Promise<any> => {
  try {
    const baseUrl = import.meta.env.VITE_BASE_URL || "";
    const response = await apiClient.post(
      `${baseUrl}/v3/workflows/share`,
      {
        workflow_id: workflowId,
        email_ids: emailIds,
        org_id: orgId,
        user_token: userToken,
      },
      {
        headers: {
          accept: "application/json",
          "x-api-key": getApiKey(),
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error sharing workflow:", error);
    throw error;
  }
};

/**
 * Unshare a workflow from users
 * @param workflowId The ID of the workflow to unshare
 * @param emailIds Array of email addresses to unshare from
 * @param orgId Organization ID
 * @param userToken User authentication token (memberstack bearer token)
 * @returns The unshare response
 */
export const unShareWorkflow = async (
  workflowId: string,
  emailIds: string[],
  orgId: string,
  userToken: string,
  adminUserId: string,
): Promise<any> => {
  try {
    const PAGOS_URL = import.meta.env.VITE_PAGOS_URL || "";
    const response = await apiClient.post(
      `/policies/unshare-resource`,
      {
        resource_id: workflowId,
        resource_type: "workflow",
        email_ids: emailIds,
        admin_user_id: adminUserId,
        org_id: orgId,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        baseURL: PAGOS_URL,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error unsharing workflow:", error);
    throw error;
  }
};

/**
 * Get workflow permissions (who the workflow is shared with)
 * Similar to agent policies but for workflows
 * @param orgId Organization ID
 * @param userToken User authentication token (memberstack bearer token)
 * @returns Array of workflow policies
 */
export const getWorkflowPolicies = async (
  orgId: string,
  userToken: string,
): Promise<any[]> => {
  try {
    const PAGOS_URL = import.meta.env.VITE_PAGOS_URL || "";
    const response = await apiClient.get("/policies/assigned-permissions", {
      baseURL: PAGOS_URL,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      params: {
        organization_id: orgId,
        permission_type: "workflow",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting workflow policies:", error);
    return [];
  }
};

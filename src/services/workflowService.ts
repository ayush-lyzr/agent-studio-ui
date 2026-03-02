// workflowService.ts

import { Workflow, WorkflowResponse } from "@/types/workflow";
import { apiClient } from "@/utils/apiClient";
import useStore from "@/lib/store";
import { useEffect, useState } from "react";
import { RUN_API_URL, RUN_SOCKET_URL } from "@/lib/constants";
// Constants
const API_BASE_URL = "/v3/workflows";

/**
 * Custom hook to get the API key from Zustand store
 * @returns The API key
 */
export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const storeApiKey = useStore((state) => state.api_key);

  useEffect(() => {
    // Get the API key from Zustand store
    if (storeApiKey) {
      setApiKey(storeApiKey);
    }
  }, [storeApiKey]);

  return apiKey;
};

// Get API key from store (for non-React contexts)
const getApiKey = (): string => {
  return useStore.getState().api_key || "";
};

/**
 * Run a workflow
 * @param workflow The workflow to run
 * @returns The result of the workflow execution
 */
/**
 * Run a workflow with React hooks
 * @param workflow The workflow to run
 * @param apiKey The API key from useApiKey hook
 * @returns The result of the workflow execution
 */
export const useRunWorkflow = (workflow: Workflow | null, apiKey: string) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const executeWorkflow = async () => {
    if (!workflow) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${RUN_API_URL}/run-dag/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to run workflow");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Error running workflow:", err);
      setError(new Error(err.message || "Failed to run workflow"));
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, executeWorkflow };
};

/**
 * Run a workflow (non-React version)
 * @param workflow The workflow to run
 * @returns The result of the workflow execution
 */
export const runWorkflow = async (workflow: Workflow): Promise<any> => {
  try {
    const response = await fetch(`${RUN_API_URL}/run-dag/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
      body: JSON.stringify(workflow),
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
 * Get a workflow by its ID
 * @param flowId The ID of the workflow to get
 * @returns The workflow response
 */
/**
 * React hook to get a workflow by its ID
 * @param flowId The ID of the workflow to get
 * @param apiKey The API key from useApiKey hook
 * @returns The workflow response and loading/error states
 */
export const useGetWorkflowById = (flowId: string | null, apiKey: string) => {
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!flowId || !apiKey) return;

    const fetchWorkflow = async () => {
      setLoading(true);
      setError(null);

      try {
        // Using direct URL path instead of query parameter
        console.log("Fetching workflow with direct path:", flowId);
        const response = await apiClient.get(`${API_BASE_URL}/${flowId}`, {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        });
        setWorkflow(response.data);
      } catch (err: any) {
        console.error("Error getting workflow:", err);
        setError(new Error(err.message || "Failed to get workflow"));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [flowId, apiKey]);

  return { workflow, loading, error };
};

/**
 * Get a workflow by its ID (non-React version)
 * @param flowId The ID of the workflow to get
 * @returns The workflow response
 */
export const getWorkflowById = async (
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
  } catch (error: any) {
    console.error("Error getting workflow:", error);
    throw new Error(error.message || "Failed to get workflow");
  }
};

// WebSocket constants
export const WS_CONNECTION_TIMEOUT = 15000; // 15 seconds
export const WS_INITIAL_DELAY = 1000; // 1 second initial delay

export const getWebSocketUrl = (flowName: string, runName: string): string => {
  return `${RUN_SOCKET_URL}/ws/${flowName}/${runName}`;
};

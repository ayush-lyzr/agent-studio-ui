import useStore from "@/lib/store";

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/v3/contexts`;

// Get API key from store
const getApiKey = (): string => {
  return useStore.getState().api_key || "";
};

/**
 * Interface for context data
 */
export interface Context {
  _id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
  api_key: string;
}

/**
 * Interface for creating a context
 */
export interface CreateContextRequest {
  name: string;
  value: string;
}

/**
 * Interface for updating a context
 */
export interface UpdateContextRequest {
  name?: string;
  value?: string;
}

/**
 * Interface for context creation response
 */
export interface CreateContextResponse {
  context_id: string;
  message: string;
}

/**
 * Interface for context count response
 */
export interface ContextCountResponse {
  total_count: number;
}

/**
 * Create a new context
 * @param data Context creation data
 * @returns The creation response
 */
export const createContext = async (data: CreateContextRequest): Promise<CreateContextResponse> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating context:", error);
    throw error;
  }
};

/**
 * Get all contexts with pagination
 * @param skip Number of contexts to skip
 * @param limit Number of contexts to retrieve
 * @returns Array of contexts
 */
export const getAllContexts = async (skip: number = 0, limit: number = 100): Promise<Context[]> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/?skip=${skip}&limit=${limit}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting contexts:", error);
    throw error;
  }
};

/**
 * Get context count
 * @returns The total count of contexts
 */
export const getContextCount = async (): Promise<ContextCountResponse> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/count`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting context count:", error);
    throw error;
  }
};

/**
 * Get context by ID
 * @param contextId The context document ID
 * @returns The context data
 */
export const getContextById = async (contextId: string): Promise<Context> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/${contextId}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting context by ID:", error);
    throw error;
  }
};

/**
 * Update context
 * @param contextId The context document ID
 * @param data Update data
 * @returns Success message
 */
export const updateContext = async (contextId: string, data: UpdateContextRequest): Promise<{ message: string }> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/${contextId}`, {
      method: "PUT",
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating context:", error);
    throw error;
  }
};

/**
 * Delete context
 * @param contextId The context document ID
 * @returns Success message
 */
export const deleteContext = async (contextId: string): Promise<{ message: string }> => {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${API_BASE_URL}/${contextId}`, {
      method: "DELETE",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting context:", error);
    throw error;
  }
};
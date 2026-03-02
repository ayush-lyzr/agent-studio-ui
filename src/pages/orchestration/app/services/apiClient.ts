import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

/**
 * Get the current API key from the store or localStorage
 * @returns The API key or empty string if not found
 */
export const getApiKey = (): string => {
  // Get from store
  const storeApiKey = useStore.getState().api_key;
  if (storeApiKey) {
    return storeApiKey;
  }

  // Return empty string if no key found
  return "";
};

/**
 * Get the current user's email
 * @returns The user's email or empty string if not found
 */
export const getCurrentUserEmail = (): string => {
  const currentUser = useManageAdminStore.getState().current_user;
  return currentUser?.auth?.email || "";
};

/**
 * Get headers with the API key included
 * @returns Headers object with x-api-key
 */
export const getAuthHeaders = () => {
  const apiKey = getApiKey();
  return {
    'x-api-key': apiKey,
    'accept': 'application/json',
    'Content-Type': 'application/json',
  };
};
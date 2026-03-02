import axios from "@/lib/axios";
import {
  UserAssetListResponse,
  UserAssetsParams,
  SearchUserAssetsParams,
  SearchUserAssetsResponse,
} from "@/types/user-assets";

/**
 * Fetch user assets with pagination support.
 * This unified endpoint returns folders, agents, manager agents, and workflows.
 *
 * @param apiKey - The API key for authentication
 * @param params - Pagination and filter parameters
 * @returns Promise<UserAssetListResponse>
 */
export async function fetchUserAssets(
  apiKey: string,
  params: UserAssetsParams = {},
): Promise<UserAssetListResponse> {
  const { page = 1, limit = 10, type = "all" } = params;

  const response = await axios.get<UserAssetListResponse>("/user-assets/", {
    params: {
      page,
      limit,
      type,
    },
    headers: {
      "x-api-key": apiKey,
    },
  });

  return response.data;
}

/**
 * Search user assets by name with case-insensitive matching.
 *
 * @param apiKey - The API key for authentication
 * @param params - Search query and pagination parameters
 * @returns Promise<SearchUserAssetsResponse>
 */
export async function searchUserAssets(
  apiKey: string,
  params: SearchUserAssetsParams,
): Promise<SearchUserAssetsResponse> {
  const { q, page = 1, limit = 10, type } = params;

  const response = await axios.get<SearchUserAssetsResponse>(
    "/user-assets/search",
    {
      params: {
        q,
        page,
        limit,
        ...(type && type !== "all" ? { type } : {}),
      },
      headers: {
        "x-api-key": apiKey,
      },
    },
  );

  return response.data;
}

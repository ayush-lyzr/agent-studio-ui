import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { fetchUserAssets } from "@/services/userAssetsService";
import {
  UnifiedAsset,
  UserAssetType,
  UserAssetListResponse,
} from "@/types/user-assets";

interface UseUserAssetsOptions {
  apiKey: string;
  limit?: number;
  type?: UserAssetType;
  enabled?: boolean;
}

interface UseUserAssetsReturn {
  assets: UnifiedAsset[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setType: (type: UserAssetType) => void;
  refresh: () => Promise<void>;
  totalPages: number;
}

export function useUserAssets({
  apiKey,
  limit: initialLimit = 20,
  type: initialType = "all",
  enabled = true,
}: UseUserAssetsOptions): UseUserAssetsReturn {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [type, setTypeState] = useState<UserAssetType>(initialType);

  const queryKey = ["userAssets", apiKey, page, limit, type];

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<UserAssetListResponse, Error>({
    queryKey,
    queryFn: () => fetchUserAssets(apiKey, { page, limit, type }),
    enabled: enabled && !!apiKey,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const setType = useCallback((newType: UserAssetType) => {
    setTypeState(newType);
    setPage(1); // Reset to first page when type changes
  }, []);

  const setLimitWithReset = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  }, []);

  const refresh = useCallback(async () => {
    // Invalidate all userAssets queries to ensure fresh data
    await queryClient.invalidateQueries({ queryKey: ["userAssets"] });
    await refetch();
  }, [queryClient, refetch]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return {
    assets: data?.assets ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    hasMore: data?.has_more ?? false,
    isLoading,
    isFetching,
    error: error ?? null,
    setPage,
    setLimit: setLimitWithReset,
    setType,
    refresh,
    totalPages,
  };
}

// Re-export types for convenience
export type { UnifiedAsset, UserAssetType, UserAssetListResponse };

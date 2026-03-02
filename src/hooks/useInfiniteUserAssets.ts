import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  fetchUserAssets,
  searchUserAssets,
} from "@/services/userAssetsService";
import {
  UnifiedAsset,
  UserAssetType,
  UserAssetListResponse,
  SearchUserAssetsResponse,
} from "@/types/user-assets";

interface UseInfiniteUserAssetsOptions {
  apiKey: string;
  limit?: number;
  type?: UserAssetType;
  enabled?: boolean;
}

interface UseInfiniteUserAssetsReturn {
  assets: UnifiedAsset[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  loadMore: () => void;
  setType: (type: UserAssetType) => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string;
  isSearching: boolean;
  refresh: () => Promise<void>;
  type: UserAssetType;
}

// Debounce delay for search (ms)
const SEARCH_DEBOUNCE_DELAY = 300;

export function useInfiniteUserAssets({
  apiKey,
  limit: initialLimit = 20,
  type: initialType = "all",
  enabled = true,
}: UseInfiniteUserAssetsOptions): UseInfiniteUserAssetsReturn {
  const queryClient = useQueryClient();
  const [type, setTypeState] = useState<UserAssetType>(initialType);
  const [searchQuery, setSearchQueryState] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const isSearching = debouncedSearchQuery.length > 0;

  // Query key includes search query when searching
  const queryKey = isSearching
    ? ["searchUserAssets", apiKey, debouncedSearchQuery, initialLimit]
    : ["infiniteUserAssets", apiKey, type, initialLimit];

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery<UserAssetListResponse | SearchUserAssetsResponse, Error>(
    {
      queryKey,
      queryFn: ({ pageParam = 1 }) => {
        if (isSearching) {
          return searchUserAssets(apiKey, {
            q: debouncedSearchQuery,
            page: pageParam as number,
            limit: initialLimit,
          });
        }
        return fetchUserAssets(apiKey, {
          page: pageParam as number,
          limit: initialLimit,
          type,
        });
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.has_more) {
          return lastPage.page + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      enabled: enabled && !!apiKey,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  );

  const setType = useCallback((newType: UserAssetType) => {
    setTypeState(newType);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["infiniteUserAssets"] });
    await queryClient.invalidateQueries({ queryKey: ["searchUserAssets"] });
    await refetch();
  }, [queryClient, refetch]);

  // Flatten all pages into a single array of assets
  const assets = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.assets);
  }, [data?.pages]);

  const total = data?.pages[0]?.total ?? 0;

  return {
    assets,
    total,
    hasMore: hasNextPage ?? false,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: error ?? null,
    loadMore,
    setType,
    setSearchQuery,
    searchQuery,
    isSearching,
    refresh,
    type,
  };
}

export type { UnifiedAsset, UserAssetType, UserAssetListResponse };

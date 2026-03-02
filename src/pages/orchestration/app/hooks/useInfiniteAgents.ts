import {
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  fetchUserAssets,
  searchUserAssets,
} from "@/services/userAssetsService";
import {
  UnifiedAsset,
  UserAssetListResponse,
  SearchUserAssetsResponse,
} from "@/types/user-assets";

interface UseInfiniteAgentsOptions {
  apiKey: string;
  limit?: number;
  enabled?: boolean;
}

interface UseInfiniteAgentsReturn {
  agents: UnifiedAsset[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  loadMore: () => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string;
  isSearching: boolean;
  refresh: () => Promise<void>;
}

interface FirstPageCache {
  managerTotal: number;
  agentTotal: number;
  managerFirstPage: UnifiedAsset[];
  agentFirstPage: UnifiedAsset[];
}

// Debounce delay for search (ms)
const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Fetches agents with pagination, displaying manager agents first then normal agents.
 * On page 1, fetches both types in parallel to get totals + data (2 calls).
 * On subsequent pages, uses cached totals and only fetches the needed type (1 call).
 */
async function fetchAgentsWithManagersFirst(
  apiKey: string,
  params: { page: number; limit: number },
  cache: React.MutableRefObject<FirstPageCache | null>,
): Promise<UserAssetListResponse> {
  const { page, limit } = params;

  // Page 1 or no cache: fetch both types to get data + totals
  if (page === 1 || !cache.current) {
    const [managerRes, agentRes] = await Promise.all([
      fetchUserAssets(apiKey, { page: 1, limit, type: "manager_agent" }),
      fetchUserAssets(apiKey, { page: 1, limit, type: "agent" }),
    ]);

    cache.current = {
      managerTotal: managerRes.total,
      agentTotal: agentRes.total,
      managerFirstPage: managerRes.assets,
      agentFirstPage: agentRes.assets,
    };

    const grandTotal = managerRes.total + agentRes.total;
    const totalManagerPages = Math.ceil(managerRes.total / limit);
    const totalPages =
      totalManagerPages + Math.ceil(agentRes.total / limit);

    // Return managers if any exist, otherwise return agents
    return {
      assets: totalManagerPages >= 1 ? managerRes.assets : agentRes.assets,
      total: grandTotal,
      page: 1,
      limit,
      has_more: 1 < totalPages,
    };
  }

  // Subsequent pages: use cached totals, single fetch (or cached first page)
  const { managerTotal, agentTotal, agentFirstPage, managerFirstPage } =
    cache.current;
  const grandTotal = managerTotal + agentTotal;
  const totalManagerPages = Math.ceil(managerTotal / limit);

  let assets: UnifiedAsset[];

  if (page <= totalManagerPages) {
    // Page 1 of managers is already cached
    if (page === 1) {
      assets = managerFirstPage;
    } else {
      const managersRes = await fetchUserAssets(apiKey, {
        page,
        limit,
        type: "manager_agent",
      });
      assets = managersRes.assets;
    }
  } else {
    const agentPage = page - totalManagerPages;
    // Page 1 of agents is already cached from the initial fetch
    if (agentPage === 1) {
      assets = agentFirstPage;
    } else {
      const agentsRes = await fetchUserAssets(apiKey, {
        page: agentPage,
        limit,
        type: "agent",
      });
      assets = agentsRes.assets;
    }
  }

  const totalPages = totalManagerPages + Math.ceil(agentTotal / limit);

  return {
    assets,
    total: grandTotal,
    page,
    limit,
    has_more: page < totalPages,
  };
}

/**
 * Search agents by name, with managers first.
 */
async function searchAgentsWithManagersFirst(
  apiKey: string,
  params: { q: string; page: number; limit: number },
): Promise<SearchUserAssetsResponse> {
  const { q, page, limit } = params;

  const emptyResponse: SearchUserAssetsResponse = {
    assets: [],
    total: 0,
    page: 1,
    limit: 100,
    has_more: false,
  };

  const [managerSearch, agentSearch] = await Promise.all([
    searchUserAssets(apiKey, {
      q,
      page: 1,
      limit: 100,
      type: "manager_agent",
    }).catch(() => emptyResponse),
    searchUserAssets(apiKey, {
      q,
      page: 1,
      limit: 100,
      type: "agent",
    }).catch(() => emptyResponse),
  ]);

  // Combine with managers first
  const allAssets = [...managerSearch.assets, ...agentSearch.assets];

  const offset = (page - 1) * limit;
  const paginatedAssets = allAssets.slice(offset, offset + limit);
  const hasMore = offset + limit < allAssets.length;

  return {
    assets: paginatedAssets,
    total: allAssets.length,
    page,
    limit,
    has_more: hasMore,
  };
}

export function useInfiniteAgents({
  apiKey,
  limit: initialLimit = 20,
  enabled = true,
}: UseInfiniteAgentsOptions): UseInfiniteAgentsReturn {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQueryState] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstPageCacheRef = useRef<FirstPageCache | null>(null);

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

  const queryKey = isSearching
    ? ["searchAgentsOrchestration", apiKey, debouncedSearchQuery, initialLimit]
    : ["infiniteAgentsOrchestration", apiKey, initialLimit];

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
          return searchAgentsWithManagersFirst(apiKey, {
            q: debouncedSearchQuery,
            page: pageParam as number,
            limit: initialLimit,
          });
        }
        return fetchAgentsWithManagersFirst(
          apiKey,
          {
            page: pageParam as number,
            limit: initialLimit,
          },
          firstPageCacheRef,
        );
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
      placeholderData: keepPreviousData,
    },
  );

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    // Clear cached totals so they're re-fetched on next page 1 load
    firstPageCacheRef.current = null;
    await queryClient.invalidateQueries({
      queryKey: ["infiniteAgentsOrchestration"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["searchAgentsOrchestration"],
    });
    await refetch();
  }, [queryClient, refetch]);

  // Flatten all pages into a single array of agents and deduplicate by ID
  const agents = useMemo(() => {
    if (!data?.pages) return [];
    const allAgents = data.pages.flatMap((page) => page.assets);

    const uniqueAgents = new Map<string, UnifiedAsset>();
    allAgents.forEach((agent) => {
      if (!uniqueAgents.has(agent.id)) {
        uniqueAgents.set(agent.id, agent);
      }
    });

    return Array.from(uniqueAgents.values());
  }, [data?.pages]);

  const total = data?.pages[0]?.total ?? 0;

  return {
    agents,
    total,
    hasMore: hasNextPage ?? false,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: error ?? null,
    loadMore,
    setSearchQuery,
    searchQuery,
    isSearching,
    refresh,
  };
}

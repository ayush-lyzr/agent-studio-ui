import {
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import axios from "@/lib/axios";

export interface ToolAction {
  name: string;
  description?: string;
  parameters: any;
  required_parameters?: string[];
}

export interface ToolProvider {
  _id: string;
  provider_id: string;
  type: string;
  meta_data: {
    categories: string[];
    description: string;
    logo: string;
    app_id: string;
    actions: ToolAction[];
  };
}

interface PaginatedToolsResponse {
  providers: ToolProvider[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

interface UseInfiniteToolsOptions {
  apiKey: string;
  limit?: number;
  enabled?: boolean;
}

interface UseInfiniteToolsReturn {
  tools: ToolProvider[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

/**
 * Fetches tools with pagination
 */
async function fetchTools(
  apiKey: string,
  params: { page: number; limit: number },
): Promise<PaginatedToolsResponse> {
  const { page, limit } = params;

  const response = await axios.get<PaginatedToolsResponse | ToolProvider[]>(
    "/providers/type",
    {
      params: {
        provider_type: "tool",
        page,
        limit,
      },
      headers: {
        "x-api-key": apiKey,
      },
    },
  );

  // Check if response is paginated or backward compatible (plain array)
  if (Array.isArray(response.data)) {
    return {
      providers: response.data,
      total: response.data.length,
      page: 1,
      limit: response.data.length,
      has_more: false,
    };
  }

  return response.data;
}

export function useInfiniteTools({
  apiKey,
  limit: initialLimit = 20,
  enabled = true,
}: UseInfiniteToolsOptions): UseInfiniteToolsReturn {
  const queryClient = useQueryClient();

  const queryKey = ["infiniteToolsOrchestration", apiKey, initialLimit];

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery<PaginatedToolsResponse, Error>({
    queryKey,
    queryFn: ({ pageParam = 1 }) => {
      return fetchTools(apiKey, {
        page: pageParam as number,
        limit: initialLimit,
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
    placeholderData: keepPreviousData,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["infiniteToolsOrchestration"],
    });
    await refetch();
  }, [queryClient, refetch]);

  // Flatten all pages into a single array of tools and deduplicate by ID
  const tools = useMemo(() => {
    if (!data?.pages) return [];
    const allTools = data.pages.flatMap((page) => page.providers);

    const uniqueTools = new Map<string, ToolProvider>();
    allTools.forEach((tool) => {
      if (!uniqueTools.has(tool._id)) {
        uniqueTools.set(tool._id, tool);
      }
    });

    return Array.from(uniqueTools.values());
  }, [data?.pages]);

  const total = data?.pages[0]?.total ?? 0;

  return {
    tools,
    total,
    hasMore: hasNextPage ?? false,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: error ?? null,
    loadMore,
    refresh,
  };
}

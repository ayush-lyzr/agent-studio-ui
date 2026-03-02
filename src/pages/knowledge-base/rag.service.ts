import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BASE_URL, RAG_URL } from "@/lib/constants";
import useStore from "@/lib/store";

export interface RAGConfig {
  _id: string;
  id: string;
  collection_name: string;
  description: string;
  vector_store_provider: string;
  embedding_model: string;
  semantic_data_model?: boolean;
  meta_data?: {
    database_name?: string;
    database_provider_id?: string;
  };
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface RAGResponse {
  configs: RAGConfig[];
}

// Service class for RAG operations
export class RAGService {
  constructor(private readonly apiKey: string) {}

  private get headers() {
    return {
      accept: "application/json",
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async fetchRAGs(params?: any): Promise<RAGConfig[]> {
    const response = await axios.get<RAGResponse>(
      `${RAG_URL}/v3/rag/user/${this.apiKey}/`,
      { headers: this.headers, params },
    );
    return response.data.configs?.map((rag) => ({ ...rag, id: rag._id })) ?? [];
  }

  async deleteRAG(ragId: string): Promise<void> {
    await axios.delete(`${BASE_URL}/v3/rag/${ragId}`, {
      headers: this.headers,
    });
  }

  async bulkDeleteRAGs(configIds: string[]): Promise<void> {
    await axios.post(
      `${RAG_URL}/v3/rag/bulk-delete/`,
      { config_ids: configIds },
      {
        headers: this.headers,
      },
    );
  }
}

// Custom hooks for RAG operations
export const useRAGService = ({ params = {} }: { params?: any }) => {
  const apiKey = useStore((state) => state.api_key);
  const queryClient = useQueryClient();
  const service = new RAGService(apiKey);

  const ragsQuery = useQuery({
    queryKey: ["rags", apiKey],
    queryFn: () => service.fetchRAGs(params),
    refetchOnWindowFocus: false,
    enabled: !!apiKey,
  });

  const deleteMutation = useMutation({
    mutationFn: (ragId: string) => service.deleteRAG(ragId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rags", apiKey] });
    },
  });

  const { mutateAsync: deleteMultiRag, isPending: isDeletingMultiRag } =
    useMutation({
      mutationKey: ["deleteMultiRag", apiKey],
      mutationFn: ({ configIds }: { configIds: string[] }) =>
        service.bulkDeleteRAGs(configIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["rags", apiKey] });
      },
    });

  return {
    ragConfigs: ragsQuery.data ?? [],
    isFetchingRagConfigs: ragsQuery.isFetching,
    isError: ragsQuery.isError,
    getRagConfigs: ragsQuery.refetch,
    deleteRAG: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteMultiRag,
    isDeletingMultiRag,
  };
};

// Query keys for better type safety and reusability
export const ragKeys = {
  all: ["rags"] as const,
  lists: () => [...ragKeys.all, "list"] as const,
  list: (apiKey: string) => [...ragKeys.lists(), apiKey] as const,
  detail: (id: string) => [...ragKeys.all, "detail", id] as const,
};

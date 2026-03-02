import axios from "@/lib/axios";
import { RAG_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useRagDocsService = ({
  rag_id,
  fetchEnabled = true,
}: {
  rag_id: string;
  fetchEnabled?: boolean;
}) => {
  const apiKey = useStore((state) => state.api_key);

  const canFetch = fetchEnabled !== false && !!rag_id && !!apiKey;

  const { mutateAsync: ragParseText, isPaused: isParsingRagText } = useMutation(
    {
      mutationKey: ["rag-parse-text", rag_id],
      mutationFn: (input: { text: string; source: string }[]) =>
        axios.post(`v3/parse/text`, input, {
          baseURL: RAG_URL,
          headers: { "x-api-key": apiKey },
        }),
    },
  );

  const { data: completeRagData } = useQuery({
    queryKey: ["fetchRag", rag_id, apiKey],
    queryFn: async () =>
      axios.get(`/v3/rag/${rag_id}/`, {
        baseURL: RAG_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: canFetch,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { data: ragDocuments } = useQuery({
    queryKey: ["ragDocs", rag_id, apiKey],
    queryFn: async () => {
      const response = await axios.get(
        `${RAG_URL}/v3/rag/documents/${rag_id}/`,
        {
          headers: { accept: "application/json", "x-api-key": apiKey },
        },
      );
      return response.data || [];
    },
    enabled: canFetch,
    refetchOnWindowFocus: false,
  });

  return {
    ragParseText,
    isParsingRagText,
    completeRagData,
    ragDocuments,
  };
};

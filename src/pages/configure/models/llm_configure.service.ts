import { useQuery } from "@tanstack/react-query";

import axios from "@/lib/axios";

export const useLLMConfig = ({ apiKey }: { apiKey: string }) => {
  const params = { headers: { "x-api-key": apiKey } };

  const { isFetching: isFetchingModels, refetch: getLLMModels } = useQuery({
    queryKey: ["getLLMModels"],
    queryFn: () => axios.get("/llm_configs/models", params),
  });

  return {
    isFetchingModels,
    getLLMModels,
  };
};

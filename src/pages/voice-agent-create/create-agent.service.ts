import axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useCreateAgentService = ({
  providerKey,
  apiKey,
}: {
  providerKey?: string;
  apiKey: string;
}) => {
  const { isFetching: isFetchingUserCredentials, refetch: getUserCredentials } =
    useQuery({
      queryKey: ["getAgentById", providerKey, apiKey],
      queryFn: () =>
        axios.get(`providers/credentials/user/llm/${providerKey}`, {
          headers: {
            "x-api-key": apiKey,
          },
        }),
      select: (res: AxiosResponse) => res.data?.credentials ?? [],
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      enabled: false,
    });

  const {
    isFetching: isFetchingUserTools,
    refetch: getUserTools,
    data: userTools = [],
  } = useQuery({
    queryKey: ["getUserTools", apiKey],
    queryFn: () =>
      axios.get(`tools/all/user`, {
        headers: {
          "x-api-key": apiKey,
        },
      }),
    select: (res: AxiosResponse) => res.data,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const getToolsField = (
    toolId?: string,
    toolSource?: string,
    appId?: string,
    serverId?: string,
  ) =>
    useQuery({
      queryKey: ["getToolsField", apiKey, toolId, toolSource, appId, serverId],
      queryFn: () => {
        const params: Record<string, string> = {};
        if (toolSource) params.tool_source = toolSource;
        if (appId) params.app_id = appId;
        if (serverId) params.server_id = serverId;

        return axios.get(`/providers/tools/actions/${toolId}`, {
          headers: {
            "x-api-key": apiKey,
          },
          params,
        });
      },
      select: (res: AxiosResponse) => res.data,
      enabled: !!toolId,
      retry: false,
      refetchOnWindowFocus: false,
    });

  return {
    getUserCredentials,
    isFetchingUserCredentials,
    getUserTools,
    isFetchingUserTools,
    userTools,
    getToolsField,
  };
};

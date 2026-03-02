import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BASE_URL, LYZR_MCP_URL } from "@/lib/constants";
import { ToolConnection } from "@/lib/types";

export const useTools = ({ apiKey }: { apiKey: string }) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser?.auth;

  const { isFetching: isFetchingTools, refetch: getTools } = useQuery({
    queryKey: ["getTools"],
    queryFn: () =>
      axios.get(`providers/tools/all`, {
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: false,
  });

  const { mutateAsync: createTool, isPending: isCreatingTool } = useMutation({
    mutationKey: ["createTool"],
    mutationFn: ({ type, enabled, ...values }: any) =>
      axios.put(`/tool`, values, {
        params: { type, enabled, user_id: user?.email },
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: updateTool, isPending: isUpdatingTool } = useMutation({
    mutationKey: ["updateTool"],
    mutationFn: ({ type, enabled, ...values }: any) =>
      axios.put(`/tool/${user?.email}`, values, {
        params: { type, enabled },
        headers: { "x-api-key": apiKey },
      }),
  });

  const saveToolCredentials = async (payload: {
    name: string;
    provider_id: string;
    type: string;
    credentials: Record<string, string>;
    meta_data: Record<string, any>;
  }) => {
    return axios.post(
      `${import.meta.env.VITE_BASE_URL}/v3/providers/credentials`,
      payload,
      {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );
  };

  const fetchToolCredentials = async (apiKey: string, providerId: string) => {
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/v3/providers/credentials/user/tool/${providerId}`,
      {
        headers: { "x-api-key": apiKey },
      },
    );
    return { data: response.data.credentials };
  };

  const getToolCredentials = (providerId: string) => {
    return fetchToolCredentials(apiKey, providerId);
  };

  const { isFetching: isFetchingToolCredentials } = useQuery({
    queryKey: ["getToolCredentials"],
    queryFn: () => null,
    enabled: false,
  });

  const { mutateAsync: deleteExternalTool, isPending: isDeletingExternalTool } =
    useMutation({
      mutationKey: ["deleteExternalTool"],
      mutationFn: (connectionId: string) =>
        axios.delete(`/tools/composio/connections/${connectionId}`, {
          headers: { "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: deleteCustomTool, isPending: isDeletingCustomTool } =
    useMutation({
      mutationKey: ["deleteCustomTool"],
      mutationFn: (providerId: string) =>
        axios.delete(`/tools/${providerId}`, {
          headers: { "x-api-key": apiKey },
        }),
    });

  // Older endpoint for bulk-delete
  // const {
  //   mutateAsync: deleteMultiCustomTools,
  //   isPending: isDeletingMultiCustomTools,
  // } = useMutation({
  //   mutationKey: ["deleteMultiCustomTools"],
  //   mutationFn: ({ tool_ids }: { tool_ids: string[] }) =>
  //     axios.post(
  //       `/tools/bulk-delete`,
  //       { tool_ids },
  //       {
  //         headers: {
  //           accept: "application/json",
  //           "x-api-key": apiKey,
  //           "Content-Type": "application/json",
  //         },
  //       },
  //     ),
  //   onSuccess: (res: AxiosResponse) => res.data,
  // });

  const {
    mutateAsync: deleteMultiCustomTools,
    isPending: isDeletingMultiCustomTools,
  } = useMutation({
    mutationKey: ["deleteMultiCustomTools"],
    mutationFn: ({ credential_ids }: { credential_ids: string[] }) =>
      axios.post(
        `/tools/credentials/bulk-delete`,
        { credential_ids },
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      ),
    onSuccess: (res: AxiosResponse) => res.data,
  });

  const { mutateAsync: getOpenAPITool, isPending: isGettingOpenAPITool } =
    useMutation({
      mutationKey: ["getOpenAPITool"],
      mutationFn: ({
        providerId,
        apiKey,
      }: {
        providerId: string;
        apiKey: string;
      }) =>
        axios.get(`${BASE_URL}/v3/tools/${providerId}`, {
          headers: { "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: updateOpenAPITool, isPending: isUpdatingOpenAPITool } =
    useMutation({
      mutationKey: ["updateOpenAPITool"],
      mutationFn: ({
        providerId,
        type,
        enabled,
        ...values
      }: {
        providerId: string;
        type?: any;
        enabled?: boolean;
      } & Record<string, any>) =>
        axios.put(`/v3/tools/${providerId}`, values, {
          baseURL: BASE_URL,
          params: { type, enabled },
          headers: { "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: connectOAuthTool } = useMutation({
    mutationKey: ["connectOAuthTool"],
    mutationFn: ({ payload }: { payload: any }) =>
      axios.post(`${BASE_URL}/v3/tools/aci/configurations`, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }),
  });

  const { mutateAsync: getACIConfigurations } = useMutation({
    mutationKey: ["getACIConfigurations"],
    mutationFn: () =>
      axios.get(`/tools/aci/configurations`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const {
    mutateAsync: createCustomAciTool,
    isPending: isCreatingCustomAciTool,
  } = useMutation({
    mutationKey: ["createCustomAciTool"],
    mutationFn: (payload: any) =>
      axios.post(`/v3/providers/aci/custom-apps`, payload, {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        baseURL: BASE_URL,
      }),
  });

  // Not using this endpoint: Older endpoint
  // const { mutateAsync: createOpenAPITool } = useMutation({
  //   mutationKey: ["createOpenAPITool"],
  //   mutationFn: (payload: any) =>
  //     axios.post(`/tools/`, payload, {
  //       headers: {
  //         accept: "application/json",
  //         "x-api-key": apiKey,
  //         "Content-Type": "application/json",
  //       },
  //     }),
  // });

  const { mutateAsync: createOpenAPITool } = useMutation({
    mutationKey: ["createOpenAPITool"],
    mutationFn: (payload: any) =>
      axios.post(`/tools/`, payload, {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }),
  });

  const { mutateAsync: connectToolById, isPending: isConnectingToolById } =
    useMutation({
      mutationKey: ["connectToolById"],
      mutationFn: ({
        authType,
        appId,
        params,
      }: {
        authType: string;
        appId: string;
        params: Record<string, string>;
      }) =>
        axios.get(`/tools/aci/connect/${authType}/${appId}`, {
          params,
          headers: { "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: unlinkACITool } = useMutation({
    mutationKey: ["unlinkACITool"],
    mutationFn: (accountId: string) =>
      axios.delete(`/tools/aci/connect/${accountId}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: deleteACITool } = useMutation({
    mutationKey: ["deleteACITool"],
    mutationFn: (appId: string) =>
      axios.delete(`/tools/aci/configurations/${appId}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: deleteCustomAciTool } = useMutation({
    mutationKey: ["deleteCustomAciTool"],
    mutationFn: (appName: string) =>
      axios.delete(`/providers/aci/custom-apps/${appName}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { refetch: getMCPServers } = useQuery({
    queryKey: ["getMCPServers"],
    queryFn: () =>
      axios.get(`/tools/mcp/servers`, { headers: { "x-api-key": apiKey } }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
  });

  const {
    mutateAsync: getMCPServersActions,
    isPending: isGettingMCPServersActions,
  } = useMutation({
    mutationKey: ["getMCPServersActions"],
    mutationFn: (serverId: string) =>
      axios.get(`/tools/mcp/servers/${serverId}/tools`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: createMCPServer, isPending: isCreatingMCPServer } =
    useMutation({
      mutationKey: ["createMCPServer"],
      mutationFn: ({ payload }: { payload: any }) =>
        axios.post(`/tools/mcp/servers`, payload, {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        }),
    });

  const { mutateAsync: initiateMCPOauth } = useMutation({
    mutationKey: ["initiateMCPOauth"],
    mutationFn: (serverId: string) =>
      axios.post(
        `/tools/mcp/servers/${serverId}/oauth/initiate`,
        {},
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      ),
  });

  const { mutateAsync: deleteMCPServer } = useMutation({
    mutationKey: ["deleteMCPServer"],
    mutationFn: (serverId: string) =>
      axios.delete(`/tools/mcp/servers/${serverId}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { data: defaultMCPTools, refetch: getDefaultMCPTools } = useQuery({
    queryKey: ["getDefaultMCPTools"],
    queryFn: () =>
      axios.get(`/api/v1/mcp/standard-servers`, {
        headers: { "x-api-key": apiKey },
        baseURL: LYZR_MCP_URL,
      }),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: connectToolOAuth } = useMutation({
    mutationKey: ["connectToolOAuth"],
    mutationFn: (payload: ToolConnection) =>
      axios.post(`/tools/credentials/oauth`, payload, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: oAuthStatusCredential } = useMutation({
    mutationKey: ["oAuthStatusCredential"],
    mutationFn: (credentialId: string) =>
      axios.patch(
        `/tools/credentials/${credentialId}/status`,
        {},
        {
          headers: { "x-api-key": apiKey },
        },
      ),
  });

  const { mutateAsync: getToolActions, isPending: isGettingToolActions } =
    useMutation({
      mutationKey: ["getToolActions"],
      mutationFn: (toolID: string) =>
        axios.get(`/providers/tools/actions/${toolID}`, {
          headers: { "x-api-key": apiKey },
        }),
    });

  const {
    data: userConnectedAccounts,
    refetch: getUserConnectedAccounts,
    isFetching: isFetchingUserConnectedAccounts,
  } = useQuery({
    queryKey: ["getUserConnectedAccounts", user?.email],
    queryFn: () =>
      axios.get(`/tools/credentials/connected_accounts`, {
        params: { user_id: user?.email },
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: !!apiKey && !!user?.email,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: createStaticCreds } = useMutation({
    mutationKey: ["createStaticCreds"],
    mutationFn: ({ payload }: { payload: any }) =>
      axios.post(`/tools/credentials/static`, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }),
  });

  const {
    mutateAsync: deleteProviderCreds,
    isPending: isDeletingProviderCreds,
  } = useMutation({
    mutationKey: ["deleteProviderCreds"],
    mutationFn: (credentialId: string) =>
      axios.delete(`/tools/credentials/${credentialId}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: deleteProvider } = useMutation({
    mutationKey: ["deleteProvider"],
    mutationFn: (providerId: string) =>
      axios.delete(`/providers/${providerId}`, {
        headers: { "x-api-key": apiKey },
      }),
  });

  return {
    isFetchingTools,
    getTools,
    createTool,
    isCreatingTool,
    updateTool,
    isUpdatingTool,
    saveToolCredentials,
    isFetchingToolCredentials,
    getToolCredentials,
    deleteExternalTool,
    isDeletingExternalTool,
    deleteCustomTool,
    isDeletingCustomTool,
    getOpenAPITool,
    isGettingOpenAPITool,
    updateOpenAPITool,
    isUpdatingOpenAPITool,
    connectOAuthTool,
    connectToolById,
    isConnectingToolById,
    unlinkACITool,
    deleteACITool,
    createOpenAPITool,
    deleteCustomAciTool,
    isCreatingCustomAciTool,
    createCustomAciTool,
    getACIConfigurations,
    getMCPServers,
    getMCPServersActions,
    isGettingMCPServersActions,
    createMCPServer,
    isCreatingMCPServer,
    initiateMCPOauth,
    deleteMCPServer,
    deleteMultiCustomTools,
    isDeletingMultiCustomTools,
    defaultMCPTools,
    getDefaultMCPTools,
    connectToolOAuth,
    oAuthStatusCredential,
    getToolActions,
    isGettingToolActions,
    userConnectedAccounts,
    getUserConnectedAccounts,
    isFetchingUserConnectedAccounts,
    createStaticCreds,
    deleteProviderCreds,
    isDeletingProviderCreds,
    deleteProvider,
  };
};

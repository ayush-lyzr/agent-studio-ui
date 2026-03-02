import { AxiosResponse } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { MARKETPLACE_URL, PAGOS_URL } from "@/lib/constants";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { ManagedAgent } from "@/pages/create-agent/types";
interface AgentValues {
  _id?: string;
  name: string;
  description?: string;
  agent_role?: string;
  agent_instructions?: string;
  features: Array<{
    type: string;
    config: Record<string, any>;
    priority: number;
  }>;
  tools?: any[];
  provider_id: string;
  model: string;
  temperature: string | number;
  top_p: string | number;
  tool?: string | null;
  tool_usage_description?: string | null;
  created_at?: string;
  updated_at?: string;
  llm_credential_id?: string;
  examples?: string | null;
  managed_agents?: ManagedAgent[];
  response_format:
    | { type: "json_schema"; json_schema: { strict: boolean; schema: any } }
    | { type: "text" };
}

export const useAgentBuilder = ({
  apiKey,
  agentId,
  permission_type,
}: {
  apiKey: string;
  agentId?: string;
  permission_type?: "agent" | "knowledge_base" | "app";
}) => {
  const params = { headers: { "x-api-key": apiKey } };

  const { current_organization } = useManageAdminStore((state) => state);
  const token = useStore((state) => state.app_token);

  const {
    isFetching: isFetchingAgents,
    refetch: getAgents,
    data: agents = [],
  } = useQuery({
    queryKey: ["getAgents", apiKey],
    queryFn: async () => {
      try {
        const response = await axios.get("/agents/", params);
        useStore.getState().setAgents(response.data);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const { isFetching: isFetchingAgentById, refetch: getAgentById } = useQuery({
    queryKey: ["getAgentById", agentId, apiKey],
    queryFn: () => axios.get(`/agents/${agentId}`, params),
    select: (res: AxiosResponse) => res.data,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const { isFetching: isFetchingAgentPolicies, refetch: getAgentPolicy } =
    useQuery({
      queryKey: ["getAgentPolicy", current_organization?.org_id],
      queryFn: () =>
        axios.get("/policies/assigned-permissions", {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
          params: {
            organization_id: current_organization?.org_id,
            permission_type,
          },
        }),
      retry: false,
      select: (res: AxiosResponse) => res.data,
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      enabled: false,
    });

  const { mutateAsync: createAgent, isPending: isCreatingAgent } = useMutation({
    mutationKey: ["createAgent", apiKey],
    mutationFn: ({
      endpoint,
      values,
    }: {
      endpoint: string;
      values: AgentValues;
    }) => axios.post(endpoint, values, params),
    onSuccess: (res: AxiosResponse) => res.data,
  });

  const { mutateAsync: updateAgent, isPending: isUpdatingAgent } = useMutation({
    mutationKey: ["updateAgent", apiKey],
    mutationFn: ({
      agentId,
      endpoint,
      values,
    }: {
      agentId: string;
      endpoint: string;
      values: AgentValues;
    }) => axios.put(`${endpoint}/${agentId}`, values, params),
    onSuccess: (res: AxiosResponse) => res.data,
  });

  const { mutateAsync: shareResource, isPending: isSharingAgent } = useMutation(
    {
      mutationKey: ["shareAgent"],
      mutationFn: (data: {
        resource_id: string;
        resource_type: string;
        email_ids: string[];
      }) =>
        axios.post(
          `/policies/share-resource`,
          {
            ...data,
            admin_user_id: current_organization?.admin_user_id,
            org_id: current_organization?.org_id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            baseURL: PAGOS_URL,
          },
        ),
      onSuccess: (res: AxiosResponse) => toast.success(res.data?.message),
    },
  );

  const { mutateAsync: unShareResource, isPending: isUnSharingAgent } =
    useMutation({
      mutationKey: ["unShareAgent"],
      mutationFn: (data: {
        resource_id: string;
        resource_type: string;
        email_ids: string[];
      }) =>
        axios.post(
          `/policies/unshare-resource`,
          {
            ...data,
            email_ids: data?.email_ids,
            admin_user_id: current_organization?.admin_user_id,
            org_id: current_organization?.org_id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            baseURL: PAGOS_URL,
          },
        ),
      onSuccess: (res: AxiosResponse) => toast.success(res.data?.message),
    });

  const { mutateAsync: deleteAgent, isPending: isDeletingAgent } = useMutation({
    mutationKey: ["deleteAgent"],
    mutationFn: (agentId: string) => axios.delete(`/agents/${agentId}`, params),
    onSuccess: (res: AxiosResponse) => res.data,
  });

  const { mutateAsync: deleteMultiAgent, isPending: isDeletingMultiAgent } =
    useMutation({
      mutationKey: ["deleteMultiAgent", apiKey],
      mutationFn: ({ agentIds }: { agentIds: string[] }) =>
        axios.post(
          `/agents/bulk-delete`,
          { agent_ids: agentIds },
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

  const { mutateAsync: createA2AAgent, isPending: isCreatingA2AAgent } =
    useMutation({
      mutationKey: ["createA2AAgent", apiKey],
      mutationFn: ({
        name,
        base_url,
        description,
      }: {
        name: string;
        base_url: string;
        description?: string;
      }) => axios.post(`/a2a/agents/`, { name, base_url, description }, params),
      onSuccess: (res: AxiosResponse) => res.data,
    });

  const { mutateAsync: updateA2AAgent, isPending: isUpdatingA2AAgent } =
    useMutation({
      mutationKey: ["updateA2AAgent", apiKey],
      mutationFn: ({
        agentId,
        name,
        base_url,
        description,
      }: {
        agentId: string;
        name: string;
        base_url: string;
        description?: string;
      }) =>
        axios.put(
          `/a2a/agents/${agentId}`,
          { name, base_url, description },
          params,
        ),
      onSuccess: (res: AxiosResponse) => res.data,
    });

  const { isFetching: isFetchingA2AAgents, refetch: getA2AAgents } = useQuery({
    queryKey: ["getA2AAgents", apiKey],
    queryFn: () => axios.get(`/a2a/agents/`, params),
    select: (res: AxiosResponse) => res.data,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const { mutateAsync: deleteA2AAgent, isPending: isDeletingA2AAgent } =
    useMutation({
      mutationKey: ["deleteA2AAgent"],
      mutationFn: (agentId: string) =>
        axios.delete(`/a2a/agents/${agentId}`, {
          headers: { "x-api-key": apiKey },
        }),
      onSuccess: (res: AxiosResponse) => res.data,
    });

  const {
    mutateAsync: deleteMultiA2AAgent,
    isPending: isDeletingMultiA2AAgent,
  } = useMutation({
    mutationKey: ["deleteMultiA2AAgent", apiKey],
    mutationFn: ({ agentIds }: { agentIds: string[] }) =>
      axios.post(
        `/a2a/agents/bulk-delete`,
        { agent_ids: agentIds },
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

  return {
    agents,
    isFetchingAgents,
    getAgents,
    isFetchingAgentById,
    getAgentById,
    isCreatingAgent,
    createAgent,
    updateAgent,
    isUpdatingAgent,
    deleteAgent,
    isDeletingAgent,
    shareResource,
    isSharingAgent,
    unShareResource,
    isUnSharingAgent,
    getAgentPolicy,
    isFetchingAgentPolicies,
    deleteMultiAgent,
    isDeletingMultiAgent,
    createA2AAgent,
    isCreatingA2AAgent,
    updateA2AAgent,
    isUpdatingA2AAgent,
    getA2AAgents,
    isFetchingA2AAgents,
    deleteA2AAgent,
    isDeletingA2AAgent,
    deleteMultiA2AAgent,
    isDeletingMultiA2AAgent,
  };
};

export const useUserApps = (userId: string | undefined, token: string) => {
  return useQuery({
    queryKey: ["userApps", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await axios.get(`/apps/user/${userId}`, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: !!userId,
  });
};

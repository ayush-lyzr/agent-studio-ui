import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import type {
  IMemoryProvider,
  IMemoryCredential,
  IMemoryResource,
  ProvisioningStatus,
} from "./types";
import { BEDROCK_LAMBDA_URL } from "@/lib/constants";

export const useMemory = ({
  enabled = false,
  providersEnabled = false,
  providerId,
}: {
  enabled?: boolean;
  providersEnabled?: boolean;
  credentialId?: string;
  providerId?: string;
} = {}) => {
  const apiKey = useStore((state) => state.api_key);
  const params = { headers: { "x-api-key": apiKey } };

  // Fetch memory providers
  const {
    refetch: getProviders,
    isFetching: isFetchingProviders,
    data: memoryProviders = [],
  } = useQuery<IMemoryProvider[]>({
    queryKey: ["getMemoryProviders", apiKey],
    queryFn: () =>
      axios.get("/memory/providers", params).then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: providersEnabled,
  });

  // Fetch user's memory credentials for a specific provider
  const {
    isFetching: isFetchingCredentials,
    refetch: getCredentials,
    data: credentials = [],
  } = useQuery<IMemoryCredential[]>({
    queryKey: ["getMemoryCredentials", apiKey, providerId],
    queryFn: () =>
      axios
        .get(`/providers/credentials/user/memory/${providerId}`, params)
        .then((res) => res.data.credentials ?? []),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled && !!providerId,
  });

  const {
    refetch: getMemoryProvider,
    isFetching: isFetchingMemoryProvider,
    data: dataProvider = [],
  } = useQuery<IMemoryProvider[]>({
    queryKey: ["getMemoryProvider", apiKey],
    queryFn: () =>
      axios
        .get(`/providers/type?provider_type=memory`, params)
        .then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: providersEnabled,
  });

  // Create a new memory credential
  const { mutateAsync: createCredential, isPending: isCreatingCredential } =
    useMutation({
      mutationKey: ["createMemoryCredential"],
      mutationFn: (values: {
        name: string;
        provider_id: string;
        type: string;
        credentials: object;
        meta_data: object;
      }) => axios.post("/providers/credentials", values, params),
    });

  // Delete a memory credential
  const { mutateAsync: deleteCredential, isPending: isDeletingCredential } =
    useMutation({
      mutationKey: ["deleteMemoryCredential"],
      mutationFn: ({ credential_id }: { credential_id: string }) =>
        axios.delete(`/providers/credentials/${credential_id}`, params),
    });

  // Validate credentials and list existing memory resources
  const { mutateAsync: validateAndListMemories, isPending: isValidating } =
    useMutation({
      mutationKey: ["validateMemoryCredentials"],
      mutationFn: (credentialId: string) =>
        axios
          .get(`/memory/aws-agentcore/${credentialId}/validate`, params)
          .then((res) => res.data),
    });

  // List memory resources for a credential
  const { mutateAsync: listMemoryResources, isPending: isListingResources } =
    useMutation({
      mutationKey: ["listMemoryResources"],
      mutationFn: (credentialId: string) =>
        axios
          .get<{
            memories: IMemoryResource[];
          }>(`/memory/aws-agentcore/${credentialId}/resources`, params)
          .then((res) => res.data.memories ?? []),
    });

  // Use an existing memory resource
  const { mutateAsync: useExistingMemory, isPending: isUsingExisting } =
    useMutation({
      mutationKey: ["useExistingMemory"],
      mutationFn: ({
        credentialId,
        memoryId,
      }: {
        credentialId: string;
        memoryId: string;
      }) =>
        axios
          .post(
            `/memory/aws-agentcore/${credentialId}/use-existing`,
            { memory_id: memoryId },
            params,
          )
          .then((res) => res.data),
    });

  // Provision a new memory resource
  const { mutateAsync: provisionMemory, isPending: isProvisioning } =
    useMutation({
      mutationKey: ["provisionMemory"],
      mutationFn: ({
        credentialId,
        memoryName,
        eventExpiryDays = 30,
        memoryStrategy,
      }: {
        credentialId: string;
        memoryName: string;
        eventExpiryDays?: number;
        memoryStrategy?: string;
      }) => {
        const body: any = {
          memory_name: memoryName,
          event_expiry_days: eventExpiryDays,
        };
        // Only include memory_strategy if provided
        if (memoryStrategy) {
          body.memory_strategy = memoryStrategy;
        }
        return axios
          .post(`/memory/aws-agentcore/${credentialId}/provision`, body, params)
          .then((res) => res.data);
      },
    });

  // Get provisioning status
  const { mutateAsync: getProvisioningStatus, isPending: isFetchingStatus } =
    useMutation({
      mutationKey: ["getProvisioningStatus"],
      mutationFn: (credentialId: string) =>
        axios
          .get<ProvisioningStatus>(
            `/memory/aws-agentcore/${credentialId}/status`,
            params,
          )
          .then((res) => res.data),
    });

  // Delete AWS memory resource
  const { mutateAsync: deleteMemoryResource, isPending: isDeletingResource } =
    useMutation({
      mutationKey: ["deleteMemoryResource"],
      mutationFn: (credentialId: string) =>
        axios
          .delete(`/memory/aws-agentcore/${credentialId}/aws-resource`, params)
          .then((res) => res.data),
    });

  // Register role ARN with Lambda (called from frontend after credential creation)
  const { mutateAsync: registerRoleWithLambda } = useMutation({
    mutationKey: ["registerRoleWithLambda"],
    mutationFn: async (roleArn: string): Promise<boolean> => {
      if (!BEDROCK_LAMBDA_URL) {
        console.warn("Bedrock Lambda URL is not configured");
        return true; // Skip if not configured
      }

      try {
        await axios.post(
          BEDROCK_LAMBDA_URL,
          { role_arn: roleArn },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        console.log(`Lambda called successfully with role_arn ${roleArn}`);
        return true;
      } catch (error) {
        console.error("Error calling Lambda:", error);
        return false;
      }
    },
  });

  return {
    // Providers
    getProviders,
    isFetchingProviders,
    memoryProviders,
    getMemoryProvider,
    isFetchingMemoryProvider,
    dataProvider,

    // Credentials
    credentials,
    isFetchingCredentials,
    getCredentials,
    createCredential,
    isCreatingCredential,
    deleteCredential,
    isDeletingCredential,

    // Memory resources
    validateAndListMemories,
    isValidating,
    listMemoryResources,
    isListingResources,
    useExistingMemory,
    isUsingExisting,
    provisionMemory,
    isProvisioning,
    getProvisioningStatus,
    isFetchingStatus,
    deleteMemoryResource,
    isDeletingResource,

    // Lambda registration
    registerRoleWithLambda,
  };
};

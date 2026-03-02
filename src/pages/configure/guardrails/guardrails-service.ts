import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { BEDROCK_LAMBDA_URL } from "@/lib/constants";
import type { IGuardrailProvider, IGuardrailCredential } from "./types";

export const useGuardrails = ({
  enabled = false,
  providersEnabled = false,
  providerId,
}: {
  enabled?: boolean;
  providersEnabled?: boolean;
  providerId?: string;
} = {}) => {
  const apiKey = useStore((state) => state.api_key);
  const params = { headers: { "x-api-key": apiKey } };

  // Fetch guardrail providers
  const {
    refetch: getProviders,
    isFetching: isFetchingProviders,
    data: guardrailProviders = [],
  } = useQuery<IGuardrailProvider[]>({
    queryKey: ["getGuardrailProviders", apiKey],
    queryFn: () =>
      axios
        .get("/providers/type?provider_type=guardrail", params)
        .then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: providersEnabled && !!apiKey,
  });

  // Fetch user's guardrail credentials for a specific provider
  const {
    isFetching: isFetchingCredentials,
    refetch: getCredentials,
    data: credentials = [],
  } = useQuery<IGuardrailCredential[]>({
    queryKey: ["getGuardrailCredentials", apiKey, providerId],
    queryFn: () =>
      axios
        .get(`/providers/credentials/user/guardrail/${providerId}`, params)
        .then((res) => res.data.credentials ?? []),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled && !!providerId && !!apiKey,
  });

  // Create a new guardrail credential
  const { mutateAsync: createCredential, isPending: isCreatingCredential } =
    useMutation({
      mutationKey: ["createGuardrailCredential"],
      mutationFn: (values: {
        name: string;
        provider_id: string;
        type: string;
        credentials: object;
        meta_data: object;
      }) => axios.post("/providers/credentials", values, params),
    });

  // Delete a guardrail credential
  const { mutateAsync: deleteCredential, isPending: isDeletingCredential } =
    useMutation({
      mutationKey: ["deleteGuardrailCredential"],
      mutationFn: ({ credential_id }: { credential_id: string }) =>
        axios.delete(`/providers/credentials/${credential_id}`, params),
    });

  // Register role ARN with Lambda (for AWS Bedrock cross-account access)
  const { mutateAsync: registerRoleWithLambda } = useMutation({
    mutationKey: ["registerGuardrailRoleWithLambda"],
    mutationFn: async (roleArn: string): Promise<boolean> => {
      if (!BEDROCK_LAMBDA_URL) {
        console.warn("Bedrock Lambda URL is not configured");
        return true;
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
    guardrailProviders,

    // Credentials
    credentials,
    isFetchingCredentials,
    getCredentials,
    createCredential,
    isCreatingCredential,
    deleteCredential,
    isDeletingCredential,

    // Lambda registration
    registerRoleWithLambda,
  };
};

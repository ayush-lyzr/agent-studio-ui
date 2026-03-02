import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import axios from "@/lib/axios";
import { AxiosError, AxiosResponse } from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BASE_URL } from "@/lib/constants";

export const useDataConnector = ({
  apiKey,
  providerId,
  providerType,
}: {
  apiKey: string;
  providerId?: string;
  providerType?: string;
}) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser?.auth;

  const { isFetching: isFetchingVectorStores, refetch: getVectorStores } =
    useQuery({
      queryKey: ["getVectorStores"],
      queryFn: () =>
        axios.get(`providers/type?provider_type=vector_store`, {
          headers: { "x-api-key": apiKey },
        }),
      select: (res: AxiosResponse) => res.data,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      enabled: false,
    });

  const { isFetching: isFetchingDatabases, refetch: getDatabases } = useQuery({
    queryKey: ["getDatabases"],
    queryFn: () =>
      axios.get(`providers/type?provider_type=database`, {
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: false,
  });

  const {
    mutateAsync: createDataConnector,
    isPending: isCreatingDataConnector,
  } = useMutation({
    mutationKey: ["createDataConnector"],
    mutationFn: ({ type, enabled, ...values }: any) =>
      axios.put(`/data-connector`, values, {
        params: { type, enabled, user_id: user?.email },
        headers: { "x-api-key": apiKey },
      }),
  });

  const {
    mutateAsync: updateDataConnector,
    isPending: isUpdatingDataConnector,
  } = useMutation({
    mutationKey: ["updateDataConnector"],
    mutationFn: ({ type, enabled, ...values }: any) =>
      axios.put(`/data-connector/${user?.email}`, values, {
        params: { type, enabled },
        headers: { "x-api-key": apiKey },
      }),
  });

  const { mutateAsync: saveCredentials, isPending: isSavingCredential } =
    useMutation({
      mutationKey: ["saveCredentials"],
      mutationFn: async (input: {
        name: string;
        provider_id: string;
        type: string;
        credentials: Record<string, string>;
        meta_data: Record<string, any>;
      }) => {
        const response = await axios.post(`/v3/providers/credentials`, input, {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        });

        // Special handling for AWS Neptune - non-blocking operation
        if (input.provider_id === "neptune" && input.credentials?.aws_role_arn) {
          try {
            const bedrockLambdaUrl = import.meta.env.VITE_BEDROCK_LAMBDA_URL;
            if (bedrockLambdaUrl) {
              await axios.post(
                bedrockLambdaUrl,
                { role_arn: input.credentials.aws_role_arn },
                {
                  headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                      "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                  },
                  timeout: 10000, // 10 second timeout
                },
              );
              console.log(
                `Neptune Lambda called successfully with role_arn ${input.credentials.aws_role_arn}`,
              );
            } else {
              console.warn("VITE_BEDROCK_LAMBDA_URL not configured for Neptune setup");
            }
          } catch (error) {
            // Log error but don't throw - this is a non-critical operation
            console.error("Error calling Neptune Lambda (non-critical):", error);
          }
        }

        return response;
      },
      onError: (error: AxiosError<{ detail: string }>) => {
        toast.error(
          error?.response?.data?.detail ??
            "Your database credentials could not be verified. Please check your credentials and try again.",
          { duration: 3 * 1000 },
        );
      },
      retry: 1,
    });

  const {
    mutateAsync: saveFileCredentials,
    isPending: isSavingFileCredential,
  } = useMutation({
    mutationKey: ["saveFileCredentials"],
    mutationFn: (input: {
      name: string;
      provider_id: string;
      type: string;
      credentials: Record<string, string>;
      meta_data: Record<string, any>;
      files: File[];
    }) => {
      const formData = new FormData();
      const { files, ...values } = input;
      formData.set("credential_data", JSON.stringify(values));
      files.forEach((file) => {
        formData.append("files", file);
      });
      return axios.post(`/v3/providers/credentials/file_upload`, formData, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast.error(
        error?.response?.data?.detail ??
          "Your database credentials could not be verified. Please check your credentials and try again.",
        { duration: 3 * 1000 },
      );
    },
    retry: 1,
  });

  const {
    mutateAsync: updateFileCredentials,
    isPending: isUpdingFileCredential,
  } = useMutation({
    mutationKey: ["updateFileCredentials"],
    mutationFn: (input: {
      credential_id: string;
      user_id: string;
      name: string;
      provider_id: string;
      type: string;
      credentials: Record<string, string>;
      meta_data: Record<string, any>;
      files?: File[];
    }) => {
      const formData = new FormData();
      const { files, credential_id, ...values } = input;
      formData.set("update_data", JSON.stringify({ ...values, credential_id }));
      files?.forEach((file) => {
        formData.append("files", file);
      });
      return axios.put(
        `/v3/providers/credentials/file_upload/${credential_id}`,
        formData,
        {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        },
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast.error(
        error?.response?.data?.detail ??
          "Your database credentials could not be verified. Please check your credentials and try again.",
        { duration: 3 * 1000 },
      );
    },
    retry: 1,
  });

  const { mutateAsync: updateCredentials, isPending: isUpdatingCredential } =
    useMutation({
      mutationKey: ["saveCredentials"],
      mutationFn: (input: {
        credential_id: string;
        name: string;
        provider_id: string;
        type: string;
        credentials: Record<string, string>;
        meta_data: Record<string, any>;
      }) =>
        axios.put(`/v3/providers/credentials/${input?.credential_id}`, input, {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        }),
      onError: (error: AxiosError<{ detail: string }>) => {
        toast.error(
          error?.response?.data?.detail ??
            "Your database credentials could not be verified. Please check your credentials and try again.",
          { duration: 3 * 1000 },
        );
      },
      retry: 1,
    });

  const fetchCredentials = async (
    apiKey: string,
    providerType: string,
    providerId: string,
  ) => {
    return axios.get(
      `${import.meta.env.VITE_BASE_URL}/v3/providers/credentials/user/${providerType}/${providerId}`,
      {
        headers: { "x-api-key": apiKey },
      },
    );
  };

  const { isFetching: isFetchingCredentials, refetch: getCredentials } =
    useQuery({
      queryKey: ["getDataConnectorCredentials", providerId],
      queryFn: () =>
        fetchCredentials(
          apiKey,
          providerType ?? "vector_store",
          providerId ?? "weaviate",
        ),
      select: (res: AxiosResponse) => res.data.credentials,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!providerId,
      staleTime: 0,
    });

  return {
    isFetchingVectorStores,
    getVectorStores,
    isFetchingDatabases,
    getDatabases,
    createDataConnector,
    isCreatingDataConnector,
    updateDataConnector,
    isUpdatingDataConnector,
    saveCredentials,
    isSavingCredential,
    isFetchingCredentials,
    saveFileCredentials,
    isSavingFileCredential,
    updateFileCredentials,
    isUpdingFileCredential,
    getCredentials,
    updateCredentials,
    isUpdatingCredential,
  };
};

export const useCredentials = ({
  apiKey,
  providerType,
  providerId,
  enabled = true,
}: {
  apiKey: string;
  providerType: string;
  providerId: string;
  enabled?: boolean;
}) => {
  const fetchCredentials = async () => {
    return axios.get(
      `/v3/providers/credentials/user/${providerType}/${providerId}`,
      {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      },
    );
  };

  const {
    data: credentials = [],
    isFetching,
    refetch: getCredentials,
    error,
  } = useQuery({
    queryKey: ["getCredentials", providerType, providerId],
    queryFn: fetchCredentials,
    select: (res: AxiosResponse) => res.data.credentials || [],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled && !!apiKey && !!providerId,
    staleTime: 0,
  });

  return {
    credentials,
    isFetching,
    getCredentials,
    error,
  };
};

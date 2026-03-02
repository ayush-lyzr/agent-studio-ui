import { useMutation, useQuery } from "@tanstack/react-query";
import axiosLib from "axios";

import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { ICredential, IModelCredential, IProvider } from "@/lib/types";
import { RAG_URL } from "@/lib/constants";

export const useModel = ({
  llmProvider = "openai",
  enabled = false,
  providersEnabled = false,
  lyzrProvidersEnabled = false,
  imageModelProvidersEnabled = false,
}: {
  apiKey: string;
  enabled?: boolean;
  providersEnabled?: boolean;
  lyzrProvidersEnabled?: boolean;
  imageModelProvidersEnabled?: boolean;
  llmProvider?: string;
}) => {
  const apiKey = useStore((state) => state.api_key);
  const params = { headers: { "x-api-key": apiKey } };

  const {
    refetch: getProviders,
    isFetching: isFetchingProviders,
    data: llmProviders = [],
  } = useQuery<IProvider[]>({
    queryKey: ["getProviders", apiKey],
    queryFn: () =>
      axios
        .get("/providers/type", {
          ...params,
          headers: {
            ...params.headers,
          },
          params: { provider_type: "llm" },
        })
        .then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: providersEnabled && !!apiKey,
  });

  const {
    isFetching: isFetchingLyzrProviders,
    refetch: getLyzrProviders,
    data: lyzrProviders,
  } = useQuery<IProvider[]>({
    queryKey: ["getLyzrProviders", apiKey],
    queryFn: () =>
      axios
        .get("/providers/type", {
          ...params,
          headers: {
            ...params.headers,
          },
          params: { provider_type: "lyzr-llm" },
        })
        .then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: lyzrProvidersEnabled && !!apiKey,
  });

  const {
    isFetching: isFetchingImageModelProviders,
    refetch: getImageModelProviders,
    data: imageModelProviders,
  } = useQuery<IProvider[]>({
    queryKey: ["getImageModelProviders", apiKey],
    queryFn: () =>
      axios
        .get("/providers/type", {
          ...params,
          headers: {
            ...params.headers,
          },
          params: { provider_type: "image-llm" },
        })
        .then((res) => res.data),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: imageModelProvidersEnabled && !!apiKey,
  });

  const {
    isFetching: isFetchingCredentials,
    refetch: getCredentials,
    data: credentials = [],
  } = useQuery<ICredential[]>({
    queryKey: ["getCredentials", llmProvider, apiKey],
    queryFn: () =>
      axios
        .get(`/providers/credentials/user/llm/${llmProvider}`, params)
        .then((res) => res.data.credentials ?? []),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled && !!apiKey,
  });

  /**
   * @param provider - Provider ID of the LLM provider
   * @param enabled - Enabling activates the API and fetches the results
   */
  const fetchUserCredentials = (provider: string, enabled: boolean) =>
    useQuery<ICredential[]>({
      queryKey: ["getCredentials", provider, apiKey],
      queryFn: () =>
        axios
          .get(`/providers/credentials/user/llm/${provider}`, params)
          .then((res) => res.data.credentials ?? []),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: enabled && !!apiKey,
    });

  const { mutateAsync: createCredential, isPending: isCreatingCredential } =
    useMutation({
      mutationKey: ["createCredential"],
      mutationFn: (values: IModelCredential) =>
        axios.post(`/providers/credentials`, values, params),
    });

  const { mutateAsync: updateCredential, isPending: isUpdatingCredential } =
    useMutation({
      mutationKey: ["updateCredential"],
      mutationFn: ({ credential_id, ...values }: any) =>
        axios.put(`/providers/credentials/${credential_id}`, values, params),
    });

  const { mutateAsync: deleteCredential, isPending: isDeletingCredential } =
    useMutation({
      mutationKey: ["deleteCredential"],
      mutationFn: ({ credential_id }: { credential_id: string }) =>
        axios.delete(`/providers/credentials/${credential_id}`, params),
    });

  const { mutateAsync: createRagCredential, isPending: isCreatingRagCredential } =
    useMutation({
      mutationKey: ["createRagCredential"],
      mutationFn: (values: IModelCredential) =>
        axiosLib.post(`${RAG_URL}/v3/credentials/`, values, params),
    });

  const { mutateAsync: deleteRagCredential, isPending: isDeletingRagCredential } =
    useMutation({
      mutationKey: ["deleteRagCredential"],
      mutationFn: ({ credential_id }: { credential_id: string }) =>
        axiosLib.delete(`${RAG_URL}/v3/credentials/${credential_id}`, params),
    });

  return {
    getProviders,
    isFetchingProviders,
    llmProviders,
    lyzrProviders,
    isFetchingLyzrProviders,
    getLyzrProviders,
    imageModelProviders,
    isFetchingImageModelProviders,
    getImageModelProviders,
    isCreatingCredential,
    createCredential,
    isFetchingCredentials,
    credentials,
    getCredentials,
    updateCredential,
    isUpdatingCredential,
    deleteCredential,
    isDeletingCredential,
    fetchUserCredentials,
    createRagCredential,
    isCreatingRagCredential,
    deleteRagCredential,
    isDeletingRagCredential,
  };
};

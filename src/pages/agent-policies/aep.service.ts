import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import { CreateAEPPolicyRequest, UpdateAEPPolicyRequest } from "./types";

export const useAEPPolicies = (token: string) => {
  // Get all policies (with optional filtering)
  const {
    data: policies,
    refetch: getAllPolicies,
    isFetching: isFetchingPolicies,
  } = useQuery({
    queryKey: ["getAllAEPPolicies"],
    queryFn: (params: any) =>
      axios.get("/aep/", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
        params: params?.queryKey[1] || {},
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Get a specific policy by ID
  const {
    data: policyDetails,
    refetch: getPolicy,
    isFetching: isFetchingPolicy,
  } = useQuery({
    queryKey: ["getAEPPolicy"],
    queryFn: (params: any) =>
      axios.get(`/aep/${params.queryKey[1]}`, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Create a new policy
  const { mutateAsync: createPolicy, isPending: isCreatingPolicy } =
    useMutation({
      mutationKey: ["createAEPPolicy"],
      mutationFn: (data: CreateAEPPolicyRequest) =>
        axios.post("/aep/", data, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
    });

  // Update an existing policy
  const { mutateAsync: updatePolicy, isPending: isUpdatingPolicy } =
    useMutation({
      mutationKey: ["updateAEPPolicy"],
      mutationFn: ({
        policyId,
        data,
      }: {
        policyId: string;
        data: UpdateAEPPolicyRequest;
      }) =>
        axios.put(`/aep/${policyId}`, data, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
    });

  // Delete a policy
  const { mutateAsync: deletePolicy, isPending: isDeletingPolicy } =
    useMutation({
      mutationKey: ["deleteAEPPolicy"],
      mutationFn: (policyId: string) =>
        axios.delete(`/aep/${policyId}`, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
    });

  // Validate connection between policies
  const { mutateAsync: validateConnection, isPending: isValidatingConnection } =
    useMutation({
      mutationKey: ["validateAEPConnection"],
      mutationFn: ({
        sourcePolicyId,
        targetPolicyId,
        connectionType,
      }: {
        sourcePolicyId: string;
        targetPolicyId: string;
        connectionType?: string;
      }) =>
        axios.post(`/aep/validate-connection`, null, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
          params: {
            source_policy_id: sourcePolicyId,
            target_policy_id: targetPolicyId,
            connection_type: connectionType || "inference",
          },
        }),
    });

  return {
    // Queries
    policies,
    policyDetails,
    getAllPolicies,
    getPolicy,
    isFetchingPolicies,
    isFetchingPolicy,

    // Mutations
    createPolicy,
    updatePolicy,
    deletePolicy,
    validateConnection,
    isCreatingPolicy,
    isUpdatingPolicy,
    isDeletingPolicy,
    isValidatingConnection,
  };
};

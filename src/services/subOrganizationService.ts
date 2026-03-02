import { useState } from "react";
import { AxiosResponse } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useToast } from "@/components/ui/use-toast";
import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import { SubOrganization } from "@/lib/types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useOrganization } from "@/pages/organization/org.service";

export interface CreateSubOrganizationRequest {
  name: string;
  domain?: string;
  about_organization?: string;
  industry?: string;
  limit: number;
}

export interface UpdateSubOrganizationRequest {
  name?: string;
  domain?: string;
  about_organization?: string;
  industry?: string;
  limit?: number;
}

export interface SubOrgUsageResponse {
  parent_organization_id: string;
  parent_organization_name: string;
  total_sub_organizations: number;
  sub_organizations: SubOrganizationUsage[];
}

export interface SubOrganizationUsage {
  organization_id: string;
  name: string;
  domain?: string;
  architecture: string;
  allocation: number;
  allocated_credits: number | null;
  paid_credits: number;
  total_available: number;
  used: number;
  used_seats: number;
  available: number;
  about_organization: string;
  percentage_used: number;
  has_gone_negative: boolean;
}

export const useSubOrganizationService = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [isAllocatingCredits, setIsAllocatingCredits] =
    useState<boolean>(false);

  const {
    current_organization,
    setCurrentOrganization,
    setUsageData,
    setSubOrgsUsageData,
  } = useManageAdminStore((state) => state);
  const { getCurrentOrg, isFetchingCurrentOrg, getUsage } = useOrganization({
    current_organization,
    token,
  });

  const fetchCurrentOrg = async () => {
    try {
      const res = await getCurrentOrg();
      setCurrentOrganization(res.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error?.message ?? "Error updating organization details",
      });
    }
  };

  // Using org ID since this API is only called from owner's account
  const {
    data: subOrgUsages,
    refetch: getSubOrgUsages,
    isFetching: isFetchingSubOrgUsages,
  } = useQuery({
    queryKey: ["getCurrentSubOrgUsages", current_organization?.org_id],
    queryFn: () =>
      axios.get(
        `/organizations/${current_organization?.org_id ?? ""}/sub_organizations_usage`,
        {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    retry: false,
    enabled: false,
    select: (res: AxiosResponse<SubOrgUsageResponse>) => res.data,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const subOrgLimitQuery = ({ sub_org_id }: { sub_org_id: string }) =>
    useQuery({
      queryKey: [
        "getCurrentSubOrgUsageLimit",
        current_organization?.parent_organization_id,
        sub_org_id,
      ],
      queryFn: () =>
        axios.get(
          `/api/v1/organizations/${current_organization?.org_id ?? ""}/sub_organization/${sub_org_id}/limit`,
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      retry: false,
      enabled: false,
      select: (res: AxiosResponse<SubOrganizationUsage>) => res.data,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  const refreshSubOrgs = () => {
    getUsage().then((res) => setUsageData(res.data));
    getSubOrgUsages().then((res) => {
      if (res.data) {
        setSubOrgsUsageData(res.data);
      }
    });
  };

  const { mutateAsync: createSubOrganization, isPending: isCreatingSubOrg } =
    useMutation({
      mutationKey: ["createSubOrganization"],
      mutationFn: (data: CreateSubOrganizationRequest) =>
        axios.post(
          `/organizations/${current_organization?.org_id ?? ""}/create_sub_organization`,
          data,
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      onSuccess: () => {
        refreshSubOrgs();
      },
    });

  const { mutateAsync: updateSubOrganization, isPending: isUpdatingSubOrg } =
    useMutation({
      mutationKey: ["updateSubOrganization"],
      mutationFn: ({
        subOrgId,
        data,
      }: {
        subOrgId: string;
        data: UpdateSubOrganizationRequest;
      }) =>
        axios.put(
          `/organizations/${current_organization?.org_id ?? ""}/sub_organization/${subOrgId}`,
          data,
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      onSuccess: () => {
        refreshSubOrgs();
      },
    });

  const { mutateAsync: updateSubOrganizationLimit } = useMutation({
    mutationKey: ["updateSubOrganizationLimit"],
    mutationFn: ({
      parent_organization_id,
      sub_org_id,
      limit,
    }: {
      parent_organization_id: string;
      sub_org_id: string;
      limit: number;
    }) =>
      axios.put(
        `/organizations/${parent_organization_id}/sub_organization/${sub_org_id}/limit`,
        {},
        {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
          params: { limit },
        },
      ),
  });

  const updateMultipleSubOrgLimits = async ({
    sub_orgs = [],
  }: {
    sub_orgs: SubOrganization[];
  }) => {
    setIsAllocatingCredits(true);

    const promises = sub_orgs.map((org) =>
      updateSubOrganizationLimit({
        parent_organization_id: current_organization?.org_id ?? "",
        sub_org_id: org.organization_id,
        limit: org.limit,
      }),
    );
    const responses = await Promise.all(promises);
    if (responses.every((response) => response.status === 200)) {
      refreshSubOrgs();
      return true;
    }
    setIsAllocatingCredits(false);
    return false;
  };

  const { mutateAsync: deleteSubOrganization, isPending: isDeletingSubOrg } =
    useMutation({
      mutationKey: ["deleteSubOrganization"],
      mutationFn: ({ subOrgId }: { subOrgId: string }) =>
        axios.delete(
          `/organizations/${current_organization?.org_id ?? ""}/sub_organization/${subOrgId}`,
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      onSuccess: () => {
        refreshSubOrgs();
      },
    });

  return {
    createSubOrganization,
    isCreatingSubOrg,
    updateSubOrganization,
    isUpdatingSubOrg,
    deleteSubOrganization,
    isDeletingSubOrg,
    updateMultipleSubOrgLimits,
    isAllocatingCredits,
    fetchCurrentOrg,
    isFetchingCurrentOrg,
    subOrgUsages,
    getSubOrgUsages,
    isFetchingSubOrgUsages,
    subOrgLimitQuery,
  };
};

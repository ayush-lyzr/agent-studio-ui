import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import mixpanel from "mixpanel-browser";

import axios from "@/lib/axios";
import { isMixpanelActive, PAGOS_URL } from "@/lib/constants";
import { IOrganization, IPolicy } from "@/lib/types";

export const useOrganization = ({
  token,
  current_organization,
}: {
  token: string;
  current_organization: Partial<IOrganization & IPolicy>;
}) => {
  const {
    data: usage,
    refetch: getUsage,
    isFetching: isFetchingUsage,
    isFetched: isUsageFetched,
  } = useQuery({
    queryKey: ["fetchUsage"],
    queryFn: () =>
      axios.get("/usages/current", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { refetch: getAllOrganizations, isFetching: isFetchingOrgs } = useQuery(
    {
      queryKey: ["getAllOrganizations"],
      queryFn: () =>
        axios.get("/organizations/all", {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
      retry: false,
      select: (res: AxiosResponse) => res.data,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: false,
    },
  );

  const {
    refetch: getCurrentOrg,
    isFetching: isFetchingCurrentOrg,
    refetch: refetchOrganization
  } = useQuery(
    {
      queryKey: ["getCurrentOrg"],
      queryFn: () =>
        axios.get("/organizations/current", {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
      retry: false,
      select: (res: AxiosResponse) => res.data,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: false,
    },
  );

  const getCurrentOrgMembers = async (user_id?: string) => {
    const params = user_id ? { user_id } : {};
    return axios.get(`/organizations/${current_organization?.org_id}/members`, {
      baseURL: PAGOS_URL,
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  };

  const { isFetching: isFetchingCurrentOrgMembers } = useQuery({
    queryKey: ["getCurrentOrgMembers", current_organization?.org_id],
    queryFn: () => getCurrentOrgMembers(),
    retry: false,
    select: (res: AxiosResponse) => res.data,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const { mutateAsync: createOrganization, isPending: isCreatingOrganization } =
    useMutation({
      mutationKey: ["createOrganization"],
      mutationFn: ({
        token: accessToken,
        ...input
      }: Partial<{
        name: string;
        domain: string;
        industry: string;
        about_company: string;
        token: string;
      }>) =>
        axios.post(`/organizations/`, input, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${accessToken ?? token}` },
          params: { ...input },
        }),
      onSuccess: (_, data) => {
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("Organization created", data);
        window.location.reload();
      },
    });

  const {
    mutateAsync: handleOrganizationForEnterprise,
    isPending: isHandlingEnterpriseSSO,
  } = useMutation({
    mutationKey: ["handleOrganizationForEnterprise"],
    mutationFn: ({
      token: accessToken,
      ...input
    }: {
      token: string;
      [key: string]: any;
    }) =>
      axios.post(`/organizations/enterprise-sso`, input, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
  });

  const { mutateAsync: updateOrganization, isPending: isUpdatingOrganization } =
    useMutation({
      mutationKey: ["updateOrganization"],
      mutationFn: ({ ...data }: Partial<IOrganization>) =>
        axios.put(`/organizations/${current_organization?.org_id}`, data, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
    });

  const {
    mutateAsync: setCurrentOrganization,
    isPending: isSettingCurrentOrg,
  } = useMutation({
    mutationKey: ["setCurrentOrganization"],
    mutationFn: ({ organization_id }: { organization_id: string }) =>
      axios.post(
        "/organizations/current",
        {},
        {
          params: { organization_id },
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  });

  const { mutateAsync: inviteUser, isPending: isInvitingUser } = useMutation({
    mutationKey: ["inviteUser"],
    mutationFn: ({ user_email, role }: { user_email: string; role: string }) =>
      axios.post(
        `/organizations/${current_organization?.org_id}/add_user/`,
        { user_email, role },
        {
          params: { organization_id: current_organization?.org_id },
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  });

  const { mutateAsync : inviteSsoUser , isPending : isInviteSsoUserPending  } = useMutation({
    mutationKey: ['inviteUserThroughKeycloak'],
    mutationFn: ({ user_email, role }: { user_email: string, role: string }) => axios.post(
      '/organizations/' + current_organization.org_id + '/add_user_sso',
      { user_email, role },
      {
        params: { organization_id: current_organization?.org_id },
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      },
    )
  })

  const { mutateAsync: removeUser, isPending: isRemovingUser } = useMutation({
    mutationKey: ["removeUser"],
    mutationFn: ({ user_id }: { user_id: string }) =>
      axios.post(
        `/organizations/${current_organization?.org_id}/remove_user/${user_id}`,
        {},
        {
          params: { organization_id: current_organization?.org_id, user_id },
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  });

  const { mutateAsync: addUserConsent, isPending: isAddingUserConsent } =
    useMutation({
      mutationKey: ["addUserConsent"],
      mutationFn: (payload: { user_id: string; consent_id: string }) => {
        return axios.post(`/user/consent`, payload, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
      },
    });

  const { mutateAsync: updateUserRole, isPending: isUpdatingUserRole } =
    useMutation({
      mutationKey: ["updateUserRole"],
      mutationFn: ({ user_id, role_id }: { user_id: string; role_id: string }) =>
        axios.post(
          `/organizations/${current_organization?.org_id}/update_role`,
          { user_id, role_id },
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
    });

  return {
    usage,
    getUsage,
    isFetchingUsage,
    isUsageFetched,
    isFetchingOrgs,
    getAllOrganizations,
    isSettingCurrentOrg,
    setCurrentOrganization,
    getCurrentOrg,
    isFetchingCurrentOrg,
    refetchOrganization,
    inviteUser,
    isInvitingUser,
    createOrganization,
    isCreatingOrganization,
    handleOrganizationForEnterprise,
    isHandlingEnterpriseSSO,
    updateOrganization,
    isUpdatingOrganization,
    getCurrentOrgMembers,
    isFetchingCurrentOrgMembers,
    removeUser,
    isRemovingUser,
    addUserConsent,
    isAddingUserConsent,
    inviteSsoUser,
    isInviteSsoUserPending,
    updateUserRole,
    isUpdatingUserRole,
  };
};



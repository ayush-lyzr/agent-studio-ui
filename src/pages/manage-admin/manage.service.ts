import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export const useManageService = ({ token }: { token: string }) => {
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

  const { refetch: getCurrentOrg, isFetching: isFetchingCurrentOrg } = useQuery(
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
    mutationKey: ["setCurrentOrganization"],
    mutationFn: ({
      organization_id,
      user_id,
      user_email,
      role,
    }: {
      organization_id: string;
      user_id: string;
      user_email: string;
      role: string;
    }) =>
      axios.post(
        `/organizations/${organization_id}/add_user/${user_id}`,
        {},
        {
          params: { organization_id, user_email, role },
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  });

  return {
    isFetchingOrgs,
    getAllOrganizations,
    isSettingCurrentOrg,
    setCurrentOrganization,
    getCurrentOrg,
    isFetchingCurrentOrg,
    inviteUser,
    isInvitingUser,
  };
};

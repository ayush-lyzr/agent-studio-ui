import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import axios from "@/lib/axios";
import { IS_ENTERPRISE_DEPLOYMENT, PAGOS_URL } from "@/lib/constants";

export interface RBACRole {
  id: string;
  name: string;
  display_name: string;
  description: string;
  role_type: "custom" | "system" | "default";
  org_id: string;
  inherits_from: string[];
  permissions: string[];
  priority: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  keycloak_role_name: string;
}

export const useRBACService = ({ token, org_id }: { token: string; org_id?: string }) => {
  // Fetch all roles for an organization
  const {
    data: roles,
    refetch: getRoles,
    isFetching: isFetchingRoles,
    isFetched: isRolesFetched,
  } = useQuery({
    queryKey: ["fetchRoles", org_id],
    queryFn: () =>
      axios.get("/rbac/roles", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
        params: {
          org_id: org_id,
          system_roles: true,
        },
      }),
    select: (res: AxiosResponse<RBACRole[]>) => res.data,
    enabled: !!org_id && !!token && IS_ENTERPRISE_DEPLOYMENT,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return {
    roles,
    getRoles,
    isFetchingRoles,
    isRolesFetched,
  };
};

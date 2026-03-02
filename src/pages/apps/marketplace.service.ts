import axios from "@/lib/axios";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { MARKETPLACE_URL } from "@/lib/constants";

export const useMarketplace = (
  token: string,
  industry?: string,
  functionTag?: string,
  categoryTag?: string,
  search?: string,
) => {
  const { current_organization, current_user } = useManageAdminStore(
    (state) => state,
  );
  const organization_id = current_organization?.org_id;
  const user_id = current_user?.id ?? "";

  const filterParams = new URLSearchParams({
    ...(industry && { industry_tag: industry }),
    ...(functionTag && { function_tag: functionTag }),
    ...(categoryTag && { category_tag: categoryTag }),
  }).toString();

  const {
    data: communityApps,
    refetch: getCommunityApps,
    isFetching: isLoadingCommunityApps,
  } = useQuery({
    queryKey: ["getCommunityApps", user_id, industry, functionTag, categoryTag],
    queryFn: async () => {
      const url = `/apps/user/${user_id}/with-public?limit=50${filterParams ? `&${filterParams}` : ""}`;
      const res = await axios.get(url, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data || [];
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false, // Disable automatic fetching - we fetch in the component
  });

  const {
    data: orgAppsRes,
    fetchNextPage: fetchNextOrgPage,
    hasNextPage: hasNextOrgPage,
    isFetching: isLoadingOrgApps,
    refetch: getOrgApps,
  } = useInfiniteQuery({
    queryKey: [
      "getOrgApps",
      organization_id,
      user_id,
      industry,
      functionTag,
      categoryTag,
      search,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const filterParams = new URLSearchParams({
        skip: (pageParam * 50).toString(),
        limit: "50",
        ...(search && { search }),
        ...(industry && { industry_tag: industry }),
        ...(functionTag && { function_tag: functionTag }),
        ...(categoryTag && { category_tag: categoryTag }),
      }).toString();

      const res = await axios.get(
        `/apps/organization/${organization_id}/${user_id}?${filterParams}`,
        {
          baseURL: MARKETPLACE_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data;
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < 50) return null;
      return pages.length;
    },
    staleTime: 1000 * 60,
  });

  return {
    communityApps,
    isLoadingCommunityApps,
    getCommunityApps,
    orgApps: orgAppsRes?.pages?.flatMap((page) => page) || [],
    orgAppsRes,
    fetchNextOrgPage,
    hasNextOrgPage,
    isLoadingOrgApps,
    getOrgApps,
  };
};

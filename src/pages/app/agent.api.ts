import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import axios from "@/lib/axios";
import { MARKETPLACE_URL } from "@/lib/constants";

export const useAgent = ({
  appId,
  token,
}: {
  appId: string;
  token: string;
}) => {
  const {
    data: appData,
    refetch: getAppData,
    isFetching: isFetchingAgentData,
  } = useQuery({
    queryKey: ["getAgentData", appId],
    queryFn: () =>
      axios.get(`/app/${appId}`, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return {
    appData,
    getAppData,
    isFetchingAgentData,
  };
};

import axios from "@/lib/axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

export interface Version {
  version_id: string;
  active: boolean;
  config: any;
  created_at: string;
  createdBy?: string;
}

interface VersionsResponse {
  agent_id: string;
  versions: {
    versions: Version[];
  };
}

export const useAgentVersionsService = ({
  apiKey,
  agentId,
}: {
  apiKey: string;
  agentId?: string;
}) => {
  const {
    data: versions = [],
    isFetching: isFetchingVersions,
    refetch: getAgentVersions,
  } = useQuery<AxiosResponse<VersionsResponse>, Error, Version[]>({
    queryKey: ["getAgentVersions", agentId, apiKey],
    queryFn: () =>
      axios.get(`/agents/${agentId}/versions`, {
        headers: { "x-api-key": apiKey },
      }),
    select: (res) => res.data.versions.versions,
    retry: false,
    enabled: false,
  });

  const { mutateAsync: setVersionActive, isPending: isActivatingVersion } =
    useMutation({
      mutationFn: (versionId: string) =>
        axios.post(
          `/agents/${agentId}/versions/${versionId}/activate`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
          },
        ),
    });

  return {
    versions,
    isFetchingVersions,
    getAgentVersions,
    setVersionActive,
    isActivatingVersion,
  };
};

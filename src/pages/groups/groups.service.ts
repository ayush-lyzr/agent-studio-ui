import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import {
  CreateGroupRequest,
  UpdateGroupRequest,
  AddGroupMemberRequest,
  UpdateMemberRoleRequest,
} from "./types";

export const useGroups = (token: string) => {
  // Get all groups the user is part of
  const {
    data: groups,
    refetch: getAllGroups,
    isFetching: isFetchingGroups,
  } = useQuery({
    queryKey: ["getAllGroups"],
    queryFn: () =>
      axios.get("/groups/all", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Get all groups where user is admin
  const {
    data: adminGroups,
    refetch: getAdminGroups,
    isFetching: isFetchingAdminGroups,
  } = useQuery({
    queryKey: ["getAdminGroups"],
    queryFn: () =>
      axios.get("/groups/admin", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Get a specific group by ID
  const {
    data: groupDetails,
    refetch: getGroup,
    isFetching: isFetchingGroup,
  } = useQuery({
    queryKey: ["getGroup"],
    queryFn: (params: any) =>
      axios.get(`/groups/${params.queryKey[1]}`, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Get group members
  const {
    data: groupMembers,
    refetch: getGroupMembers,
    isFetching: isFetchingGroupMembers,
  } = useQuery({
    queryKey: ["getGroupMembers"],
    queryFn: (params: any) =>
      axios.get(`/groups/${params.queryKey[1]}/members`, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Create a new group
  const { mutateAsync: createGroup, isPending: isCreatingGroup } = useMutation({
    mutationKey: ["createGroup"],
    mutationFn: (data: CreateGroupRequest) => {
      // Create params object with non-empty values
      const params = new URLSearchParams();
      if (data.name) params.append("name", data.name);
      if (data.description) params.append("description", data.description);
      if (data.group_aep_id) params.append("group_aep_id", data.group_aep_id);

      return axios.post(
        `/groups/?${params.toString()}`,
        {
          tags: data.tags || [],
          metadata: data.metadata || {},
        },
        {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    },
  });

  // Update an existing group
  const { mutateAsync: updateGroup, isPending: isUpdatingGroup } = useMutation({
    mutationKey: ["updateGroup"],
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: UpdateGroupRequest;
    }) =>
      axios.put(`/groups/${groupId}`, data, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
  });

  // Delete a group
  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } = useMutation({
    mutationKey: ["deleteGroup"],
    mutationFn: (groupId: string) =>
      axios.delete(`/groups/${groupId}`, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
  });

  // Add a user to a group
  const { mutateAsync: addGroupMember, isPending: isAddingGroupMember } =
    useMutation({
      mutationKey: ["addGroupMember"],
      mutationFn: ({
        groupId,
        data,
      }: {
        groupId: string;
        data: AddGroupMemberRequest;
      }) => {
        // Using a URL with query params for the user_id_to_add
        const url = `/groups/${groupId}/members?user_id_to_add=${data.user_id_to_add}`;
        const role = data.role || "member";

        return axios.post(
          url,
          { role },
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      },
    });

  // Remove a user from a group
  const { mutateAsync: removeGroupMember, isPending: isRemovingGroupMember } =
    useMutation({
      mutationKey: ["removeGroupMember"],
      mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
        axios.delete(`/groups/${groupId}/members/${userId}`, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        }),
    });

  // Update a member's role
  const { mutateAsync: updateMemberRole, isPending: isUpdatingMemberRole } =
    useMutation({
      mutationKey: ["updateMemberRole"],
      mutationFn: ({
        groupId,
        userId,
        data,
      }: {
        groupId: string;
        userId: string;
        data: UpdateMemberRoleRequest;
      }) =>
        axios.put(
          `/groups/${groupId}/members/${userId}/role`,
          {
            new_role: data.new_role,
          },
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
    });

  // Add tags to a group
  const { mutateAsync: addGroupTags, isPending: isAddingGroupTags } =
    useMutation({
      mutationKey: ["addGroupTags"],
      mutationFn: ({ groupId, tags }: { groupId: string; tags: string[] }) =>
        axios.post(
          `/groups/${groupId}/tags`,
          { tags },
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
    });

  // Remove tags from a group
  const { mutateAsync: removeGroupTags, isPending: isRemovingGroupTags } =
    useMutation({
      mutationKey: ["removeGroupTags"],
      mutationFn: ({ groupId, tags }: { groupId: string; tags: string[] }) =>
        axios.delete(`/groups/${groupId}/tags`, {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
          data: { tags },
        }),
    });

  // Update group metadata
  const {
    mutateAsync: updateGroupMetadata,
    isPending: isUpdatingGroupMetadata,
  } = useMutation({
    mutationKey: ["updateGroupMetadata"],
    mutationFn: ({
      groupId,
      metadata,
    }: {
      groupId: string;
      metadata: Record<string, any>;
    }) =>
      axios.patch(`/groups/${groupId}/metadata`, metadata, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
  });

  const { mutateAsync: moveMultiToGroup, isPending: isMovingMultiToGroup } =
    useMutation({
      mutationKey: ["moveMultiToGroup"],
      mutationFn: ({
        groupName,
        groupType,
        organizationId,
        payload,
      }: {
        groupName: string;
        groupType: string;
        organizationId: string;
        payload: Array<{
          asset_id: string;
          asset_type: string;
          asset_name: string;
          metadata?: Record<string, any>;
        }>;
      }) =>
        axios.post(
          `views/groups/${groupName}/${groupType}/assets/batch?organization_id=${organizationId}`,
          payload,
          {
            baseURL: PAGOS_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
    });

  const {
    mutateAsync: removeMultiAssetsFromGroup,
    isPending: isRemovingMultiAssetsFromGroup,
  } = useMutation({
    mutationKey: ["removeMultiAssetsFromGroup"],
    mutationFn: ({
      groupName,
      groupType,
      organizationId,
      assetIds,
    }: {
      groupName: string;
      groupType: string;
      organizationId: string;
      assetIds: string[];
    }) =>
      axios.post(
        `views/groups/${groupName}/${groupType}/assets/batch/remove?organization_id=${organizationId}`,
        { asset_ids: assetIds },
        {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  });

  return {
    // Data
    groups,
    adminGroups,
    groupDetails,
    groupMembers,

    // Refetch functions
    getAllGroups,
    getAdminGroups,
    getGroup,
    getGroupMembers,

    // Mutation functions
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    updateMemberRole,
    addGroupTags,
    removeGroupTags,
    updateGroupMetadata,
    moveMultiToGroup,
    removeMultiAssetsFromGroup,

    // Loading states
    isFetchingGroups,
    isFetchingAdminGroups,
    isFetchingGroup,
    isFetchingGroupMembers,
    isCreatingGroup,
    isUpdatingGroup,
    isDeletingGroup,
    isAddingGroupMember,
    isRemovingGroupMember,
    isUpdatingMemberRole,
    isAddingGroupTags,
    isRemovingGroupTags,
    isUpdatingGroupMetadata,
    isMovingMultiToGroup,
    isRemovingMultiAssetsFromGroup,
  };
};

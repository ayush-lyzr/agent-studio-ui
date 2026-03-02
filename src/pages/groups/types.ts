// Types for Groups management

export interface GroupMember {
  user_id: string;
  joined_at: string;
  role: string;
}

export interface IGroup {
  _id: string;
  group_id: string;
  admin_user_id: string;
  name: string | null;
  description: string | null;
  members: GroupMember[];
  group_aep_id: string | null;
  created_at: string;
  updated_at: string | null;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CreateGroupRequest {
  name?: string | null;
  description?: string | null;
  group_aep_id?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateGroupRequest {
  name?: string | null;
  description?: string | null;
  group_aep_id?: string | null;
  updated_at?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AddGroupMemberRequest {
  user_id_to_add: string;
  role?: string;
}

export interface UpdateMemberRoleRequest {
  new_role: string;
}

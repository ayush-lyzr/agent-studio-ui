import React, { useEffect, useMemo, useState } from "react";
import { Ellipsis, Loader2, Plus, Search, UserCog } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrentUserProps, ITeamMember, UserRole } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import Invite from "./invite";
import ManageSeats from "./manage-seats";
import { useOrganization } from "../organization/org.service";
import { Badge } from "@/components/ui/badge";
import DeleteMember from "./delete-member";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useManageAdminStore } from "./manage-admin.store";
import { useRBACService, RBACRole } from "./rbac.service";
import { IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";

const teamColumns = ({
  userId,
  fetchTeamMembers,
  roles,
  updateUserRole,
  currentUserRole,
}: Partial<CurrentUserProps> & {
  fetchTeamMembers: () => void;
  roles: RBACRole[];
  updateUserRole: (params: { user_id: string; role_id: string }) => Promise<any>;
  currentUserRole?: string;
}): ColumnDef<ITeamMember>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row: { original } }) => {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="ml- h-10 w-10 rounded-sm">
            <AvatarImage
              className="rounded-md"
              alt="current user profile picture"
              src={original?.name ?? original?.email}
            />
            <AvatarFallback className="rounded-sm bg-badge-background uppercase">
              {(original?.name ?? original?.email)
                ?.split(" ")
                .map((name: string) => name[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {original?.name ? (
            <span>
              <p className="font-semibold">{original?.name}</p>
              <p className="text-[0.7rem]">{original?.email}</p>
            </span>
          ) : (
            <p>{original?.email}</p>
          )}
          {userId == original?.user_id && (
            <Badge
              variant="secondary"
              className="rounded-full bg-neutral-200 dark:bg-neutral-600"
            >
              You
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
      header: "Role",
      cell: ({ row: { original } }) => {
        const role = original?.role;
        return role[0].toUpperCase() + role.slice(1, role.length);
      },
    },
    {
      id: "actions",
      accessorKey: "",
      header: "",
      cell: ({ row: { original } }) => {
        const [selectedRole, setSelectedRole] = useState(original?.role || "");
        const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

        // Filter roles based on current user's role and target user's role
        // Admin can: change member to admin, but cannot change admin to member, cannot touch owner
        const isCurrentUserAdmin = currentUserRole === UserRole.admin;
        const isTargetUserAdmin = original?.role === UserRole.admin;

        // Don't show actions for: owner, self, or if admin is trying to manage another admin
        if (original?.role === UserRole.owner || userId === original?.user_id || (isCurrentUserAdmin && isTargetUserAdmin)) {
          return null;
        }

        // Filter out owner role - only owners can manage owner assignments
        const filteredRoles = roles.filter((role) => role.name !== UserRole.owner);

        const handleUpdateRole = async () => {
          try {
            const selectedRoleData = roles.find(role => role.name === selectedRole);
            if (!selectedRoleData || !original?.user_id) return;

            await updateUserRole({
              user_id: original.user_id,
              role_id: selectedRoleData.id,
            });

            setIsUpdateDialogOpen(false);
            fetchTeamMembers();
          } catch (error) {
            console.error("Error updating role:", error);
          }
        };

        return (
          <div className="flex w-full items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Ellipsis className="size-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="flex flex-col gap-2 p-2"
              >
                <DropdownMenuItem asChild>
                  <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                    <AlertDialogTrigger className="inline-flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <UserCog className="mr-2 size-4" />
                      Change Role
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Change Role</AlertDialogTitle>
                        <Separator />
                        <div className="flex w-[95%] flex-col justify-center gap-2">
                          <p className="font-semibold text-muted-foreground">Role</p>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredRoles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </AlertDialogHeader>
                      <Separator />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button onClick={handleUpdateRole}>Update</Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <DeleteMember
                    member={original}
                    fetchTeamMembers={fetchTeamMembers}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

const Team: React.FC<Partial<CurrentUserProps>> = () => {
  const { getToken, userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inviteVisible, setInviteVisible] = useState<boolean>(false);
  const [team, setTeam] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });

  const { current_organization, usage_data } = useManageAdminStore(
    (state) => state,
  );
  const { getCurrentOrgMembers, isFetchingCurrentOrgMembers, updateUserRole } = useOrganization(
    { token: getToken()!, current_organization },
  );

  // Fetch RBAC roles
  const { roles: fetchedRoles, getRoles } = useRBACService({
    token: getToken()!,
    org_id: current_organization?.org_id,
  });

  // For non-enterprise deployments, use default roles (admin and member)
  const defaultRoles: RBACRole[] = [
    { id: UserRole.admin, name: UserRole.admin, display_name: "Admin", description: "Admin role", role_type: "system", org_id: "", inherits_from: [], permissions: [], priority: 1, is_default: false, created_at: "", updated_at: "", created_by: "", keycloak_role_name: "" },
    { id: UserRole.member, name: UserRole.member, display_name: "Member", description: "Member role", role_type: "system", org_id: "", inherits_from: [], permissions: [], priority: 2, is_default: true, created_at: "", updated_at: "", created_by: "", keycloak_role_name: "" },
  ];

  const roles = IS_ENTERPRISE_DEPLOYMENT ? fetchedRoles : defaultRoles;

  const fetchTeamMembers = async () => {
    // Add user_id filter for role_owner and role_admin
    const shouldFilterByUser =
      current_organization?.role === 'role_owner' ||
      current_organization?.role === 'role_admin';

    const res = await getCurrentOrgMembers(
      shouldFilterByUser && userId ? userId : undefined
    );
    setTeam(res.data);
  };

  const checkInviteDisability = () => {
    if (!!current_organization?.parent_organization_id) {
      return false;
    }
    return team?.length >= (usage_data?.total_seats ?? 0);
  };

  const columns = useMemo(
    () => teamColumns({
      userId: userId ? userId : '',
      fetchTeamMembers,
      roles: roles || [],
      updateUserRole,
      currentUserRole: current_organization?.role,
    }),
    [userId, roles, updateUserRole, current_organization?.role],
  );

  const table = useReactTable({
    data: useMemo(
      () =>
        (team ?? [])?.filter((member) =>
          member?.email.includes(searchQuery.toLowerCase()),
        ),
      [searchQuery, team],
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  useEffect(() => {
    if (current_organization?.org_id) {
      fetchTeamMembers();
      if (IS_ENTERPRISE_DEPLOYMENT) {
        getRoles();
      }
    }
  }, [userId, current_organization?.org_id]);

  return (
    <div className="mt-4 space-y-4">
      <Alert className="flex items-center justify-between rounded-lg bg-neutral-100 p-4 dark:bg-neutral-600">
        <span>
          <AlertTitle className="font-bold">
            Increase seats to invite more team members to your organization
          </AlertTitle>
          <AlertDescription className="text-sm">
            Members: {team?.length}
            {!current_organization?.parent_organization_id &&
              `/${usage_data?.total_seats}`}
          </AlertDescription>
        </span>

        <ManageSeats />
      </Alert>
      <div className="flex items-center justify-between">
        <div className="sticky top-0 z-10 flex items-center rounded-md border border-slate-300 px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
          />
        </div>
        <Button
          variant="outline"
          disabled={checkInviteDisability()}
          onClick={() => setInviteVisible(true)}
        >
          <Plus className="mr-1 size-4" />
          Invite
        </Button>
      </div>
      <Table className="border-separate rounded-md border-none">
        <TableHeader className="first:rounded-tl-md last:rounded-tr-md">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="font-semibold text-black hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="shadow-lg">
          {isFetchingCurrentOrgMembers ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="grid place-items-center">
                  <Loader2 className="animate-spin" />
                  Loading ...
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows?.length > 0 &&
            table.getRowModel().rows?.map((row) => (
              <TableRow key={row.id} className="bg-card">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="first:rounded-bl-md last:rounded-br-md"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <Invite
        open={inviteVisible}
        onOpen={setInviteVisible}
        fetchTeamMembers={fetchTeamMembers}
      />
    </div>
  );
};

export default Team;

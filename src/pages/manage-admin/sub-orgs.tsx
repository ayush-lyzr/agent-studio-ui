import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
  // Youtube,
} from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { useManageAdminStore } from "./manage-admin.store";
import { CreateSubOrgModal } from "./create-sub-org-modal";
import type { SubOrgFormType } from "./create-sub-org-modal";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Path, SubOrganization, UserRole } from "@/lib/types";
import GradientCard from "@/components/custom/gradient-card";
import { convertToReadableNumber } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useOrganization } from "../organization/org.service";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive, CREDITS_DIVISOR } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import { DeleteSubOrg } from "./delete-sub-org";
import {
  SubOrganizationUsage,
  useSubOrganizationService,
} from "@/services/subOrganizationService";

export type SubOrgModeType = "create" | "update" | "manage" | "delete" | null;

export const columns: ColumnDef<SubOrganizationUsage>[] = [
  {
    accessorKey: "name",
    header: "Sub-Account Name",
    size: 80,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <GradientCard
            className="size-5 rounded-md"
            text={row.original.name}
          />
          {row.original.name}
        </div>
      );
    },
  },
  {
    accessorKey: "used_seats",
    header: "Team Size",
    size: 40,
    cell: ({ row }) => row.original.used_seats + 1,
  },
  {
    accessorKey: "available",
    header: "Credits Left",
    size: 80,
    cell: ({ row }) =>
      convertToReadableNumber((row.original.total_available ?? 0) / CREDITS_DIVISOR),
  },
  {
    accessorKey: "limit",
    header: "Credits Allocated",
    size: 80,
    cell: ({ row }) =>
      convertToReadableNumber((row.original.allocated_credits ?? 0) / CREDITS_DIVISOR),
  },
  {
    accessorKey: "",
    id: "actions",
    size: 100,
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => {
      const [loadingOrg, setLoadingOrg] = useState<string>("");
      const current_organization = useManageAdminStore(
        (state) => state.current_organization,
      );
      return [UserRole.owner].includes(
        current_organization?.role as UserRole,
      ) ? (
        <div className="flex items-center justify-end gap-4">
          <Button
            variant="ghost"
            loading={loadingOrg === row.original.organization_id}
            onClick={() => {
              setLoadingOrg(row.original.organization_id);
              meta
                ?.onSwitch?.({
                  limit: row.original.allocation,
                  organization_id: row.original.organization_id,
                  name: row.original.name,
                })
                .then(() => setLoadingOrg(""));
            }}
          >
            <Repeat className="mr-1 size-4 text-muted-foreground" />
            Switch
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              meta?.setFormVisible?.(true);
              meta?.setMode?.("update");
              meta?.setFormData?.({
                ...row.original,
                limit: row.original?.allocation ?? 0,
              });
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              meta?.setMode?.("delete");
              meta?.setFormData?.({
                ...row.original,
                limit: row.original?.allocation ?? 0,
              });
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ) : null;
    },
  },
];

export const SubOrganizations = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<SubOrgModeType>(null);
  const [formData, setFormData] = useState<
    Partial<SubOrgFormType & { organization_id: string }>
  >({});

  const token = useStore((state) => state.app_token);
  const {
    current_organization,
    usage_data,
    setCurrentOrganization: setCurrentOrgInStore,
    sub_orgs_usage_data,
    setSubOrgsUsageData,
  } = useManageAdminStore((state) => state);
  const subOrganizations = sub_orgs_usage_data?.sub_organizations || [];
  const canCreateSubOrg = [UserRole.owner].includes(
    current_organization.role as UserRole,
  );

  const { setCurrentOrganization } = useOrganization({
    current_organization,
    token,
  });
  const { getSubOrgUsages, isFetchingSubOrgUsages } = useSubOrganizationService(
    {
      token,
    },
  );

  const table = useReactTable({
    data: useMemo(
      () =>
        subOrganizations?.filter((org) =>
          org.name.toLowerCase().match(searchQuery),
        ) ?? [],
      [subOrganizations, searchQuery],
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      usage_data,
      setFormData,
      setFormVisible,
      setMode,
      onSwitch: async (org: SubOrganization) => {
        await setCurrentOrganization({ organization_id: org.organization_id });
        setCurrentOrgInStore({
          org_id: org.organization_id,
          ...org,
          role: UserRole.member,
        });

        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
          mixpanel.track(`Switched organization`, {
            from_organization: current_organization?.name,
            to_organization: org.name,
            is_sub_organization: true,
          });
        }

        toast({
          title: "Success",
          description: `Switched to ${org.name}`,
        });

        window.location.href = Path.HOME;
      },
    },
    defaultColumn: {
      size: 200, //starting column size
      minSize: 50, //enforced during column resizing
      maxSize: 500, //enforced during column resizing
    },
  });

  const onCreateNew = () => {
    setMode("create");
    setFormData({});
    setFormVisible(true);
  };

  useEffect(() => {
    getSubOrgUsages().then((res) => {
      if (res.data) setSubOrgsUsageData(res.data);
    });
  }, []);

  if (subOrganizations?.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center space-y-5 text-center">
        <img src="/images/no-tools.svg" alt="Empty state" className="mt-20" />
        <p className="pb-2 font-medium">No Sub-Accounts found</p>
        <p className="pb-5 text-xs text-muted-foreground">
          Create dedicated account spaces for customers or projects.
          <br />
          Collaborate, manage teams, and keep all work isolated within each
          space.
        </p>

        <div className="flex items-center gap-4">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Video className="mr-1 size-4" /> Learn More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {new Array(3).fill(0).map((_, idx) => (
                <DropdownMenuItem key={idx}>
                  <div className="flex items-center gap-2">
                    <Avatar className="rounded-md">
                      <AvatarFallback className="rounded-md">
                        <Youtube className="text-destructive" />
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      <p className="text-sm font-semibold">
                        Lorem ipsum dolor isit
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lorem ipsum dolor isit
                      </p>
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
          {canCreateSubOrg && (
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="mr-1 size-4" /> Create new
            </Button>
          )}
        </div>
        <CreateSubOrgModal
          open={formVisible}
          onOpen={setFormVisible}
          data={formData}
          mode={mode}
          subOrganizations={subOrganizations}
        />
      </div>
    );
  }

  return (
    <>
      <div className="my-4 grid gap-4">
        <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-2">
          <div className="flex items-center gap-2">
            {/* <Avatar className="rounded-md">
              <AvatarFallback className="rounded-md bg-neutral-200 dark:bg-neutral-600">
                <Building2 className="size-4" />
              </AvatarFallback>
            </Avatar> */}
            <span>
              {/* <p className="text-sm font-semibold">Organization</p> */}
              <p className="text-sm text-muted-foreground">
                Create dedicated account spaces for customers or projects.
                Collaborate, manage teams, and keep all work isolated within
                each space.
              </p>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-12 ">
          <InputGroup className="col-span-3">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <InputGroupButton
                variant="link"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4 text-muted-foreground" />
              </InputGroupButton>
            )}
          </InputGroup>
          <div className="col-span-2" />
          <div className="col-span-7 flex place-content-end items-center gap-2">
            <Link
              to={`${Path.UPGRADE_PLAN}?section=topup`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Sparkles className="mr-1 size-4" /> Top Up
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormVisible(true);
                setMode("manage");
              }}
            >
              <Settings2 className="mr-1 size-4" /> Manage Credits
            </Button>
            {canCreateSubOrg && (
              <Button size="sm" onClick={onCreateNew}>
                <Plus className="mr-1 size-4" />
                Add Sub-Account
              </Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader className="bg-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isFetchingSubOrgUsages ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-44 text-center"
                >
                  <div className="grid place-items-center">
                    <Loader2 className="animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-background"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CreateSubOrgModal
        mode={mode}
        open={formVisible}
        onOpen={setFormVisible}
        data={formData}
        subOrganizations={subOrganizations}
      />
      <DeleteSubOrg
        open={mode === "delete"}
        onOpen={(open) => setMode(open ? "delete" : null)}
        subOrgId={formData?.organization_id ?? ""}
      />
    </>
  );
};

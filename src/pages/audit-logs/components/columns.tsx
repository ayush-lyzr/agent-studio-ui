import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, User } from "lucide-react";
import { AuditLogResponse, AuditResult } from "../types";
import { UserMap } from "..";

const formatDate = (dateString: string) => {
  // Ensure UTC timestamp is properly parsed by appending 'Z' if no timezone indicator exists
  const normalizedDate = dateString.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateString)
    ? dateString
    : `${dateString}Z`;

  return new Date(normalizedDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

const getResultBadgeVariant = (
  result: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (result) {
    case AuditResult.SUCCESS:
      return "default";
    case AuditResult.FAILURE:
      return "destructive";
    case AuditResult.PARTIAL:
      return "secondary";
    default:
      return "outline";
  }
};

const getActionLabel = (action: string): string => {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getResourceLabel = (resource: string): string => {
  return resource
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const createColumns = (
  onViewDetails: (log: AuditLogResponse) => void,
  userMap: UserMap
): ColumnDef<AuditLogResponse>[] => [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => (
      <p className="w-44 text-sm">{formatDate(row.original.timestamp)}</p>
    ),
  },
  {
    accessorKey: "actor",
    header: "User",
    cell: ({ row }) => {
      const actor = row.original.actor;
      const user = actor.user_id ? userMap[actor.user_id] : null;
      const displayName = user?.email || (actor.user_id ? `${actor.user_id.slice(0, 8)}...` : "System");

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-44 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="size-3" />
              </div>
              <span className="truncate text-sm">
                {displayName}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              {user?.name && <p>Name: {user.name}</p>}
              {user?.email && <p>Email: {user.email}</p>}
              <p>User ID: {actor.user_id ?? "N/A"}</p>
              {actor.ip_address && <p>IP: {actor.ip_address}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {getActionLabel(row.original.action)}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: "Resource",
    cell: ({ row }) => {
      const target = row.original.target;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-40">
              <p className="text-sm font-medium">
                {getResourceLabel(target.resource_type)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {target.resource_name ?? target.resource_id ?? "—"}
              </p>
            </div>
          </TooltipTrigger>
          {(target.resource_name || target.resource_id) && (
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p>Type: {getResourceLabel(target.resource_type)}</p>
                {target.resource_name && <p>Name: {target.resource_name}</p>}
                {target.resource_id && <p>ID: {target.resource_id}</p>}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => (
      <Badge
        variant={getResultBadgeVariant(row.original.result)}
        className="font-normal capitalize"
      >
        {row.original.result}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(row.original)}
      >
        <Eye className="size-4" />
      </Button>
    ),
  },
];

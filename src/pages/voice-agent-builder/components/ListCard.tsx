import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Ellipsis,
  Pencil,
  Trash2,
  RocketIcon,
  ArrowRightLeft,
  // ExternalLink,
  Share2,
  Copy,
  // FolderPlus,
  Code,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IAgent, ITeamMember, UserRole } from "@/lib/types";
import { useManageAdminStore } from "../../manage-admin/manage-admin.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useStore from "@/lib/store";
import { isOrgMode } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Group } from "@/services/groupsApiService";

interface ListCardProps {
  agent: IAgent;
  index: number;
  isLaunched: boolean;
  appId?: string | null;
  userId: string;
  team: ITeamMember[];
  agentPolicies: IPolicy[];
  onEdit: (agent: IAgent) => void;
  onDuplicate: (agent: IAgent) => void;
  onShare: (agent: IAgent) => void;
  onLaunch: (agent: IAgent) => void;
  onDelete: (agent: IAgent) => void;
  onMoveToNewVoice?: (agent: IAgent) => void;
  onAddToGroup?: (agent: IAgent) => void;
  onClick: (agent: IAgent) => void;
  onRemoveFromGroup?: (agent: IAgent) => void;
  onEditJson?: (agent: IAgent) => void;
  showJsonEdit?: boolean;
  showMoveToNewVoice?: boolean;
  currentGroup?: Group | null;
}

type IPolicy = { user_id: string; resource_id: string };

const listVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 20,
    },
  }),
};

export function ListCard({
  agent,
  index = 0,
  isLaunched,
  // appId,
  onEdit,
  team,
  agentPolicies,
  onDuplicate,
  onShare,
  onDelete,
  onMoveToNewVoice,
  // onAddToGroup,
  onClick,
  // onRemoveFromGroup,
  onEditJson,
  showJsonEdit = false,
  showMoveToNewVoice = false,
  // currentGroup,
}: ListCardProps) {
  const [emails, setEmails] = useState<string[]>([]);

  const { usage_data, current_organization } = useManageAdminStore(
    (state) => state,
  );
  const apiKey = useStore((state) => state.api_key);

  const isActionable =
    [UserRole.owner, UserRole.admin].includes(
      current_organization?.role as UserRole,
    ) || agent.api_key === apiKey;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(agent);
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(agent);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(agent);
  };

  const handleMoveToNewVoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToNewVoice?.(agent);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(agent);
  };

  // const handleAddToGroupClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   onAddToGroup?.(agent);
  // };

  // const handleRemoveFromGroupClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   onRemoveFromGroup?.(agent);
  // };

  useEffect(() => {
    setEmails(
      team
        ?.filter((member: ITeamMember) =>
          agentPolicies
            ?.map((p: IPolicy) => p?.user_id)
            .includes(member?.user_id),
        )
        ?.map((member: ITeamMember) => member?.email) || [],
    );
    return () => {
      setEmails([]);
    };
  }, [agent?._id, team?.length, agentPolicies?.length]);

  // Get owner email - using api_key to match with user_id
  // const isOwnAgent = agent.api_key === apiKey;
  // const ownerEmail =
  //   !isOwnAgent ||
  //   team?.find(
  //     (member: ITeamMember) =>
  //       member?.user_id === current_organization?.user_id,
  //   )?.email ||
  //   current_organization?.name ||
  //   "Unknown";

  // Format date - using _id timestamp
  const createdDate = agent?._id
    ? format(
        new Date(parseInt(agent._id.substring(0, 8), 16) * 1000),
        "MMM d, yyyy",
      )
    : "-";

  return (
    <motion.div
      custom={index}
      variants={listVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <div
        className={cn(
          "group relative flex items-center border-b px-4 py-2",
          "cursor-pointer transition-colors hover:bg-muted/50",
          "text-sm",
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(agent);
        }}
      >
        {/* Name column */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-secondary text-xs font-medium">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{agent.name}</span>
              {isLaunched && (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <RocketIcon className="h-3 w-3 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      ``
                      <p>Launched as Agent</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {agent.description || "No description"}
            </p>
          </div>
        </div>

        {/* Created At column */}
        <div className="w-32 px-4 text-muted-foreground">{createdDate}</div>

        {/* Owner column */}
        {/* <div className="w-40 px-4">
          {agent?.managed_agents?.length ? "Manager" : "Single"}
        </div> */}

        {/* Shared With column */}
        <div className="flex w-40 justify-center px-4">
          {emails && emails.length > 0 ? (
            <div className="flex items-center justify-center -space-x-1">
              {emails.slice(0, 3).map((email, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background text-[0.65rem]">
                        <AvatarFallback>
                          {email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {emails.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[0.65rem] font-medium">
                        +{emails.length - 3}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {emails.slice(3).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* Actions column */}
        <div className="flex w-16 items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded p-1 hover:bg-muted">
                <Ellipsis className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditClick}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {isOrgMode(usage_data?.plan_name) && isActionable && (
                <DropdownMenuItem onClick={handleShareClick}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Agent
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicateClick}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Agent
              </DropdownMenuItem>
              {showMoveToNewVoice && isActionable && (
                <DropdownMenuItem onClick={handleMoveToNewVoiceClick}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Move to New Voice
                </DropdownMenuItem>
              )}
              {showJsonEdit && onEditJson && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditJson(agent);
                  }}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Edit as JSON
                </DropdownMenuItem>
              )}
              {isActionable && (
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Ellipsis,
  Pencil,
  Trash2,
  RocketIcon,
  ExternalLink,
  Share2,
  Copy,
  FolderPlus,
  FolderMinus,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
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
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useStore from "@/lib/store";
import { isOrgMode } from "@/lib/utils";
import { Group } from "@/services/groupsApiService";

interface AgentCardProps {
  agent: IAgent;
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
  onAddToGroup?: (agent: IAgent) => void;
  onRemoveFromGroup?: (agent: IAgent) => void;
  onClick: (agent: IAgent) => void;
  currentGroup?: Group | null;
  index: number;
}

type IPolicy = { user_id: string; resource_id: string };

const cardVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
    scale: 1,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 10,
    },
  }),
};

export function AgentCard({
  agent,
  index = 0,
  isLaunched,
  appId,
  onEdit,
  team,
  agentPolicies,
  onDuplicate,
  onShare,
  onDelete,
  onLaunch,
  onAddToGroup,
  onRemoveFromGroup,
  onClick,
  currentGroup,
}: AgentCardProps) {
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

  const handleLaunchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onLaunch(agent);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(agent);
  };

  const handleAddToGroupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToGroup?.(agent);
  };

  const handleRemoveFromGroupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromGroup?.(agent);
  };

  useEffect(() => {
    setEmails(
      team
        ?.filter((member: ITeamMember) =>
          agentPolicies
            ?.map((p: IPolicy) => p?.user_id)
            .includes(member?.user_id),
        )
        ?.map((member: ITeamMember) => member?.email),
    );
    return () => {
      setEmails([]);
    };
  }, [agent?._id, team?.length, agentPolicies?.length]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      transition={{
        delay: index / 20,
      }}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      layout
    >
      <Card
        className="relative z-10 h-[180px] cursor-pointer space-y-4 border p-4 transition-all hover:border-primary"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(agent);
        }}
      >
        <CardTitle className="flex w-full items-center justify-between">
          {/* @ts-ignore */}
          <p className="line-clamp-3">{agent?.name ?? agent?.flow_name}</p>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ellipsis className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditClick}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              {isOrgMode(usage_data?.plan_name) && isActionable && (
                <DropdownMenuItem onClick={handleShareClick}>
                  <Share2 className="mr-2 size-4" />
                  Share Agent
                </DropdownMenuItem>
              )}
              {isLaunched && appId ? (
                <DropdownMenuItem
                  onClick={() => window.open(`/agent/${appId}`, "_blank")}
                >
                  <ExternalLink className="mr-2 size-4" />
                  View Agent
                </DropdownMenuItem>
              ) : isActionable ? (
                <DropdownMenuItem onClick={handleLaunchClick}>
                  <RocketIcon className="mr-2 size-4" />
                  Launch Agent
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={handleDuplicateClick}>
                <Copy className="mr-2 size-4" />
                Duplicate Agent
              </DropdownMenuItem>
              {onAddToGroup && (
                <DropdownMenuItem onClick={handleAddToGroupClick}>
                  <FolderPlus className="mr-2 size-4" />
                  {/* Show different text based on context */}
                  {currentGroup === null ? "Add to Folder" : "Move to Folder"}
                </DropdownMenuItem>
              )}
              {currentGroup !== null && onRemoveFromGroup && (
                <DropdownMenuItem
                  onClick={handleRemoveFromGroupClick}
                  className="text-red-600"
                >
                  <FolderMinus className="mr-2 size-4" />
                  Remove from Folder
                </DropdownMenuItem>
              )}
              {isActionable && (
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {agent?.description || "No description"}
          </p>
        </CardDescription>
        <CardFooter className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-0">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {emails?.slice(0, 3).map((email, index) => (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <Avatar className="size-6 rounded-full text-[0.65rem] font-semibold">
                    <AvatarFallback className="rounded-full border border-background">
                      {email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{email}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          {isLaunched && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <RocketIcon className="size-5 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Launched as Agent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

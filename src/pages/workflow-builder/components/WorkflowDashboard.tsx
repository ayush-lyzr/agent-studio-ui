import { useEffect, useState } from "react";
import {
  Search,
  XCircleIcon,
  Plus,
  Trash2,
  Ellipsis,
  Share2,
  Users2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteWorkflow,
  listWorkflows,
  getWorkflowPolicies,
} from "@/services/workflowApiService";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import { WorkflowResponse } from "@/types/workflow";
import { Button, buttonVariants } from "@/components/custom/button";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApiKeyProvider } from "@/contexts/ApiKeyContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { Path, UserRole } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ShareWorkflow from "./ShareWorkflow";
import { useOrganization } from "../../organization/org.service";
import { useManageAdminStore } from "../../manage-admin/manage-admin.store";
import { ITeamMember } from "@/lib/types";
import { isOrgMode } from "@/lib/utils";
import { ResourceCard } from "@/components/custom/resource-card";
import useStore from "@/lib/store";

// WorkflowCard component to display individual workflow cards
export const WorkflowCard = ({
  workflow,
  onSelect,
  onDelete,
  onShare,
  usageData,
  sharedEmails = [],
  isPoliciesLoading = false,
  isTeamLoading = false,
}: {
  workflow: WorkflowResponse;
  onSelect: (id: string) => void;
  onDelete: (workflow: WorkflowResponse) => void;
  onShare: (workflow: WorkflowResponse) => void;
  usageData?: any;
  sharedEmails?: string[];
  isPoliciesLoading?: boolean;
  isTeamLoading?: boolean;
}) => {
  const date = new Date(workflow.created_at || Date.now());
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(workflow);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(workflow);
  };

  return (
    <Card
      className="relative col-span-1 h-[180px] cursor-pointer transition-all hover:border-primary hover:shadow-md"
      onClick={() => onSelect(workflow.flow_id.toString())}
    >
      <CardContent className="flex h-full flex-col p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="truncate text-lg font-semibold">
            {workflow.flow_name}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ellipsis className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOrgMode(usageData?.plan_name) && (
                <DropdownMenuItem onClick={handleShareClick}>
                  <Share2 className="mr-2 size-4" />
                  Share Workflow
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-red-600"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* <CardDescription className="flex-grow text-sm text-muted-foreground">
          {workflow.description || "No description provided"}
        </CardDescription> */}
        <div className="mt-4 text-xs text-muted-foreground">
          Created: {formattedDate}
        </div>
      </CardContent>
      <CardFooter className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-0">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {isPoliciesLoading || isTeamLoading ? (
            // Show skeleton loaders while either policies or team data are loading
            <>
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="size-6 rounded-full" />
            </>
          ) : (
            // Show actual shared user avatars (or nothing if no shared users)
            sharedEmails?.slice(0, 3).map((email, index) => (
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
            ))
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// NewWorkflowCard component to create a new workflow
// const NewWorkflowCard = () => {
//   return (
//     <Link
//       to={`${Path.WORKFLOW_BUILDER}/new`}
//       className="col-span-1 block"
//       onClick={() => {
//         if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//           mixpanel.track("New workflow clicked");
//       }}
//     >
//       <Card className="h-full cursor-pointer border-dashed transition-all hover:border-primary hover:shadow-md">
//         <CardContent className="flex h-full flex-col items-center justify-center p-4">
//           <div className="flex h-full flex-col items-center justify-center gap-2">
//             <div className="rounded-full bg-primary/10 p-3">
//               <Plus className="h-6 w-6 text-primary" />
//             </div>
//             <h3 className="text-lg font-semibold">Create New Workflow</h3>
//             <CardDescription className="text-center text-sm text-muted-foreground">
//               Start building a new workflow from scratch
//             </CardDescription>
//           </div>
//         </CardContent>
//       </Card>
//     </Link>
//   );
// };

const WorkflowDashboardContent = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [workflowToDelete, setWorkflowToDelete] =
    useState<WorkflowResponse | null>(null);
  const [isDeletingWorkflow, setIsDeletingWorkflow] = useState(false);
  const [workflowToShare, setWorkflowToShare] =
    useState<WorkflowResponse | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Organization and team data

  const apiKey = useStore((state) => state.api_key);
  const token = useStore((state) => state.app_token);

  const { current_organization, usage_data } = useManageAdminStore(
    (state) => state,
  );
  const { getCurrentOrgMembers } = useOrganization({
    token,
    current_organization,
  });
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [workflowPolicies, setWorkflowPolicies] = useState<any[]>([]);
  // const [isPoliciesLoading, setIsPoliciesLoading] = useState(true);
  // const [isTeamLoading, setIsTeamLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const workflowList = await listWorkflows();
      setWorkflows(workflowList);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // setIsTeamLoading(true);
      const teamRes = await getCurrentOrgMembers();
      setTeam(teamRes.data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      // setIsTeamLoading(false);
    }
  };

  const fetchWorkflowPolicies = async () => {
    try {
      // setIsPoliciesLoading(true);
      if (current_organization?.org_id) {
        const policiesRes = await getWorkflowPolicies(
          current_organization.org_id,
          token || "",
        );
        setWorkflowPolicies(policiesRes);
      }
    } catch (error) {
      console.error("Error fetching workflow policies:", error);
    } finally {
      // setIsPoliciesLoading(false);
    }
  };

  // Helper function to get shared emails for a specific workflow (for displaying in cards)
  const getSharedEmailsForWorkflow = (workflowId: string): string[] => {
    const workflowSpecificPolicies = workflowPolicies.filter(
      (policy) => policy?.resource_id === workflowId,
    );
    return (
      team
        ?.filter((member: ITeamMember) =>
          workflowSpecificPolicies
            ?.map((p: any) => p?.user_id)
            .includes(member?.user_id),
        )
        ?.map((member: ITeamMember) => member?.email) || []
    );
  };

  useEffect(() => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Avanade Agentflow page visited");

    const initializeData = async () => {
      await Promise.all([
        fetchWorkflows(),
        fetchTeamMembers(),
        fetchWorkflowPolicies(),
      ]);
      console.log("All workflow dashboard data loaded");
    };

    initializeData();
  }, []);

  const handleSelectWorkflow = (id: string) => {
    navigate(`${Path.WORKFLOW_BUILDER}/${id}`);
  };

  const handleDelete = async () => {
    if (workflowToDelete) {
      setIsDeletingWorkflow(true);
      try {
        await deleteWorkflow(workflowToDelete.flow_id.toString());
        toast.success("Workflow deleted successfully");
        setWorkflowToDelete(null);
        fetchWorkflows();
      } catch (error) {
        toast.error("Failed to delete workflow");
        console.error("Error deleting workflow:", error);
      } finally {
        setIsDeletingWorkflow(false);
      }
    }
  };

  const handleDeleteWorkflow = (workflow: WorkflowResponse) => {
    setWorkflowToDelete(workflow);
  };

  const handleShareWorkflow = (workflow: WorkflowResponse) => {
    console.log("Opening share modal for workflow:", {
      workflow_id: workflow.flow_id,
      teamCount: team?.length,
      policiesCount: workflowPolicies?.length,
      filteredPolicies: workflowPolicies.filter(
        (p) => p?.resource_id === workflow.flow_id.toString(),
      ).length,
    });
    setWorkflowToShare(workflow);
    setShowShareModal(true);
  };

  const handleShareComplete = async () => {
    // Refresh policies after successful sharing
    await fetchWorkflowPolicies();
  };

  const isActionable = (workflow: WorkflowResponse) =>
    [UserRole.owner, UserRole.admin].includes(
      current_organization?.role as UserRole,
    ) || workflow?.api_key === apiKey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-8 p-8"
    >
      <PageTitle
        title="Multi-Agent Workflow"
        description={
          <span className="inline-flex items-center gap-1 space-x-1 text-sm text-muted-foreground">
            <p>
              Create and manage your workflows to automate tasks and processes.
            </p>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Docs-clicked", {
                    feature: "Avanade AgentFlow",
                  });
              }}
            >
              Docs
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("API-clicked", {
                    feature: "Avanade AgentFlow",
                  });
              }}
            >
              API
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
          </span>
        }
      />

      <div className="grid w-full grid-cols-12 place-content-between gap-2">
        <span className="col-span-3 flex items-center rounded-md border border-input px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="max-w-xs border-none bg-transparent shadow-none"
          />

          <XCircleIcon
            className={cn(
              "size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
              searchQuery.length > 0 ? "visible" : "invisible",
            )}
            onClick={() => setSearchQuery("")}
          />
        </span>

        <div className="col-span-9 flex justify-end">
          <Link
            to={`${Path.WORKFLOW_BUILDER}/new`}
            onClick={() => {
              if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                mixpanel.track("New workflow clicked");
            }}
          >
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      <div className="h-[calc(100%-8rem)] overflow-y-scroll">
        <div className="grid grid-cols-4 gap-4 pt-1">
          {isLoading ? (
            <>
              {[...Array(8)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="col-span-1 h-52 w-full rounded-lg"
                />
              ))}
            </>
          ) : workflows?.length ? (
            <>
              {/* <NewWorkflowCard /> */}

              {(workflows ?? [])
                .filter((workflow) =>
                  workflow.flow_name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                )
                .map((workflow, index) => (
                  // <WorkflowCard
                  //   key={workflow.flow_id}
                  //   workflow={workflow}
                  //   onSelect={handleSelectWorkflow}
                  //   onDelete={handleDeleteWorkflow}
                  //   onShare={handleShareWorkflow}
                  //   usageData={usage_data}
                  //   sharedEmails={getSharedEmailsForWorkflow(workflow.flow_id)}
                  //   isPoliciesLoading={isPoliciesLoading}
                  //   isTeamLoading={isTeamLoading}
                  // />
                  <ResourceCard<{ type?: string } & WorkflowResponse>
                    index={index}
                    key={workflow?.flow_id}
                    item={workflow}
                    viewMode="grid"
                    withGradientIcon
                    title={workflow?.flow_name}
                    type="Workflow"
                    timestamp={workflow?.updated_at ?? workflow?.created_at}
                    description={workflow?.description}
                    onClick={() => handleSelectWorkflow(workflow?.flow_id)}
                    badges={[
                      {
                        icon: (
                          <Users2 className="size-4 text-muted-foreground" />
                        ),
                        visible:
                          getSharedEmailsForWorkflow(workflow?.flow_id).length >
                          0,
                        tooltip: `Shared with ${getSharedEmailsForWorkflow(workflow?.flow_id)?.length} users`,
                      },
                    ]}
                    actions={[
                      {
                        label: "Share",
                        icon: <Share2 className="size-4" />,
                        visible: isOrgMode(usage_data?.plan_name),
                        onClick: () => (e) => {
                          e.stopPropagation();
                          handleShareWorkflow(workflow);
                        },
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="size-4" />,
                        visible: isActionable(workflow),
                        className: "text-destructive",
                        onClick: () => (e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow);
                        },
                      },
                    ]}
                  />
                ))}
            </>
          ) : (
            <div className="col-span-4 flex h-3/4 flex-col items-center justify-center space-y-5 text-center">
              <img
                src="/images/no-tools.svg"
                alt="Empty state"
                className="mt-20"
              />
              <p className="pb-5 font-medium">No Workflows found</p>

              <Link
                to={`${Path.WORKFLOW_BUILDER}/new`}
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("New workflow clicked");
                }}
                className={buttonVariants()}
              >
                <Plus className="mr-1 size-4" /> Create new
              </Link>
            </div>
          )}
        </div>
      </div>
      <AlertDialog
        open={!!workflowToDelete}
        onOpenChange={() => setWorkflowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingWorkflow}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
              disabled={isDeletingWorkflow}
            >
              {isDeletingWorkflow ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Workflow Modal */}
      <ShareWorkflow
        open={showShareModal}
        onOpen={setShowShareModal}
        workflow_id={workflowToShare?.flow_id?.toString() || ""}
        team={team || []}
        workflowPolicies={workflowPolicies.filter(
          (policy) =>
            policy?.resource_id === workflowToShare?.flow_id?.toString(),
        )}
        onShareComplete={handleShareComplete}
      />
    </motion.div>
  );
};

export default function WorkflowDashboard() {
  return (
    <div className="h-screen w-full">
      <ApiKeyProvider>
        <WorkflowProvider>
          <TooltipProvider>
            <WorkflowDashboardContent />
          </TooltipProvider>
        </WorkflowProvider>
      </ApiKeyProvider>
    </div>
  );
}

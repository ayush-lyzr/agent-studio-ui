import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import mixpanel from "mixpanel-browser";
import {
  MoreVertical,
  ThumbsUp,
  Trash2,
  Pencil,
  Share2,
  ClipboardCheck,
  Clipboard,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/custom/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import axios from "@/lib/axios";
import { AppData, MemberstackCurrentUser, UserRole } from "@/lib/types";
import { cn, isOrgMode } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isMixpanelActive, MARKETPLACE_URL } from "@/lib/constants";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
};

export const AppCard: React.FC<{
  app: AppData;
  editingApp: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  currentUser: Partial<MemberstackCurrentUser>;
  userId: string;
  token: string;
  isOrgApp?: boolean;
}> = ({
  app,
  onEdit,
  onDelete,
  currentUser,
  userId,
  token,
  isOrgApp = false,
}) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<boolean>(false);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);

  const { usage_data, current_organization } = useManageAdminStore(
    (state) => state,
  );

  const hasDeletePermission =
    userId === app?.user_id ||
    (isOrgApp &&
      isOrgMode(usage_data?.plan_name) &&
      current_organization?.role === UserRole.owner);

  const { mutateAsync: upvoteApp, isPending: isUpvotingApp } = useMutation({
    mutationKey: ["upvoteApp", app.id],
    mutationFn: () =>
      axios.post(
        `/app/${app.id}/upvote`,
        {
          user_email: currentUser?.auth?.email ?? "",
          app_id: app.id,
        },
        {
          baseURL: MARKETPLACE_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sucessfully upvoted! 👍",
      });
    },
  });

  const onUpvoteApp = async () => await upvoteApp();

  const { mutateAsync: deleteAgent, isPending: isDeletingAgent } = useMutation({
    mutationKey: ["deleteAgent", app.id],
    mutationFn: () =>
      axios.delete(`/app/${app?.id}`, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => {
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Deleted agent", app);
      setDeleteVisible(false);
      toast({
        title: "Success",
        description: "Agent deleted successfully!",
      });
      onDelete?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error?.message ?? "Sorry, unknown error. Our team is fixing this.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteAgent();
    await queryClient.invalidateQueries({ queryKey: ["fetchApps"] });
  };

  const getBadgeItems = () => {
    if (app.categories && app.categories.length > 0) {
      return app.categories.filter((category) => category.trim() !== "");
    }
    if (app.tags) {
      return Object.values(app.tags).filter((tag) => tag && tag.trim() !== "");
    }
    return [];
  };

  return (
    <Link
      to={`/agent/${app.id}`}
      target="_blank"
      className="col-span-1 block h-fit"
    >
      <Card
        key={app.id}
        className="relative cursor-pointer border transition-all hover:border-primary"
      >
        <CardHeader className="h-36 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted p-2">
                <img
                  src={`https://api.dicebear.com/9.x/identicon/svg?seed=${app.name}`}
                  alt="avatar"
                />
              </div>
              <CardTitle className="line-clamp-2" title={app.name}>
                {app.name}
              </CardTitle>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreVertical className="size-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  {userId === app?.user_id && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="mr-2 size-4" />
                      Edit Agent
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                    <AlertDialog>
                      <AlertDialogTrigger className="flex items-center">
                        <Share2 className="mr-2 size-4" />
                        Share Agent
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Shareable Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Simply copy this link and share it anywhere.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <p className="break-all rounded-md bg-secondary p-2 text-sm font-medium">{`${window.location.origin}/agent/${app.id}`}</p>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/agent/${app.id}`,
                              );
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                          >
                            {copied ? (
                              <ClipboardCheck className="mr-1 size-5 text-emerald-500" />
                            ) : (
                              <Clipboard className="mr-1 size-5" />
                            )}
                            {copied ? "Copied" : "Copy"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuItem>
                  {hasDeletePermission && (
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={(e) => e.preventDefault()}
                    >
                      <AlertDialog
                        open={deleteVisible}
                        onOpenChange={setDeleteVisible}
                      >
                        <AlertDialogTrigger className="flex items-center text-destructive hover:text-destructive/80">
                          <Trash2 className="mr-2 size-4" />
                          Delete Agent
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete this key.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button
                              variant="destructive"
                              loading={isDeletingAgent}
                              onClick={handleDelete}
                            >
                              <Trash2 className="mr-1 size-5" /> Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription className="mt-2 line-clamp-3 text-sm">
            {app.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-1 pt-0">
          <div className="flex h-16 flex-wrap items-start gap-2 overflow-hidden">
            {getBadgeItems()
              .slice(0, 2)
              .map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="rounded-full px-2 py-1 text-xs"
                >
                  {toTitleCase(item)}
                </Badge>
              ))}
            {getBadgeItems().length > 2 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2 py-1 text-xs"
                    >
                      +{getBadgeItems().length - 2}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      {getBadgeItems()
                        .slice(2)
                        .map((item, index) => (
                          <span key={index}>{toTitleCase(item)}</span>
                        ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex h-12 items-center justify-between pt-0">
          <p className="w-3/5 text-[0.8rem] text-muted-foreground">
            By {toTitleCase(app?.creator)}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className={cn(
              "border-none font-semibold",
              isUpvotingApp && "animate-pulse",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpvoteApp();
            }}
          >
            <ThumbsUp className="mr-2 size-4" />
            {app.upvotes}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import mixpanel from "mixpanel-browser";
import {
  MoreVertical,
  Trash2,
  Pencil,
  Share2,
  ClipboardCheck,
  Clipboard,
  ChevronRight,
  ThumbsUp,
  Bell,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/custom/button";
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
import { isOrgMode } from "@/lib/utils";
import { isMixpanelActive, MARKETPLACE_URL } from "@/lib/constants";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

// Generate random gradient for avatars
const getRandomGradient = (seed: string) => {
  const gradients = [
    "bg-gradient-to-br from-orange-300 via-amber-200 to-yellow-300",
    "bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400",
    "bg-gradient-to-br from-teal-300 via-emerald-300 to-green-400",
    "bg-gradient-to-br from-purple-500 via-fuchsia-400 to-pink-500",
    "bg-gradient-to-br from-cyan-300 via-sky-300 to-blue-400",
    "bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500",
    "bg-gradient-to-br from-violet-400 via-purple-300 to-pink-300",
    "bg-gradient-to-br from-red-400 via-orange-400 to-red-500",
    "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-400",
    "bg-gradient-to-br from-fuchsia-400 via-pink-300 to-rose-400",
    "bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400",
    "bg-gradient-to-br from-amber-400 via-orange-300 to-yellow-400",
  ];

  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

interface CompactAgentCardProps {
  app: AppData;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUser: Partial<MemberstackCurrentUser>;
  userId: string;
  token: string;
  isOrgApp?: boolean;
  showAuthor?: boolean;
}

export function CompactAgentCard({
  app,
  onEdit,
  onDelete,
  userId,
  token,
  isOrgApp = false,
  showAuthor = false,
}: CompactAgentCardProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<boolean>(false);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);
  const [upvoteCount, setUpvoteCount] = useState<number>(app.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);

  const { usage_data, current_organization, current_user } =
    useManageAdminStore((state) => state);

  const gradient = getRandomGradient(app.name);

  const hasDeletePermission =
    userId === app?.user_id ||
    (isOrgApp &&
      isOrgMode(usage_data?.plan_name) &&
      current_organization?.role === UserRole.owner);

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

  const { mutate: upvoteApp, isPending: isUpvoting } = useMutation({
    mutationKey: ["upvoteApp", app.id],
    mutationFn: () =>
      axios.post(
        `/app/${app.id}/upvote`,
        {
          user_email: current_user?.auth?.email,
          app_id: app.id,
        },
        {
          baseURL: MARKETPLACE_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    onSuccess: () => {
      setUpvoteCount((prev) => prev + 1);
      setHasUpvoted(true);
      toast({
        title: "Success",
        description: "Thanks for your upvote!",
      });
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const errorMessage = error?.response?.data?.detail || error?.message;
      if (errorMessage?.toLowerCase().includes("already upvoted")) {
        setHasUpvoted(true);
      }
      toast({
        title: "Error",
        description: errorMessage || "Failed to upvote",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasUpvoted && !isUpvoting) {
      upvoteApp();
    }
  };

  return (
    <Link
      to={`/agent/${app.id}`}
      target="_blank"
      className="group block h-full w-full"
    >
      <div className="relative flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary hover:shadow-md">
        {/* Title row with gradient box inline */}
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded ${gradient}`}
          ></div>
          <h4
            className="truncate font-semibold text-foreground"
            title={app.name}
          >
            {app.name}
          </h4>
        </div>

        {/* Description - takes up available space */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {app.description || "Lorem ipsum dolor sit amet"}
          </p>
        </div>

        {/* Author and Upvote - always at bottom */}
        {showAuthor && (
          <div className="mt-auto flex items-center justify-between pt-3">
            {app.creator ? (
              <span className="text-xs">
                by <span className="font-bold">{app.creator}</span>
              </span>
            ) : (
              <span></span>
            )}
            <Button
              onClick={handleUpvote}
              disabled={hasUpvoted || isUpvoting}
              className={`flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-primary/10`}
            >
              <ThumbsUp
                className={`size-4 ${hasUpvoted ? "fill-primary" : ""}`}
              />
              <span>{upvoteCount}</span>
            </Button>
          </div>
        )}

        {/* Dropdown menu - absolute positioned */}
        <div
          className="absolute right-3 top-3"
          onClick={(e) => e.preventDefault()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVertical className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              {userId === app?.user_id && onEdit && (
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
                          This action cannot be undone. This will permanently
                          delete this agent.
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
    </Link>
  );
}

// Lyzr app card for featured agents from lyzr-apps.ts
interface LyzrAgentCardProps {
  app: {
    id: string;
    name: string;
    description?: string;
    navigation_path: string;
    special?: ("Beta" | "Demo" | "Pro")[];
    imageUrl?: string;
    coming_soon?: boolean;
    new?: boolean;
    demo?: boolean;
    forProAnAbove?: boolean;
    industry_tag?: string;
    function_tag?: string;
    category_tag?: string;
  };
  variant?: "default" | "category";
  agentCount?: number;
  hideComingSoonBadge?: boolean;
  hideAuthorAndTags?: boolean;
}

export function LyzrAgentCard({
  app,
  variant = "default",
  agentCount,
  hideComingSoonBadge = false,
  hideAuthorAndTags = false,
}: LyzrAgentCardProps) {
  const isCategory = variant === "category";
  const isComingSoon = app.coming_soon === true;
  const isNew = app.new === true;
  const isProOnly = app.forProAnAbove === true;
  const gradient = getRandomGradient(app.name);

  // Get current user from store
  const { current_user } = useManageAdminStore((state) => state);

  const { mutate: sendSlackNotification, isPending: isNotifying } = useMutation(
    {
      mutationKey: ["sendSlackNotification", app.id],
      mutationFn: () => {
        const apiUrl = import.meta.env.VITE_MARKETPLACE_URL;
        const apiSecretKey = import.meta.env.VITE_SLACK_API_SECRET_KEY;

        if (!apiUrl || !apiSecretKey) {
          throw new Error("Slack API configuration missing");
        }

        const userEmail = current_user?.auth?.email || "Unknown";
        const userName =
          current_user?.customFields?.name ||
          current_user?.auth?.email?.split("@")[0] ||
          "Unknown";

        const message = {
          text: `🔔 Coming Soon Notification Request`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "📥 Coming Soon - Notify Request",
                emoji: true,
              },
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*User Name:* ${userName}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Email:* ${userEmail}`,
                },
              ],
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*App Requested:* ${app.name}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Requested At:* ${new Date().toLocaleString()}`,
                },
              ],
            },
            {
              type: "divider",
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "📍 Submitted via Lyzr Agent Studio Marketplace - Coming Soon Notification",
                },
              ],
            },
          ],
        };

        return axios.post(`/api/slack/send`, message, {
          baseURL: apiUrl,
          headers: {
            "x-secret-key": apiSecretKey,
          },
        });
      },
      onSuccess: () => {
        toast({
          title: "Coming Soon!",
          description: `We'll notify you when it's live on the App Store.`,
        });
      },
      onError: (error) => {
        console.error("Error sending to Slack:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to send notification",
          variant: "destructive",
        });
      },
    },
  );

  const handleNotifyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isNotifying) {
      sendSlackNotification();
    }
  };

  const CardWrapper = isComingSoon ? "div" : Link;
  const cardProps = isComingSoon
    ? { className: "group block w-full h-full" }
    : { to: app.navigation_path, className: "group block w-full h-full" };

  // Collect all badges to display
  const getBadges = () => {
    const badges: { label: string; className: string }[] = [];

    if (isComingSoon && !hideComingSoonBadge) {
      badges.push({
        label: "Coming Soon",
        className:
          "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
      });
    }

    if (isNew && !isComingSoon) {
      badges.push({
        label: "New",
        className:
          "border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400",
      });
    }

    // Special tags (Beta, Demo, Pro)
    app.special?.forEach((tag) => {
      let className = "";
      switch (tag) {
        case "Demo":
          className =
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
          break;
        case "Beta":
          className =
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
          break;
        case "Pro":
          className =
            "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0";
          break;
        default:
          className = "";
      }
      badges.push({ label: tag, className });
    });

    // Pro-only indicator (if not already in special)
    if (isProOnly && !app.special?.includes("Pro")) {
      badges.push({
        label: "Pro",
        className:
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
      });
    }

    return badges;
  };

  const badges = getBadges();

  return (
    <CardWrapper {...(cardProps as any)}>
      <div
        className={`relative flex h-full ${isCategory ? "flex-row items-center gap-3" : "flex-col gap-3"} rounded-xl border p-4 transition-all duration-200 ${
          isComingSoon
            ? "bg-card"
            : isCategory
              ? "border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 hover:shadow-md dark:border-purple-900/30 dark:bg-purple-950/20 dark:hover:border-purple-800/50 dark:hover:bg-purple-950/30"
              : "bg-card hover:border-primary hover:shadow-md"
        }`}
      >
        {/* Category variant - horizontal layout */}
        {isCategory ? (
          <>
            {/* Large image on the left */}
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${app.imageUrl ? "" : "bg-purple-100 dark:bg-purple-900/30"}`}
            >
              {app.imageUrl && (
                <img
                  src={app.imageUrl}
                  alt="avatar"
                  className="object-fit h-full w-full rounded-full bg-purple-900/50"
                />
              )}
            </div>

            {/* Middle content - title and description */}
            <div className="min-w-0 flex-1">
              <h4
                className="truncate font-semibold text-foreground"
                title={app.name}
              >
                {app.name}
              </h4>
              {app.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {app.description}
                </p>
              )}
            </div>

            {/* Right side - agent count and chevron */}
            <div className="flex flex-shrink-0 flex-col items-end justify-between self-stretch">
              {agentCount !== undefined && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {agentCount} {agentCount === 1 ? "Agent" : "Agents"}
                </span>
              )}
              {!isComingSoon && (
                <ChevronRight className="h-5 w-5 text-purple-400 transition-transform group-hover:translate-x-1 dark:text-purple-500" />
              )}
            </div>
          </>
        ) : (
          <>
            {/* New badge - absolute positioned */}
            {isNew && !isComingSoon && (
              <div className="absolute -right-2 -top-2 z-10">
                <Badge className="bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                  New
                </Badge>
              </div>
            )}

            {/* Title row with gradient box inline */}
            <div
              className={`flex flex-wrap items-center gap-2 transition-opacity duration-200 ${isComingSoon ? "group-hover:opacity-30" : ""}`}
            >
              {/* Gradient box */}
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded ${app.imageUrl ? "" : gradient}`}
              >
                {app.imageUrl && (
                  <img
                    src={app.imageUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <h4
                className="truncate font-semibold text-foreground"
                title={app.name}
              >
                {app.name}
              </h4>
              {/* Inline badges (Coming Soon, Special tags) */}
              {badges
                .filter((b) => b.label !== "New")
                .slice(0, 2)
                .map((badge) => (
                  <Badge
                    key={badge.label}
                    variant="outline"
                    className={`px-1.5 py-0 text-[10px] ${badge.className}`}
                  >
                    {badge.label}
                  </Badge>
                ))}
            </div>

            {/* Content */}
            <div
              className={`flex min-w-0 flex-1 flex-col transition-opacity duration-200 ${isComingSoon ? "group-hover:opacity-30" : ""}`}
            >
              {/* Description */}
              {app.description ? (
                <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                  {app.description}
                </p>
              ) : (
                <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                  &nbsp;
                </p>
              )}

              {/* By Lyzr AI tag - show for all non-category Lyzr apps */}
              {!hideAuthorAndTags && (
                <p className="mt-2 text-xs text-muted-foreground">
                  By <span className="font-medium text-primary">Lyzr AI</span>
                </p>
              )}

              {/* Tags row - show industry, function, category tags as badges */}
              {!hideAuthorAndTags &&
                (app.industry_tag || app.function_tag || app.category_tag) && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {app.function_tag && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px] font-normal"
                      >
                        {app.function_tag}
                      </Badge>
                    )}
                    {app.category_tag && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px] font-normal"
                      >
                        {app.category_tag}
                      </Badge>
                    )}
                    {app.industry_tag && (
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[10px] font-normal"
                      >
                        {app.industry_tag}
                      </Badge>
                    )}
                  </div>
                )}
            </div>

            {/* Notify button overlay for coming soon - centered */}
            {isComingSoon && (
              <button
                onClick={handleNotifyClick}
                className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 shadow-lg transition-all duration-200 hover:bg-primary/90 group-hover:opacity-100"
              >
                <Bell className="size-4" />
                Notify Me
              </button>
            )}
          </>
        )}
      </div>
    </CardWrapper>
  );
}

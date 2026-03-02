import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import {
  MonitorPlay,
  Zap,
  Sparkles,
  CircleHelp,
  RefreshCw,
  Plus,
  Bug,
  MessageCircleMore,
  Settings,
  BadgeHelp,
  LibraryBig,
  SquarePlus,
  ExternalLink,
  Store,
} from "lucide-react";

import { SidebarMenuItem, SidebarMenuButton, useSidebar } from "..";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useOrganization } from "@/pages/organization/org.service";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { BRAND } from "@/lib/branding";
import { cn, convertToReadableNumber, getNextBillingDate } from "@/lib/utils";
import {
  isMixpanelActive,
  MAIA_FRONTEND_URL,
  IS_PROPHET_DEPLOYMENT,
  IS_ENTERPRISE_DEPLOYMENT,
  CREDITS_DIVISOR,
} from "@/lib/constants";
import { Path, UserRole } from "@/lib/types";
import useStore from "@/lib/store";
import { useUserback } from "@/contexts/feedback-context";
import { CreditsHelperModal } from "./credits-helper-modal";
import { SpeakToUs } from "./speak-to-us";
import { ReleaseNotesModal } from "./release-notes-modal";
import { AppSidebarItem } from "./sidebar-item";
import { UserbackFeedbackType } from "@userback/widget";
import { useSubOrganizationService } from "@/services/subOrganizationService";

interface SidebarFooterProps {
  isUserPartOfOrg: boolean;
  loading: boolean;
  isUsageFetched: boolean;
  creditsDropdownOpen: boolean;
  footerDropdownOpen: boolean;
  handleCreditsOpenChange: (open: boolean) => void;
  handleFooterOpenChange: (open: boolean) => void;
  creditsLeft: number;
  totalCredits: number;
  usage_data: any;
  isUserOnCommunityplan: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isUserPartOfOrg,
  loading,
  isUsageFetched,
  creditsDropdownOpen,
  handleCreditsOpenChange,
  footerDropdownOpen,
  handleFooterOpenChange,
  creditsLeft,
  totalCredits,
  usage_data,
  isUserOnCommunityplan,
}) => {
  const { open, setOpen } = useSidebar();
  const userback = useUserback();
  const [creditsModalVisible, setCreditsModalVisible] = useState(false);
  const [speakVisible, setSpeakVisible] = useState(false);
  const [releaseNotesVisible, setReleaseNotesVisible] = useState(false);

  const token = useStore((state) => state.app_token);
  const {
    setUsageData,
    current_user: currentUser,
    current_organization,
    sub_orgs_usage_data,
    setSubOrgsUsageData,
  } = useManageAdminStore((state) => state);
  const { getUsage, isFetchingUsage } = useOrganization({
    current_organization,
    token,
  });
  const { getSubOrgUsages, isFetchingSubOrgUsages } = useSubOrganizationService(
    { token },
  );

  const refreshCredits = async () => {
    try {
      const res = await getUsage();
      const subOrgRes = await getSubOrgUsages();
      setUsageData(res.data);
      if (subOrgRes.data) setSubOrgsUsageData(subOrgRes.data);
    } catch (error) {
      console.error("Error refreshing credits => ", error);
    }
  };

  const handleFeedback = (feedbackType: UserbackFeedbackType) => {
    if (userback) {
      userback.openForm(feedbackType);
    }
  };

  const formatTruncatedCredits = (credits: number) => {
    return credits >= 1000000
      ? `${Math.floor(credits / 1000000)}M`
      : credits >= 1000
        ? `${Math.floor(credits / 1000)}K`
        : credits.toString();
  };

  const handleCreditsHelper = () => {
    setCreditsModalVisible(true);
    if (mixpanel?.hasOwnProperty("cookie") && isMixpanelActive) {
      mixpanel.track("Credit Info Clicked");
    }
  };

  // Divided by 100 for simplify credits
  const totalSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce(
    (prev, curr) => prev + (curr?.allocated_credits ?? 0) / CREDITS_DIVISOR,
    0,
  );
  const usedSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce((prev, curr) => prev + (curr?.used ?? 0) / CREDITS_DIVISOR, 0);
  const subOrgCreditsLeft = totalSubOrgCredits - usedSubOrgCredits;

  const creditsHidden = () => {
    if (!current_organization?.vpas_enabled) return true;
    if (current_organization?.parent_organization_id) return true;
    else {
      return [UserRole.owner, UserRole.admin, UserRole.member].includes(
        current_organization?.role as UserRole,
      );
    }
  };

  useEffect(() => {
    if (userback && currentUser?.id) {
      const name = `${currentUser?.customFields?.["first-name"]} ${currentUser?.customFields?.["last-name"]}`;
      const email = currentUser?.auth?.email;
      const displayName = currentUser?.customFields?.["first-name"]
        ? name
        : email;
      userback?.identify(currentUser?.id, {
        name: displayName, // required
        email: email, // required
        plan: usage_data?.plan_name,
        account_id: currentUser?.id,
      });
    }
  }, [userback, currentUser]);

  return (
    <footer className="w-full list-none items-center p-2">
      {IS_PROPHET_DEPLOYMENT && (
        <AppSidebarItem
          item={{
            title: "Maia App",
            beta: false,
            blocked: false,
            description: "Prophet Maia App",
            icon: <ExternalLink />,
            url: MAIA_FRONTEND_URL,
          }}
          open={open}
        />
      )}

      <AppSidebarItem
        item={{
          title: "Marketplace",
          beta: false,
          blocked: false,
          description: "Agent Marketplace",
          icon: <Store />,
          url: Path.APP_STORE,
        }}
        open={open}
      />

      <SidebarMenuItem className="w-full">
        <DropdownMenu
          open={footerDropdownOpen}
          onOpenChange={handleFooterOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={"See more options"}
              className="overflow-hidden whitespace-nowrap"
            >
              <BadgeHelp />
              Help
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="center"
            side="right"
            sideOffset={8}
            className="relative bottom-10 left-1 grid w-60 gap-1 rounded-lg bg-background text-sm text-muted-foreground shadow-md hover:text-primary dark:bg-sidebar-accent"
          >
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link
                to="https://www.avanade.com/en-gb/services"
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 overflow-hidden whitespace-nowrap text-muted-foreground hover:text-primary"
              >
                <LibraryBig className="mr-1 size-4" />
                Docs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link
                to="https://www.avanade.com/en-gb/insights"
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 overflow-hidden whitespace-nowrap text-muted-foreground hover:text-primary"
              >
                <MonitorPlay className="mr-1 size-4" />
                Tutorials
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFeedback("feature_request")}
              className="h-7 cursor-pointer overflow-hidden whitespace-nowrap text-muted-foreground hover:text-primary"
            >
              <SquarePlus className="mr-1 size-4" />
              Request Feature
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFeedback("bug")}
              className="h-7 cursor-pointer overflow-hidden whitespace-nowrap text-muted-foreground hover:text-primary"
            >
              <Bug className="mr-1 size-4" />
              Report a Bug
            </DropdownMenuItem>

            <DropdownMenuItem
              className="h-7 cursor-pointer overflow-hidden whitespace-nowrap text-muted-foreground hover:text-primary"
              onClick={() => setSpeakVisible(true)}
            >
              <MessageCircleMore className="mr-1 size-4" />
              Speak to us
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {loading && !isUsageFetched && isFetchingSubOrgUsages ? (
        <div className="shimmer h-10 w-full rounded-lg bg-neutral-200" />
      ) : (
        <div
          className={cn(
            "flex w-full flex-col items-center space-y-2",
            open && "px-2",
          )}
        >
          <>
            {creditsHidden() && (
              <div className="mt-4 flex w-full flex-col space-y-2">
                {open ? (
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="inline-flex items-center truncate text-xs">
                      Credits Left
                      <CircleHelp
                        className="ml-1 size-3 cursor-pointer"
                        onClick={handleCreditsHelper}
                      />
                    </span>

                    <DropdownMenu
                      open={creditsDropdownOpen}
                      onOpenChange={handleCreditsOpenChange}
                    >
                      <span className="inline-flex items-center text-xs">
                        {convertToReadableNumber(
                          current_organization?.vpas_enabled &&
                            !!current_organization.sub_organizations?.length &&
                            [UserRole.owner].includes(
                              current_organization?.role as UserRole,
                            )
                            ? creditsLeft - subOrgCreditsLeft
                            : creditsLeft,
                        )}
                        <RefreshCw
                          className={cn(
                            "ml-1 size-3",
                            isFetchingUsage && "animate-spin",
                          )}
                          onClick={refreshCredits}
                        />
                        <DropdownMenuTrigger>
                          <Plus className="ml-2 size-3" />
                        </DropdownMenuTrigger>
                      </span>
                      <DropdownMenuContent
                        align="center"
                        side="right"
                        sideOffset={20}
                        alignOffset={9}
                        className="relative -top-2 w-72 flex-col space-y-2 rounded-lg p-4 text-xs shadow-md dark:bg-sidebar-accent"
                      >
                        <p>Credits Summary</p>
                        {!!current_organization.sub_organizations?.length &&
                          [UserRole.owner].includes(
                            current_organization?.role as UserRole,
                          ) &&
                          current_organization?.vpas_enabled && (
                            <div className="space-y-2 rounded-xl bg-secondary p-2">
                              <p className="text-xs text-muted-foreground">
                                Main Account
                              </p>

                              <div className="flex justify-between">
                                <p className="text-muted-foreground">
                                  Total Credits
                                </p>
                                <p className="font-medium">
                                  {convertToReadableNumber(
                                    totalCredits - totalSubOrgCredits,
                                  )}
                                </p>
                              </div>
                              <div className="flex justify-between">
                                <p className="text-muted-foreground">
                                  Used Credits
                                </p>
                                <p className="font-medium">
                                  {convertToReadableNumber(
                                    Number(usage_data?.used_credits ?? 0) /
                                      CREDITS_DIVISOR -
                                      usedSubOrgCredits,
                                  )}
                                </p>
                              </div>
                              <div className="flex justify-between">
                                <p className="text-muted-foreground">
                                  Credits Left
                                </p>
                                <p className="font-medium">
                                  {convertToReadableNumber(
                                    creditsLeft - subOrgCreditsLeft,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}

                        <DropdownMenuSeparator />
                        <div className="space-y-2 rounded-xl bg-secondary p-2">
                          {!!current_organization.sub_organizations?.length &&
                            current_organization?.vpas_enabled &&
                            [UserRole.owner].includes(
                              current_organization?.role as UserRole,
                            ) && (
                              <p className="text-xs text-muted-foreground">
                                All Accounts (incl. Sub-Accounts)
                              </p>
                            )}
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">
                              Total Credits
                            </p>
                            <p className="font-medium">
                              {convertToReadableNumber(totalCredits)}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">
                              Used Credits
                            </p>
                            <p className="font-medium">
                              {convertToReadableNumber(
                                Number(usage_data?.used_credits) /
                                  CREDITS_DIVISOR,
                              )}
                            </p>
                          </div>

                          <div className="flex justify-between">
                            <p className="text-muted-foreground">
                              Credits Left
                            </p>
                            <p className="font-medium">
                              {convertToReadableNumber(creditsLeft)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Credits refresh on{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(
                            getNextBillingDate(
                              new Date(usage_data?.created_at ?? new Date()),
                              usage_data?.cycle_at ?? "monthly",
                            ),
                          )}
                        </p>
                        <Link
                          to={`${Path.UPGRADE_PLAN}?section=topup`}
                          className={cn(
                            buttonVariants(),
                            "w-full justify-center",
                          )}
                          onClick={() => {
                            setOpen(false);
                            handleCreditsOpenChange(false);
                          }}
                        >
                          <Zap className="mr-2 size-4" />
                          Top up
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="text-center text-xs">
                    {formatTruncatedCredits(
                      Math.round(creditsLeft - subOrgCreditsLeft),
                    )}
                  </div>
                )}
                <Progress
                  value={
                    totalCredits > 0
                      ? ((usage_data?.used_credits ?? 0) /
                          CREDITS_DIVISOR /
                          totalCredits) *
                        100
                      : 0
                  }
                  max={100}
                />
              </div>
            )}

            {/* Show Upgrade/Manage button only for role_admin and role_owner (not for role_member) */}
            {!isUserPartOfOrg &&
              (!IS_ENTERPRISE_DEPLOYMENT ||
                (current_organization?.is_new_rbac &&
                  (current_organization?.role === "role_admin" ||
                    current_organization?.role === "role_owner"))) && (
                <SidebarMenuItem
                  className={cn("h-8 w-full", !creditsHidden() && "mt-2")}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={isUserOnCommunityplan ? "Upgrade" : "Manage"}
                  >
                    {isUserOnCommunityplan ? (
                      <Link
                        to={Path.UPGRADE_PLAN}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          open ? "w-full" : "w-fit",
                        )}
                      >
                        <Sparkles className="size-4" />
                        {open && <p>Upgrade</p>}
                      </Link>
                    ) : (
                      <Link
                        to={Path.MANAGE}
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                          open ? "w-full" : "w-fit",
                          "bg-neutral-300 dark:bg-secondary dark:text-primary",
                        )}
                      >
                        <Settings className="size-4" />
                        {open && <p>Manage</p>}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
          </>
          <div className="flex h-6 items-center justify-center">
            <a
              href={BRAND.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
              aria-label={BRAND.name}
            >
              <BrandLogo className="h-6 w-auto object-contain" />
            </a>
          </div>
        </div>
      )}
      <CreditsHelperModal
        open={creditsModalVisible}
        onOpen={setCreditsModalVisible}
      />
      <SpeakToUs open={speakVisible} onOpenChange={setSpeakVisible} />
      <ReleaseNotesModal
        open={releaseNotesVisible}
        onOpenChange={setReleaseNotesVisible}
      />
    </footer>
  );
};

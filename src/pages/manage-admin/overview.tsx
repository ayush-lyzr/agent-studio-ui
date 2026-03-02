import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import Invite from "./invite";
import { PlanType, CREDITS_DIVISOR } from "@/lib/constants";
import { useOrganization } from "../organization/org.service";
import { IUsage, Path, UserRole } from "@/lib/types";
import {
  cn,
  convertToReadableNumber,
  getNextBillingDate,
  isOrgMode,
} from "@/lib/utils";
import EditDetails from "./edit-details";
import { useManageAdminStore } from "./manage-admin.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreditReportDialog } from "../organization/CreditReportDialog";
import { CreditsBreakdown } from "./credits-breakdown";
// import SubOrganizations from "./sub-organizations";

interface InfoCardProps {
  title: string;
  value: string;
  loading?: boolean;
  action?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };
  action2?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };
}

const Manage: React.FC<InfoCardProps> = ({
  title,
  value,
  action,
  action2,
  loading,
}) => {
  return (
    <Card className={cn(loading && "shimmer")}>
      <CardContent className="flex h-full flex-col justify-between space-y-2 p-6">
        <span className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </span>
        <div className="flex items-center justify-between">
          {action?.href && (
            <Link
              to={action.href}
              onClick={action.onClick}
              className="inline-flex items-center text-sm text-link hover:underline"
            >
              {action.label}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          )}
          {action2?.href && (
            <Link
              to={action2.href}
              onClick={action2.onClick}
              className="inline-flex items-center text-sm text-link hover:underline"
            >
              {action2.label}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Overview = () => {
  const [inviteVisible, setInviteVisible] = useState<boolean>(false);
  const [creditReportVisible, setCreditReportVisible] =
    useState<boolean>(false);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [creditsBreakdownVisible, setCreditsBreakdownVisible] =
    useState<boolean>(false);
  const [usage, setUsage] = useState<Partial<IUsage>>({});

  const { getToken } = useAuth();
  const token = getToken()!;

  const { current_organization, sub_orgs_usage_data } = useManageAdminStore(
    (state) => state,
  );
  const { getUsage, isFetchingUsage } = useOrganization({
    token,
    current_organization,
  });

  const totalCredits =
    (usage?.paid_credits ?? 0) +
    (usage?.used_credits ?? 0) +
    (usage?.recurring_credits ?? 0);
  const creditsLeft = totalCredits - Number(usage?.used_credits ?? 0);

  const totalSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce((prev, curr) => prev + (curr?.allocated_credits ?? 0), 0);
  const usedSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce((prev, curr) => prev + (curr?.used ?? 0), 0);
  const subOrgCreditsLeft = totalSubOrgCredits - usedSubOrgCredits;

  const loading = isFetchingUsage;
  const hasPlan = [
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage?.plan_name as PlanType);

  const hideCredits = () => {
    if (!current_organization?.vpas_enabled) return true;
    if (current_organization?.parent_organization_id) return true;
    else {
      return [UserRole.owner].includes(current_organization?.role as UserRole);
    }
  };

  const onBillingPortal = async () => {
    try {
      toast.promise(
        new Promise((resolve) => {
          setTimeout(() => {
            window.open(
              "https://billing.stripe.com/p/login/9AQdSY9JL57ugg0cMM",
            );
            resolve(true);
          }, 3000);
        }),
        {
          loading:
            "Redirecting you to stripe. You will need to use your email address to login.",
          success: () => `Successfully redirected to billing page`,
          error: (error) => `Error redirecting to billing : ${error?.message}`,
          duration: 3 * 1000,
        },
      );
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  useEffect(() => {
    if (current_organization?.org_id)
      getUsage().then((res) => {
        setUsage(res.data);
      });
  }, [current_organization?.org_id]);

  const isSubAccount =
    current_organization?.vpas_enabled &&
    [UserRole.owner].includes(current_organization?.role as UserRole) &&
    current_organization?.sub_organizations?.length;

  return (
    <div className="mt-4 space-y-4">
      <div
        className={cn(
          "grid h-44 gap-6 md:grid-cols-2",
          hasPlan ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        <Manage
          title="Next invoice issue date"
          value={new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(
            getNextBillingDate(
              new Date(usage?.created_at ?? new Date()),
              // @ts-ignore
              usage?.cycle_at ?? "monthly",
            ),
          )}
          action={
            current_organization?.role === UserRole.owner &&
            ![PlanType.Community].includes(usage?.plan_name as PlanType)
              ? {
                  label: "Manage Billing",
                  href: "#",
                  onClick: onBillingPortal,
                }
              : {}
          }
        />

        {hideCredits() && (
          <Manage
            title="Credits balance available"
            value={
              isSubAccount
                ? convertToReadableNumber(
                    (creditsLeft - subOrgCreditsLeft) / CREDITS_DIVISOR,
                  )
                : `${convertToReadableNumber(creditsLeft / CREDITS_DIVISOR)} / ${convertToReadableNumber(totalCredits / CREDITS_DIVISOR)}`
            }
            loading={loading}
            action={
              [UserRole.owner].includes(current_organization?.role as UserRole)
                ? {
                    label: "Top-up",
                    href: `${Path.UPGRADE_PLAN}?section=topup`,
                  }
                : {}
            }
            action2={
              isSubAccount
                ? {
                    label: "View Credits Breakdown",
                    href: "#",
                    onClick: () => setCreditsBreakdownVisible(true),
                  }
                : {}
            }
          />
        )}

        {isOrgMode(usage?.plan_name) && (
          <Manage
            loading={loading}
            value={String(current_organization?.user_ids?.length ?? 0)}
            title="Organization members"
            action={
              isOrgMode(usage?.plan_name) &&
              [UserRole.owner, UserRole.admin].includes(
                current_organization?.role as UserRole,
              )
                ? {
                    label: "Invite",
                    href: "#",
                    onClick: () => setInviteVisible(true),
                  }
                : {}
            }
          />
        )}
        {hasPlan && (
          <div className="relative col-span-1 rounded-xl bg-white/50">
            <img
              src="/bg-upgrade-banner.png"
              className="absolute z-0 h-full w-full rounded-xl object-cover mix-blend-overlay"
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-2">
              <p className="text-center text-lg font-bold text-black">
                Choose the perfect plan to <br />
                to super charge your AI-driven projects.
              </p>
              <Link
                to="/upgrade-plan"
                className={cn(buttonVariants(), "w-fit")}
              >
                Upgrade plan
              </Link>
            </div>
          </div>
        )}
      </div>

      <Card className={cn(loading && "shimmer w-full")}>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {[PlanType.Organization, PlanType.Teams].includes(
                usage?.plan_name as PlanType,
              )
                ? "Organization"
                : "Plan"}{" "}
              details
            </h2>
            {current_organization?.role === UserRole.owner &&
              isOrgMode(usage?.plan_name) && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="outline"
                        disabled={
                          ![UserRole.admin, UserRole.owner].includes(
                            current_organization?.role as UserRole,
                          ) &&
                          ![PlanType.Community, PlanType.Starter].includes(
                            usage?.plan_name as PlanType,
                          )
                        }
                        onClick={() => setEditVisible(true)}
                      >
                        Edit
                      </Button>
                    </TooltipTrigger>
                    {![UserRole.admin, UserRole.owner].includes(
                      current_organization?.role as UserRole,
                    ) && (
                      <TooltipContent side="left" className="">
                        You need to be an administrator to edit organization
                        details.
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
          </div>

          <Separator />
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4">
                <p className="col-span-1 text-sm text-muted-foreground">Name</p>
                <p className="col-span-5 text-sm font-medium">
                  {current_organization?.name}
                </p>
                <p className="col-span-1 text-sm text-muted-foreground">
                  Current plan
                </p>
                <span className="col-span-5 inline-flex w-fit items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  {usage?.plan_name} Plan
                </span>
                {isOrgMode(usage?.plan_name) && (
                  <>
                    <p className="col-span-1 text-sm text-muted-foreground">
                      Industry
                    </p>
                    <p className="col-span-5 text-sm font-medium">
                      {current_organization?.industry}
                    </p>
                    <p className="col-span-1 text-sm text-muted-foreground">
                      About Company
                    </p>
                    <p className="col-span-5 text-sm text-muted-foreground">
                      {current_organization?.about_organization}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* {current_organization?.role === UserRole.owner && (
        <SubOrganizations />
      )} */}
      <Invite open={inviteVisible} onOpen={setInviteVisible} />
      <EditDetails open={editVisible} onOpen={setEditVisible} usage={usage} />
      <CreditReportDialog
        open={creditReportVisible}
        onOpen={setCreditReportVisible}
      />
      <CreditsBreakdown
        open={creditsBreakdownVisible}
        onOpen={setCreditsBreakdownVisible}
      />
    </div>
  );
};

export default Overview;

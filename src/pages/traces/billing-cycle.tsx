import useStore from "@/lib/store";
import { useOrganization } from "../organization/org.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { getCurrentBillingCycle, getNextBillingDate } from "@/lib/utils";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, CircleDollarSign } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@/lib/types";

const BillingCycle = () => {
  const navigate = useNavigate();
  const token = useStore((state) => state.app_token);
  const apiKey = useStore((state) => state.api_key);
  const { usage_data, setUsageData, current_organization } =
    useManageAdminStore((state) => state);

  const { getUsage } = useOrganization({
    token,
    current_organization,
  });

  const nextBillingDate = getNextBillingDate(
    new Date(usage_data?.created_at ?? new Date()),
    // @ts-ignore
    usage_data?.cycle_at ?? "monthly",
  );

  useEffect(() => {
    const fetchUsageStats = async () => {
      const res = await getUsage();
      setUsageData(res.data);
      const date = getCurrentBillingCycle(
        usage_data?.created_at ?? new Date().toString(),
        // @ts-ignore
        usage_data?.cycle_at ?? "monthly",
      );
      return date;
    };

    fetchUsageStats();
  }, [apiKey]);

  const hideCredits = () => {
    if (!current_organization?.vpas_enabled) return true;
    if (current_organization?.parent_organization_id) return true;
    else {
      return [UserRole.owner].includes(current_organization?.role as UserRole);
    }
  };

  const getTotalCredits = () => {
    let totalCredits = 0;
    if (usage_data?.paid_credits)
      totalCredits += Number(usage_data?.paid_credits);
    if (usage_data?.recurring_credits)
      totalCredits += Number(usage_data?.recurring_credits);
    return totalCredits.toFixed(2);
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          {hideCredits() && (
            <>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2 text-xl font-medium">
                  <p>{getTotalCredits()}</p>
                </div>
                <p className="text-muted-foreground">Credits remaining </p>
              </div>
              <Separator
                orientation="vertical"
                className="h-5 bg-muted-foreground"
              />
            </>
          )}
          <div className="flex items-end gap-2">
            <p className="text-xl font-medium">
              {format(nextBillingDate, "dd MMM yyyy")}
            </p>
            <p className="text-muted-foreground">Next Billing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant={"outline"}>
            <Calculator className="mr-2 size-4" />
            <p>Credit Usage Calculation</p>
          </Button> */}
          <Link to="/credit-report">
            <Button variant={"outline"}>
              <Calculator className="mr-2 size-4" />
              <p>Credit Report</p>
            </Button>
          </Link>
          <Button
            variant={"default"}
            onClick={() => navigate("/upgrade-plan?section=topup")}
          >
            <CircleDollarSign className="mr-2 size-4" />
            <p>Top Up</p>
          </Button>
        </div>
      </div>
      {/* <div className="grid grid-cols-4 gap-4">
        <Card className={cn("p-4", isFetchingUsage && "shimmer bg-secondary")}>
          <p className="mb-1 text-sm text-muted-foreground">Credits Consumed</p>
          <p className="text-sm font-semibold">
            {currentBillingCreditData
              ?.reduce((prev, acc) => Number(prev) + Number(acc.actions), 0)
              .toFixed(2)}
          </p>
        </Card>
        <Card className={cn("p-4", isFetchingUsage && "shimmer bg-secondary")}>
          <CardHeaderWithTooltip
            title="Credits Remaining"
            tooltip="Includes both monthly recurring credits and non-expiring top-up credits."
          />
          <p className="text-sm font-semibold">
            {convertToReadableNumber(
              Number(usage_data?.paid_credits) +
                Number(usage_data?.recurring_credits),
            )}
          </p>
        </Card>
        <Card className={cn("p-4", isFetchingUsage && "shimmer bg-secondary")}>
          <CardHeaderWithTooltip
            title="Top-up Credits Remaining"
            tooltip="Includes only top-up credits, which do not expire."
          />
          <p className="text-sm font-semibold">{usage_data?.paid_credits}</p>
        </Card>
        <Card className={cn("p-4", isFetchingUsage && "shimmer bg-secondary")}>
          <CardHeaderWithTooltip
            title="Credit Gets Refreshed On"
            tooltip="Your monthly credits will refresh on this date, no matter how many are left. Top-up credits won't expire."
          />

          <p className="text-sm font-semibold">
            {new Intl.DateTimeFormat("default", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(
              getNextBillingDate(
                new Date(usage_data?.created_at ?? new Date()),
                // @ts-ignore
                usage_data?.cycle_at ?? "monthly",
              ),
            )}
          </p>
        </Card>
      </div> */}
    </div>
  );
};

export default BillingCycle;

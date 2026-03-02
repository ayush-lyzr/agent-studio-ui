import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useOrganization } from "@/pages/organization/org.service";
import { CREDITS_DIVISOR, PlanType } from "@/lib/constants";
import useStore from "@/lib/store";
import { Path } from "@/lib/types";
// import { useSubOrganizationService } from "@/services/subOrganizationService";

export const useCredits = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    current_organization,
    credit_alert_level,
    setCreditAlertLevel,
    usage_data,
    setUsageData,
    // sub_orgs_usage_data,
    // setSubOrgsUsageData,
  } = useManageAdminStore((state) => state);

  const token = useStore((state) => state.app_token);

  const { getUsage } = useOrganization({ current_organization, token });
  // const { getSubOrgUsages } = useSubOrganizationService({ token });

  const handleToast = (totalCredits: number, used_percent: number) => {
    const isOnFreeTier = [PlanType.Community].includes(
      usage_data?.plan_name as PlanType,
    );
    const isOnPaidTier = !isOnFreeTier;

    switch (true) {
      case isOnFreeTier && used_percent === 0 && credit_alert_level === 1:
        setCreditAlertLevel(2);
        toast({
          title: "You’ve run out of free credits",
          description:
            "Upgrade to a plan or top up credits to continue using your agents without interruption.",
          action: (
            <Button size="sm" onClick={() => navigate(Path.UPGRADE_PLAN)}>
              Explore Plans
            </Button>
          ),
          duration: 5 * 1000,
        });
        break;
      case isOnFreeTier &&
        used_percent <= 100 &&
        used_percent >= 50 &&
        credit_alert_level === null:
        setCreditAlertLevel(1);
        toast({
          title: "Running low on credits",
          description: `You have only ${totalCredits} credits left. Upgrade or top up to avoid disruption.`,
          action: (
            <Button
              size="sm"
              onClick={() => navigate(`${Path.UPGRADE_PLAN}?section=topup`)}
            >
              Top Up
            </Button>
          ),
          duration: 5 * 1000,
        });
        break;
      case isOnPaidTier && used_percent === 100 && credit_alert_level === 3:
        setCreditAlertLevel(4);
        toast({
          title: "Credits exhausted",
          description: "Top up to continue using your agents without delay.",
          action: (
            <Button
              size="sm"
              onClick={() => navigate(`${Path.UPGRADE_PLAN}?section=topup`)}
            >
              Top Up
            </Button>
          ),
          duration: 5 * 1000,
        });
        break;
      case isOnPaidTier &&
        used_percent <= 100 &&
        used_percent >= 50 &&
        credit_alert_level === null:
        setCreditAlertLevel(3);
        toast({
          title: "Low credits warning",
          description: `Only ${totalCredits} credits left. Consider topping up to ensure continued usage.`,
          action: (
            <Button
              size="sm"
              onClick={() => navigate(`${Path.UPGRADE_PLAN}?section=topup`)}
            >
              Top Up
            </Button>
          ),
          duration: 5 * 1000,
        });
        break;
      default:
        break;
    }
  };

  const handleCredits = () => {
    getUsage().then((res) => {
      setUsageData(res.data);
      const usage_data = res.data;

      const totalCredits =
        (Number(usage_data?.paid_credits ?? 0) / CREDITS_DIVISOR) +
        (Number(usage_data?.used_credits ?? 0) / CREDITS_DIVISOR) +
        (Number(usage_data?.recurring_credits ?? 0) / CREDITS_DIVISOR);

      const creditsLeft =
        (Number(usage_data?.paid_credits ?? 0) / CREDITS_DIVISOR) +
        (Number(usage_data?.recurring_credits ?? 0) / CREDITS_DIVISOR) -
        (Number(usage_data?.used_credits ?? 0) / CREDITS_DIVISOR);

      const used_percent =
        (((usage_data?.used_credits ?? 0) / CREDITS_DIVISOR) / totalCredits) * 100;

      handleToast(creditsLeft, used_percent);
    });

    // getSubOrgUsages().then((res) => {
    //   if (res.data) setSubOrgsUsageData(res.data);

    //   const currentSubOrg = sub_orgs_usage_data?.sub_organizations?.find(
    //     (org) => org.organization_id === current_organization?.org_id,
    //   );
    //   const totalCredits = Number(
    //     (currentSubOrg?.total_available ?? 0).toFixed(2),
    //   );
    //   handleToast(totalCredits, currentSubOrg?.percentage_used ?? 0);
    // });
  };

  return { handleCredits };
};

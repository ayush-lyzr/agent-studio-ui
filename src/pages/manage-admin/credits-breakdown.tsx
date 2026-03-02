import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useManageAdminStore } from "./manage-admin.store";
import { convertToReadableNumber, getNextBillingDate } from "@/lib/utils";
import { CREDITS_DIVISOR } from "@/lib/constants";

type CreditsBreakdownProps = {
  open: boolean;
  onOpen: (open: boolean) => void;
};

export const CreditsBreakdown: React.FC<CreditsBreakdownProps> = ({
  open,
  onOpen,
}) => {
  const { usage_data, current_organization, sub_orgs_usage_data } =
    useManageAdminStore((state) => state);

  const totalCredits =
    (Number((usage_data?.paid_credits ?? 0).toFixed(2)) +
      Number((usage_data?.used_credits ?? 0).toFixed(2)) +
      Number((usage_data?.recurring_credits ?? 0).toFixed(2))) /
    100;
  const creditsLeft = totalCredits - Number((usage_data?.used_credits ?? 0).toFixed(2)) / 100;
  const totalSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce((prev, curr) => prev + (curr?.allocated_credits ?? 0) / CREDITS_DIVISOR, 0);
  const usedSubOrgCredits = (
    sub_orgs_usage_data?.sub_organizations ?? []
  )?.reduce((prev, curr) => prev + (curr?.used ?? 0) / CREDITS_DIVISOR, 0);
  const subOrgCreditsLeft = totalSubOrgCredits - usedSubOrgCredits;

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credits Breakdown</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {!!current_organization.sub_organizations?.length &&
            current_organization?.vpas_enabled && (
              <>
                <p className="text-xs text-muted-foreground">Main Account</p>

                <div className="flex justify-between">
                  <p className="text-muted-foreground">Total Credits</p>
                  <p className="font-medium">
                    {convertToReadableNumber(totalCredits - totalSubOrgCredits)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Used Credits</p>
                  <p className="font-medium">
                    {convertToReadableNumber(
                      Number((usage_data?.used_credits ?? 0).toFixed(2)) / CREDITS_DIVISOR - usedSubOrgCredits,
                    )}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Credits Left</p>
                  <p className="font-medium">
                    {convertToReadableNumber(creditsLeft - subOrgCreditsLeft)}
                  </p>
                </div>
              </>
            )}

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
        </div>
      </DialogContent>
    </Dialog>
  );
};

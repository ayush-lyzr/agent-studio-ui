import { motion } from "framer-motion";
import { useAuth, useMemberstack } from "@memberstack/react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { ArrowUpRightFromSquareIcon, ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/custom/button";
import {
  isMixpanelActive,
  planBadgeColor,
  TOP_UP_PRICEID,
} from "@/lib/constants";
import { useEffect, useState } from "react";
import { useOrganization } from "./org.service";
import { IUsage } from "@/lib/types";
import { CreditReportDialog } from "./CreditReportDialog";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Organization page visited");
export default function Organization() {
  const { launchStripeCustomerPortal, purchasePlansWithCheckout } =
    useMemberstack();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const token = getToken();
  const [stats, setStats] = useState<Partial<IUsage>>({});
  const { current_organization } = useManageAdminStore((state) => state);
  const { getUsage } = useOrganization({ token, current_organization });

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await getUsage();
      setStats(res.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const onTopup = async () => {
    try {
      setLoading(true);
      toast.promise(
        purchasePlansWithCheckout({
          priceId: TOP_UP_PRICEID,
          cancelUrl: window.location.origin + "/organization",
          successUrl: window.location.origin,
        }),
        {
          loading: "Redirecting you to stripe...",
          success: () => {
            setLoading(false);
            return `Successfully redirected to topup plan`;
          },
          error: (error) => `Error topping up : ${error?.message}`,
          finally: () => {
            setLoading(false);
          },
          duration: 5 * 1000,
        },
      );
    } catch (error: any) {
      console.log("Error topping up => ", error);
      toast.error(error?.message);
    }
  };

  const onBillingPortal = async () => {
    try {
      toast.promise(
        launchStripeCustomerPortal({
          autoRedirect: true,
          returnUrl: window.location.origin,
          configuration: {
            invoice_history: {
              enabled: true,
            },
          },
        }),
        {
          loading: "Redirecting you to stripe...",
          success: () => {
            setLoading(false);
            return `Successfully redirected to billing plans`;
          },
          error: (error) => `Error topping up : ${error?.message}`,
          finally: () => {
            setLoading(false);
          },
          duration: 5 * 1000,
        },
      );
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full overflow-y-auto p-6"
    >
      <p className="text-lg font-semibold">Organization</p>
      <p className="text-muted-foreground">
        You can view your organization information here.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-10">
        <div className="col-span-1 flex flex-col justify-end rounded-3xl bg-neutral-200 dark:bg-neutral-600">
          <div className="px-6 py-3">
            <p className="font-semibold">Credits</p>
            <p className="text-sm text-secondary-foreground">
              Add or check your available agent action credits here. (1 agent
              action = 1 credit)
            </p>
          </div>
          <div className="grid h-[90%] w-full grid-cols-2 place-content-stretch gap-4 rounded-3xl border bg-white p-6 shadow-xl dark:bg-secondary">
            <span
              className={cn(
                "col-span-1 place-self-start",
                loading && "shimmer",
              )}
            >
              <p className="text-muted-foreground">Available balance</p>

              <p className="text-sm font-semibold">
                {Number(stats?.paid_credits ?? 0) +
                  Number(stats?.recurring_credits ?? 0)}{" "}
                credits
              </p>
            </span>
            <span
              className={cn(
                "bg- h-fit w-fit cursor-default place-self-end rounded-full px-2 py-1 text-sm font-semibold",
                loading && "shimmer",
                planBadgeColor(stats?.plan_name),
              )}
            >
              {stats?.plan_name ?? ""} plan
            </span>
            <span className={cn("col-span-1", loading && "shimmer")}>
              <p className="text-muted-foreground">Usage</p>

              <p className="text-sm font-semibold">
                {stats?.used_credits ?? 0} credits
              </p>
            </span>
            <div className="col-span-1 flex gap-2 place-self-end">
              <CreditReportDialog open={false} onOpen={() => {}}>
                <Button variant="outline">
                  Credit Report
                  <ArrowUpRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </CreditReportDialog>
              <Button
                onClick={onTopup}
                loading={loading}
                className="inline-flex w-fit items-center"
              >
                Top up
              </Button>
            </div>
          </div>
        </div>

        <div className="relative col-span-1 h-56 rounded-3xl bg-white/50">
          <img
            src="/bg-upgrade-banner.png"
            className="absolute z-0 h-full w-full rounded-3xl object-cover mix-blend-overlay"
          />
          <div className="relative flex h-full flex-col items-center justify-center gap-2">
            <p className="text-center text-xl font-bold text-black">
              Choose the perfect plan to <br />
              to super charge your AI-driven projects.
            </p>
            <Link
              to="/upgrade-plan"
              className={cn(buttonVariants({ size: "lg" }), "w-fit")}
            >
              Upgrade plan
            </Link>
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-end rounded-3xl bg-neutral-200 dark:bg-neutral-600">
          <div className="px-6 py-3">
            <p className="font-semibold">Manage Organization</p>
            <p className="text-sm text-secondary-foreground">
              Update your organization's details and team with ease
            </p>
          </div>
          <div className="grid h-[90%] w-full grid-cols-2 place-content-stretch gap-4 rounded-3xl border bg-white p-6 shadow-xl dark:bg-secondary"></div>
        </div>

        <div className="z-10 col-span-2 rounded-3xl bg-neutral-200 dark:bg-neutral-600">
          <div className="px-6 py-3">
            <p className="font-semibold">Billing history</p>
            <p className="text-sm text-secondary-foreground">Manage billing</p>
          </div>
          <div className="z-20 h-[90%] w-full rounded-3xl border bg-white p-6 shadow-xl dark:bg-secondary">
            <div className="grid place-items-center space-y-4">
              <img src="/no-invoices.svg" width={150} />
              <p className="text-center text-sm font-semibold">
                No invoices found
              </p>
              <p>
                To view brief history, please check the{" "}
                <Button
                  variant="link"
                  onClick={onBillingPortal}
                  className="inline-flex items-baseline px-0 underline underline-offset-4 hover:text-primary/60 focus:outline-none"
                >
                  stripe portal
                  <ArrowUpRightFromSquareIcon className="ml-1 size-3" />
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import Overview from "./overview";
import Team from "./team";
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs";
import { useManageAdminStore } from "./manage-admin.store";
import { Path, UserRole } from "@/lib/types";
import { useOrganization } from "../organization/org.service";
import { hasPermission, isOrgMode } from "@/lib/utils";
import { SubOrganizations } from "./sub-orgs";
import useStore from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Manage() {
  const token = useStore((state) => state.app_token);
  const [params, _] = useSearchParams();
  const current_tab = params.get("current_tab");
  const { current_organization, current_user: currentUser } =
    useManageAdminStore((state) => state);
  const { usage, getUsage } = useOrganization({
    token: token!,
    current_organization,
  });

  const tabs = [
    {
      id: 0,
      label: "Overview",
      content: <Overview />,
    },
  ];

  if (
    [UserRole.owner, UserRole.admin, 'role_owner'].includes(
      current_organization?.role as UserRole,
    ) &&
    isOrgMode(usage?.plan_name)
  ) {
    tabs.push({
      id: 1,
      label: "Team",
      content: <Team currentUser={currentUser} />,
    });
  }

  if (
    isOrgMode(usage?.plan_name) &&
    !current_organization?.parent_organization_id &&
    [UserRole.owner].includes(current_organization?.role as UserRole) &&
    current_organization?.vpas_enabled
  ) {
    tabs.push({
      id: 2,
      label: "Sub-Accounts",
      content: <SubOrganizations />,
    });
  }

  const role = current_organization?.role;

  useEffect(() => {
    getUsage();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full flex-col items-center p-6"
    >
      <div className="w-4/5 space-y-6">
        <h1 className="text-2xl font-semibold capitalize">{role}</h1>
        <DirectionAwareTabs
          className="glassmorphism w-fit bg-neutral-200"
          tabClassName="text-primary dark:text-black hover:text-primary/60 font-medium p-2"
          activeTabClassName="bg-primary/20"
          tabs={tabs}
          defaultTab={current_tab ? Number(current_tab) : 0}
          rounded="rounded-md"
          rightContent={
            hasPermission("audit_logs:read", current_organization) ? (
              <Link to={Path.AUDIT_LOGS}>
                <Button variant="outline" className="gap-2">
                  <ClipboardList className="size-4" />
                  Audit Logs
                </Button>
              </Link>
            ) : undefined
          }
        />
      </div>
    </motion.div>
  );
}

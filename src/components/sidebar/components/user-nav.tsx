import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { useOrganization } from "@/pages/organization/org.service";
import { CurrentUserProps } from "@/lib/types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { CreditReportDialog } from "@/pages/organization/CreditReportDialog";
import { OrganizationSwitcher } from "./organization-switcher";

export function UserNav({
  currentUser,
}: Partial<CurrentUserProps>) {
  const { getToken } = useAuth();
  const token = getToken();
  const [creditReportVisible, setCreditReportVisible] =
    useState<boolean>(false);

  const { current_organization, setOrganizationData } =
    useManageAdminStore((state) => state);
  const { getAllOrganizations } = useOrganization({
    token : token!,
    current_organization,
  });

  const fetchUsage = async () => {
    try {
      const orgRes = await getAllOrganizations();
      setOrganizationData(orgRes?.data);

      // if (!orgRes.data?.onboarded) {
      //   navigate("/onboarding");
      // }
    } catch (error) {}
  };

  useEffect(() => {
    if (current_organization?.org_id) fetchUsage();
  }, [token, current_organization?.org_id]);

  return (
    <>
      {/* Single Consolidated Menu */}
      <OrganizationSwitcher 
        currentUser={currentUser}
        className="w-full"
      />
      
      <CreditReportDialog
        open={creditReportVisible}
        onOpen={setCreditReportVisible}
      />
    </>
  );
}

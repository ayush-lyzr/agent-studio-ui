import { PlanType } from "@/lib/constants";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

export const useAuthorization = () => {
  const usage_data = useManageAdminStore((state) => state.usage_data);

  const isFreeStarterPro = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  return {
    isFreeStarterPro,
  };
};

import { useMemo } from "react";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import {
  PlanType,
  PlanCommunity,
  PlanStarter,
  PlanPro,
  PlanCustom,
} from "@/lib/constants";

export interface PlanLimits {
  [PlanType.Community]: number;
  [PlanType.Starter]: number;
  [PlanType.Pro]: number;
  [PlanType.Pro_Yearly]: number;
  [PlanType.Teams]: number;
  [PlanType.Organization]: number;
  [PlanType.Enterprise]: number;
  [PlanType.Teams_Yearly]: number;
  [PlanType.Organization_Yearly]: number;
  [PlanType.Enterprise_Yearly]: number;
  [PlanType.Custom]: number;
}

export interface UsePlanLimitsReturn {
  isLimitReached: boolean;
  remainingSlots: number;
}

type ResourceKey = keyof typeof PlanCommunity &
  keyof typeof PlanStarter &
  keyof typeof PlanPro &
  keyof typeof PlanCustom;

function getDefaultLimits(resourceType: ResourceKey): PlanLimits {
  return {
    [PlanType.Community]: PlanCommunity[resourceType],
    [PlanType.Starter]: PlanStarter[resourceType],
    [PlanType.Pro]: PlanPro[resourceType],
    [PlanType.Pro_Yearly]: PlanPro[resourceType],
    [PlanType.Teams]: PlanCustom[resourceType],
    [PlanType.Organization]: PlanCustom[resourceType],
    [PlanType.Enterprise]: PlanCustom[resourceType],
    [PlanType.Teams_Yearly]: PlanCustom[resourceType],
    [PlanType.Organization_Yearly]: PlanCustom[resourceType],
    [PlanType.Enterprise_Yearly]: PlanCustom[resourceType],
    [PlanType.Custom]: PlanCustom[resourceType],
  };
}

export function usePlanLimits(
  currentUsage: number,
  resourceType: ResourceKey,
): UsePlanLimitsReturn {
  const usage_data = useManageAdminStore((state) => state.usage_data);

  const currentPlan = usage_data?.plan_name as PlanType;

  const planLimit = useMemo(() => {
    const defaultLimits = getDefaultLimits(resourceType);

    return defaultLimits[currentPlan] ?? PlanCustom[resourceType];
  }, [currentPlan, resourceType]);

  const isLimitReached = useMemo(() => {
    return currentUsage >= planLimit;
  }, [currentUsage, planLimit]);

  const remainingSlots = useMemo(() => {
    return Math.max(0, planLimit - currentUsage);
  }, [planLimit, currentUsage]);

  return { isLimitReached, remainingSlots };
}

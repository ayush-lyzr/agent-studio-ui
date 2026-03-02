import { create } from "zustand";

import {
  IOrganization,
  IOrganizationRoot,
  IPolicy,
  IUsage,
  MemberstackCurrentUser,
} from "@/lib/types";
import { SubOrgUsageResponse } from "@/services/subOrganizationService";

type CurrentOrganization = IOrganization & IPolicy & { isSubAccont: boolean };

interface IManageAdminStore {
  current_user: Partial<MemberstackCurrentUser>;
  current_organization: Partial<CurrentOrganization>;
  org_data: Partial<IOrganizationRoot>;
  usage_data: Partial<IUsage>;
  credit_alert_level: number | null;
  sub_orgs_usage_data: Partial<SubOrgUsageResponse>;
  task_queue: { [schemaId: string]: string };
  setCurrentUser: (user: Partial<MemberstackCurrentUser>) => void;
  setCreditAlertLevel: (credit_alert_level: number | null) => void;
  addToTaskQueue: (schema: string, taskId: string) => void;
  removeFromTaskQueue: (schema: string) => void;
  setCurrentOrganization: (user: Partial<CurrentOrganization>) => void;
  setOrganizationData: (data: Partial<IOrganizationRoot>) => void;
  setUsageData: (usage_data: Partial<IUsage>) => void;
  setSubOrgsUsageData: (usage_data: Partial<SubOrgUsageResponse>) => void;
  resetStore: () => void;
}

export const useManageAdminStore = create<IManageAdminStore>()((set) => ({
  current_user: {},
  current_organization: {},
  org_data: {},
  usage_data: {},
  sub_orgs_usage_data: {},
  task_queue: {},
  credit_alert_level: null,
  setCurrentUser: (current_user: Partial<MemberstackCurrentUser>) =>
    set({ current_user }),
  setCreditAlertLevel: (credit_alert_level) => set({ credit_alert_level }),
  setCurrentOrganization: (
    current_organization: Partial<CurrentOrganization>,
  ) => set({ current_organization }),
  setOrganizationData: (org_data: Partial<IOrganizationRoot>) =>
    set({ org_data }),
  setUsageData: (usage_data: Partial<IUsage>) => set({ usage_data }),
  setSubOrgsUsageData: (
    sub_orgs_usage_data: Partial<SubOrgUsageResponse>,
  ) => set({ sub_orgs_usage_data }),
  addToTaskQueue: (schema: string, taskId: string) =>
    set((prevState) => ({
      task_queue: { ...prevState.task_queue, [schema]: taskId },
    })),
  removeFromTaskQueue: (schema: string) =>
    set((prevState) => {
      const newState = {
        task_queue: { ...prevState.task_queue, [schema]: "" },
      };
      delete newState.task_queue?.[schema];
      return newState;
    }),
  resetStore: () =>
    set({
      current_user: {},
      current_organization: {},
      org_data: {},
      usage_data: {},
      sub_orgs_usage_data: {},
      task_queue: {},
      credit_alert_level: null,
    }),
}));

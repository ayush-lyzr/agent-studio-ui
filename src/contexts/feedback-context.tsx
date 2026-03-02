import React, { createContext, useContext, useEffect, useState } from "react";
import Userback from "@userback/widget";
import type { UserbackWidget } from "@userback/widget";

import { env } from "@/lib/env";
import { BRAND } from "@/lib/branding";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

const UserbackContext = createContext<UserbackWidget | null>(null);

interface UserbackProviderProps {
  children: React.ReactNode;
}

// Get token from `../../.env`
const token = env.VITE_USERBACK_SECRET;

export const UserbackProvider: React.FC<UserbackProviderProps> = ({
  children,
}) => {
  const [userback, setUserback] = useState<UserbackWidget | null>(null);

  const currentUser = useManageAdminStore((state) => state.current_user);

  useEffect(() => {
    const init = async () => {
      const name = `${currentUser?.customFields?.["first-name"]} ${currentUser?.customFields?.["last-name"]}`;
      const email = currentUser?.auth?.email;
      const displayName = currentUser?.customFields?.["first-name"]
        ? name
        : email;
      const instance: UserbackWidget = await Userback(token, {
        email,
        name: displayName,
        widget_settings: {
          logo: BRAND.logoUrl,
          help_link:
            "mailto:support@avanade.com?subject=Support%20Request%20%E2%80%93%20%5BAdd%20Short%20Summary%5D&body=Hi%20Avanade%20Team%2C%0D%0A%0D%0AI%E2%80%99m%20facing%20the%20following%20issue%3A%0D%0A%5BPlease%20describe%20your%20issue%20here%5D",
          form_settings: {},
        },
      });
      setUserback(instance);
    };

    if (currentUser?.id) init();
  }, [currentUser?.id]);

  return (
    <UserbackContext.Provider value={userback}>
      {children}
    </UserbackContext.Provider>
  );
};

export const useUserback = () => useContext(UserbackContext);

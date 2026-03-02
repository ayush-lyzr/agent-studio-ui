import React, { ReactNode, useCallback, useEffect } from "react";
import mixpanel from "mixpanel-browser";
import {
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { MemberstackProtected } from "@memberstack/react";

import { AppSidebar } from "./sidebar";
import useStore from "@/lib/store";
import axios from "@/lib/axios";
import { getKeys } from "@/lib/utils";
import {
  IOrganization,
  IOrganizationRoot,
  IPolicy,
  Path,
  UserRole,
} from "@/lib/types";
import Loader from "./loader";
import { IS_ENTERPRISE_DEPLOYMENT, MIXPANEL_MODE, PlanType } from "@/lib/constants";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { useOrganization } from "@/pages/organization/org.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useToast } from "./ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/contexts/AuthContext";

const PrivateRoute: React.FC<{
  children: ReactNode;
  current_organization: Partial<IOrganization & IPolicy>;
  org_data: Partial<IOrganizationRoot>;
}> = ({ children, current_organization, org_data }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const usage_data = useManageAdminStore((state) => state.usage_data);

  useEffect(() => {
    const isPlanBlocked = [
      PlanType.Community,
      PlanType.Starter,
      PlanType.Pro,
      PlanType.Pro_Yearly,
    ].includes(usage_data?.plan_name as PlanType);

    if (
      current_organization?.role === UserRole.member &&
      [Path.MANAGE, Path.MODELS].includes(location.pathname as Path)
    ) {
      navigate("/401");
    }
    if (
      current_organization?.role === UserRole.owner &&
      org_data?.owner_of === current_organization?.org_id &&
      usage_data?.plan_name === PlanType.Community &&
      location.pathname.includes(Path.MANAGE)
    ) {
      navigate("/401");
    }

    if (
      isPlanBlocked &&
      (location.pathname.includes(Path.RESPONSIBLE_AI) ||
        location.pathname.includes(Path.AGENT_EVAL))
    ) {
      navigate(Path.HOME, {
        replace: true,
        state: {
          path: location.pathname,
        },
      });
    }
  }, [
    location.pathname,
    current_organization?.role,
    current_organization?.org_id,
    usage_data?.plan_name,
    org_data?.owner_of,
  ]);

  return children;
};

// const UnAuthorizedCallback: React.FC = () => {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const redirectTo = searchParams.get("redirect");

//   return <Navigate to={`${Path.REGISTER}?redirect=${redirectTo}`} />;
// };
const UnAuthorizedCallback: React.FC = () => {
  return <Navigate to={`${Path.LOGIN}`} />;
};

export default function AppShell() {
  const { getToken } = useAuth()
  // Read token reactively from the store so initApp() waits until auth is ready
  const storeToken = useStore((state: any) => state.app_token);

  // Ensure any fallback token fetch/sync happens in an effect, not during render
  useEffect(() => {
    if (!storeToken) {
      getToken();
    }
  }, [storeToken, getToken]);

  const token = storeToken;
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, _] = useSearchParams();

  // Track if initialization has already happened to prevent multiple API calls
  const { currentUser } = useCurrentUser();
  const setAppToken = useStore((state: any) => state.setAppToken);
  const setApiKey = useStore((state: any) => state.setApiKey);
  const setApiKeys = useStore((state: any) => state.setApiKeys);
  const setUserEmail = useStore((state: any) => state.setUserEmail);

  const { setCurrentOrganization, current_organization, org_data, usage_data } =
    useManageAdminStore((state) => state);

  const { getCurrentOrg, createOrganization } = useOrganization({
    token: token!,
    current_organization,
  });

  const handleOrganization = useCallback(async () => {
    try {
      const res = await getCurrentOrg();
      if (res.isSuccess) {
        setCurrentOrganization({
          org_id: res.data?.current_organization?._id,
          isSubAccont: res.data?.parent_organization_id ?? false,
          ...res.data?.current_organization,
          ...res.data?.policy,
        });
      } else {
        const user = currentUser;
        const displayName =
          Object?.keys(user?.customFields ?? {}).length > 0
            ? user?.customFields?.["first-name"]
            : user?.auth?.email?.split("@")[0];
        const name = `${displayName}'s organization`;
        const newOrgRes = await createOrganization({ name });
        setCurrentOrganization({
          org_id: newOrgRes.data?.organization_id,
          ...newOrgRes.data,
        });
        return newOrgRes;
      }
      return res;
    } catch (error) {
      console.log("Error handling org", error);
    }
  }, [currentUser, getCurrentOrg, createOrganization, setCurrentOrganization]);
  // used to track the events in mixpanel
  useEffect(() => {
    if (
      MIXPANEL_MODE !== "dev" &&
      Boolean(token) &&
      currentUser?.auth?.email &&
      usage_data?.plan_name
    ) {
      const isOrgMode = [
        PlanType.Organization,
        PlanType.Organization_Yearly,
      ].includes(usage_data?.plan_name);
      const isTeamMode = [PlanType.Teams, PlanType.Teams_Yearly].includes(
        usage_data?.plan_name,
      );
      const isEnterpriseMode = [
        PlanType.Enterprise,
        PlanType.Enterprise_Yearly,
      ].includes(usage_data?.plan_name);

      mixpanel.register({
        app: "Avanade Agent Studio",
        user: currentUser,
        mode: isEnterpriseMode
          ? "Enterprise"
          : isOrgMode
            ? "Organization"
            : isTeamMode
              ? "Teams"
              : "Individual",
      });
      mixpanel.identify(currentUser?.auth?.email ?? "global");
      mixpanel.people.set({
        $email: currentUser?.auth?.email ?? "global",
        // @ts-ignore
        $name:
          `${currentUser?.customFields?.["first-name"]} ${currentUser?.customFields?.["last-name"]}` ||
          "global",
        "Last Login": new Date(),
      });
    }
  }, [currentUser?.auth?.email, usage_data?.plan_name]);

  useEffect(() => {
    // Only run verification check after user data is loaded and token exists
    if (!token || !currentUser || Object.keys(currentUser).length === 0) {
      return;
    }

    // Check if user signed up with email/password and is not verified
    // IMPORTANT: This check should redirect away from AppShell routes
    if (
      currentUser.auth?.hasPassword &&
      !currentUser.verified
    ) {
      // Redirect to verification page only if user has password (email/password signup)
      // Use replace to prevent back button issues
      navigate(Path.VERIFY_EMAIL, { replace: true });
      return;
    }

    const initApp = async () => {
      // Clean up legacy localStorage API key - we now use Zustand store exclusively
      localStorage.removeItem("lyzrApiKey");

      const res = await handleOrganization();

      setAppToken(token);
      const api_keys: any = await getKeys({
        token: token!,
        organization_id: res?.data?.current_organization?._id ?? "",
      });
      const apiKey = api_keys[0]?.["api_key"];
      const redirect = params.get("redirect");
      if (
        Boolean(apiKey) &&
        Boolean(redirect) &&
        redirect?.startsWith("http")
      ) {
        toast({
          title: "Redirecting",
          description: "Taking you to the app home page",
        });
        window.location.href = `${redirect}?token=${token}`;
      }

      if (
        Boolean(apiKey) &&
        Boolean(redirect) &&
        !redirect?.startsWith("http")
      ) {
        navigate(redirect ?? Path.HOME);
      }

      setApiKey(apiKey);
      setApiKeys(api_keys);
      setUserEmail(currentUser?.auth?.email ?? "");

      // Send login event to backend (once per session)
      if (apiKey && !sessionStorage.getItem('login_event_sent')) {
        axios.post('/audit-logs/event', {
          event_type: 'login',
          user_email: currentUser?.auth?.email ?? '',
          metadata: { idp: IS_ENTERPRISE_DEPLOYMENT ? 'keycloak' : 'memberstack' },
        }, {
          headers: { 'x-api-key': apiKey },
        }).catch((err) => console.error('Failed to send login event:', err));
        sessionStorage.setItem('login_event_sent', 'true');
      }
    };

    // Only initialize if we have a user and token, and haven't initialized yet
    if (Object.keys(currentUser ?? {}).length > 0 && token) {
      initApp();
    }
  }, [token, currentUser?.auth?.email]); // token is now reactive — re-runs when Memberstack sets it

  // useEffect(() => {
  //     const fetchApiKeys = async () => {
  //         if (!token || !current_organization?.org_id) {
  //             return;
  //         }

  //         try {
  //             const api_keys: any = await getKeys({
  //                 token: token,
  //                 organization_id: current_organization.org_id,
  //             });

  //             const apiKey = api_keys[0]?.["api_key"];

  //             // Only set API key if it's a valid non-empty string
  //             if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
  //                 setApiKey(apiKey);
  //                 setApiKeys(api_keys);
  //             }
  //         } catch (error) {
  //             console.error("Error fetching API keys:", error);
  //         }
  //     };

  //     fetchApiKeys();
  // }, [current_organization?.org_id]);

  return (
    <MemberstackProtected
      fallback={<Loader loadingText="Loading ..." />}
      onUnauthorized={<UnAuthorizedCallback />}
    >
      <PrivateRoute
        current_organization={current_organization}
        org_data={org_data}
      >
        <SidebarProvider>
          {/* Using Path.AGENT matches marketplace route as well. So, this is a workaround */}
          {[Path.ONBOARDING, "/agent/"].some((route) =>
            location.pathname.startsWith(route),
          ) ? (
            <Outlet />
          ) : (
            <div className="relative flex h-svh w-svw justify-between overflow-hidden bg-background">
              <AppSidebar currentUser={currentUser} />
              <SidebarInset>
                <main
                  id="content"
                  className="h-full w-full overflow-x-hidden pt-16 transition-[margin] md:overflow-y-scroll md:pt-0"
                >
                  <Outlet />
                </main>
              </SidebarInset>
            </div>
          )}
        </SidebarProvider>
      </PrivateRoute>
    </MemberstackProtected>
  );
}

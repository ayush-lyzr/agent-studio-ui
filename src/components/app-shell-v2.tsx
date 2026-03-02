import { useEffect } from "react";
import { IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";
import { Path } from "@/lib/types";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useOrganization } from "@/pages/organization/org.service";
import Loader from "./loader";
import { useToast } from "./ui/use-toast";
import { useSearchParams } from "react-router-dom";
import useStore from "@/lib/store";
import { getKeys } from "@/lib/utils";


export default function AppShell() {

    const { authenticated, getToken,loading } = useAuth();
    const token = getToken();
    const { current_user } = useManageAdminStore();

    const navigate = useNavigate();

    const { setCurrentOrganization, current_organization } = useManageAdminStore()
    const { getCurrentOrg, createOrganization, handleOrganizationForEnterprise } = useOrganization({ token: token!, current_organization: current_organization });
    const setApiKey = useStore(store => store.setApiKey);
    const setApiKeys = useStore(store => store.setApiKeys);
    const [params, _] = useSearchParams();
    const { toast } = useToast();


    // Handle navigation in useEffect to prevent infinite re-render
    useEffect(() => {

        if (!loading && !authenticated) {
            navigate(Path.LOGIN);
        }

        const initOrg = async () => {
            await handleOrganization()
            const api_keys: any = await getKeys({
                token: token!,
                organization_id: current_organization?.org_id ?? "",
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

            // Only set API key if it's a valid non-empty string
            if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
                setApiKey(apiKey);
                setApiKeys(api_keys);

            }
        }

        if (token && authenticated) initOrg();

    }, [token, authenticated]);

    // Fetch API keys when current organization changes
    useEffect(() => {
        const fetchApiKeys = async () => {
            if (!token || !current_organization?.org_id) {
                return;
            }

            try {
                const api_keys: any = await getKeys({
                    token: token,
                    organization_id: current_organization.org_id,
                });

                const apiKey = api_keys[0]?.["api_key"];

                // Only set API key if it's a valid non-empty string
                if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
                    setApiKey(apiKey);
                    setApiKeys(api_keys);
                }
            } catch (error) {
                console.error("Error fetching API keys:", error);
            }
        };

        fetchApiKeys();
    }, [current_organization?.org_id]);

    const handleOrganization = async () => {
        try {
            const res = await getCurrentOrg();
            if (res.isSuccess) {
                setCurrentOrganization({
                    org_id: res.data?.current_organization?._id,
                    ...res.data?.current_organization,
                    ...res.data?.policy,
                });
            } else {
                // based on the deployment mode call the respective endpoints 
                if (IS_ENTERPRISE_DEPLOYMENT) {
                    const res = await handleOrganizationForEnterprise({
                        token: token!,
                    })
                    const org = res.data;
                    setCurrentOrganization(
                        {
                            org_id : org._id,
                            ...org
                        }
                    )
                    return org
                } else {
                    const user = current_user;
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
            }
            return res;
        } catch (error) {
            console.log("Error handling org", error);
        }
    };

    if (loading) {
        return <Loader />
    }

    if (authenticated && IS_ENTERPRISE_DEPLOYMENT) {
        return (
            <>
                <SidebarProvider>
                    {/* Using Path.AGENT matches marketplace route as well. So, this is a workaround */}
                    {[Path.ONBOARDING, "/agent/"].some((route) =>
                        location.pathname.startsWith(route),
                    ) ? (
                        <Outlet />
                    ) : (
                        <div className="relative flex h-svh w-svw justify-between overflow-hidden bg-background">
                            <AppSidebar currentUser={current_user} />
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
            </>
        );
    }

    // Fallback for non-enterprise or unauthenticated state
    return null;
}
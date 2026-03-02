import { useState, useEffect } from "react";
import {
  ChevronsUpDown,
  Check,
  // Plus,
  Sun,
  Moon,
  User,
  LogOut,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import mixpanel from "mixpanel-browser";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/pages/organization/org.service";
import { IOrganization, IOrganizationRoot, Path, UserRole } from "@/lib/types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { isMixpanelActive, IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
interface OrganizationSwitcherProps {
  currentUser?: any;
  className?: string;
}

interface GroupedOrganization extends IOrganization {
  sub_organizations_details?: IOrganization[];
}

export function OrganizationSwitcher({
  currentUser,
  className,
}: OrganizationSwitcherProps) {
  const { getToken, logout } = useAuth();
  const navigate = useNavigate();
  const token = getToken();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { setIsSubmenuOpen, open: sidebarOpen, setOpen } = useSidebar();
  const [orgs, setOrgs] = useState<Partial<IOrganizationRoot>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    current_organization,
    setOrganizationData,
    setCurrentOrganization: setCurrentOrgInStore,
    usage_data,
  } = useManageAdminStore((state) => state);

  const { getAllOrganizations, setCurrentOrganization } = useOrganization({
    token: token!,
    current_organization,
  });

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setIsSubmenuOpen(false);
  };

  function subOrganizationGroups(): GroupedOrganization[] {
    // Create a map for quick lookup of organizations by ID
    const organizations = orgs?.organizations ?? [];
    const orgMap = new Map<string, GroupedOrganization>();

    // First pass: Create a map of all organizations
    organizations.forEach((org) => {
      orgMap.set(org._id, { ...org, sub_organizations_details: [] });
    });

    // Second pass: Group sub-organizations under their parents
    const result: GroupedOrganization[] = [];

    organizations.forEach((org) => {
      if (org.parent_organization_id === null) {
        // This is a parent organization
        const parentOrg = orgMap.get(org._id);
        if (parentOrg) {
          result.push(parentOrg);
        }
      } else if (org.parent_organization_id) {
        // This is a sub-organization, add it to its parent
        const parent = orgMap.get(org.parent_organization_id);
        const current = orgMap.get(org._id);

        if (parent && current) {
          if (!parent.sub_organizations_details) {
            parent.sub_organizations_details = [];
          }
          parent.sub_organizations_details.push(current);
        } else if (current) {
          result.push(current);
        }
      }
    });

    return result;
  }

  const fetchOrganizations = async () => {
    try {
      const orgRes = await getAllOrganizations();
      setOrgs(orgRes?.data);
      setOrganizationData(orgRes?.data);

      if (!orgRes.data?.onboarded && !IS_ENTERPRISE_DEPLOYMENT) {
        navigate(Path.ONBOARDING);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const handleOrgSelection =
    (org: IOrganization, isSubOrg: boolean = false) =>
    async () => {
      try {
        closeDropdown();

        await setCurrentOrganization({ organization_id: org._id });

        // Update the store with the new organization data
        setCurrentOrgInStore({
          org_id: org._id,
          ...org,
          role: isSubOrg
            ? UserRole.member
            : org.policy?.role || current_organization?.role,
        });

        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
          mixpanel.track(`Switched organization`, {
            from_organization: current_organization?.name,
            to_organization: org.name,
            is_sub_organization: isSubOrg,
          });
        }

        toast({
          title: "Success",
          description: `Switched to ${org.name}`,
        });

        window.location.href = Path.HOME;
      } catch (error: any) {
        console.error("Error switching org:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to switch organization",
          variant: "destructive",
        });
        // Re-open dropdown if there was an error
        setIsDropdownOpen(true);
        setIsSubmenuOpen(true);
      }
    };

  const getDisplayName = (orgName?: string) => {
    if (!orgName || orgName === "undefined's organization") {
      return "Personal Workspace";
    }
    return orgName;
  };

  const getAvatarFallback = (name?: string) => {
    if (!name || name === "undefined's organization") return "P";
    return name.slice(0, 2).toUpperCase();
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    // Disable sidebar hover behavior when dropdown is open
    setIsSubmenuOpen(open);
    setOpen(open);
  };

  // Auto-close dropdown when sidebar collapses
  useEffect(() => {
    if (!sidebarOpen && isDropdownOpen) {
      setIsDropdownOpen(false);
      setIsSubmenuOpen(false);
      setOpen(false);
    }
  }, [sidebarOpen, isDropdownOpen, setIsSubmenuOpen]);

  const onLogout = () => {
    try {
      logout();
      navigate(Path.LOGIN);
    } catch (error) {
      console.log("Error");
    }
  };

  const redirectTo = (link: string) => () => {
    closeDropdown();
    navigate(link);
  };

  useEffect(() => {
    if (current_organization?.org_id) {
      fetchOrganizations();
    }
  }, [current_organization?.org_id]);

  // Filter out current organization from the list
  const otherOrganizations = subOrganizationGroups();
  // Find current organization's full data
  // const currentOrgFullData = orgs?.organizations?.find(
  //   (org) => org._id === current_organization?.org_id,
  // );

  // const isOwner = current_organization?.role === UserRole.owner;

  return (
    <DropdownMenu
      open={sidebarOpen && isDropdownOpen}
      onOpenChange={sidebarOpen ? handleDropdownOpenChange : () => {}}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto w-full rounded-lg p-0 hover:bg-neutral-200 hover:dark:bg-neutral-600",
            sidebarOpen ? "justify-between" : "justify-center",
            className,
          )}
        >
          <div
            className={cn(
              "flex w-full items-center rounded-lg",
              sidebarOpen ? "px-1" : "px-0",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 items-center gap-2",
                sidebarOpen ? "flex-1 justify-start" : "w-full justify-center",
              )}
            >
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold">
                  {currentUser?.auth?.email
                    ? currentUser.auth.email.charAt(0).toUpperCase()
                    : getAvatarFallback(current_organization?.name)}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <span className="block truncate text-xs font-medium">
                    {getDisplayName(current_organization?.name)}
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {usage_data?.plan_name || "Community"} Plan
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <ChevronsUpDown className="h-4 w-4 justify-self-end opacity-50" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[280px]"
        align="start"
        side="right"
        sideOffset={6}
        alignOffset={-10}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>

        {/* Current Organization */}
        {/* {currentOrgFullData && (
          <DropdownMenuItem className="font-medium" disabled>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md text-xs">
                    {getAvatarFallback(currentOrgFullData.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {getDisplayName(currentOrgFullData.name)}
                </span>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </div>
          </DropdownMenuItem>
        )} */}

        {/* All Other Organizations (Flat List) */}
        {otherOrganizations.length > 0 && (
          <>
            <DropdownMenuSeparator className="dark:bg-neutral-600" />
            <div className="max-h-[20rem] overflow-x-hidden overflow-y-scroll">
              {otherOrganizations.map((org) => {
                const isCurrentOrg = org._id === current_organization.org_id;
                return (
                  <div key={org._id}>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleOrgSelection(org)}
                      disabled={isCurrentOrg}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 rounded-md">
                            <AvatarFallback className="rounded-md bg-neutral-200 text-xs dark:bg-neutral-700">
                              {getAvatarFallback(org.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="truncate text-sm">
                              {getDisplayName(org.name)}
                            </span>
                            {org.domain && (
                              <span className="text-xs text-muted-foreground">
                                {org.domain}
                              </span>
                            )}
                          </div>
                          {isCurrentOrg && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <div className="mx-2 ml-4 w-[95%] border-l-2 border-muted px-2 dark:border-neutral-600">
                      {org.sub_organizations_details?.map((subOrg) => {
                        const isCurrentOrg =
                          subOrg._id === current_organization.org_id;
                        return (
                          <DropdownMenuItem
                            key={subOrg._id}
                            className="cursor-pointer"
                            onClick={handleOrgSelection(subOrg)}
                            disabled={isCurrentOrg}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 rounded-md">
                                  <AvatarFallback className="rounded-md bg-neutral-200 text-xs dark:bg-neutral-700">
                                    {getAvatarFallback(subOrg.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="truncate text-sm">
                                    {getDisplayName(subOrg.name)}
                                  </span>
                                  {subOrg.domain && (
                                    <span className="text-xs text-muted-foreground">
                                      {subOrg.domain}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCurrentOrg && <Check className="h-4 w-4" />}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Add Sub-organization option for owners */}
        {/* {isOwner && currentOrgFullData?.vpas_enabled && (
          <>
            <DropdownMenuSeparator className="dark:bg-neutral-600" />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                closeDropdown();
                navigate(`${Path.MANAGE}#sub-organizations`);
              }}
            >
              <Plus className="mr-2 h-3 w-3" />
              <span className="text-sm">Manage Sub-Organizations</span>
            </DropdownMenuItem>
          </>
        )} */}

        {/* User Menu Items */}
        <DropdownMenuSeparator className="dark:bg-neutral-600" />

        {/* Theme Toggle */}
        <DropdownMenuItem
          className="cursor-pointer focus:bg-transparent"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-sm">Theme</span>
            <div
              className="relative h-6 w-11 cursor-pointer rounded-full bg-secondary"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="absolute left-0.5 top-0.5 z-10 h-5 w-5 p-1" />
              <Moon className="absolute right-0.5 top-0.5 z-10 h-5 w-5 p-1" />
              <div
                className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                  theme === "dark" && "translate-x-5",
                )}
              />
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-neutral-600" />

        {/* Account */}
        <DropdownMenuItem
          className="h-7 cursor-pointer"
          onClick={redirectTo("account")}
        >
          <User className="mr-2 h-4 w-4" />
          Account & API Keys
        </DropdownMenuItem>

        {/* Privacy Policy */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            className="h-7 cursor-pointer"
            to="https://www.avanade.com/en-gb/about/legal/privacy"
            target="_blank"
          >
            <InfoCircledIcon className="mr-2 h-4 w-4" />
            Privacy Policy
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-neutral-600" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

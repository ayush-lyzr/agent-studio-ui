import React, { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  House,
  BotMessageSquare,
  Database,
  BrainCircuit,
  Wrench,
  Unplug,
  Bug,
  ShieldAlert,
  Zap,
  Network,
  Package,
  FileText,
  Mic,
  Telescope,
  GitGraph,
  BugPlay,
  CheckCircle,
  Users,
  Mic2,
  Code,
  Warehouse,
} from "lucide-react";

import { UserNav } from "./components/user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
// import FeaturebaseFeedback from "@/pages/feedback";
import { Path, UserRole } from "@/lib/types";
import {
  isDevEnv,
  PlanType,
  IS_ENTERPRISE_DEPLOYMENT,
  CREDITS_DIVISOR,
} from "@/lib/constants";
import { getCookie, hasPermission, hasAnyPermission } from "@/lib/utils";
import useStore from "@/lib/store";
import { useOrganization } from "@/pages/organization/org.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarFooter } from "@/components/sidebar/components/sidebar-footer";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { AppSidebarItem } from "./components/sidebar-item";
import { useSubOrganizationService } from "@/services/subOrganizationService";

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";

type ISidebarItem = {
  title: string;
  description?: string;
  url?: string;
  icon?: ReactNode;
  beta?: boolean;
  blocked?: boolean;
  new?: boolean;
  type?: string;
  external?: boolean;
  children?: ISidebarItem[];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open, setOpen } = useSidebar(); // Add setOpen here
  const { userId } = useAuth();

  const [menuItems, setMenuItems] = useState<ISidebarItem[]>([]);
  const [upgradeVisbile, setUpgradeVisible] = useState<{
    title: string;
    description: string;
    open: boolean;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const token = useStore((state) => state.app_token);
  const {
    current_organization,
    // current_user: { id: userId = "" },
    org_data,
    setOrganizationData,
    usage_data,
    setUsageData,
    setSubOrgsUsageData,
  } = useManageAdminStore((state) => state);
  const {
    getUsage,
    getAllOrganizations,
    addUserConsent,
    isFetchingUsage,
    isUsageFetched,
    isFetchingOrgs,
  } = useOrganization({ token, current_organization });
  const { getSubOrgUsages, isFetchingSubOrgUsages } = useSubOrganizationService(
    { token },
  );

  const loading = isFetchingOrgs || isFetchingUsage || isFetchingSubOrgUsages;
  const isUserPartOfOrg =
    org_data?.part_of?.includes(current_organization?.org_id ?? "") &&
    current_organization?.role === UserRole.member;
  const isUserOnCommunityplan = usage_data?.plan_name === PlanType.Community;

  // Check if user has access (new RBAC enabled and not a member)
  const hasNewRbacAccess =
    current_organization?.is_new_rbac &&
    current_organization?.role !== "role_member";

  // Divided by 100 for simplify credits
  const totalCredits =
    Number(((usage_data?.paid_credits ?? 0) / CREDITS_DIVISOR).toFixed(2)) +
    Number(((usage_data?.used_credits ?? 0) / CREDITS_DIVISOR).toFixed(2)) +
    Number(((usage_data?.recurring_credits ?? 0) / CREDITS_DIVISOR).toFixed(2));

  const creditsLeft =
    totalCredits - Number((usage_data?.used_credits ?? 0) / CREDITS_DIVISOR);

  useEffect(() => {
    const fetchUsageData = async () => {
      const res = await getUsage();
      setUsageData(res.data);
      return res.data;
    };

    const fetchSubOrgUsageData = async () => {
      const res = await getSubOrgUsages();
      if (res.data) setSubOrgsUsageData(res.data);
      return res.data;
    };

    const fetchOrganizationData = async () => {
      const orgRes = await getAllOrganizations();
      setOrganizationData(orgRes.data);
      return orgRes.data;
    };

    const handleUserConsent = async (usageData: any) => {
      const cookieyesCookie = getCookie("cookieyes-consent");

      if (
        !Boolean(usageData?.consent_id) &&
        userId &&
        cookieyesCookie &&
        Boolean(cookieyesCookie?.consentid)
      ) {
        await addUserConsent({
          user_id: userId,
          consent_id: cookieyesCookie.consentid,
        });
      }
    };

    const generateMenuItems = (isUserMember: boolean) => {
      const isPlanBlocked = [
        PlanType.Community,
        PlanType.Starter,
        PlanType.Pro,
        PlanType.Pro_Yearly,
      ].includes(usage_data?.plan_name as PlanType);

      const items: ISidebarItem[] = [
        {
          title: "",
          url: "#",
          beta: false,
          blocked: false,
          children: [
            // Hide Home for role_member when not using new RBAC
            ...(current_organization?.policy?.is_new_rbac &&
            current_organization?.policy?.role === "role_member"
              ? []
              : [
                  {
                    title: "Home",
                    url: Path.HOME,
                    icon: <House />,
                    beta: false,
                    blocked: false,
                  },
                ]),
            ...(hasAnyPermission(
              ["agents:read", "agents:create"],
              current_organization,
            )
              ? [
                  {
                    title: "Agents",
                    url: Path.AGENT_BUILDER,
                    icon: <BotMessageSquare />,
                    beta: false,
                    blocked: false,
                  },
                ]
              : []),
            ...(hasAnyPermission(
              ["agents:read", "agents:create"],
              current_organization,
            )
              ? [
                  {
                    title: "Voice Agents",
                    url: Path.VOICE_AGENT_BUILDER,
                    icon: <Mic />,
                    beta: false,
                    blocked: false,
                  },
                ]
              : []),
            {
              title: "Architect",
              url: "https://lyzr.architect.new/",
              icon: <Warehouse />,
              beta: false,
              blocked: false,
              external: true,
            },
          ],
        },

        ...(!IS_ENTERPRISE_DEPLOYMENT ||
        (hasNewRbacAccess &&
          hasAnyPermission(
            ["workflows:read", "apps:read", "blueprints:read"],
            current_organization,
          ))
          ? [
              {
                title: "Orchestrate",
                url: "#",
                beta: false,
                blocked: false,
                children: [
                  ...(hasPermission("workflows:read", current_organization)
                    ? [
                        {
                          title: "Managerial",
                          url: Path.ORCHESTRATION,
                          icon: <Network />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasPermission("workflows:read", current_organization)
                    ? [
                        {
                          title: "Workflows",
                          url: Path.WORKFLOW_BUILDER,
                          icon: <Zap />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasPermission("blueprints:read", current_organization)
                    ? [
                        {
                          title: "Blueprints",
                          url: Path.BLUEPRINTS,
                          icon: <Package />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),

        ...(hasAnyPermission(
          ["knowledge_base:read", "knowledge_base:create"],
          current_organization,
        )
          ? [
              {
                title: "Knowledge Source",
                url: "#",
                beta: false,
                blocked: false,
                children: [
                  ...(hasAnyPermission(
                    ["knowledge_base:read", "knowledge_base:create"],
                    current_organization,
                  )
                    ? [
                        {
                          title: "Knowledge Bases",
                          url: Path.KNOWLEDGE_BASE,
                          icon: <Database />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasAnyPermission(
                    ["knowledge_base:read", "knowledge_base:create"],
                    current_organization,
                  )
                    ? [
                        {
                          title: "Knowledge Graph",
                          url: `${Path.KNOWLEDGE_BASE}?tab=graph-rag`,
                          icon: <GitGraph />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasAnyPermission(
                    ["knowledge_base:read", "knowledge_base:create"],
                    current_organization,
                  )
                    ? [
                        {
                          title: "Global Context",
                          url: Path.GLOBAL_CONTEXTS,
                          icon: <FileText />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),

        // Hide Governance for role_member when not using new RBAC
        ...(current_organization?.is_new_rbac &&
        current_organization?.role === "role_member"
          ? []
          : [
              {
                title: "Governance",
                url: "#",
                beta: false,
                blocked: false,
                children: [
                  {
                    title: "Responsible AI",
                    url: Path.RAI,
                    icon: <ShieldAlert />,
                    beta: false,
                    blocked: isPlanBlocked,
                    description:
                      "Add guardrails to make your AI safe, fair, and reliable.",
                  },
                  {
                    title: "Agent Eval",
                    url: Path.AGENT_EVAL,
                    icon: <Bug />,
                    beta: false,
                    blocked: isPlanBlocked,
                    description:
                      "Test your agents with auto-generated test cases to ensure they're production-ready.",
                  },
                  ...(isDevEnv && !IS_ENTERPRISE_DEPLOYMENT
                    ? [
                        {
                          title: "Agent Simulation Engine",
                          url: Path.EVALS,
                          icon: <BugPlay />,
                          beta: false,
                          blocked: isPlanBlocked,
                          description:
                            "Simulate and test agent performance in controlled environments.",
                        },
                        {
                          title: "OGI",
                          url: Path.OGI,
                          icon: <CheckCircle />,
                          beta: true,
                          blocked: false,
                          description:
                            "Ontology Governance Interface for managing AI ontologies.",
                        },
                        {
                          title: "Agent Policies",
                          url: Path.AGENT_POLICIES,
                          icon: <ShieldAlert className="size-5" />,
                          beta: false,
                          blocked: false,
                        },
                        {
                          title: "Groups",
                          url: Path.GROUPS,
                          icon: <Users className="size-5" />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasPermission("views:read", current_organization)
                    ? [
                        {
                          title: "Traces",
                          url: Path.TRACES,
                          icon: <Telescope className="size-5" />,
                          beta: false,
                          blocked: false,
                          description:
                            "Test your agents with auto-generated test cases to ensure they're production-ready.",
                        },
                      ]
                    : []),
                ],
              },
            ]),

        ...(hasAnyPermission(
          ["tools:read", "models:read", "credentials:read"],
          current_organization,
        )
          ? [
              {
                title: "Connect",
                url: "#",
                beta: false,
                blocked: false,
                children: [
                  ...(hasAnyPermission(
                    ["tools:read", "tools:create"],
                    current_organization,
                  )
                    ? [
                        {
                          title: "Tools",
                          url: Path.TOOLS,
                          icon: <Wrench />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(!isUserMember &&
                  hasAnyPermission(
                    ["models:create", "models:*"],
                    current_organization,
                  )
                    ? [
                        {
                          title: "Models",
                          url: Path.MODELS,
                          icon: <BrainCircuit className="size-5" />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(hasPermission("credentials:create", current_organization)
                    ? [
                        {
                          title: "Data Connectors",
                          url: Path.DATA_CONNECTORS,
                          icon: <Unplug className="size-5" />,
                          beta: false,
                          blocked: false,
                        },
                      ]
                    : []),
                  ...(isDevEnv && !IS_ENTERPRISE_DEPLOYMENT
                    ? [
                        {
                          title: "Voice Agent",
                          url: Path.VOICE_BUILDER,
                          icon: <Mic2 className="size-5" />,
                          beta: true,
                          blocked: false,
                        },
                        {
                          title: "Code IDE",
                          url: Path.CODE_IDE,
                          icon: <Code className="size-5" />,
                          beta: true,
                          blocked: false,
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
      ];

      // Filter out empty sections
      return items.filter((item) => !item.children || item.children.length > 0);
    };

    const setMenuItemsBasedOnRole = () => {
      const isUserMember =
        current_organization.role == "member" ||
        current_organization.role == "role_member";

      setMenuItems(generateMenuItems(isUserMember));
    };

    const initializeSidebarData = async () => {
      try {
        const [usageData] = await Promise.all([
          fetchUsageData(),
          fetchOrganizationData(),
        ]);

        if (current_organization?.sub_organizations?.length) {
          fetchSubOrgUsageData();
        }

        await handleUserConsent(usageData);
        setMenuItemsBasedOnRole();
      } catch (error) {
        console.error("Error initializing sidebar data:", error);
      }
    };
    if (current_organization?.org_id) {
      initializeSidebarData();
    }
  }, [current_organization?.org_id, userId, usage_data]);

  const [creditsDropdownOpen, setCreditsDropdownOpen] = useState(false);
  const [footerDropdownOpen, setFooterDropdownOpen] = useState(false);

  const handleCreditsOpenChange = (open: boolean) => {
    setCreditsDropdownOpen(open);
    if (!open) {
      setOpen(false);
    }
  };

  const handleFooterOpenChange = (open: boolean) => {
    setFooterDropdownOpen(open);
    if (!open) {
      setOpen(false);
    }
  };

  return (
    <>
      <div className="hidden md:block md:w-[--sidebar-width-icon] md:shrink-0" />

      <Sidebar
        collapsible="icon"
        variant="floating"
        data-credits-open={creditsDropdownOpen}
        data-footer-open={footerDropdownOpen}
        {...props}
      >
        <SidebarHeader className="px-1">
          <UserNav currentUser={props?.currentUser} />
        </SidebarHeader>
        <SidebarContent className="flex list-none flex-col items-center gap-2">
          {loading && !isUsageFetched
            ? Array.from({ length: 12 }).map((_, index) => (
                <SidebarMenuItem key={index} className="mb-2 w-full px-2">
                  {open ? (
                    <SidebarMenuSkeleton className="w-full" />
                  ) : index % 3 === 0 ? (
                    <Separator />
                  ) : (
                    <Skeleton className="h-8 w-full" />
                  )}
                </SidebarMenuItem>
              ))
            : menuItems?.map((item) => (
                <>
                  {item?.children?.length ? (
                    <SidebarGroup key={item.title} className="gap-0 py-0">
                      <div>
                        {item.title &&
                          (open ? (
                            <SidebarGroupLabel className="h-5 !text-[0.7rem] text-primary/45">
                              {item.title}
                            </SidebarGroupLabel>
                          ) : (
                            <div className="grid h-5 place-items-center px-0.5">
                              <Separator className="bg-neutral-300 dark:bg-neutral-500" />
                            </div>
                          ))}
                      </div>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {item.children?.map((item) => (
                            <AppSidebarItem
                              item={item}
                              open={open}
                              setUpgradeVisible={setUpgradeVisible}
                            />
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ) : (
                    <AppSidebarItem
                      item={item}
                      open={open}
                      className="px-2"
                      setUpgradeVisible={setUpgradeVisible}
                    />
                  )}

                  {/* {["Home", "Data Connectors", "Agent Marketplace"].includes(
                    item.title,
                  ) && <Separator className="my-1" />} */}
                </>
              ))}
        </SidebarContent>
        <SidebarSeparator className="bg-neutral-300 dark:bg-neutral-500" />
        <SidebarFooter
          isUserPartOfOrg={!!isUserPartOfOrg}
          loading={loading}
          isUsageFetched={isUsageFetched}
          creditsDropdownOpen={creditsDropdownOpen}
          footerDropdownOpen={footerDropdownOpen}
          handleCreditsOpenChange={handleCreditsOpenChange}
          handleFooterOpenChange={handleFooterOpenChange}
          creditsLeft={creditsLeft}
          totalCredits={totalCredits}
          usage_data={usage_data}
          isUserOnCommunityplan={isUserOnCommunityplan}
        />
      </Sidebar>
      <NeedsUpgrade
        open={upgradeVisbile.open}
        onOpen={() =>
          setUpgradeVisible((prev) => ({ ...prev, open: !prev.open }))
        }
        title={upgradeVisbile.title}
        description={upgradeVisbile.description}
      />
    </>
  );
}

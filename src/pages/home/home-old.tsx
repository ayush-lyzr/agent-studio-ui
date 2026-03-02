import { useEffect, useState, Suspense } from "react";
import mixpanel from "mixpanel-browser";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CheckSquare, Square } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import useStore from "@/lib/store";
import { StatsCol } from "@/pages/home/Stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isMixpanelActive, MARKETPLACE_URL, PlanType } from "@/lib/constants";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { cn, isOrgMode } from "@/lib/utils";
import { useAgentBuilder } from "../agent-builder/agent-builder.service";
import { useRAGService } from "../knowledge-base/rag.service";
import { useCreateAgentService } from "../create-agent/create-agent.service";
import AppCarousel from "./AppCarousel";
import { Path } from "@/lib/types";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { useMarketplace } from "../apps/marketplace.service";

type Step = {
  id: string;
  title: string;
  successMessage: string;
  isCompleted: boolean;
};

const RESOURCE_LINKS = [
  { text: "API Documentation", url: "https://www.avanade.com/en-gb/services" },
  { text: "Join our Community", url: "https://discord.gg/uaHrgJQxAv" },
  {
    text: "Join us on Github",
    url: "https://github.com/LyzrCore/lyzr-framework",
  },
  { text: "Speak to an Avanade Specialist", url: "https://www.avanade.com/en-gb/contact" },
];

const INTRO_VIDEO = "https://www.youtube.com/embed/btOBqAJWFT8";

const fetchUserApps = async (userId: string | undefined, token: string) => {
  if (!userId) return [];
  const { data } = await axios.get(`/apps/user/${userId}`, {
    baseURL: MARKETPLACE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Home page visited");

type TabType =
  | "community"
  | "organization"
  | "agents"
  | "featured"
  | "user_apps";

const HomePageOld = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("community");
  const [upgradeVisbile, setUpgradeVisible] = useState<{
    title: string;
    description: string;
    open: boolean;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const { usage_data, current_user: currentUser } = useManageAdminStore(
    (state) => state,
  );
  const userId = currentUser?.id ?? "";
  const userName =
    currentUser?.customFields?.["first-name"] ??
    currentUser?.auth?.email.split("@")[0] ??
    "";
  const apiKey = useStore((state: any) => state.api_key);
  const token = useStore((state: any) => state.app_token);

  const { data: userApps = [], isFetching: isAppsLoading } = useQuery({
    queryKey: ["userApps", userId],
    queryFn: () => fetchUserApps(userId, token),
  });
  const { agents, getAgents, isFetchingAgents } = useAgentBuilder({ apiKey });
  const { ragConfigs, getRagConfigs, isFetchingRagConfigs } = useRAGService({
    params: {},
  });
  const { orgApps } = useMarketplace(token);
  const { userTools, getUserTools, isFetchingUserTools } =
    useCreateAgentService({
      apiKey,
    });

  const showOrgApps = isOrgMode(usage_data?.plan_name) && orgApps.length > 0;
  const showUserAgents = orgApps.length === 0 && agents.length > 0;
  console.log({ showOrgApps, orgApps });

  const steps: Step[] = [
    {
      id: "knowledge-base",
      title: "Add documents and data sources to your agent",
      successMessage:
        "Knowledge base integration complete! Your agent is now equipped with custom data.",
      isCompleted: agents.some((agent: any) =>
        agent.features?.some(
          (feature: any) => feature.type === "KNOWLEDGE_BASE",
        ),
      ),
    },
    {
      id: "connect-tools",
      title: "Connect external tools to expand your agent's capabilities",
      successMessage:
        "Tools connected successfully! Your agent can now perform advanced tasks.",
      isCompleted: agents.some((agent: any) => agent.tool?.length > 0),
    },
    {
      id: "enable-srs",
      title: "Enable a Safe/Responsible AI feature in your agent",
      successMessage:
        "Safe AI features enabled! Your agent now operates within ethical boundaries.",
      isCompleted: agents.some((agent: any) =>
        agent.features?.some((feature: any) => feature.type === "SRS"),
      ),
    },
    {
      id: "launch-app",
      title: "Deploy your agent as an Agent in the Agent Marketplace",
      successMessage:
        "Congratulations! Your agent is now live in the Agent Marketplace.",
      isCompleted: userApps.length > 0,
    },
  ];

  const allStepsCompleted = steps.every((step) => step.isCompleted);
  const isLoading =
    isAppsLoading ||
    isFetchingAgents ||
    isFetchingRagConfigs ||
    isFetchingUserTools;

  useEffect(() => {
    setTab(
      showOrgApps
        ? "organization"
        : userApps.length > 0
          ? "user_apps"
          : showUserAgents
            ? "agents"
            : "community",
    );
  }, [showOrgApps, showUserAgents, userApps.length]);

  useEffect(() => {
    const initApp = async () => {
      await Promise.all([getAgents(), getRagConfigs(), getUserTools()]);
    };
    if (apiKey) {
      initApp();
    }
  }, [apiKey]);

  useEffect(() => {
    const isPlanBlocked = [
      PlanType.Community,
      PlanType.Starter,
      PlanType.Pro,
      PlanType.Pro_Yearly,
    ].includes(usage_data?.plan_name as PlanType);

    if (
      isPlanBlocked &&
      !!location.state?.path &&
      location.state?.path?.includes(Path.RESPONSIBLE_AI)
    ) {
      setUpgradeVisible({
        open: true,
        title: "Responsible AI",
        description: "Add guardrails to make your AI safe, fair, and reliable.",
      });
    }

    if (
      isPlanBlocked &&
      !!location.state?.path &&
      location.state?.path?.includes(Path.AGENT_EVAL)
    ) {
      setUpgradeVisible({
        open: true,
        title: "Agent Eval",
        description:
          "Test your agents with auto-generated test cases to ensure they’re production-ready.",
      });
    }

    return () => {
      if (location.state) {
        navigate(location.pathname, { replace: true });
      }
    };
  }, [location.state, usage_data?.plan_name]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-900">
        <div className="mx-auto w-full max-w-screen-2xl px-4 pt-8">
          <Skeleton className="mb-6 h-12 w-64" />
          <div className="mt-12 grid grid-cols-6 gap-4">
            <Skeleton className="col-span-3 h-[250px] w-full" />
            <Skeleton className="col-span-2 h-[250px] w-full" />
            <Skeleton className="col-span-1 h-[250px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const renderResources = () => (
    <Card className="col-span-1 flex flex-col justify-center">
      <CardHeader>
        <h2 className="font-semibold">Resources</h2>
      </CardHeader>
      <CardContent>
        <CardDescription className="space-y-3">
          {RESOURCE_LINKS.map(({ text, url }) => (
            <Link
              key={text}
              to={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-between gap-1 hover:text-primary"
            >
              <p className="w-5/6">{text}</p>
              <ArrowUpRight className="size-4" />
            </Link>
          ))}
        </CardDescription>
      </CardContent>
    </Card>
  );

  const renderVideo = () => (
    <Card className="h-full">
      <CardContent className="flex h-full items-center justify-center p-4">
        <div className="relative flex h-full w-full items-center">
          {isVideoLoading && (
            <Skeleton className="absolute inset-0 aspect-video w-full rounded-lg" />
          )}
          <iframe
            className="aspect-video w-full rounded-lg"
            src={INTRO_VIDEO}
            title="Avanade Agent Studio Tutorial"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsVideoLoading(false)}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );

  console.log({ userApps });

  return (
    <>
      <div className="min-h-screen w-[100%] bg-background transition-all duration-700 ease-in-out">
        <div className="mx-auto w-full px-4 pt-8">
          {!isLoading && (
            <h1 className="mb-6 text-4xl">
              <span className="text-muted-foreground">Welcome,</span> {userName}
            </h1>
          )}

          <div
            className={cn("mt-12 grid w-[calc(100vw-5rem)] grid-cols-6 gap-4")}
          >
            {agents?.length === 0 ? (
              <>
                <Card className="col-span-3">
                  <div className="grid h-full grid-cols-5">
                    <div className="col-span-2 flex items-center justify-center">
                      <img
                        src="/agent-creation.svg"
                        alt="Create Agent"
                        className="my-auto size-[15rem]"
                      />
                    </div>
                    <div className="col-span-3 flex flex-col justify-center">
                      <CardHeader>
                        <h2 className="font-semibold">
                          Create Your Own Custom Agent
                        </h2>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          Build reliable AI agents, enable Safe AI and
                          Responsible AI modules, and access them via Agent API
                          or launch it as an app instantly.
                        </CardDescription>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => navigate("/agent-create")}>
                          Build Agent <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
                <div className="col-span-2 overflow-hidden">
                  {renderVideo()}
                </div>
                {renderResources()}
              </>
            ) : (
              <>
                <div className="col-span-1">
                  <StatsCol
                    agents={agents?.length}
                    knowledgeBases={ragConfigs?.length}
                    tools={
                      (Array.isArray(userTools) ? userTools : []).length ?? 0
                    }
                    isLoading={isLoading}
                  />
                </div>
                <Card className="col-span-2 flex flex-col justify-center">
                  <CardHeader>
                    <h2 className="font-semibold">
                      {allStepsCompleted
                        ? "You are now an Expert Agent Builder! 🎉"
                        : "What's Next?"}
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-3"
                        >
                          <span className="w-4">
                            {step.isCompleted ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </span>
                          <div
                            className={
                              step.isCompleted ? "text-muted-foreground" : ""
                            }
                          >
                            <div className="text-sm">
                              {step.isCompleted
                                ? step.successMessage
                                : step.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="col-span-2 overflow-hidden">
                  {renderVideo()}
                </div>
                {renderResources()}
              </>
            )}
          </div>

          <div className={cn("mt-10 w-[calc(100vw-5rem)]")}>
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as TabType)}
              className="max-w-[calc(100% + 20rem)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <TabsList>
                  {showOrgApps && (
                    <TabsTrigger value="organization">
                      Organization Apps
                    </TabsTrigger>
                  )}
                  {showUserAgents && userApps.length === 0 && (
                    <TabsTrigger value="agents">My Agents</TabsTrigger>
                  )}
                  {!showOrgApps && userApps.length > 0 && (
                    <TabsTrigger value="user_apps">My Apps</TabsTrigger>
                  )}
                  <TabsTrigger value="community">Community Apps</TabsTrigger>
                  <TabsTrigger value="featured">Featured Apps</TabsTrigger>
                </TabsList>
                <Link
                  to={
                    tab === "agents" ? Path.AGENT_BUILDER : "/agent-marketplace"
                  }
                >
                  <Button variant="outline">
                    View More <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {showOrgApps && (
                <TabsContent value="organization">
                  <Suspense
                    fallback={<Skeleton className="h-[200px] w-full" />}
                  >
                    <AppCarousel
                      currentUser={currentUser}
                      userId={userId}
                      token={token}
                      tab="organization"
                    />
                  </Suspense>
                </TabsContent>
              )}
              {!showUserAgents && userApps.length === 0 && (
                <TabsContent value="agents">
                  <Suspense
                    fallback={<Skeleton className="h-[200px] w-full" />}
                  >
                    <AppCarousel
                      currentUser={currentUser}
                      userId={userId}
                      token={token}
                      tab="agents"
                    />
                  </Suspense>
                </TabsContent>
              )}
              {!showOrgApps && userApps.length > 0 && (
                <TabsContent value="user_apps">
                  <Suspense
                    fallback={<Skeleton className="h-[200px] w-full" />}
                  >
                    <AppCarousel
                      currentUser={currentUser}
                      userId={userId}
                      token={token}
                      tab="user_apps"
                      userApps={userApps}
                    />
                  </Suspense>
                </TabsContent>
              )}
              <TabsContent value="community">
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <AppCarousel
                    currentUser={currentUser}
                    userId={userId}
                    token={token}
                    tab="community"
                  />
                </Suspense>
              </TabsContent>
              <TabsContent value="featured">
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <AppCarousel
                    currentUser={currentUser}
                    userId={userId}
                    token={token}
                    tab="featured"
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <NeedsUpgrade
        open={upgradeVisbile.open}
        onOpen={() =>
          setUpgradeVisible((prev) => {
            if (prev.open) {
              return { ...prev, open: !prev.open };
            } else {
              return { ...prev, open: !prev.open, title: "", description: "" };
            }
          })
        }
        title={upgradeVisbile.title}
        description={upgradeVisbile.description}
      />
    </>
  );
};

export default HomePageOld;

import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AppCard } from "../apps/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppData, MemberstackCurrentUser, Path } from "@/lib/types";
import { useMarketplace } from "../apps/marketplace.service";
import { lyzrApps } from "@/data/lyzr-apps";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import useStore from "@/lib/store";
import { useAgentBuilder } from "../agent-builder/agent-builder.service";
import { Agent } from "../create-agent/types";

const AppCarousel: React.FC<{
  currentUser: Partial<MemberstackCurrentUser>;
  userId: string;
  token: string;
  tab: "community" | "organization" | "agents" | "featured" | "user_apps";
  userApps?: any[];
}> = ({ currentUser, userId, token, tab, userApps = [] }) => {
  const navigate = useNavigate();
  const apiKey = useStore((state: any) => state.api_key);
  const { agents } = useAgentBuilder({ apiKey });
  const {
    communityApps,
    getCommunityApps,
    isLoadingCommunityApps,
    orgApps,
    getOrgApps,
    isLoadingOrgApps,
  } = useMarketplace(token);

  const isLoading = isLoadingCommunityApps || isLoadingOrgApps;

  const apps = useMemo(() => {
    if (tab === "community") {
      if (Array.isArray(communityApps)) {
        return Array.from(communityApps);
      }
      return [];
    } else if (tab === "organization") {
      return orgApps || [];
    } else if (tab === "agents") {
      return agents || [];
    } else if (tab === "user_apps") {
      return userApps;
    } else if (tab === "featured") {
      return lyzrApps.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        categories: app.categories,
        creator: "Avanade",
        public: true,
        upvotes: 0,
      }));
    }
    return [];
  }, [tab, communityApps, orgApps]);

  useEffect(() => {
    const loadApps = async () => {
      try {
        if (tab === "organization") await getOrgApps();
        if (tab === "community") await getCommunityApps();
      } catch (error) {
        console.error("Error loading agents:", error);
      }
    };

    loadApps();
  }, [tab]);

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className="mx-4 w-72 flex-shrink-0">
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      ));
  };

  return (
    <div className="flex w-full flex-col items-center bg-background">
      <div className="w-full overflow-hidden">
        {apps?.length === 0 && !isLoading && (
          <div className="flex h-32 w-full justify-center rounded-lg">
            <span className="inline-flex items-center space-x-1">
              No Agents found.{" "}
              <Link
                to={Path.AGENT_CREATE}
                className="px-1 underline underline-offset-4"
              >
                Create an agent
              </Link>{" "}
              to get started.
            </span>
          </div>
        )}
        <div
          className="flex animate-carousel gap-4"
          style={{
            animation:
              isLoading || apps.length < 3
                ? "none"
                : `carousel ${apps.length * 10}s linear infinite`,
            width: isLoading ? "auto" : `${apps.length * 2 * 320}px`,
          }}
        >
          {isLoading
            ? renderSkeletons()
            : (tab === "agents"
                ? agents.length < 3
                  ? agents
                  : [...agents, ...agents, ...agents]
                : apps.length < 3
                  ? apps
                  : [...apps, ...apps, ...apps]
              ).map((app: any, index: number) => {
                const typedApp = app as AppData;
                const typedAgent = app as Agent;
                return tab === "featured" ? (
                  <div
                    key={`${typedApp?.id}-${index}`}
                    className="w-80 flex-shrink-0 pb-1"
                    onClick={() => {
                      const lyzrApp = lyzrApps.find(
                        (a) => a.id === typedApp.id,
                      );
                      navigate(lyzrApp?.navigation_path || "");
                    }}
                  >
                    <Card className="relative cursor-pointer border transition-all hover:border-primary">
                      <CardHeader className="h-40 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted p-2">
                              <img
                                src={`https://api.dicebear.com/9.x/identicon/svg?seed=${typedApp.name}`}
                                alt="avatar"
                              />
                            </div>
                            <CardTitle
                              className="line-clamp-2"
                              title={typedApp.name}
                            >
                              {typedApp.name}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription className="mt-2 line-clamp-3">
                          {typedApp.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 pt-0">
                        <div className="flex h-16 flex-wrap items-start gap-2 overflow-hidden">
                          {(() => {
                            const lyzrApp = lyzrApps.find(
                              (a) => a.id === typedApp.id,
                            );
                            const tags = [
                              lyzrApp?.function_tag,
                              lyzrApp?.category_tag,
                              lyzrApp?.industry_tag,
                            ].filter(Boolean);

                            return (
                              <>
                                {tags.slice(0, 2).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="rounded-full px-2 py-1 text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 2 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge
                                          variant="secondary"
                                          className="rounded-full px-2 py-1 text-xs"
                                        >
                                          +{tags.length - 2}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="flex flex-col gap-1">
                                          {tags.slice(2).map((tag, index) => (
                                            <span key={index}>{tag}</span>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                      <CardFooter className="flex h-12 items-center justify-between pt-0">
                        <p className="text-sm text-muted-foreground">By Lyzr</p>
                        {(() => {
                          const lyzrApp = lyzrApps.find(
                            (a) => a.id === typedApp.id,
                          );
                          return (
                            lyzrApp?.special && (
                              <div className="flex gap-2">
                                {lyzrApp.special.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className={
                                      tag === "Demo"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : tag === "Beta"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                          : tag === "Pro"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : ""
                                    }
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )
                          );
                        })()}
                      </CardFooter>
                    </Card>
                  </div>
                ) : tab === "agents" ? (
                  <div
                    key={`${typedAgent?._id}-${index}`}
                    className="w-80 flex-shrink-0 pb-1"
                    onClick={() =>
                      navigate(`${Path.AGENT_CREATE}/${typedAgent._id}`)
                    }
                  >
                    <Card className="relative cursor-pointer border transition-all hover:border-primary">
                      <CardHeader className="h-36 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted p-2">
                              <img
                                src={`https://api.dicebear.com/9.x/identicon/svg?seed=${typedApp.name}`}
                                alt="avatar"
                              />
                            </div>
                            <CardTitle
                              className="line-clamp-2"
                              title={typedApp.name}
                            >
                              {typedApp.name}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription className="mt-2 line-clamp-3">
                          {typedApp.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 pt-0">
                        <div className="flex h-16 flex-wrap items-start gap-2 overflow-hidden"></div>
                      </CardContent>
                      <CardFooter className="flex h-12 items-center justify-between pt-0">
                        <p className="text-sm text-muted-foreground">By You</p>
                      </CardFooter>
                    </Card>
                  </div>
                ) : (
                  <div
                    key={`${typedApp?.id}-${index}`}
                    className="w-80 flex-shrink-0 pb-1"
                  >
                    <AppCard
                      app={typedApp}
                      editingApp={false}
                      onEdit={() => {}}
                      userId={userId}
                      currentUser={currentUser}
                      token={token}
                    />
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default AppCarousel;

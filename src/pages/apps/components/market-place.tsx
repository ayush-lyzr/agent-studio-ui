import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import axios from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { UtilityBar } from "./utility-bar";
import { AppCard } from "./app-card";
import { useDebounce } from "@/hooks/useDebounce";
import { EmptyPage } from "@/assets/icons";
import { motion } from "framer-motion";
import { CurrentUserProps } from "@/lib/types";
import { MARKETPLACE_URL } from "@/lib/constants";
import { Link, useSearchParams } from "react-router-dom";
import { lyzrApps } from "@/data/lyzr-apps";
import { Edit } from "@/pages/create-agent/components/edit";
import { Button, buttonVariants } from "@/components/ui/button";
import { HubCard } from "@/components/hub-card";
import { cn } from "@/lib/utils";

export interface MarketplaceAppData {
  _id?: string;
  id: string;
  name: string;
  description: string;
  welcome_message?: string;
  organization_id?: string;
  creator: string;
  user_id: string;
  agent_id?: string;
  public: boolean;
  categories: string[];
  created_at: string;
  updated_at: string;
  upvotes: number;
  tags?: {
    industry?: string;
    function?: string;
    category?: string;
  };
}

interface ResponseData {
  data: MarketplaceAppData[];
  total: number;
  skip: number;
  limit: number;
}

const getHubAppCount = (hub: string) => {
  return lyzrApps.filter((app) => app.hub === hub).length;
};

const filterHub = (hubName: string, searchTerm: string) => {
  if (hubName === "marketing" && searchTerm) {
    return false;
  }

  const hubApps = lyzrApps.filter((app) => app.hub === hubName);
  return hubApps.some(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );
};

export default function Apps({
  currentUser,
  userId,
  token,
}: Partial<CurrentUserProps> & { token: string }) {
  const queryClient = useQueryClient();
  const [appType, setAppType] = useState<"all" | "connected" | "notConnected">(
    "all",
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce<string>(searchTerm, 800);
  const pageSize = 12;

  const [editingApp, setEditingApp] = useState<MarketplaceAppData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    searchParams.get("industry") || "",
  );
  const [selectedFunction, setSelectedFunction] = useState<string>(
    searchParams.get("function") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "",
  );

  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get("type") || "Community Agents",
  );
  const [isVideoLoading, setIsVideoLoading] = useState(true);


  const { data: userApps = [], refetch: getUserApps } = useQuery({
    queryKey: ["userApps", userId],
    queryFn: async () => {
      const { data } = await axios.get(`/apps/user/${userId}`, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data || data;
    },
  });

  const {
    refetch: getApps,
    data: appsRes,
    hasNextPage,
    isFetching,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "fetchApps",
      userId,
      pageSize,
      debouncedSearch,
      selectedIndustry,
      selectedFunction,
      selectedCategory,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const filterParams = new URLSearchParams({
        skip: (pageParam * pageSize).toString(),
        limit: pageSize.toString(),
        search: debouncedSearch,
        ...(selectedIndustry && { industry_tag: selectedIndustry }),
        ...(selectedFunction && { function_tag: selectedFunction }),
        ...(selectedCategory && { category_tag: selectedCategory }),
      }).toString();

      const res = await axios.get<ResponseData>(
        `/apps/user/${userId}/with-public?${filterParams}`,
        {
          baseURL: MARKETPLACE_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data;
    },
    getNextPageParam: (lastPage, pages) => {
      const filteredApps = pages
        ?.flatMap((res) => res.data)
        ?.filter((app) =>
          appType === "connected"
            ? app.public
            : appType === "notConnected"
              ? !app.public
              : true,
        )
        ?.filter((app) =>
          app.name?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      if (filteredApps?.length === 0) return null;
      if (lastPage.limit + lastPage.skip >= lastPage.total) return null;
      return pages.length;
    },
    select: (res) => res.pages,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });


  useEffect(() => {
    getApps();
  }, [selectedIndustry, selectedFunction, selectedCategory]);

  useEffect(() => {
    setSelectedIndustry(searchParams.get("industry") || "");
    setSelectedFunction(searchParams.get("function") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedType(searchParams.get("type") || "All Agents");
  }, [searchParams]);

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedFunction("");
    setSelectedCategory("");
    const params = new URLSearchParams(searchParams);
    params.delete("industry");
    params.delete("function");
    params.delete("category");
    setSearchParams(params);
  };

  useEffect(() => {
    if (selectedType === "My Agents") {
      getUserApps();
    } else {
      getApps();
    }
  }, [selectedType]);

  const filteredApps = () => {
    switch (selectedType) {
      case "My Agents":
        return Array.isArray(userApps)
          ? userApps
              .filter((app) => app.user_id === userId)
              .filter((app) =>
                app?.name?.toLowerCase().includes(searchTerm?.toLowerCase()),
              )
              .filter((app) => {
                const appTags = app.tags || {};
                const matchesIndustry =
                  !selectedIndustry || appTags.industry === selectedIndustry;
                const matchesFunction =
                  !selectedFunction || appTags.function === selectedFunction;
                const matchesCategory =
                  !selectedCategory || appTags.category === selectedCategory;

                return matchesIndustry && matchesFunction && matchesCategory;
              })
          : [];
      case "Community Agents":
        return (
          appsRes
            ?.flatMap((res) => res.data)
            ?.filter((app) => app.public)
            ?.filter((app) =>
              app.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            ) || []
        );
      default:
        return (
          appsRes
            ?.flatMap((res) => res.data)
            ?.filter((app) =>
              app.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            ) || []
        );
    }
  };

  const filteredLyzrApps = lyzrApps.filter((app) => {
    const matchesSearch =
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry =
      !selectedIndustry || app.industry_tag === selectedIndustry;
    const matchesFunction =
      !selectedFunction || app.function_tag === selectedFunction;
    const matchesCategory =
      !selectedCategory || app.category_tag === selectedCategory;

    return (
      matchesSearch && matchesIndustry && matchesFunction && matchesCategory
    );
  });

  const handleEdit = (app: MarketplaceAppData) => () => {
    setEditingApp(app);
    setIsEditDialogOpen(true);
  };

  const Loader = () =>
    Array(4)
      .fill(null)
      .map((_, index) => (
        <div
          key={index}
          className="col-span-1 h-72 rounded-lg border bg-card p-4"
        >
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div>
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-4 flex justify-end">
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ));

  return (
    <>
      <div className="flex flex-col space-y-4">
        <UtilityBar
          appType={appType}
          searchTerm={searchTerm}
          loading={isFetching}
          setSearchTerm={setSearchTerm}
          setAppType={setAppType}
          refresh={async () => {
            await getApps();
            await getUserApps();
          }}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedIndustry={selectedIndustry}
          selectedFunction={selectedFunction}
          selectedCategory={selectedCategory}
          setSelectedIndustry={setSelectedIndustry}
          setSelectedFunction={setSelectedFunction}
          setSelectedCategory={setSelectedCategory}
          clearFilters={clearFilters}
        />

        <InfiniteScroll
          height="calc(100vh - 200px)"
          className="space-y-8"
          dataLength={(filteredApps()?.length ?? 0) + filteredLyzrApps.length}
          next={() => {
            fetchNextPage();
          }}
          hasMore={
            selectedType === "My Agents"
              ? false
              : hasNextPage || false
          }
          loader={
            <div className="my-2 grid grid-cols-4 gap-4">
              <Loader />
            </div>
          }
        >
          {selectedType === "All Agents" && (
            <div>
              <h2 className="mb-4 font-semibold">Lyzr Agents</h2>
              {/* <div className="grid grid-cols-5 gap-4">
                {filterHub("hr", searchTerm) && (
                  <HubCard
                    title="HR Hub"
                    path="/agent-marketplace/hr-hub"
                    appCount={getHubAppCount("hr")}
                  />
                )}
                {filterHub("banking-insurance", searchTerm) && (
                  <HubCard
                    title="Banking & Insurance Hub"
                    path="/agent-marketplace/banking-insurance-hub"
                    appCount={getHubAppCount("banking-insurance")}
                  />
                )}
                {filterHub("sales", searchTerm) && (
                  <HubCard
                    title="Sales Hub"
                    path="/agent-marketplace/sales-hub"
                    appCount={getHubAppCount("sales")}
                  />
                )}
                {filterHub("research-analysis", searchTerm) && (
                  <HubCard
                    title="Research & Analysis Hub"
                    path="/agent-marketplace/research-analysis-hub"
                    appCount={getHubAppCount("research-analysis")}
                  />
                )}
                {filterHub("marketing", searchTerm) && (
                  <HubCard
                    title="Marketing Hub"
                    path="/agent-marketplace/marketing-hub"
                    appCount={getHubAppCount("marketing")}
                  />
                )}
              </div> */}
              <div className="grid auto-rows-[9rem] grid-cols-12 gap-4">
                {/* Top row - 2 medium boxes on left, 1 large box on right */}

                <div className="group/bento col-span-3 row-span-1">
                  {filterHub("hr", searchTerm) && (
                    <HubCard
                      title="HR Hub"
                      path="/agent-marketplace/hr-hub"
                      appCount={getHubAppCount("hr")}
                    />
                  )}
                </div>
                <div className="group/bento col-span-3 row-span-1">
                  {filterHub("banking-insurance", searchTerm) && (
                    <HubCard
                      title="Banking & Insurance Hub"
                      path="/agent-marketplace/banking-insurance-hub"
                      appCount={getHubAppCount("banking-insurance")}
                    />
                  )}
                </div>

                {/* Large featured card with content */}
                <div className="row-span-2 rounded-xl border bg-card p-4 md:col-span-2 lg:col-span-6">
                  <div className="flex h-full gap-4">
                    <div className="relative aspect-video h-full rounded-lg bg-muted sm:w-72 lg:w-1/2">
                      {isVideoLoading && (
                        <Skeleton className="absolute inset-0 h-full w-full" />
                      )}
                      <iframe
                        title="Video"
                        src={"https://www.youtube.com/embed/NHXsQqCqHYg"}
                        className="h-full w-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsVideoLoading(false)}
                      />
                    </div>
                    <div className="flex h-full flex-col justify-between gap-4 overflow-y-scroll">
                      <span>
                        <h2 className="font-bold text-foreground sm:text-lg 2xl:text-2xl">
                          Meet Diane - your enterprise HR agent suite
                        </h2>
                        <p className="leading-loose text-muted-foreground sm:text-xs 2xl:text-sm">
                          Stop drowning in administrative work. Diane, Lyzr's
                          AI-powered HR agent suite, automates everything from
                          hiring to exit interviews, freeing your team to focus
                          on people, not paperwork. Diane isn’t a single bot
                          with templated responses. She’s a full-stack HR agent
                          system - made of modular agents that think, work, and
                          collaborate like your HR team.
                        </p>
                      </span>
                      <Link
                        to="/agent-marketplace/hr-hub"
                        className={cn("w-full", buttonVariants())}
                      >
                        View the agent suite
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Bottom row - 3 small boxes */}
                <div className="row-span-1 md:col-span-2">
                  {filterHub("sales", searchTerm) && (
                    <HubCard
                      title="Sales Hub"
                      path="/agent-marketplace/sales-hub"
                      appCount={getHubAppCount("sales")}
                    />
                  )}
                </div>
                <div className="row-span-1 md:col-span-2">
                  {filterHub("research-analysis", searchTerm) && (
                    <HubCard
                      title="Research & Analysis Hub"
                      path="/agent-marketplace/research-analysis-hub"
                      appCount={getHubAppCount("research-analysis")}
                    />
                  )}
                </div>
                <div className="row-span-1 md:col-span-2">
                  {filterHub("marketing", searchTerm) && (
                    <HubCard
                      title="Marketing Hub"
                      path="/agent-marketplace/marketing-hub"
                      appCount={getHubAppCount("marketing")}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {(selectedType === "My Agents" || selectedType === "All Agents") && (
            <div>
              <h2 className="mb-4 font-semibold">My Agents</h2>
              {(() => {
                const myAgentsData = selectedType === "My Agents"
                  ? filteredApps()
                  : userApps.filter((app: MarketplaceAppData) => app.user_id === userId);

                return myAgentsData?.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex h-[200px] flex-col items-center justify-center gap-4"
                  >
                    <EmptyPage />
                    <p className="text-lg text-muted-foreground">
                      No agents found
                    </p>
                    {selectedType === "My Agents" && (selectedIndustry ||
                      selectedFunction ||
                      selectedCategory) && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 px-1">
                    {userId &&
                      currentUser &&
                      myAgentsData?.map((app: any) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          editingApp={!!editingApp}
                          onEdit={handleEdit(app)}
                          onDelete={() =>
                            queryClient.invalidateQueries({
                              queryKey: ["userApps"],
                            })
                          }
                          currentUser={currentUser}
                          userId={userId}
                          token={token}
                        />
                      ))}
                  </div>
                );
              })()}
            </div>
          )}

          {(selectedType === "All Agents" ||
            selectedType === "Community Agents") && (
            <div>
              <h2 className="mb-4 font-semibold">Community Agents</h2>
              {filteredApps()?.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex h-[200px] flex-col items-center justify-center gap-4"
                >
                  <EmptyPage />
                  <p className="text-lg text-muted-foreground">
                    No community agents found
                  </p>
                  {(selectedIndustry ||
                    selectedFunction ||
                    selectedCategory) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-4 gap-4 px-1">
                  {userId &&
                    currentUser &&
                    filteredApps()?.map((app: any) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        editingApp={!!editingApp}
                        onEdit={handleEdit(app)}
                        onDelete={() =>
                          queryClient.invalidateQueries({
                            queryKey: ["userApps"],
                          })
                        }
                        currentUser={currentUser}
                        userId={userId}
                        token={token}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </InfiniteScroll>
      </div>

      {editingApp && (
        <Edit
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          app={editingApp}
          token={token}
        />
      )}
    </>
  );
}

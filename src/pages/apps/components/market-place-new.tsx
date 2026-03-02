import { useState, useEffect, useMemo, useCallback } from "react";
import {
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { EmptyPage } from "@/assets/icons";
import { motion } from "framer-motion";
import { CurrentUserProps } from "@/lib/types";
import { MARKETPLACE_URL } from "@/lib/constants";
import { useMarketplace } from "../marketplace.service";
import { lyzrApps, coreUtilityApps } from "@/data/lyzr-apps";
import { Edit } from "@/pages/create-agent/components/edit";
import { useManageAdminStore } from "../../manage-admin/manage-admin.store";
import { isOrgMode } from "@/lib/utils";
import { Search, X, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// New components
import { CategoryPills } from "./category-pills";
import { CompactAgentCard, LyzrAgentCard } from "./compact-agent-card";
import { LyzrGPTBanner } from "./promo-banner";
import { CTASection } from "./cta-section";
import { AgentSection } from "./agent-section";

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

// Hub configuration for category cards (Explore Categories)
const categoryHubs = [
    {
        id: "hr",
        name: "HR & LMS",
        description: "Agent Diane handles recruitment, employee experience and HR productivity.",
        navigation_path: "/agent-marketplace/hr-hub",
        agentCount: 8,
        imageUrl: "/avatars/diane.png",
    },
    {
        id: "customer-service",
        name: "Customer Service",
        description: "Agent Jeff as your specialised customer service executive.",
        navigation_path: "/agent-marketplace/customer-service-hub",
        agentCount: 3,
        imageUrl: "/avatars/jeff.png",
    },
    {
        id: "banking",
        name: "Banking & Finance",
        description: "Agent Amadeo for customer onboarding, regulatory monitoring, claims processing etc.",
        navigation_path: "/agent-marketplace/banking-insurance-hub",
        agentCount: 7,
        imageUrl: "/avatars/amadeo.png",
    },
    {
        id: "sales",
        name: "Sales",
        description: "Agent Jazon is your virtual sales assistant for lead generation and CRM management.",
        navigation_path: "/agent-marketplace/sales-hub",
        agentCount: 5,
        imageUrl: "/avatars/jazon.png",
    },
    {
        id: "core-utility",
        name: "Core Utility",
        description: "Essential AI tools and agents for everyday tasks.",
        navigation_path: "/agent-marketplace/core-utility-hub",
        agentCount: 6,
        imageUrl: "https://digitalassets.avanade.com/api/public/content/avanade-logo-color1?v=d989feca",
    },
    {
        id: "marketing",
        name: "Marketing",
        description: "Agent Mark handles marketing campaigns, analytics, and customer engagement.",
        navigation_path: "/agent-marketplace/marketing-hub",
        agentCount: 8,
        imageUrl: "/avatars/scott.png",
    },
    {
        id: "itops-secops",
        name: "IT Ops & Security",
        description: "Agents for IT operations, security monitoring, and infrastructure management.",
        navigation_path: "/agent-marketplace/itops-secops-hub",
        agentCount: 5,
        imageUrl: "/avatars/jazon.png"
    },
    {
        id: "research-analysis",
        name: "Research & Analysis",
        description: "AI-powered research assistants for data analysis and insights generation.",
        navigation_path: "/agent-marketplace/research-analysis-hub",
        agentCount: 2,
        imageUrl: "/avatars/jeff.png"
    }
];

// Category options with hub paths
const categoryHubPaths: Record<string, string> = {
    "core-utility": "/agent-marketplace/core-utility-hub",
    "hr": "/agent-marketplace/hr-hub",
    "sales": "/agent-marketplace/sales-hub",
    "banking": "/agent-marketplace/banking-insurance-hub",
    "marketing": "/agent-marketplace/marketing-hub",
    "customer-service": "/agent-marketplace/customer-service-hub",
    "research-analysis": "/agent-marketplace/research-analysis-hub",
    "itops-secops": "/agent-marketplace/itops-secops-hub",
};

const categories = [
    "hr",
    "core-utility",
    "sales",
    "banking",
    "marketing",
    "customer-service",
    "research-analysis",
    "itops-secops",
];

export default function Apps({
    currentUser,
    userId,
    token,
}: Partial<CurrentUserProps> & { token: string }) {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const viewType = searchParams.get("type"); // "Organization Agents", "Community Agents", "My Agents", "Explore Categories"

    const [searchTerm, setSearchTerm] = useState<string>("");
    const debouncedSearch = useDebounce<string>(searchTerm, 800);
    const pageSize = 50;

    const [editingApp, setEditingApp] = useState<MarketplaceAppData | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("hr");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const { usage_data } = useManageAdminStore((state) => state);

    // Fetch user's own apps (My Agents)
    const {
        data: userApps = [],
        refetch: getUserApps,
        isFetching: isFetchingUserApps,
    } = useQuery({
        queryKey: ["userApps", userId],
        queryFn: async () => {
            const { data } = await axios.get(`/apps/user/${userId}`, {
                baseURL: MARKETPLACE_URL,
                headers: { Authorization: `Bearer ${token}` },
            });
            return data.data || data || [];
        },
        enabled: !!userId && !!token,
    });

    // Marketplace hooks for organization apps - only use search when in filtered view
    const { orgAppsRes, getOrgApps, isLoadingOrgApps, fetchNextOrgPage, hasNextOrgPage } = useMarketplace(
        token,
        "", // industry
        "", // function
        "", // category
        viewType === "Organization Agents" ? debouncedSearch : "" // Only search when in org view
    );

    // Fetch community/public apps
    const {
        refetch: getApps,
        data: appsRes,
        isFetching: isFetchingApps,
        fetchNextPage: fetchNextCommunityPage,
        hasNextPage: hasNextCommunityPage,
        isFetchingNextPage: isFetchingNextCommunityPage,
    } = useInfiniteQuery({
        queryKey: ["fetchApps", userId, pageSize, viewType === "Community Agents" ? debouncedSearch : ""],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const searchValue = viewType === "Community Agents" ? debouncedSearch : "";
            const filterParams = new URLSearchParams({
                skip: (pageParam * pageSize).toString(),
                limit: pageSize.toString(),
                search: searchValue,
            }).toString();

            const res = await axios.get<ResponseData>(
                `/apps/user/${userId}/with-public?${filterParams}`,
                {
                    baseURL: MARKETPLACE_URL,
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data;
        },
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.limit + lastPage.skip >= lastPage.total) return null;
            return pages.length;
        },
        select: (res) => res.pages,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    // Fetch user's own apps with infinite scroll (My Agents)
    const {
        data: myAppsRes,
        refetch: getMyApps,
        isFetching: isFetchingMyApps,
        fetchNextPage: fetchNextMyAppsPage,
        hasNextPage: hasNextMyAppsPage,
        isFetchingNextPage: isFetchingNextMyAppsPage,
    } = useInfiniteQuery({
        queryKey: ["fetchMyApps", userId, pageSize, viewType === "My Agents" ? debouncedSearch : ""],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const searchValue = viewType === "My Agents" ? debouncedSearch : "";
            const filterParams = new URLSearchParams({
                skip: (pageParam * pageSize).toString(),
                limit: pageSize.toString(),
                ...(searchValue && { search: searchValue }),
            }).toString();

            const res = await axios.get<ResponseData>(
                `/apps/user/${userId}?${filterParams}`,
                {
                    baseURL: MARKETPLACE_URL,
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data;
        },
        getNextPageParam: (lastPage, pages) => {
            if (!lastPage?.data || lastPage.data.length < pageSize) return null;
            return pages.length;
        },
        select: (res) => res.pages,
        enabled: !!userId && !!token,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    // Initial load - runs once when component mounts
    useEffect(() => {
        getApps();
        getUserApps();
        getMyApps();
        if (isOrgMode(usage_data?.plan_name)) {
            getOrgApps();
        }
    }, []); // Empty dependency - only run on mount

    // Search-based refetch - only when in filtered views
    useEffect(() => {
        if (!viewType) return; // Don't refetch on main marketplace page

        if (viewType === "Community Agents") {
            getApps();
        } else if (viewType === "My Agents") {
            getMyApps();
        } else if (viewType === "Organization Agents" && isOrgMode(usage_data?.plan_name)) {
            getOrgApps();
        }
    }, [viewType, debouncedSearch]);

    // Map category pill names to actual hub field values in lyzr-apps.ts
    const categoryToHubMap: Record<string, string> = {
        "hr": "hr",
        "sales": "sales",
        "core-utility": "core-utility",
        "banking": "banking-insurance",
        "marketing": "marketing",
        "customer-service": "customer-service",
        "research-analysis": "research-analysis",
        "itops-secops": "itops-secops",
    };

    // Search results for dropdown - always filters by search term across ALL apps
    const searchResultsApps = useMemo(() => {
        if (!searchTerm) return [];
        const searchLower = searchTerm.toLowerCase();

        // Search through lyzr apps (studio agents)
        const lyzrResults = lyzrApps.filter((app) =>
            app.name.toLowerCase().includes(searchLower) ||
            app.description.toLowerCase().includes(searchLower)
        ).map(app => ({ ...app, source: 'studio' as const }));

        // Search through community apps
        const communityResults = (appsRes?.flatMap((res) => res.data)?.filter((app) => app.public) || [])
            .filter((app) =>
                app.name?.toLowerCase().includes(searchLower) ||
                app.description?.toLowerCase().includes(searchLower)
            ).map(app => ({ ...app, source: 'community' as const }));

        // Search through organization apps
        const orgResults = (isOrgMode(usage_data?.plan_name)
            ? (orgAppsRes?.pages?.flatMap((page: any) => page) || [])
            : []
        ).filter((app) =>
            app.name?.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        ).map(app => ({ ...app, source: 'organization' as const }));

        // Search through my agents
        const myAgentsResults = (Array.isArray(userApps) ? userApps : [])
            .filter((app: MarketplaceAppData) =>
                app.name?.toLowerCase().includes(searchLower) ||
                app.description?.toLowerCase().includes(searchLower)
            ).map(app => ({ ...app, source: 'my' as const }));

        // Combine all results and limit to avoid overwhelming the dropdown
        return [...lyzrResults, ...communityResults, ...orgResults, ...myAgentsResults];
    }, [searchTerm, appsRes, orgAppsRes, userApps, usage_data?.plan_name]);

    // Category filtered apps for the grid section - filters by selected category only
    const filteredLyzrApps = useMemo(() => {
        const hubValue = categoryToHubMap[selectedCategory];
        if (!hubValue) return [];
        return lyzrApps.filter((app) => app.hub === hubValue);
    }, [selectedCategory]);

    // Get community apps (no category filtering) - for home page, don't filter by search
    const communityApps = useMemo(() => {
        const apps =
            appsRes
                ?.flatMap((res) => res.data)
                ?.filter((app) => app.public) || [];
        return apps.slice(0, 4);
    }, [appsRes]);

    // Get organization apps (no category filtering)
    const organizationApps = useMemo(() => {
        if (!isOrgMode(usage_data?.plan_name)) return [];
        const apps = orgAppsRes?.pages?.flatMap((page: any) => page) || [];
        return apps.slice(0, 4);
    }, [orgAppsRes, usage_data?.plan_name]);

    // Get ALL organization apps for filtered view
    const allOrganizationApps = useMemo(() => {
        if (!isOrgMode(usage_data?.plan_name)) return [];
        return orgAppsRes?.pages?.flatMap((page: any) => page) || [];
    }, [orgAppsRes, usage_data?.plan_name]);

    // Get ALL community apps for filtered view - only filter by search when in Community Agents view
    const allCommunityApps = useMemo(() => {
        const apps = appsRes
            ?.flatMap((res) => res.data)
            ?.filter((app) => app.public) || [];

        // Only apply search filter when in Community Agents view
        if (viewType === "Community Agents" && searchTerm) {
            return apps.filter((app) =>
                app.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return apps;
    }, [appsRes, searchTerm, viewType]);

    // Get ALL my apps for filtered view - only filter by search when in My Agents view
    const allMyAgents = useMemo(() => {
        const apps = myAppsRes?.flatMap((res) => res.data || res) || [];

        // Only apply search filter when in My Agents view
        if (viewType === "My Agents" && searchTerm) {
            return apps.filter((app: MarketplaceAppData) =>
                app.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return apps;
    }, [myAppsRes, searchTerm, viewType]);

    // Get my apps (user's own apps) - limited for home view (no search filtering on main page)
    const myAgents = useMemo(() => {
        const apps = Array.isArray(userApps) ? userApps : [];
        return apps.slice(0, 4);
    }, [userApps]);

    const handleEdit = (app: MarketplaceAppData) => () => {
        setEditingApp(app);
        setIsEditDialogOpen(true);
    };

    // Loader skeleton - now full width for grid layout
    const CardSkeleton = () => (
        <div className="w-full rounded-xl border bg-card p-4">
            <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </div>
        </div>
    );

    // Grid skeleton for filtered view
    const GridSkeleton = () => (
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Determine loading state for filtered view
    const isFilteredViewLoading =
        (viewType === "Organization Agents" && isLoadingOrgApps) ||
        (viewType === "Community Agents" && isFetchingApps) ||
        (viewType === "My Agents" && isFetchingMyApps);

    // Check if there are more agents to load
    const hasMoreAgents =
        (viewType === "Organization Agents" && hasNextOrgPage) ||
        (viewType === "Community Agents" && hasNextCommunityPage) ||
        (viewType === "My Agents" && hasNextMyAppsPage);

    // Check if currently fetching more
    const isFetchingMoreAgents =
        (viewType === "Organization Agents" && isLoadingOrgApps) ||
        (viewType === "Community Agents" && isFetchingNextCommunityPage) ||
        (viewType === "My Agents" && isFetchingNextMyAppsPage);

    // Load more handler
    const handleLoadMore = useCallback(() => {
        if (viewType === "Organization Agents" && hasNextOrgPage) {
            fetchNextOrgPage();
        } else if (viewType === "Community Agents" && hasNextCommunityPage) {
            fetchNextCommunityPage();
        } else if (viewType === "My Agents" && hasNextMyAppsPage) {
            fetchNextMyAppsPage();
        }
    }, [viewType, hasNextOrgPage, hasNextCommunityPage, hasNextMyAppsPage, fetchNextOrgPage, fetchNextCommunityPage, fetchNextMyAppsPage]);

    const getFilteredApps = () => {
        if (viewType === "Organization Agents") return allOrganizationApps;
        if (viewType === "Community Agents") return allCommunityApps;
        if (viewType === "My Agents") return allMyAgents;
        return [];
    };

    const getRefetchFn = () => {
        if (viewType === "Organization Agents") return getOrgApps;
        if (viewType === "Community Agents") return () => queryClient.invalidateQueries({ queryKey: ["fetchApps"] });
        if (viewType === "My Agents") return getMyApps;
        return () => { };
    };

    // Render Explore Categories view
    if (viewType === "Explore Categories") {
        // Filter categoryHubs based on search
        const filteredCategoryHubs = categoryHubs.filter((hub) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                hub.name.toLowerCase().includes(searchLower) ||
                hub.description.toLowerCase().includes(searchLower)
            );
        });

        return (
            <>
                <div className="flex flex-col space-y-6">
                    {/* Header with Back Button */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/agent-marketplace")}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                Explore Categories
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {filteredCategoryHubs.length} categories available
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-md">
                        <div className="flex items-center rounded-full border bg-background px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search categories..."
                                className="border-none bg-transparent shadow-none focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm.length > 0 && (
                                <X
                                    className="h-4 w-4 cursor-pointer text-muted-foreground transition-opacity hover:opacity-70"
                                    onClick={() => setSearchTerm("")}
                                />
                            )}
                        </div>
                    </div>

                    {/* Categories Grid */}
                    {filteredCategoryHubs.length > 0 ? (
                        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {filteredCategoryHubs.map((hub) => (
                                <LyzrAgentCard
                                    key={hub.id}
                                    app={hub}
                                    variant="category"
                                    agentCount={hub.agentCount}
                                />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex h-64 w-full flex-col items-center justify-center gap-4"
                        >
                            <EmptyPage />
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground">
                                    No categories found
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Try adjusting your search terms
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </>
        );
    }

    // Render filtered view if viewType is set (Organization, Community, My Agents)
    if (viewType) {
        const filteredApps = getFilteredApps();
        const refetchFn = getRefetchFn();

        return (
            <>
                <div className="flex flex-col space-y-6">
                    {/* Header with Back Button */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/agent-marketplace")}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                {viewType}
                            </h1>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-md">
                        <div className="flex items-center rounded-full border bg-background px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search agents..."
                                className="border-none bg-transparent shadow-none focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm.length > 0 && (
                                <X
                                    className="h-4 w-4 cursor-pointer text-muted-foreground transition-opacity hover:opacity-70"
                                    onClick={() => setSearchTerm("")}
                                />
                            )}
                        </div>
                    </div>

                    {/* Agents Grid */}
                    {isFilteredViewLoading && filteredApps.length === 0 ? (
                        <GridSkeleton />
                    ) : filteredApps.length > 0 ? (
                        <>
                            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {filteredApps.map((app: any) => (
                                    <CompactAgentCard
                                        key={app.id || app._id}
                                        app={app}
                                        isOrgApp={viewType === "Organization Agents"}
                                        showAuthor={viewType === "Community Agents" || viewType === "Organization Agents"}
                                        currentUser={currentUser || {}}
                                        userId={userId || ""}
                                        token={token}
                                        onEdit={handleEdit(app)}
                                        onDelete={() => refetchFn()}
                                    />
                                ))}
                            </div>

                            {/* View More Button */}
                            {hasMoreAgents && (
                                <div className="flex justify-center pt-6">
                                    <Button
                                        variant="default"
                                        onClick={handleLoadMore}
                                        disabled={isFetchingMoreAgents}
                                    // className="min-w-[200px"
                                    >
                                        {isFetchingMoreAgents ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "View More"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex h-64 w-full flex-col items-center justify-center gap-4"
                        >
                            <EmptyPage />
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground">
                                    No agents found
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : `No ${viewType.toLowerCase()} available yet`}
                                </p>
                            </div>
                        </motion.div>
                    )}
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

    return (
        <>
            <div className="flex w-full max-w-full flex-col space-y-8 overflow-x-hidden">
                {/* Header Section */}
                <div className="flex flex-col items-center space-y-6 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Avanade Agentic App Store
                        </h1>
                        <p className="text-muted-foreground">
                            Deploy enterprise-grade AI agents to transform your business
                            workflows
                        </p>
                    </div>

                    {/* Search Bar with Dropdown */}
                    <div className="relative w-full max-w-2xl">
                        <div className="flex items-center rounded-full border bg-background px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search agents..."
                                className="border-none bg-transparent shadow-none focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            {searchTerm.length > 0 && (
                                <X
                                    className="h-4 w-4 cursor-pointer text-muted-foreground transition-opacity hover:opacity-70"
                                    onClick={() => setSearchTerm("")}
                                />
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchTerm.length > 0 && isSearchFocused && searchResultsApps.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border bg-card shadow-lg">
                                <div className="p-2">
                                    {searchResultsApps.slice(0, 8).map((app) => {
                                        // Determine navigation path based on source
                                        const getNavigationPath = () => {
                                            if ('navigation_path' in app && app.navigation_path) {
                                                return app.navigation_path; // Studio agents
                                            }
                                            // For marketplace agents, navigate to chat
                                            return `/agent/${app.id}`;
                                        };

                                        // Determine source label
                                        const getSourceLabel = () => {
                                            if (app.source === 'studio') return '🎨 Studio';
                                            if (app.source === 'community') return '🌐 Community';
                                            if (app.source === 'organization') return '🏢 Organization';
                                            if (app.source === 'my') return '👤 My Agent';
                                            return '';
                                        };

                                        return (
                                            <Link
                                                key={`${app.source}-${app.id}`}
                                                to={getNavigationPath()}
                                                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setIsSearchFocused(false);
                                                }}
                                            >
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400"></div>
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate font-medium text-foreground">{app.name}</p>
                                                        <span className="text-[10px] text-muted-foreground">{getSourceLabel()}</span>
                                                    </div>
                                                    <p className="truncate text-xs text-muted-foreground">{app.description}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No results message */}
                        {searchTerm.length > 0 && isSearchFocused && searchResultsApps.length === 0 && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border bg-card p-4 text-center shadow-lg">
                                <p className="text-sm text-muted-foreground">No agents found for "{searchTerm}"</p>
                            </div>
                        )}
                    </div>

                    {/* Category Pills */}
                    <CategoryPills
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategorySelect={setSelectedCategory}
                    />
                </div>

                {/* Two Column Section: Core Utility Agents + Category Cards - ALWAYS VISIBLE */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column: Core Utility Agents (2 rows x 2 agents) - Hardcoded */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Core Utility Agents</h3>
                            <Link
                                to="/agent-marketplace/core-utility-hub"
                                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4">
                            {coreUtilityApps.map((app) => (
                                <LyzrAgentCard key={app.id} app={app as any} hideComingSoonBadge hideAuthorAndTags />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Category Cards (2 rows x 2 cards) */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Explore Categories</h3>
                            <Link
                                to="/agent-marketplace?type=Explore+Categories"
                                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4">
                            {categoryHubs.slice(0, 4).map((hub) => (
                                <LyzrAgentCard
                                    key={hub.id}
                                    app={hub}
                                    variant="category"
                                    agentCount={hub.agentCount}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* This section is independent of search - search results appear in dropdown only */}
                {filteredLyzrApps.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-normal">
                            <h3 className="text-lg font-semibold text-foreground mr-3">
                                {`${selectedCategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Agents (${filteredLyzrApps.length})`}
                            </h3>

                            {/* Navigate to hub page for the selected category */}
                            {categoryHubPaths[selectedCategory] && (
                                <Link
                                    to={categoryHubPaths[selectedCategory]}
                                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    View More
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>

                        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredLyzrApps.slice(0, 4).map((app) => (
                                <LyzrAgentCard key={app.id} app={app} hideComingSoonBadge hideAuthorAndTags />
                            ))}
                        </div>
                    </section>
                )}

                {/* LyzrGPT Promo Banner */}
                <LyzrGPTBanner />

                {/* Organization Agents Section - Always show if org mode */}
                {isOrgMode(usage_data?.plan_name) && (
                    <AgentSection
                        title="Organization Agents"
                        viewAllLink="/agent-marketplace?type=Organization+Agents"
                    >
                        {isLoadingOrgApps ? (
                            <>
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                            </>
                        ) : organizationApps.length > 0 ? (
                            organizationApps.map((app: any) => (
                                <CompactAgentCard
                                    key={app.id}
                                    app={app}
                                    isOrgApp
                                    showAuthor
                                    currentUser={currentUser || {}}
                                    userId={userId || ""}
                                    token={token}
                                    onEdit={handleEdit(app)}
                                    onDelete={() => getOrgApps()}
                                />
                            ))
                        ) : (
                            <div className="flex h-32 w-full items-center justify-center text-muted-foreground">
                                No organization agents found
                            </div>
                        )}
                    </AgentSection>
                )}

                <CTASection />

                {/* Community Agents Section - Always show */}
                <AgentSection
                    title="Community Agents"
                    viewAllLink="/agent-marketplace?type=Community Agents"
                >
                    {isFetchingApps ? (
                        <>
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                        </>
                    ) : communityApps.length > 0 ? (
                        communityApps.map((app: any) => (
                            <CompactAgentCard
                                key={app.id}
                                app={app}
                                showAuthor
                                currentUser={currentUser || {}}
                                userId={userId || ""}
                                token={token}
                                onEdit={handleEdit(app)}
                                onDelete={() =>
                                    queryClient.invalidateQueries({
                                        queryKey: ["fetchApps"],
                                    })
                                }
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex h-32 w-full flex-col items-center justify-center gap-2"
                        >
                            <EmptyPage />
                            <p className="text-sm text-muted-foreground">
                                No community agents found
                            </p>
                        </motion.div>
                    )}
                </AgentSection>

                {/* My Agents Section - Always show */}
                <AgentSection
                    title="My Agents"
                    viewAllLink="/agent-marketplace?type=My Agents"
                >
                    {isFetchingUserApps ? (
                        <>
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                        </>
                    ) : myAgents.length > 0 ? (
                        myAgents.map((app: MarketplaceAppData) => (
                            <CompactAgentCard
                                key={app.id}
                                app={app as any}
                                currentUser={currentUser || {}}
                                userId={userId || ""}
                                token={token}
                                onEdit={handleEdit(app)}
                                onDelete={() => getUserApps()}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex h-32 w-full flex-col items-center justify-center gap-2"
                        >
                            <EmptyPage />
                            <p className="text-sm text-muted-foreground">
                                No agents created yet
                            </p>
                        </motion.div>
                    )}
                </AgentSection>
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

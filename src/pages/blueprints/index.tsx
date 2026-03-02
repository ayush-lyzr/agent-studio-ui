import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import BlueprintPreviewCard from "@/components/blueprints/BlueprintPreviewCard";
import { blueprintApiService } from "@/services/blueprintApiService";
import { toast } from "sonner";
import { Path } from "@/lib/types";
import { isMixpanelActive, PlanType } from "@/lib/constants";
import mixpanel from "mixpanel-browser";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { motion } from "framer-motion";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Blueprint page visited");

const BlueprintsPage: React.FC = () => {
  const navigate = useNavigate();
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [activeTab, setActiveTab] = useState<string>("all");

  const currentUser = useManageAdminStore((state) => state.current_user);
  const current_organization = useManageAdminStore((state) => state.current_organization);
  const usage_data = useManageAdminStore((state) => state.usage_data);
  const lyzrUser = "@lyzr.ai";
  const isLyzrUser = currentUser?.auth?.email.endsWith(lyzrUser);
  const planName = usage_data?.plan_name;
  const restrictedPlans = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ];
  const isRestrictedPlan =
    planName && restrictedPlans.includes(planName as PlanType);

  useEffect(() => {
    fetchBlueprints();
  }, [selectedType, selectedCategory, sortBy, activeTab]);

  const fetchBlueprints = async () => {
    setLoading(true);
    try {
      const params: any = {
        sort_by: sortBy as any,
        page_size: 50,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedType !== "all") {
        params.orchestration_type = selectedType;
      }

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (activeTab === "my-blueprints") {
        params.owner_id = currentUser.id;
      }

      if (activeTab === "organization-blueprints") {
        params.organization_id = current_organization?.org_id;
        params.share_type = "organization";
      }

      const response = await blueprintApiService.listBlueprints(params);
      setBlueprints(response.blueprints || []);
    } catch (error) {
      console.error("Failed to fetch blueprints:", error);
      toast.error("Failed to load blueprints");
    } finally {
      setLoading(false);
    }
  };

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((blueprint) =>
      blueprint.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [blueprints, searchQuery]);

  const handleBlueprintClick = (blueprint: any) => {
    // Navigate to orchestration with blueprint ID
    // The orchestration page will load the complete blueprint with all agent documents
    navigate(`${Path.ORCHESTRATION}?blueprint=${blueprint._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-4"
    >
      <div className="w-full p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Blueprints
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover orchestration templates
            </p>
          </div>
        </div>

        {/* Mobile filters - shown below header on small screens */}
        <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Manager Agent">Manager Agent</SelectItem>
              <SelectItem value="Single Agent">Single Agent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="customer-service">Customer Service</SelectItem>
              <SelectItem value="data-analysis">Data Analysis</SelectItem>
              <SelectItem value="content-creation">Content Creation</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Recently Updated</SelectItem>
              <SelectItem value="created_at">Recently Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="usage_count">Most Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8 flex flex-shrink-0 items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-[280px] pl-8"
            />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Manager Agent">Manager Agent</SelectItem>
                <SelectItem value="Single Agent">Single Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="customer-service">
                  Customer Service
                </SelectItem>
                <SelectItem value="data-analysis">Data Analysis</SelectItem>
                <SelectItem value="content-creation">
                  Content Creation
                </SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Recently Updated</SelectItem>
                <SelectItem value="created_at">Recently Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage_count">Most Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(isLyzrUser || !isRestrictedPlan) && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9">
                <TabsTrigger
                  value="all"
                  className="flex items-center gap-1 text-sm"
                >
                  <Package className="w-4s h-4" />
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="my-blueprints"
                  className="flex items-center gap-1 text-sm"
                >
                  <Lock className="h-4 w-4" />
                  My Blueprints
                </TabsTrigger>
                <TabsTrigger
                  value="organization-blueprints"
                  className="flex items-center gap-1 text-sm"
                >
                  <Lock className="h-4 w-4" />
                  Orgs Blueprints
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="m-0"></TabsContent>
            </Tabs>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-[220px] w-full" />
              </div>
            ))}
          </div>
        ) : blueprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
            <Package className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No blueprints found</h3>
          </div>
        ) : (
          filteredBlueprints.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {filteredBlueprints.map((blueprint) => (
                <BlueprintPreviewCard
                  key={blueprint._id}
                  blueprint={blueprint}
                  onClick={() => handleBlueprintClick(blueprint)}
                  onDelete={() => fetchBlueprints()}
                  onClone={() => fetchBlueprints()}
                />
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
};

export default BlueprintsPage;

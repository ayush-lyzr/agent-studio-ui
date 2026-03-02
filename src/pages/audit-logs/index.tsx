import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import useStore from "@/lib/store";
import { ITeamMember, Path } from "@/lib/types";
import { useAuditLogs, useAuditStats } from "./audit-logs.service";
import { AuditLogFilters } from "./types";
import AuditLogStats from "./components/AuditLogStats";
import AuditLogsTable from "./components/AuditLogsTable";
import AuditLogsFilters from "./components/AuditLogsFilters";
import { useOrganization } from "../organization/org.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

export type UserMap = Record<string, { email: string; name: string }>;

const PAGE_SIZE = 50;

const AuditLogsPage = () => {
  const apiKey = useStore((state) => state.api_key);
  const appToken = useStore((state) => state.app_token);
  const { current_organization } = useManageAdminStore();
  const [activeTab, setActiveTab] = useState("logs");
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [userMap, setUserMap] = useState<UserMap>({});

  const { getCurrentOrgMembers } = useOrganization({
    token: appToken,
    current_organization,
  });

  // Fetch organization members to map user_id to email
  useEffect(() => {
    const fetchMembers = async () => {
      if (!current_organization?.org_id) return;
      try {
        const res = await getCurrentOrgMembers();
        const members: ITeamMember[] = res.data || [];
        const map: UserMap = {};
        members.forEach((member) => {
          if (member.user_id) {
            map[member.user_id] = {
              email: member.email,
              name: member.name || "",
            };
          }
        });
        setUserMap(map);
      } catch (error) {
        console.error("Failed to fetch org members:", error);
      }
    };
    fetchMembers();
  }, [current_organization?.org_id]);

  const {
    data: logsData,
    isLoading: isLoadingLogs,
    isRefetching: isRefetchingLogs,
    refetch: refetchLogs,
  } = useAuditLogs(apiKey, {
    ...filters,
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useAuditStats(
    apiKey,
    filters.start_time,
    filters.end_time
  );

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    refetchLogs();
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.user_id) count++;
    if (filters.action) count++;
    if (filters.resource_type) count++;
    if (filters.result) count++;
    if (filters.start_time || filters.end_time) count++;
    return count;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 p-6"
    >
      <div className="flex items-center gap-4">
        <Link to={Path.MANAGE}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-xl font-bold">Audit Logs</p>
          <p className="text-sm text-muted-foreground">
            Monitor and track all activities within your organization
          </p>
        </div>
      </div>
      <Separator className="bg-secondary" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <AuditLogsFilters
              filters={filters}
              onApplyFilters={handleFiltersChange}
              activeFilterCount={activeFilterCount}
              userMap={userMap}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetchingLogs}
              className="gap-2"
            >
              <RefreshCw
                className={`size-4 ${isRefetchingLogs ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <AuditLogStats stats={statsData} isLoading={isLoadingStats} />

          {statsData && (
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border p-4">
                <h3 className="mb-4 font-semibold">Events by Action</h3>
                <div className="space-y-2">
                  {Object.entries(statsData.events_by_action)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([action, count]) => (
                      <div
                        key={action}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {action.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(count / statsData.total_events) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-sm text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="mb-4 font-semibold">Events by Resource</h3>
                <div className="space-y-2">
                  {Object.entries(statsData.events_by_resource)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([resource, count]) => (
                      <div
                        key={resource}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {resource.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(count / statsData.total_events) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-sm text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <AuditLogsTable
            logs={logsData?.logs ?? []}
            total={logsData?.total ?? 0}
            isLoading={isLoadingLogs}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            userMap={userMap}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AuditLogsPage;

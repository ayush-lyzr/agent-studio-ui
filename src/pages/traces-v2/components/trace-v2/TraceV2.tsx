import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "@/components/loader";
import useStore from "@/lib/store";
import { getRootSpans, Trace, TraceFilters } from "../../trace.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import TraceFiltersComponent from './TraceFilters';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useManageAdminStore } from '@/pages/manage-admin/manage-admin.store';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/pages/organization/org.service';
import { CREDITS_DIVISOR } from '@/lib/constants';

// Special value to indicate "all users" (intentionally no filter)
const ALL_USERS = "all";

// Helper to parse filters from URL search params
const parseFiltersFromUrl = (
  searchParams: URLSearchParams,
): { filters: TraceFilters; hasUserFilter: boolean } => {
  const filters: TraceFilters = {};
  let hasUserFilter = false;

  if (searchParams.get("agent_id"))
    filters.agent_id = searchParams.get("agent_id")!;
  if (searchParams.get("trace_id"))
    filters.trace_id = searchParams.get("trace_id")!;
  if (searchParams.get("session_id"))
    filters.session_id = searchParams.get("session_id")!;

  // Check for query_user_id - "all" means intentionally no user filter
  const queryUserId = searchParams.get("query_user_id");
  if (queryUserId) {
    hasUserFilter = true;
    if (queryUserId !== ALL_USERS) {
      filters.query_user_id = queryUserId;
    }
    // If queryUserId is "all", we don't set it in filters (empty = all users)
  }

  if (searchParams.get("start_time"))
    filters.start_time = searchParams.get("start_time")!;
  if (searchParams.get("end_time"))
    filters.end_time = searchParams.get("end_time")!;

  return { filters, hasUserFilter };
};

// Helper to update URL search params from filters
const updateUrlWithFilters = (
  filters: TraceFilters,
  setSearchParams: (params: URLSearchParams) => void,
  explicitlyAllUsers: boolean = false,
) => {
  const params = new URLSearchParams();

  if (filters.agent_id) params.set("agent_id", filters.agent_id);
  if (filters.trace_id) params.set("trace_id", filters.trace_id);
  if (filters.session_id) params.set("session_id", filters.session_id);

  // Set query_user_id - use "all" if user explicitly cleared the filter
  if (filters.query_user_id) {
    params.set("query_user_id", filters.query_user_id);
  } else if (explicitlyAllUsers) {
    params.set("query_user_id", ALL_USERS);
  }

  if (filters.start_time) params.set("start_time", filters.start_time);
  if (filters.end_time) params.set("end_time", filters.end_time);

  setSearchParams(params);
};

const TraceV2 = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiKey = useStore((state) => state.api_key);
  const { current_organization } = useManageAdminStore();
  const { userId } = useCurrentUser();
  const { getToken, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Initialize filters from URL on mount
  const getInitialState = () => {
    const { filters, hasUserFilter } = parseFiltersFromUrl(searchParams);
    return { filters, hasUserFilter };
  };

  const initialState = getInitialState();
  const [filters, setFilters] = useState<TraceFilters>(initialState.filters);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [hasInitializedUser, setHasInitializedUser] = useState(false);
  // Track if user explicitly set "all users" - preserve this choice
  const [explicitlyAllUsers, setExplicitlyAllUsers] = useState(
    initialState.hasUserFilter && !initialState.filters.query_user_id,
  );

  // Roles that can view traces across the organization
  const adminRoles = ["role_owner", "role_admin", "owner", "admin"];
  const isAdminRole = adminRoles.includes(current_organization?.role || "");

  // Fetch organization members
  const { getCurrentOrgMembers } = useOrganization({
    token: getToken()!,
    current_organization,
  });

  // Fetch members when org changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (!current_organization?.org_id) return;
      if (orgMembers.length > 0) return; // Don't fetch if already loaded

      try {
        const res = await getCurrentOrgMembers();
        setOrgMembers(res.data || []);
      } catch (error) {
        console.error("Error fetching org members:", error);
      }
    };

    fetchMembers();
  }, [current_organization?.org_id]);

  // Set default query_user_id only once when userId is available and URL doesn't have explicit user choice
  useEffect(() => {
    if (userId && !hasInitializedUser) {
      const { hasUserFilter } = parseFiltersFromUrl(searchParams);
      // Only set default if URL doesn't have any user filter choice
      if (!hasUserFilter) {
        setFilters((prev) => ({
          ...prev,
          query_user_id: userId,
        }));
      }
      setHasInitializedUser(true);
    }
  }, [userId, hasInitializedUser, searchParams]);

  // Update URL when filters change (only after user initialization)
  useEffect(() => {
    if (hasInitializedUser) {
      updateUrlWithFilters(filters, setSearchParams, explicitlyAllUsers);
    }
  }, [filters, hasInitializedUser, explicitlyAllUsers]);

  const offset = page * pageSize;
  const { data, loading, error, refetch, isRefetching } = getRootSpans(
    apiKey,
    pageSize,
    offset,
    filters,
  );

  const handleApplyFilters = (newFilters: TraceFilters) => {
    // Non-admin users must have their user_id in filters
    const filtersToApply =
      !isAdminRole && userId
        ? { ...newFilters, query_user_id: userId }
        : newFilters;

    // Track if admin explicitly chose "all users" (no query_user_id)
    if (isAdminRole && !newFilters.query_user_id) {
      setExplicitlyAllUsers(true);
    } else {
      setExplicitlyAllUsers(false);
    }

    setFilters(filtersToApply);
    setPage(0); // Reset to first page when applying filters
  };

  const handleClearFilters = () => {
    // Default to current user when clearing filters
    const clearedFilters = userId ? { query_user_id: userId } : {};

    setExplicitlyAllUsers(false); // Reset to default behavior
    setFilters(clearedFilters);
    setPage(0);
  };

  // Show loader while auth is initializing or API key is not yet available
  if (authLoading || (!apiKey && loading)) {
    return <Loader />;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading traces: {error.message}
      </div>
    );
  }

  const traces: Trace[] = data || [];

  const formatTimestamp = (timestamp: string) => {
    // Append 'Z' if timestamp doesn't have timezone indicator to treat as UTC
    const utcTimestamp =
      timestamp.endsWith("Z") ||
      timestamp.includes("+") ||
      timestamp.includes("-", 10)
        ? timestamp
        : timestamp + "Z";
    const date = new Date(utcTimestamp);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (durationSeconds: number) => {
    if (durationSeconds < 60) {
      return `${durationSeconds.toFixed(2)} s`;
    }
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = (durationSeconds % 60).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };

  const formatCost = (cost: number | null | undefined) => {
    if (cost === null || cost === undefined) return "0.0000";
    return `${(cost / CREDITS_DIVISOR).toFixed(4)}`;
  };

  const handleRowClick = (traceId: string) => {
    // Preserve current filter params when navigating to trace view
    const currentParams = new URLSearchParams();
    if (filters.agent_id) currentParams.set("agent_id", filters.agent_id);
    if (filters.trace_id) currentParams.set("trace_id", filters.trace_id);
    if (filters.session_id) currentParams.set("session_id", filters.session_id);
    if (filters.query_user_id)
      currentParams.set("query_user_id", filters.query_user_id);
    else if (explicitlyAllUsers) currentParams.set("query_user_id", "all");
    if (filters.start_time) currentParams.set("start_time", filters.start_time);
    if (filters.end_time) currentParams.set("end_time", filters.end_time);

    const queryString = currentParams.toString();
    const url = queryString
      ? `/traces/${traceId}?${queryString}`
      : `/traces/${traceId}`;
    navigate(url);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Root Traces</h2>
        <div className="flex gap-2">
          <TraceFiltersComponent
            filters={filters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            orgMembers={orgMembers}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Tokens (In/Out)</TableHead>
            <TableHead>Trace ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {traces.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No traces found
              </TableCell>
            </TableRow>
          ) : (
            traces.map((trace) => (
              <TableRow
                key={trace.trace_id}
                onClick={() => handleRowClick(trace.trace_id)}
                className="cursor-pointer hover:bg-secondary/50"
              >
                <TableCell className="font-medium">{trace.name}</TableCell>
                <TableCell className="text-xs">
                  {formatTimestamp(trace.trace_start_time)}
                </TableCell>
                <TableCell>{formatDuration(trace.trace_duration)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatCost(trace.action_cost)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {trace.llm_input_tokens} / {trace.llm_output_tokens}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {trace.trace_id.substring(0, 8)}...
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || isRefetching}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={traces.length < pageSize || isRefetching}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceV2;

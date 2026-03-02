import { useState, useEffect } from 'react';
import { Filter, X, Search, Loader2, CalendarIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import axios from '@/lib/axios';
import useStore from '@/lib/store';
import { AnalyticsFilters as AnalyticsFiltersType } from '../../trace.service';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useManageAdminStore } from '@/pages/manage-admin/manage-admin.store';
import { IS_ENTERPRISE_DEPLOYMENT } from '@/lib/constants';

interface AgentSearchResult {
    id: string;
    name: string;
    type: string;
}

interface AnalyticsFiltersProps {
    filters: AnalyticsFiltersType;
    onApplyFilters: (filters: AnalyticsFiltersType) => void;
    onClearFilters: () => void;
    orgMembers: any[];
}

const AnalyticsFiltersComponent: React.FC<AnalyticsFiltersProps> = ({
    filters,
    onApplyFilters,
    onClearFilters,
    orgMembers,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState<AnalyticsFiltersType>(filters);

    // Minimum date for traces-v2 analytics - February 3, 2026
    const MIN_TRACE_DATE = new Date('2026-02-03T00:00:00');

    // Get API key from store
    const apiKey = useStore(state => state.api_key);

    // Agent search state
    const [agentSearchQuery, setAgentSearchQuery] = useState('');
    const [agentSearchResults, setAgentSearchResults] = useState<AgentSearchResult[]>([]);
    const [isSearchingAgents, setIsSearchingAgents] = useState(false);
    const [selectedAgentName, setSelectedAgentName] = useState<string>('');
    const [showAgentDropdown, setShowAgentDropdown] = useState(false);

    // Only sync tempFilters when the applied filters change from parent
    useEffect(() => {
        setTempFilters(filters);
    }, [JSON.stringify(filters)]);

    // Debounced agent search
    useEffect(() => {
        const searchAgents = async () => {
            if (!agentSearchQuery.trim()) {
                setAgentSearchResults([]);
                return;
            }

            // Don't search if API key is not available yet
            if (!apiKey) {
                return;
            }

            setIsSearchingAgents(true);
            try {
                const response = await axios.get('/user-assets/search', {
                    params: {
                        q: agentSearchQuery,
                        page: 1,
                        limit: 20,
                    },
                    headers: {
                        'x-api-key': apiKey,
                    },
                });
                // Filter only agents from results
                const agents = (response.data?.assets || [])
                    .filter((asset: AgentSearchResult) => asset.type === 'agent');
                setAgentSearchResults(agents);
            } catch (error) {
                console.error('Error searching agents:', error);
                setAgentSearchResults([]);
            } finally {
                setIsSearchingAgents(false);
            }
        };

        const debounceTimer = setTimeout(searchAgents, 300);
        return () => clearTimeout(debounceTimer);
    }, [agentSearchQuery, apiKey]);

    // Get current user and organization
    const { userId } = useCurrentUser();
    const { current_organization } = useManageAdminStore();

    // Roles that can view analytics across the organization
    const adminRoles = ["role_owner", "role_admin", "owner", "admin"];
    const isAdminRole = adminRoles.includes(current_organization?.role || "");

    // Automatically add query_user_id filter for non-admin users only
    useEffect(() => {
        // Non-admin users should only see their own analytics
        if (!isAdminRole && userId) {
            setTempFilters((prev) => ({
                ...prev,
                query_user_id: userId,
            }));
        }
    }, [isAdminRole, userId]);

    const handleApply = () => {
        // Validate date range doesn't exceed 31 days
        if (tempFilters.start_time && tempFilters.end_time) {
            const daysDiff = differenceInDays(
                new Date(tempFilters.end_time),
                new Date(tempFilters.start_time)
            );
            if (daysDiff > 31) {
                return; // Don't apply if date range exceeds 31 days
            }
        }

        // Non-admin users must have their user_id in filters
        const filtersToApply =
            !isAdminRole && userId
                ? { ...tempFilters, query_user_id: userId }
                : tempFilters;

        onApplyFilters(filtersToApply);
        setIsOpen(false);
    };

    const handleClear = () => {
        // Non-admin users must keep query_user_id
        const clearedFilters =
            !isAdminRole && userId ? { query_user_id: userId } : {};

        setTempFilters(clearedFilters);
        onClearFilters();
        setIsOpen(false);
    };

    // Count active filters
    const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
        if (key === 'days') return false; // Ignore days field
        return val && String(val).trim() !== '';
    }).length;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Filter Analytics</SheetTitle>
                    <SheetDescription>
                        Apply filters to customize your analytics dashboard
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-6">
                    {/* Date Range Filter */}
                    <div className="space-y-3">
                        <Label>Date Range</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Start Date */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">From</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !tempFilters.start_time && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {tempFilters.start_time
                                                ? format(new Date(tempFilters.start_time), "PPP")
                                                : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={tempFilters.start_time ? new Date(tempFilters.start_time) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    // Set to start of day
                                                    date.setHours(0, 0, 0, 0);
                                                    setTempFilters((prev) => ({
                                                        ...prev,
                                                        start_time: date.toISOString(),
                                                    }));
                                                }
                                            }}
                                            disabled={(date) => {
                                                // Can't select dates before Feb 3, 2026
                                                if (date < MIN_TRACE_DATE) return true;
                                                // Can't select future dates
                                                if (date > new Date()) return true;
                                                // If end_time is set, can't select more than 31 days before it
                                                if (tempFilters.end_time) {
                                                    const endDate = new Date(tempFilters.end_time);
                                                    const minDate = subDays(endDate, 31);
                                                    if (date < minDate) return true;
                                                }
                                                return false;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">To</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !tempFilters.end_time && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {tempFilters.end_time
                                                ? format(new Date(tempFilters.end_time), "PPP")
                                                : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={tempFilters.end_time ? new Date(tempFilters.end_time) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    // Set to end of day
                                                    date.setHours(23, 59, 59, 999);
                                                    setTempFilters((prev) => ({
                                                        ...prev,
                                                        end_time: date.toISOString(),
                                                    }));
                                                }
                                            }}
                                            disabled={(date) => {
                                                // Can't select dates before Feb 3, 2026
                                                if (date < MIN_TRACE_DATE) return true;
                                                // Can't select future dates
                                                if (date > new Date()) return true;
                                                // If start_time is set, can't select more than 31 days after it
                                                if (tempFilters.start_time) {
                                                    const startDate = new Date(tempFilters.start_time);
                                                    // Can't select before start date
                                                    if (date < startDate) return true;
                                                    // Can't select more than 31 days after start
                                                    const maxDate = new Date(startDate);
                                                    maxDate.setDate(maxDate.getDate() + 31);
                                                    if (date > maxDate) return true;
                                                }
                                                return false;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        {/* Date range validation message */}
                        {tempFilters.start_time && tempFilters.end_time && (
                            (() => {
                                const daysDiff = differenceInDays(
                                    new Date(tempFilters.end_time),
                                    new Date(tempFilters.start_time)
                                );
                                if (daysDiff > 31) {
                                    return (
                                        <div className="flex items-center gap-2 text-destructive text-xs">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Date range cannot exceed 31 days</span>
                                        </div>
                                    );
                                }
                                return (
                                    <p className="text-xs text-muted-foreground">
                                        Selected range: {daysDiff + 1} day{daysDiff !== 0 ? 's' : ''}
                                    </p>
                                );
                            })()
                        )}
                        {!tempFilters.start_time && !tempFilters.end_time && !IS_ENTERPRISE_DEPLOYMENT && (
                            <p className="text-xs text-muted-foreground">
                                The current date filter applies to dates above Feb 3, 2026.
                                To view traces older than Feb 3, 2026,{' '}
                                <Link
                                    to="/traces-v1?tab=analytics"
                                    className="underline hover:text-foreground"
                                    onClick={() => setIsOpen(false)}
                                >
                                    click here
                                </Link>
                            </p>
                        )}
                    </div>

                    {/* Agent Name Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="agent_name">Agent Name</Label>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="agent_name"
                                    placeholder="Search agents..."
                                    value={selectedAgentName || agentSearchQuery}
                                    onChange={(e) => {
                                        setAgentSearchQuery(e.target.value);
                                        setSelectedAgentName('');
                                        setShowAgentDropdown(true);
                                        if (!e.target.value) {
                                            setTempFilters((prev) => ({
                                                ...prev,
                                                agent_id: undefined,
                                            }));
                                        }
                                    }}
                                    onFocus={() => setShowAgentDropdown(true)}
                                    className="pl-9"
                                />
                                {isSearchingAgents && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {selectedAgentName && !isSearchingAgents && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAgentName('');
                                            setAgentSearchQuery('');
                                            setTempFilters((prev) => ({
                                                ...prev,
                                                agent_id: undefined,
                                            }));
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {showAgentDropdown && agentSearchQuery && !selectedAgentName && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {isSearchingAgents ? (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                                            Searching...
                                        </div>
                                    ) : agentSearchResults.length > 0 ? (
                                        agentSearchResults.map((agent) => (
                                            <button
                                                key={agent.id}
                                                type="button"
                                                onClick={() => {
                                                    setTempFilters((prev) => ({
                                                        ...prev,
                                                        agent_id: agent.id,
                                                    }));
                                                    setSelectedAgentName(agent.name);
                                                    setAgentSearchQuery('');
                                                    setShowAgentDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                            >
                                                {agent.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            No agents found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Search and filter analytics by agent name
                        </p>
                    </div>

                    {/* User ID Filter - Only show for admin/owner roles */}
                    {isAdminRole && (
                        <div className="space-y-2">
                            <Label htmlFor="query_user_id">User</Label>
                            <Select
                                value={tempFilters.query_user_id || 'all'}
                                onValueChange={(value) => {
                                    setTempFilters((prev) => ({
                                        ...prev,
                                        query_user_id: value === 'all' ? undefined : value,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {orgMembers.map((member) => (
                                        <SelectItem key={member.user_id} value={member.user_id}>
                                            {member.name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Filter analytics by team member
                            </p>
                        </div>
                    )}

                    {/* Session ID Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="session_id">Session ID</Label>
                        <Input
                            id="session_id"
                            placeholder="Enter session ID"
                            value={tempFilters.session_id || ''}
                            onChange={(e) =>
                                setTempFilters((prev) => ({
                                    ...prev,
                                    session_id: e.target.value || undefined,
                                }))
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Filter analytics by session
                        </p>
                    </div>
                </div>

                <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={handleClear} className="gap-2">
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                    <Button onClick={handleApply}>Apply Filters</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default AnalyticsFiltersComponent;

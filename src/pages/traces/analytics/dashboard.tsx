import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditUsageChart } from "./line-chart";
import LineChartWithLabel from "./line-chart-label";
import { BarChartWithLabel } from "./bar-chart";
import useStore from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { DateRange } from "react-day-picker";
import { ChevronDown, ListFilter } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { PlanType } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";

const Dashboard = () => {
  const { api_key: apiKey, agents } = useStore((state) => state);
  const [searchParams] = useSearchParams();

  // Maximum date for traces - February 3, 2026
  const MAX_TRACE_DATE = new Date('2026-02-03T23:59:59');

  // Get agent ID from URL parameters
  const getDefaultAgentId = () => {
    const agentIdFromParams = searchParams.get("agent_id");
    if (
      agentIdFromParams &&
      agents.some((agent) => agent._id === agentIdFromParams)
    ) {
      return agentIdFromParams;
    }
    return "";
  };

  // Set default date range to last 7 days from today (capped at MAX_TRACE_DATE)
  const getDefaultDateRange = () => {
    const today = new Date();
    const effectiveToday = today > MAX_TRACE_DATE ? MAX_TRACE_DATE : today;
    const sevenDaysAgo = new Date(effectiveToday);
    sevenDaysAgo.setDate(effectiveToday.getDate() - 7);
    return {
      from: sevenDaysAgo,
      to: effectiveToday,
    };
  };

  const [date, setDate] = useState<DateRange | undefined>(
    getDefaultDateRange(),
  );
  const [month, setMonth] = useState(new Date());

  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [upgradeVisible, setUpgradeVisible] = useState<boolean>(false);
  const [showRangeWarning, setShowRangeWarning] = useState<boolean>(false);
  const [agentPopoverOpen, setAgentPopoverOpen] = useState<boolean>(false);

  const [selectedAgent, setSelectedAgent] =
    useState<string>(getDefaultAgentId());
  const [filter, setFilter] = useState<boolean>(false);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const usage_data = useManageAdminStore((state) => state.usage_data);

  const isPlanBlocked = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  const { isPending, mutateAsync: fetchDashboardData } = useMutation({
    mutationFn: ({ date, agent_id }: { date: DateRange; agent_id?: string }) =>
      axios.get("/ops/dashboard", {
        headers: {
          "x-api-key": apiKey,
        },
        params: {
          start_date: date.from?.toISOString().split("T")[0],
          end_date: date.to?.toISOString().split("T")[0],
          agent_id,
        },
      }),
    onSuccess: (response) => {
      setDashboardData(response.data.line_chart_data);
      setBarChartData(response.data.bar_chart_data);
    },
  });

  // Update selected agent when URL parameters change
  useEffect(() => {
    const agentIdFromParams = searchParams.get("agent_id");
    if (
      agentIdFromParams &&
      agents.some((agent) => agent._id === agentIdFromParams)
    ) {
      setSelectedAgent(agentIdFromParams);
    }
  }, [searchParams, agents]);

  // Set mounted flag on first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchDashboardData({
        date: date!,
        agent_id: selectedAgent,
      });
    }
  }, [filter, selectedAgent, isMounted]);

  // Disable future dates and dates after Feb 2, 2026
  const disabledDates = {
    after: MAX_TRACE_DATE,
  };

  // Custom date selection handler to limit range to 31 days and cap at MAX_TRACE_DATE
  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate?.from) {
      setDate(selectedDate);
      setShowRangeWarning(false);
      return;
    }

    // If only start date is selected
    if (selectedDate.from && !selectedDate.to) {
      setDate(selectedDate);
      setShowRangeWarning(false);
      return;
    }

    // If both dates are selected, check the range
    if (selectedDate.from && selectedDate.to) {
      // Cap the end date at MAX_TRACE_DATE
      let cappedToDate = selectedDate.to;
      if (selectedDate.to > MAX_TRACE_DATE) {
        cappedToDate = MAX_TRACE_DATE;
      }

      const daysDiff = Math.ceil(
        (cappedToDate.getTime() - selectedDate.from.getTime()) /
        (1000 * 60 * 60 * 24),
      );

      // If range is more than 31 days, adjust the end date
      if (daysDiff > 31) {
        const adjustedEndDate = new Date(selectedDate.from);
        adjustedEndDate.setDate(selectedDate.from.getDate() + 31);
        // Ensure adjusted date doesn't exceed MAX_TRACE_DATE
        const finalEndDate = adjustedEndDate > MAX_TRACE_DATE ? MAX_TRACE_DATE : adjustedEndDate;
        setDate({
          from: selectedDate.from,
          to: finalEndDate,
        });
        setShowRangeWarning(true);
        // Hide warning after 3 seconds
        setTimeout(() => setShowRangeWarning(false), 3000);
      } else {
        setDate({
          from: selectedDate.from,
          to: cappedToDate,
        });
        setShowRangeWarning(false);
      }
    }
  };

  const getDateRangeText = (input_date?: DateRange) => {
    const dateRange = input_date?.from ? input_date : date;
    if (!dateRange?.from) return "Select dates";
    if (!dateRange.to)
      return `Start: ${format(dateRange.from, "MMM dd, yyyy")}`;
    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold">Dashboard</p>
        <div className="flex items-center gap-2">
          {isPlanBlocked && (
            <div className="flex items-center gap-2 rounded-md border p-1.5">
              <Badge
                variant="premium"
                className="cursor-pointer"
                onClick={() => setUpgradeVisible(true)}
              >
                Upgrade
              </Badge>
              <p className="text-sm">to access traces older than 7 days.</p>
            </div>
          )}
          <div>
            <Popover open={agentPopoverOpen} onOpenChange={setAgentPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={agentPopoverOpen}
                  className="flex  justify-between px-3"
                >
                  <div className="mr-2 min-w-0 flex-1 truncate">
                    {selectedAgent
                      ? agents.find((agent) => agent._id === selectedAgent)
                        ?.name
                      : "By Agent"}
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="relative right-8 w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search agents..." />
                  <CommandList>
                    <CommandEmpty>No agent found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedAgent("");
                          setAgentPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedAgent === "" ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate text-muted-foreground">
                          No Agent
                        </span>
                      </CommandItem>
                      {agents.map((agent) => (
                        <CommandItem
                          key={agent._id}
                          onSelect={() => {
                            setSelectedAgent(agent._id);
                            setAgentPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedAgent === agent._id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">{agent.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {!isPlanBlocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarVisible(true)}
            >
              <ListFilter className="mr-2 size-4" />
              {getDateRangeText(date)}
            </Button>
          )}
        </div>
      </div>

      {isPending ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <CreditUsageChart data={dashboardData} />
          <div className="grid grid-cols-2 gap-4">
            <LineChartWithLabel
              title="Average Latency"
              description="Average latency of the agents"
              data={dashboardData}
              chartConfig={{
                avg_latency_ms: {
                  label: "Average Latency (ms)",
                  color: "hsl(var(--chart-1))",
                },
              }}
              dataKey="avg_latency_ms"
              calculation="avg"
            />

            <LineChartWithLabel
              title="Total Sessions"
              description="2883"
              data={dashboardData}
              chartConfig={{
                total_sessions: {
                  label: "Sessions",
                  color: "hsl(var(--chart-2))",
                },
              }}
              dataKey="total_sessions"
              calculation="sum"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <LineChartWithLabel
              title="Total Traces"
              description="2883"
              data={dashboardData}
              chartConfig={{
                total_traces: {
                  label: "Total Traces",
                  color: "hsl(var(--chart-4))",
                },
              }}
              dataKey="total_traces"
              calculation="sum"
            />
          </div>
          <BarChartWithLabel data={barChartData} />
        </div>
      )}

      <Dialog open={calendarVisible} onOpenChange={setCalendarVisible}>
        <DialogContent className="w-full sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Set date range</DialogTitle>
            <DialogDescription>
              {getDateRangeText()}
              <br />
              <span className="text-xs text-muted-foreground">
                Maximum range: 31 days • Data available until Feb 3, 2026
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full place-items-center gap-4">
            <Calendar
              mode="range"
              className="w-full"
              selected={date}
              onSelect={handleDateSelect}
              showOutsideDays={false}
              month={month}
              onMonthChange={(e) => setMonth(e)}
              numberOfMonths={2}
              disabled={disabledDates}
            />
            {showRangeWarning && (
              <div className="w-full rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Date range adjusted to maximum 31 days
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDate(getDefaultDateRange());
                  setShowRangeWarning(false);
                }}
              >
                Reset to Default
              </Button>
              <Button
                onClick={() => {
                  setFilter(!filter);
                  setCalendarVisible(false);
                }}
                disabled={isPending || !date?.from || !date?.to}
              >
                Apply filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <NeedsUpgrade
        open={upgradeVisible}
        onOpen={setUpgradeVisible}
        title="Traces"
        description="To view traces beyond 7 days, upgrading to custom plan is required."
      />
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Skeleton for CreditUsageChart */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
        <Skeleton className="h-[250px] w-full" />
      </div>

      {/* Skeleton for the 2x2 grid of charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* First row */}
        <div className="rounded-lg border p-4">
          <div className="mb-4 flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Second row */}
        <div className="rounded-lg border p-4">
          <div className="mb-4 flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>

      {/* Skeleton for BarChartWithLabel */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
        <Skeleton className="h-[250px] w-full" />
      </div>
    </div>
  );
};
export default Dashboard;

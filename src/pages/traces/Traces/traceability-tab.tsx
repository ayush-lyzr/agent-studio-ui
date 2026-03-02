import { useEffect, useState, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Trace, traceColumns } from "./trace-columns";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { TableLoading } from "@/components/ui/table-loading";
import useStore from "@/lib/store";
import TracePagination from "./trace-pagination";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  Dialog,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { PlanType } from "@/lib/constants";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { Badge } from "@/components/ui/badge";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { useAgentBuilder } from "@/pages/agent-builder/agent-builder.service";
import { IAgent } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

const TraceabilityTab = memo(() => {
  const apiKey = useStore((state) => state.api_key);
  const { loading: authLoading } = useAuth();
  const { isFetchingAgents, getAgents } = useAgentBuilder({ apiKey });
  const [searchParams] = useSearchParams();

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

  const [agents, setAgents] = useState<IAgent[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    itemsPerPage: 15,
    totalItems: 0,
    totalPages: 0,
  });

  const { isPending: isFetchingTraces, mutateAsync: fetchTraces } = useMutation(
    {
      mutationKey: ["getTraces"],
      mutationFn: () =>
        axios.get("/ops/traces", {
          headers: {
            "x-api-key": apiKey,
          },
          params: {
            agent_id: selectedAgent,
            start_date: date?.from?.toISOString(),
            end_date: date?.to?.toISOString(),
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            count: true,
          },
        }),
      onSuccess: (res: AxiosResponse) => {
        const traces = res.data.traces;
        const count = res.data.count;
        setTraces(traces);
        setPagination({
          currentPage: pagination.currentPage,
          itemsPerPage: pagination.itemsPerPage,
          totalItems: count,
          totalPages: Math.ceil(count / pagination.itemsPerPage),
        });
      },
    },
  );

  const fetchAgents = async () => {
    try {
      const res = await getAgents();
      setAgents(res.data);
    } catch (error) {
      console.log("Error fetching agents in traces page => ", error);
    }
  };

  const [selectedAgent, setSelectedAgent] =
    useState<string>(getDefaultAgentId());
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [month, setMonth] = useState(new Date());
  const [filter, setFilter] = useState<boolean>(false);
  const [showRangeWarning, setShowRangeWarning] = useState<boolean>(false);
  const [agentPopoverOpen, setAgentPopoverOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [upgradeVisible, setUpgradeVisible] = useState<boolean>(false);

  const usage_data = useManageAdminStore((state) => state.usage_data);

  const isPlanBlocked = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  // Set default date range to last 30 days from today
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      from: thirtyDaysAgo,
      to: today,
    };
  };

  const [date, setDate] = useState<DateRange | undefined>(
    getDefaultDateRange(),
  );

  const getDateRangeText = (input_date?: DateRange) => {
    const range = input_date || date;
    if (!range?.from) return "Select dates";
    if (!range.to) return `Start: ${format(range.from, "MMM dd, yyyy")}`;
    return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
  };

  // Disable future dates
  const disabledDates = {
    after: new Date(),
  };

  // Custom date selection handler to limit range to 31 days
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
      const daysDiff = Math.ceil(
        (selectedDate.to.getTime() - selectedDate.from.getTime()) /
        (1000 * 60 * 60 * 24),
      );

      // If range is more than 31 days, adjust the end date
      if (daysDiff > 31) {
        const adjustedEndDate = new Date(selectedDate.from);
        adjustedEndDate.setDate(selectedDate.from.getDate() + 31);
        setDate({
          from: selectedDate.from,
          to: adjustedEndDate,
        });
        setShowRangeWarning(true);
        // Hide warning after 3 seconds
        setTimeout(() => setShowRangeWarning(false), 3000);
      } else {
        setDate(selectedDate);
        setShowRangeWarning(false);
      }
    }
  };

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

  // Only fetch when auth is ready, API key exists, and component is mounted
  useEffect(() => {
    if (isMounted && !authLoading && apiKey) {
      fetchTraces();
      fetchAgents();
    }
  }, [pagination.currentPage, filter, selectedAgent, isMounted, authLoading, apiKey]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
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
        <div className="flex space-x-2">
          <Popover open={agentPopoverOpen} onOpenChange={setAgentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={agentPopoverOpen}
                className="flex w-[200px] justify-between px-3"
              >
                <div className="mr-2 min-w-0 flex-1 truncate">
                  {selectedAgent
                    ? agents.find((agent) => agent._id === selectedAgent)?.name
                    : "Select Agent"}
                </div>
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
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
                    {isFetchingAgents ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      agents.map((agent) => (
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
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {!isPlanBlocked && (
            <Button
              className="flex items-center gap-2"
              variant={"outline"}
              onClick={() => setCalendarVisible(true)}
            >
              <CalendarIcon className="h-4 w-4" />
              <p>Date</p>
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {isFetchingTraces ? (
          <TableLoading columns={traceColumns.length} />
        ) : (
          <DataTable
            columns={traceColumns}
            data={traces}
            pageSize={pagination.itemsPerPage}
          />
        )}
        <TracePagination
          currentPage={pagination.currentPage}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          setCurrentPage={(page) =>
            setPagination((prev) => ({ ...prev, currentPage: page }))
          }
        />
      </div>

      <Dialog open={calendarVisible} onOpenChange={setCalendarVisible}>
        <DialogContent className="w-full sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Set date range</DialogTitle>
            <DialogDescription>
              {getDateRangeText()}
              <br />
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full place-items-center gap-4">
            <Calendar
              mode="range"
              className="w-full"
              initialFocus
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
                disabled={!date?.from || !date?.to}
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
});

TraceabilityTab.displayName = "TraceabilityTab";

export default TraceabilityTab;

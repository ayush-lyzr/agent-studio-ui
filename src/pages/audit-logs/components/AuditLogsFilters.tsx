import { useState } from "react";
import { endOfDay, format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Filter, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  AuditAction,
  AuditLogFilters,
  AuditResource,
  AuditResult,
} from "../types";
import { UserMap } from "..";

interface AuditLogsFiltersProps {
  filters: AuditLogFilters;
  onApplyFilters: (filters: AuditLogFilters) => void;
  activeFilterCount: number;
  userMap: UserMap;
}

const actionOptions = [
  { value: AuditAction.CREATE, label: "Create" },
  { value: AuditAction.READ, label: "Read" },
  { value: AuditAction.UPDATE, label: "Update" },
  { value: AuditAction.DELETE, label: "Delete" },
  { value: AuditAction.EXECUTE, label: "Execute" },
  { value: AuditAction.LOGIN, label: "Login" },
  { value: AuditAction.LOGOUT, label: "Logout" },
  { value: AuditAction.ACCESS_DENIED, label: "Access Denied" },
  { value: AuditAction.EXPORT, label: "Export" },
  { value: AuditAction.IMPORT, label: "Import" },
  { value: AuditAction.PARSE, label: "Parse" },
  { value: AuditAction.TRAIN, label: "Train" },
  { value: AuditAction.UPLOAD, label: "Upload" },
  { value: AuditAction.DOWNLOAD, label: "Download" },
  { value: AuditAction.RESET, label: "Reset" },
  { value: AuditAction.SHARE, label: "Share" },
  { value: AuditAction.AUTH, label: "Auth" },
  { value: AuditAction.CLONE, label: "Clone" },
  { value: AuditAction.ADD, label: "Add" },
];

const resourceOptions = [
  { value: AuditResource.AGENT, label: "Agent" },
  { value: AuditResource.API, label: "API" },
  { value: AuditResource.VOICE_AGENT, label: "Voice Agent" },
  { value: AuditResource.TOOL, label: "Tool" },
  { value: AuditResource.PROVIDER, label: "Provider" },
  { value: AuditResource.SESSION, label: "Session" },
  { value: AuditResource.MESSAGE, label: "Message" },
  { value: AuditResource.KNOWLEDGE_BASE, label: "Knowledge Base" },
  { value: AuditResource.KNOWLEDGE_BASE_CREDENTIAL, label: "Knowledge Base Credential" },
  { value: AuditResource.KNOWLEDGE_GRAPH, label: "Knowledge Graph" },
  { value: AuditResource.SEMANTIC_DATA_MODEL, label: "Semantic Data Model" },
  { value: AuditResource.MEMORY, label: "Memory" },
  { value: AuditResource.ARTIFACT, label: "Artifact" },
  { value: AuditResource.WORKFLOW, label: "Workflow" },
  { value: AuditResource.CREDENTIAL, label: "Credential" },
  { value: AuditResource.USER, label: "User" },
  { value: AuditResource.ORGANIZATION, label: "Organization" },
  { value: AuditResource.API_KEY, label: "API Key" },
  { value: AuditResource.INFERENCE, label: "Inference" },
  { value: AuditResource.GUARDRAIL, label: "Guardrail" },
  { value: AuditResource.RAI_POLICY, label: "RAI Policy" },
  { value: AuditResource.HM_POLICY, label: "HM Policy" },
  { value: AuditResource.FOLDER, label: "Folder" },
  { value: AuditResource.CONTEXT, label: "Context" },
  { value: AuditResource.BLUEPRINT, label: "Blueprint" },
  { value: AuditResource.ENVIRONMENT, label: "Environment" },
  { value: AuditResource.PERSONA, label: "Persona" },
  { value: AuditResource.SCENARIO, label: "Scenario" },
  { value: AuditResource.SIMULATION, label: "Simulation" },
  { value: AuditResource.JOB, label: "Job" },
  { value: AuditResource.EVALUATION, label: "Evaluation" },
];

const resultOptions = [
  { value: AuditResult.SUCCESS, label: "Success" },
  { value: AuditResult.FAILURE, label: "Failure" },
  { value: AuditResult.BLOCKED, label: "Blocked" },
  { value: AuditResult.PARTIAL, label: "Partial" },
];

const AuditLogsFilters = ({
  filters,
  onApplyFilters,
  activeFilterCount,
  userMap,
}: AuditLogsFiltersProps) => {
  const userOptions = Object.entries(userMap).map(([userId, user]) => ({
    value: userId,
    label: user.email,
  }));
  const [isOpen, setIsOpen] = useState(false);
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (filters.start_time || filters.end_time) {
      return {
        from: filters.start_time ? new Date(filters.start_time) : undefined,
        to: filters.end_time ? new Date(filters.end_time) : undefined,
      };
    }
    return undefined;
  });

  const handleApply = () => {
    const updatedFilters: AuditLogFilters = {
      ...localFilters,
      start_time: dateRange?.from?.toISOString(),
      end_time: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
    };
    onApplyFilters(updatedFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalFilters({});
    setDateRange(undefined);
    onApplyFilters({});
    setIsOpen(false);
  };

  const updateFilter = (key: keyof AuditLogFilters, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="size-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Audit Logs</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down the audit log entries.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>User</Label>
            <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userComboboxOpen}
                  className="w-full justify-between font-normal"
                >
                  {localFilters.user_id
                    ? userOptions.find((user) => user.value === localFilters.user_id)?.label
                    : "All users"}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search user email..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("user_id", "all");
                          setUserComboboxOpen(false);
                        }}
                      >
                        All users
                        <Check
                          className={cn(
                            "ml-auto size-4",
                            !localFilters.user_id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                      {userOptions.map((user) => (
                        <CommandItem
                          key={user.value}
                          value={user.label}
                          onSelect={() => {
                            updateFilter("user_id", user.value);
                            setUserComboboxOpen(false);
                          }}
                        >
                          {user.label}
                          <Check
                            className={cn(
                              "ml-auto size-4",
                              localFilters.user_id === user.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={localFilters.action ?? "all"}
              onValueChange={(value) => updateFilter("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Resource Type</Label>
            <Select
              value={localFilters.resource_type ?? "all"}
              onValueChange={(value) => updateFilter("resource_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                {resourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Result</Label>
            <Select
              value={localFilters.result ?? "all"}
              onValueChange={(value) => updateFilter("result", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                {resultOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 size-4" />
            Reset
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AuditLogsFilters;

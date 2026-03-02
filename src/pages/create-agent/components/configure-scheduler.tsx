
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ExternalLink, PauseIcon, PlayIcon, Trash2Icon, X, ZapIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { ExtraComponentProps } from "@/data/features";
import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useSchedulerService, ScheduleResponse } from "./automation.service";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AxiosResponse } from "axios";

export interface SchedulerConfig {
  interval: "minutes" | "hours" | "months" | "days";
  interval_value: string;
  minutes_details?: {
    interval?: string;
    start_time?: string;
  };
  hours_details?: {
    interval?: string;
    start_time?: string;
    days?: string;
    minute?: string;
  };
  months_details?: {
    interval?: string;
    day?: string;
    time?: string;
    hour?: string;
    minute?: string;
  };
  days_details?: {
    selected_days?: number[];
    times?: Record<number, { time: string; period: "AM" | "PM" }>;
  };
}

type ScheduleInterval = "minutes" | "hours" | "months" | "days" | "cron";

interface ConfigureSchedulerProps extends ExtraComponentProps { }

interface TimeData {
  time: string;
  period: "AM" | "PM";
}

interface DayOption {
  value: number;
  label: string;
  short: string;
}

interface FieldRange {
  min: number;
  max: number;
  name: string;
}

interface CronValidationResult {
  valid: boolean;
  error?: string;
}

const SCHEDULE_LIMITS = {
  minutes: { min: 30, max: 60 },
  hours: { min: 1, max: 24 },
  months: { min: 1, max: 12 },
} as const;

const DAYS_OF_WEEK: readonly DayOption[] = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

const CRON_FIELD_RANGES: readonly FieldRange[] = [
  { min: 0, max: 59, name: "minute" },
  { min: 0, max: 23, name: "hour" },
  { min: 1, max: 31, name: "day of month" },
  { min: 1, max: 12, name: "month" },
  { min: 0, max: 7, name: "day of week" },
] as const;

const convert24To12 = (time24: string): TimeData => {
  if (!time24?.includes(":")) {
    return { time: "", period: "AM" };
  }

  const [hour, minute] = time24.split(":").map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    return { time: "", period: "AM" };
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return {
    time: `${hour12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    period,
  };
};

const convert12To24 = (time12: string, period: "AM" | "PM"): string => {
  if (!time12?.includes(":")) {
    return "";
  }

  const [hour, minute] = time12.split(":").map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    return "";
  }

  let hour24 = hour;

  if (period === "AM") {
    hour24 = hour === 12 ? 0 : hour;
  } else {
    hour24 = hour === 12 ? 12 : hour + 12;
  }

  return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const validateCronField = (
  field: string,
  range: FieldRange,
): CronValidationResult => {
  if (field === "*") return { valid: true };

  if (
    field === "?" &&
    (range.name === "day of month" || range.name === "day of week")
  ) {
    return { valid: true };
  }

  if (field.includes("/")) {
    const [base, step] = field.split("/");
    const stepNum = parseInt(step, 10);

    if (isNaN(stepNum) || stepNum <= 0) {
      return {
        valid: false,
        error: `Invalid step value in ${range.name} field: ${step}`,
      };
    }

    if (base !== "*" && !base.includes("-")) {
      const baseNum = parseInt(base, 10);
      if (isNaN(baseNum) || baseNum < range.min || baseNum > range.max) {
        return {
          valid: false,
          error: `Invalid value in ${range.name} field: ${base}`,
        };
      }
    }

    if (base.includes("-")) {
      const [start, end] = base.split("-").map((v) => parseInt(v, 10));
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < range.min ||
        end > range.max ||
        start > end
      ) {
        return {
          valid: false,
          error: `Invalid range in ${range.name} field: ${base}`,
        };
      }
    }

    return { valid: true };
  }

  if (field.includes("-")) {
    const [start, end] = field.split("-").map((v) => parseInt(v, 10));
    if (
      isNaN(start) ||
      isNaN(end) ||
      start < range.min ||
      end > range.max ||
      start > end
    ) {
      return {
        valid: false,
        error: `Invalid range in ${range.name} field: ${field}`,
      };
    }
    return { valid: true };
  }

  if (field.includes(",")) {
    const values = field.split(",").map((v) => parseInt(v, 10));
    for (const value of values) {
      if (isNaN(value) || value < range.min || value > range.max) {
        return {
          valid: false,
          error: `Invalid value in ${range.name} field list: ${value}`,
        };
      }
    }
    return { valid: true };
  }

  const num = parseInt(field, 10);
  if (isNaN(num) || num < range.min || num > range.max) {
    return {
      valid: false,
      error: `Invalid ${range.name} value: ${field}. Must be between ${range.min} and ${range.max}`,
    };
  }

  return { valid: true };
};

const validateCronExpression = (cron: string): CronValidationResult => {
  if (!cron?.trim()) {
    return { valid: false, error: "Cron expression is required" };
  }

  const trimmed = cron.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return {
      valid: false,
      error:
        "Cron expression must have exactly 5 fields (minute hour day month weekday)",
    };
  }

  for (let i = 0; i < parts.length; i++) {
    const result = validateCronField(parts[i], CRON_FIELD_RANGES[i]);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
};

const getDayLabel = (dayValue: number): string => {
  return (
    DAYS_OF_WEEK.find((d) => d.value === dayValue)?.label || "selected day"
  );
};

const normalizeDaysTimes = (
  daysDetails: any,
): { selected_days: number[]; times: Record<number, TimeData> } => {
  const normalized: Record<number, TimeData> = {};

  if (!daysDetails?.times) {
    return { selected_days: daysDetails?.selected_days || [], times: {} };
  }

  Object.entries(daysDetails.times).forEach(([key, value]) => {
    const dayKey = Number(key);

    if (typeof value === "string") {
      normalized[dayKey] = convert24To12(value);
    } else if (
      value &&
      typeof value === "object" &&
      "time" in value &&
      "period" in value
    ) {
      // @ts-ignore
      normalized[dayKey] = value;
    }
  });

  return {
    selected_days: daysDetails.selected_days || [],
    times: normalized,
  };
};

/**
 * Calculate the next execution time from a cron expression
 * Cron format: minute hour day-of-month month day-of-week
 */
const getNextExecutionTime = (cronExpression: string): Date | null => {
  if (!cronExpression?.trim()) return null;

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minutePart, hourPart, dayOfMonthPart, monthPart, dayOfWeekPart] = parts;

  const now = new Date();
  const maxIterations = 366 * 24 * 60; // Max 1 year of minutes to check
  let iterations = 0;

  // Start from the next minute
  const candidate = new Date(now);
  candidate.setSeconds(0);
  candidate.setMilliseconds(0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const matchesField = (value: number, field: string, min: number, max: number): boolean => {
    
    if (value < min || value > max) return false;

    if (field === "*") return true;

    // Handle step values like */5 or 1/10
    if (field.includes("/")) {
      const [base, stepStr] = field.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return false;

      // */n means "every n-th value starting from min"
      const startValue = base === "*" ? min : parseInt(base, 10);
      if (isNaN(startValue) || startValue < min || startValue > max) return false;
      return value >= startValue && (value - startValue) % step === 0;
    }

    // Handle ranges like 1-5
    if (field.includes("-") && !field.includes(",")) {
      const [startStr, endStr] = field.split("-");
      const start = Math.max(parseInt(startStr, 10), min);
      const end = Math.min(parseInt(endStr, 10), max);
      return value >= start && value <= end;
    }

    // Handle lists like 1,3,5
    if (field.includes(",")) {
      const values = field.split(",").map((v) => {
        if (v.includes("-")) {
          const [s, e] = v.split("-").map(Number);
          const range: number[] = [];
          for (let i = Math.max(s, min); i <= Math.min(e, max); i++) range.push(i);
          return range;
        }
        return [parseInt(v, 10)];
      }).flat().filter(n => n >= min && n <= max);
      return values.includes(value);
    }

    // Simple number
    const num = parseInt(field, 10);
    return !isNaN(num) && num >= min && num <= max && value === num;
  };

  while (iterations < maxIterations) {
    const minute = candidate.getMinutes();
    const hour = candidate.getHours();
    const dayOfMonth = candidate.getDate();
    const month = candidate.getMonth() + 1; // 1-12
    const dayOfWeek = candidate.getDay(); // 0-6 (Sunday = 0)

    const minuteMatches = matchesField(minute, minutePart, 0, 59);
    const hourMatches = matchesField(hour, hourPart, 0, 23);
    const monthMatches = matchesField(month, monthPart, 1, 12);

    // Day matching logic
    let dayMatches = false;
    const isDayOfMonthWildcard = dayOfMonthPart === "*";
    const isDayOfWeekWildcard = dayOfWeekPart === "*";

    // Check day of week (0-6, also handle 7 as Sunday)
    const dowValue = parseInt(dayOfWeekPart, 10);
    const dayOfWeekMatches =
      !isDayOfWeekWildcard &&
      (dayOfWeek === dowValue || (dowValue === 7 && dayOfWeek === 0) ||
        matchesField(dayOfWeek, dayOfWeekPart, 0, 6));

    // Check day of month
    const dayOfMonthMatches =
      !isDayOfMonthWildcard && matchesField(dayOfMonth, dayOfMonthPart, 1, 31);

    if (isDayOfMonthWildcard && isDayOfWeekWildcard) {
      dayMatches = true;
    } else if (isDayOfMonthWildcard) {
      dayMatches = dayOfWeekMatches;
    } else if (isDayOfWeekWildcard) {
      dayMatches = dayOfMonthMatches;
    } else {
      dayMatches = dayOfMonthMatches || dayOfWeekMatches;
    }

    if (minuteMatches && hourMatches && monthMatches && dayMatches) {
      return candidate;
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
    iterations++;
  }

  return null;
};

const formatNextExecution = (date: Date | null): string => {
  if (!date) return "";

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formSchema = z
  .object({
    name: z.string().min(1, "Message is required"),
    interval: z.enum(["minutes", "hours", "months", "days", "cron"]),
    minutes_interval: z.string().optional(),
    hours_interval: z.string().optional(),
    months_interval: z.string().optional(),
    days_interval: z.string().optional(),
    cron_expression: z.string().optional(),
    minutes_details: z.any().optional(),
    hours_details: z.any().optional(),
    months_details: z.any().optional(),
    days_details: z.any().optional(),
    max_retries: z.string().optional(),
    retry_delay: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.interval) {
      case "minutes": {
        if (!data.minutes_interval?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["minutes_interval"],
            message: "Interval is required",
          });
        } else {
          const num = Number(data.minutes_interval);
          if (
            isNaN(num) ||
            num < SCHEDULE_LIMITS.minutes.min ||
            num > SCHEDULE_LIMITS.minutes.max
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["minutes_interval"],
              message: `Interval must be between ${SCHEDULE_LIMITS.minutes.min} and ${SCHEDULE_LIMITS.minutes.max} minutes`,
            });
          }
        }
        break;
      }

      case "hours": {
        if (!data.hours_interval?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hours_interval"],
            message: "Interval is required",
          });
        } else {
          const num = Number(data.hours_interval);
          if (
            isNaN(num) ||
            num < SCHEDULE_LIMITS.hours.min ||
            num > SCHEDULE_LIMITS.hours.max
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["hours_interval"],
              message: `Interval must be between ${SCHEDULE_LIMITS.hours.min} and ${SCHEDULE_LIMITS.hours.max} hours`,
            });
          }
        }
        break;
      }

      case "months": {
        if (!data.months_interval?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["months_interval"],
            message: "Interval is required",
          });
        } else {
          const num = Number(data.months_interval);
          if (
            isNaN(num) ||
            num < SCHEDULE_LIMITS.months.min ||
            num > SCHEDULE_LIMITS.months.max
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["months_interval"],
              message: `Interval must be between ${SCHEDULE_LIMITS.months.min} and ${SCHEDULE_LIMITS.months.max} months`,
            });
          }
        }
        break;
      }

      case "days": {
        const daysDetails = data.days_details || {};
        const selectedDays = daysDetails.selected_days || [];
        const times = daysDetails.times || {};

        if (!selectedDays.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["days_details"],
            message: "At least one day must be selected",
          });
        } else {
          for (const day of selectedDays) {
            const timeData = times[day];
            const dayLabel = getDayLabel(day);

            if (!timeData?.time?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["days_details"],
                message: `Time is required for ${dayLabel}`,
              });
            } else if (
              !timeData.period ||
              !["AM", "PM"].includes(timeData.period)
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["days_details"],
                message: `AM/PM is required for ${dayLabel}`,
              });
            } else {
              const timeRegex = /^([0]?[1-9]|1[0-2]):[0-5][0-9]$/;
              if (!timeRegex.test(timeData.time.trim())) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: ["days_details"],
                  message: `Invalid time format for ${dayLabel}. Use HH:MM format (1-12 hours)`,
                });
              }
            }
          }
        }
        break;
      }

      case "cron": {
        if (!data.cron_expression?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cron_expression"],
            message: "Cron expression is required",
          });
        } else {
          const validation = validateCronExpression(data.cron_expression);
          if (!validation.valid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["cron_expression"],
              message: validation.error || "Invalid cron expression",
            });
          }
        }
        break;
      }
    }

    // Validate max_retries
    if (data.max_retries?.trim()) {
      const maxRetriesNum = Number(data.max_retries);
      if (isNaN(maxRetriesNum) || maxRetriesNum < 1 || maxRetriesNum > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_retries"],
          message: "Max Retries must be between 1 and 10",
        });
      }
    }

    // Validate retry_delay
    if (data.retry_delay?.trim()) {
      const retryDelayNum = Number(data.retry_delay);
      if (isNaN(retryDelayNum) || retryDelayNum < 1 || retryDelayNum > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["retry_delay"],
          message: "Retry Delay must be between 1 and 60 minutes",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const ConfigureScheduler: React.FC<ConfigureSchedulerProps> = ({
  updateFeatures,
  featureName,
  openDialog,
  initialConfig,
}) => {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isTestingSchedule, setIsTestingSchedule] = useState<string | null>(null);

  const { agentId } = useParams();
  const apiKey = useStore((state) => state?.api_key ?? "");
  const currentUser = useManageAdminStore((state) => state?.current_user);
  const userEmail = currentUser?.auth?.email ?? "";

  const {
    createSchedule,
    isCreatingSchedule,
    getScheduleByAgentId,
    scheduleAction,
    isSchedulingAction,
    deleteSchedule,
    isDeletingSchedule,
  } = useSchedulerService({ apiKey });

  const defaultInterval: ScheduleInterval =
    (initialConfig?.interval as ScheduleInterval) || "minutes";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Execute it",
      interval: defaultInterval,
      minutes_interval:
        initialConfig?.interval === "minutes"
          ? String(initialConfig?.interval_value || "")
          : "",
      hours_interval:
        initialConfig?.interval === "hours"
          ? String(initialConfig?.interval_value || "")
          : "",
      months_interval:
        initialConfig?.interval === "months"
          ? String(initialConfig?.interval_value || "")
          : "",
      days_interval: "",
      cron_expression: "",
      minutes_details: initialConfig?.minutes_details || {},
      hours_details: {
        minute: "0",
        ...(initialConfig?.hours_details || {}),
      },
      months_details: {
        day: "1",
        hour: "0",
        minute: "0",
        ...(initialConfig?.months_details || {}),
      },
      days_details: initialConfig?.days_details || {
        selected_days: [],
        times: {},
      },
      max_retries: "3",
      retry_delay: "10",
    },
  });

  const selectedTab = form.watch("interval");

  // Open dialog when openDialog prop is true (either on mount or change)
  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  // Also check on initial mount
  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!open || !agentId || !apiKey) return;

      setIsLoadingSchedules(true);
      try {
        const response = (await getScheduleByAgentId({
          agentId,
        })) as AxiosResponse<{ schedules: ScheduleResponse[] }>;

        setSchedules(response?.data?.schedules || []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setSchedules([]);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [open, agentId, apiKey, getScheduleByAgentId]);

  useEffect(() => {
    if (!selectedTab) return;

    form.setValue("minutes_interval", "");
    form.setValue("hours_interval", "");
    form.setValue("months_interval", "");
    form.setValue("days_interval", "");
    form.setValue("cron_expression", "");

    // Handle days_details normalization
    if (selectedTab === "days") {
      const currentDaysDetails = form.getValues("days_details");
      const normalized = normalizeDaysTimes(currentDaysDetails);
      form.setValue("days_details", normalized);
    } else {
      form.setValue("days_details", { selected_days: [], times: {} });
    }

    // Don't clear name, max_retries, and retry_delay - keep default values
    form.clearErrors();
  }, [selectedTab, form]);

  useEffect(() => {
    if (!initialConfig) return;

    form.reset({
      name: "Execute it",
      interval: (initialConfig.interval as ScheduleInterval) || "minutes",
      minutes_interval:
        initialConfig.interval === "minutes"
          ? String(initialConfig.interval_value || "")
          : "",
      hours_interval:
        initialConfig.interval === "hours"
          ? String(initialConfig.interval_value || "")
          : "",
      months_interval:
        initialConfig.interval === "months"
          ? String(initialConfig.interval_value || "")
          : "",
      days_interval: "",
      cron_expression: "",
      minutes_details: initialConfig.minutes_details || {},
      hours_details: initialConfig.hours_details || {},
      months_details: initialConfig.months_details || {},
      days_details: normalizeDaysTimes(initialConfig.days_details),
      max_retries: "3",
      retry_delay: "10",
    });
  }, [initialConfig, form]);

  const convertToCron = useCallback(
    (interval: string, intervalValue: string, details?: any): string => {
      const value = parseInt(intervalValue, 10) || 1;

      switch (interval) {
        case "minutes":
          return `*/${value} * * * *`;

        case "hours": {
          const minute = parseInt(details?.minute || "0", 10);
          return `${minute} */${value} * * *`;
        }

        case "months": {
          const monthDay = parseInt(details?.day || "1", 10);
          const hour = parseInt(details?.hour || "0", 10);
          const minute = parseInt(details?.minute || "0", 10);
          return `${minute} ${hour} ${monthDay} */${value} *`;
        }

        case "days": {
          const selectedDays = details?.selected_days || [];
          const times = details?.times || {};

          if (selectedDays.length === 0) {
            return "0 0 * * 0"; // Default to Sunday at midnight
          }

          const convertTimeTo24 = (timeData: TimeData | string): string => {
            if (typeof timeData === "string") {
              return timeData;
            }
            if (!timeData?.time || !timeData?.period) {
              return "00:00";
            }
            return convert12To24(timeData.time, timeData.period);
          };

          const timeStrings = selectedDays.map((day: number) => {
            const timeData = times[day];
            return convertTimeTo24(timeData || "00:00");
          });

          const uniqueTimes = new Set(timeStrings);
          const time24 = Array.from(uniqueTimes)[0] as string;
          const [hour, minute] = time24
            .split(":")
            .map((n: string) => parseInt(n, 10));
          const daysList = selectedDays
            .sort((a: number, b: number) => a - b)
            .join(",");

          return `${minute || 0} ${hour || 0} * * ${daysList}`;
        }

        default:
          return "*/5 * * * *";
      }
    },
    [],
  );

  const refreshSchedules = useCallback(async () => {
    if (!agentId) return null;

    try {
      const response = (await getScheduleByAgentId({
        agentId,
      })) as AxiosResponse<{ schedules: ScheduleResponse[] }>;

      setSchedules(response?.data?.schedules || []);
      return response;
    } catch (error) {
      console.error("Error refreshing schedules:", error);
      return null;
    }
  }, [agentId, getScheduleByAgentId]);

  const handlePauseSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await scheduleAction({ scheduleId, action: "pause" });
        await refreshSchedules();
      } catch (error) {
        console.error("Error pausing schedule:", error);
      }
    },
    [scheduleAction, refreshSchedules],
  );

  const handleResumeSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await scheduleAction({ scheduleId, action: "resume" });
        await refreshSchedules();
      } catch (error) {
        console.error("Error resuming schedule:", error);
      }
    },
    [scheduleAction, refreshSchedules],
  );

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await deleteSchedule(scheduleId);
        await refreshSchedules();
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    },
    [deleteSchedule, refreshSchedules],
  );

  const handleTestSchedule = useCallback(
    async (scheduleId: string) => {
      setIsTestingSchedule(scheduleId);
      try {
        await scheduleAction({ scheduleId, action: "trigger" });
        toast.success("Triggered successfully. Execution may take some time. Check Executions page for updates.");
      } catch (error) {
        console.error("Error triggering schedule:", error);
        toast.error("Failed to trigger schedule, Try again");
      } finally {
        setIsTestingSchedule(null);
      }
    },
    [scheduleAction],
  );

  const handleClose = useCallback(() => {
    setOpen(false);

    // Check if there are any active schedules to determine toggle state
    const activeSchedules = schedules.filter(
      (s) => (s as any).is_active !== false,
    );

    if (activeSchedules.length > 0) {
      // If there are active schedules, keep the feature enabled
      updateFeatures(featureName, true, undefined, undefined, { name: "active" });
    } else {
      // If no active schedules, disable the feature
      updateFeatures(featureName, false);
    }

    if (!initialConfig?.name) {
      form.reset({
        name: "Execute it",
        interval: "minutes",
        minutes_interval: "",
        hours_interval: "",
        months_interval: "",
        days_interval: "",
        cron_expression: "",
        minutes_details: {},
        hours_details: { minute: "0" },
        months_details: { day: "1", hour: "0", minute: "0" },
        days_details: { selected_days: [], times: {} },
        max_retries: "10",
        retry_delay: "60",
      });
    }
  }, [initialConfig, form, featureName, updateFeatures, schedules]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const intervalValue =
        values[`${selectedTab}_interval` as keyof FormValues] || "";

      let cronExpression: string;

      if (selectedTab === "cron") {
        cronExpression = values.cron_expression || "";
      } else if (selectedTab === "days") {
        cronExpression = convertToCron(selectedTab, "", values.days_details);
      } else {
        cronExpression = convertToCron(
          selectedTab,
          String(intervalValue),
          values[`${selectedTab}_details` as keyof FormValues],
        );
      }

      if (!agentId || !userEmail) {
        console.error("Agent ID or User Email is missing");
        return;
      }

      // Normalizing timezone as backend not accepting Asia/Calcutta
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const normalizeTimezone = (tz: string) => {
        const map: Record<string, string> = { "Asia/Calcutta": "Asia/Kolkata" };
        return map[tz] || tz;
      };

      const payload = {
        agent_id: agentId,
        cron_expression: cronExpression,
        message: values.name.trim(),
        user_id: userEmail,
        timezone: normalizeTimezone(timeZone),
        max_retries:
          values.max_retries && values.max_retries.trim() !== ""
            ? Number(values.max_retries)
            : 3,
        retry_delay:
          values.retry_delay && values.retry_delay.trim() !== ""
            ? Number(values.retry_delay)
            : 60,
      };

      try {
        await createSchedule(payload);

        if (agentId) {
          const response = (await getScheduleByAgentId({
            agentId,
          })) as AxiosResponse<{ schedules: ScheduleResponse[] }>;
          setSchedules(response?.data?.schedules || []);
        }

        // Reset form after successful creation
        form.reset({
          name: "Execute it",
          interval: "minutes",
          minutes_interval: "",
          hours_interval: "",
          months_interval: "",
          days_interval: "",
          cron_expression: "",
          minutes_details: {},
          hours_details: { minute: "0" },
          months_details: { day: "1", hour: "0", minute: "0" },
          days_details: { selected_days: [], times: {} },
          max_retries: "3",
          retry_delay: "10",
        });
      } catch (error) {
        console.error("Error creating schedule:", error);
      }
    },
    [
      selectedTab,
      convertToCron,
      agentId,
      userEmail,
      createSchedule,
      getScheduleByAgentId,
    ],
  );

  const minutesInterval = form.watch("minutes_interval");
  const hoursInterval = form.watch("hours_interval");
  const monthsInterval = form.watch("months_interval");
  const cronExpression = form.watch("cron_expression");
  const minutesDetails = form.watch("minutes_details");
  const hoursDetails = form.watch("hours_details");
  const monthsDetails = form.watch("months_details");
  const daysDetails = form.watch("days_details");
  const schedulerName = form.watch("name");

  const displayedCronExpression = useMemo(() => {
    if (selectedTab === "cron") {
      return cronExpression || "";
    }

    if (selectedTab === "days") {
      if (!daysDetails?.selected_days?.length) {
        return "";
      }
      return convertToCron(selectedTab, "", daysDetails);
    }

    const intervalValue =
      selectedTab === "minutes"
        ? minutesInterval
        : selectedTab === "hours"
          ? hoursInterval
          : monthsInterval;

    const details =
      selectedTab === "minutes"
        ? minutesDetails
        : selectedTab === "hours"
          ? hoursDetails
          : monthsDetails;

    if (!intervalValue?.trim()) {
      return "";
    }

    return convertToCron(selectedTab, String(intervalValue), details);
  }, [
    selectedTab,
    minutesInterval,
    hoursInterval,
    monthsInterval,
    cronExpression,
    minutesDetails,
    hoursDetails,
    monthsDetails,
    daysDetails,
    convertToCron,
  ]);

  const isSubmitDisabled = useMemo(() => {
    const name = schedulerName?.trim();

    if (isCreatingSchedule || !name || !agentId) {
      return true;
    }

    if (selectedTab === "cron") {
      const cron = cronExpression?.trim() || "";
      return !cron || !validateCronExpression(cron).valid;
    }

    if (selectedTab === "days") {
      const days = daysDetails?.selected_days || [];
      return days.length === 0;
    }

    // Get interval value based on selected tab
    const intervalValue =
      selectedTab === "minutes"
        ? minutesInterval
        : selectedTab === "hours"
          ? hoursInterval
          : monthsInterval;

    // Explicitly check for empty/undefined — "0" is a valid typed value
    const strValue = intervalValue?.toString() ?? "";
    if (strValue.trim() === "") {
      return true;
    }

    // For hours tab: button enables as soon as hours_interval is filled.
    // The minute dropdown defaults to "0" which is always valid.
    if (selectedTab === "hours") {
      return false;
    }

    // For months tab: button enables as soon as months_interval is filled.
    // The day/hour/minute dropdowns already have valid defaults (day=1, hour=0, minute=0).
    if (selectedTab === "months") {
      return false;
    }

    return false;
  }, [
    schedulerName,
    selectedTab,
    isCreatingSchedule,
    cronExpression,
    daysDetails,
    minutesInterval,
    hoursInterval,
    monthsInterval,
  ]);

  return (
    <Fragment>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "link" }),
            "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
          )}
        >
          Configure
          <ArrowTopRightIcon className="size-4" />
        </DialogTrigger>

        <DialogContent
          className={cn("gap-0 pb-0 sm:max-w-lg")}
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Scheduler Configuration</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Configure the scheduler name for your agent.</span>
              <a
                href="/executions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Executions
                <ExternalLink className="size-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          {!agentId && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Create an agent to enable
              </p>
            </div>
          )}

          <Separator className="mt-4" />

          {/* Existing Schedules Section */}
          {open && agentId && (
            <>
              <div className="space-y-4 p-2">
                {isLoadingSchedules ? (
                  <p className="text-sm text-muted-foreground">
                    Loading schedules...
                  </p>
                ) : schedules.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Existing Schedules</h3>
                    {schedules.map((schedule) => {
                      const scheduleId = schedule.id || schedule._id || "";
                      const isActive = (schedule as any).is_active ?? true;

                      return (
                        <ScheduleItem
                          key={scheduleId}
                          schedule={schedule}
                          isActive={isActive}
                          isSchedulingAction={isSchedulingAction}
                          isDeletingSchedule={isDeletingSchedule}
                          isTesting={isTestingSchedule === scheduleId}
                          onPause={() => handlePauseSchedule(scheduleId)}
                          onResume={() => handleResumeSchedule(scheduleId)}
                          onDelete={() => handleDeleteSchedule(scheduleId)}
                          onTest={() => handleTestSchedule(scheduleId)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No schedules found
                  </p>
                )}
              </div>
            </>
          )}

          <Separator className="mt-4" />
          {/* New Scheduler Form */}
          {agentId && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <h3 className="mt-4 text-sm font-medium">Create a New Schedule</h3>
                <div className="space-y-4 py-4">
                  <ScheduleTabs
                    selectedTab={selectedTab}
                    form={form}
                    displayedCronExpression={displayedCronExpression}
                  />
                </div>

                <DialogFooter className="py-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitDisabled}>
                    {isCreatingSchedule ? "Creating..." : "Create Scheduler"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

    </Fragment>
  );
};

interface ScheduleItemProps {
  schedule: ScheduleResponse;
  isActive: boolean;
  isSchedulingAction: boolean;
  isDeletingSchedule: boolean;
  isTesting: boolean;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  onTest: () => void;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  schedule,
  isActive,
  isSchedulingAction,
  isDeletingSchedule,
  isTesting,
  onPause,
  onResume,
  onDelete,
  onTest,
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{schedule.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cron: {schedule.cron_expression}
        </p>
        <p className="text-xs text-muted-foreground">
          Status: {isActive ? "Active" : "Paused"}
        </p>
        {(schedule as any).next_run_time && (
          <p className="text-xs text-muted-foreground">
            Next Run:{" "}
            {new Date((schedule as any).next_run_time).toLocaleString(
              undefined,
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          </p>
        )}
      </div>

      <div className="ml-4 flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTest}
                disabled={isTesting || isSchedulingAction}
                aria-label="Trigger schedule now"
              >
                <ZapIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trigger this schedule instantly to test your agent</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isActive ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={isSchedulingAction}
            aria-label="Pause schedule"
          >
            <PauseIcon className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResume}
            disabled={isSchedulingAction}
            aria-label="Resume schedule"
          >
            <PlayIcon className="size-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeletingSchedule}
          aria-label="Delete schedule"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

interface ScheduleTabsProps {
  selectedTab: ScheduleInterval;
  form: ReturnType<typeof useForm<FormValues>>;
  displayedCronExpression: string;
}

const ScheduleTabs: React.FC<ScheduleTabsProps> = ({
  selectedTab,
  form,
  displayedCronExpression,
}) => {
  const nextExecution = useMemo(() => {
    if (!displayedCronExpression) return "";
    const nextTime = getNextExecutionTime(displayedCronExpression);
    return formatNextExecution(nextTime);
  }, [displayedCronExpression]);

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => {
        form.setValue("interval", value as ScheduleInterval);
        form.clearErrors();
      }}
    >
      <TabsList className="grid w-full grid-cols-5 rounded-full">
        <TabsTrigger value="minutes" className="rounded-full">
          Minutes
        </TabsTrigger>
        <TabsTrigger value="hours" className="rounded-full">
          Hours
        </TabsTrigger>
        <TabsTrigger value="days" className="rounded-full">
          Days
        </TabsTrigger>
        <TabsTrigger value="months" className="rounded-full">
          Months
        </TabsTrigger>
        <TabsTrigger value="cron" className="rounded-full">
          Cron
        </TabsTrigger>
      </TabsList>

      <MinutesTab form={form} />
      <HoursTab form={form} />
      <MonthsTab form={form} />
      <DaysTab form={form} />
      <CronTab form={form} />

      {displayedCronExpression && (
        <div className="mt-4 flex items-start justify-between gap-4 px-1">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Cron Expression
            </p>
            <code className="block break-all font-mono text-sm text-foreground">
              {displayedCronExpression}
            </code>
          </div>
          {nextExecution && (
            <div className="space-y-1 text-right">
              <p className="text-xs font-medium text-muted-foreground">
                First Execution
              </p>
              <p className="text-sm text-foreground">
                {nextExecution}
              </p>
            </div>
          )}
        </div>
      )}

      <RetrySettingsSection form={form} />
      <SchedulerInputSection form={form} />
    </Tabs>
  );
};

// Tab Components
const MinutesTab: React.FC<{
  form: ReturnType<typeof useForm<FormValues>>;
}> = ({ form }) => (
  <TabsContent value="minutes" className="mt-4 space-y-4">
    <FormField
      control={form.control}
      name="minutes_interval"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Interval (minutes){" "}
            <span className="text-xs text-muted-foreground">
              ({SCHEDULE_LIMITS.minutes.min}-{SCHEDULE_LIMITS.minutes.max})
            </span>
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={`e.g., ${SCHEDULE_LIMITS.minutes.min}, ${SCHEDULE_LIMITS.minutes.max}`}
              min={SCHEDULE_LIMITS.minutes.min}
              max={SCHEDULE_LIMITS.minutes.max}
              {...field}
              onBlur={() => {
                field.onBlur();
                form.trigger("minutes_interval");
              }}
              onChange={(e) => {
                field.onChange(e);
                form.trigger("minutes_interval");
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </TabsContent>
);

const HoursTab: React.FC<{ form: ReturnType<typeof useForm<FormValues>> }> = ({
  form,
}) => {
  const hoursDetails = form.watch("hours_details") || {};
  const currentMinute = hoursDetails.minute || "0";

  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, "0"),
  }));

  return (
    <TabsContent value="hours" className="mt-4 space-y-4">
      <FormField
        control={form.control}
        name="hours_interval"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Interval (hours){" "}
              <span className="text-xs text-muted-foreground">
                ({SCHEDULE_LIMITS.hours.min}-{SCHEDULE_LIMITS.hours.max})
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={`e.g., ${SCHEDULE_LIMITS.hours.min}, ${SCHEDULE_LIMITS.hours.max}`}
                min={SCHEDULE_LIMITS.hours.min}
                max={SCHEDULE_LIMITS.hours.max}
                {...field}
                onBlur={() => {
                  field.onBlur();
                  form.trigger("hours_interval");
                }}
                onChange={(e) => {
                  field.onChange(e);
                  form.trigger("hours_interval");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hours_details"
        render={({ field }) => (
          <FormItem>
            <FormLabel>At Minute</FormLabel>
            <FormControl>
              <Select
                value={currentMinute}
                onValueChange={(value) => {
                  field.onChange({
                    ...hoursDetails,
                    minute: value,
                  });
                  form.trigger("hours_details");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select minute" />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((min) => (
                    <SelectItem key={min.value} value={min.value}>
                      {min.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </TabsContent>
  );
};

const MonthsTab: React.FC<{ form: ReturnType<typeof useForm<FormValues>> }> = ({
  form,
}) => {
  const monthsDetails = form.watch("months_details") || {};
  const currentDay = monthsDetails.day || "1";
  const currentHour = monthsDetails.hour || "0";
  const currentMinute = monthsDetails.minute || "0";

  const dayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    if (hour === 0) return { value: "0", label: "Midnight" };
    if (hour === 12) return { value: "12", label: "Noon" };
    return {
      value: String(hour),
      label: `${hour % 12 || 12}${hour >= 12 ? "pm" : "am"}`,
    };
  });

  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, "0"),
  }));

  return (
    <TabsContent value="months" className="mt-4 space-y-4">
      <FormField
        control={form.control}
        name="months_interval"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Interval (months){" "}
              <span className="text-xs text-muted-foreground">
                ({SCHEDULE_LIMITS.months.min}-{SCHEDULE_LIMITS.months.max})
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={`e.g., ${SCHEDULE_LIMITS.months.min}, ${SCHEDULE_LIMITS.months.max}`}
                min={SCHEDULE_LIMITS.months.min}
                max={SCHEDULE_LIMITS.months.max}
                {...field}
                onBlur={() => {
                  field.onBlur();
                  form.trigger("months_interval");
                }}
                onChange={(e) => {
                  field.onChange(e);
                  form.trigger("months_interval");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="months_details"
        render={({ field }) => (
          <FormItem>
            <FormLabel>On Day of Month</FormLabel>
            <FormControl>
              <Select
                value={currentDay}
                onValueChange={(value) => {
                  field.onChange({
                    ...monthsDetails,
                    day: value,
                  });
                  form.trigger("months_details");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="months_details"
        render={({ field }) => (
          <FormItem>
            <FormLabel>At Time</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                value={currentHour}
                onValueChange={(value) => {
                  field.onChange({
                    ...monthsDetails,
                    hour: value,
                  });
                  form.trigger("months_details");
                }}
              >
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentMinute}
                onValueChange={(value) => {
                  field.onChange({
                    ...monthsDetails,
                    minute: value,
                  });
                  form.trigger("months_details");
                }}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((min) => (
                    <SelectItem key={min.value} value={min.value}>
                      {min.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </TabsContent>
  );
};

const DaysTab: React.FC<{ form: ReturnType<typeof useForm<FormValues>> }> = ({
  form,
}) => (
  <TabsContent value="days" className="mt-4 space-y-4">
    <FormField
      control={form.control}
      name="days_details"
      render={({ field }) => {
        const selectedDays = (field.value?.selected_days as number[]) || [];

        return (
          <FormItem>
            <FormLabel>Select Days of Week</FormLabel>
            <FormControl>
              <DaysSelector
                field={field}
                selectedDays={selectedDays}
                form={form}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  </TabsContent>
);

const CronTab: React.FC<{ form: ReturnType<typeof useForm<FormValues>> }> = ({
  form,
}) => (
  <TabsContent value="cron" className="mt-4 space-y-4">
    <FormField
      control={form.control}
      name="cron_expression"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cron Expression</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., 0 0 * * *"
              {...field}
              onBlur={() => {
                field.onBlur();
                form.trigger("cron_expression");
              }}
              onChange={(e) => {
                field.onChange(e);
                form.trigger("cron_expression");
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </TabsContent>
);

// Complex sub-components
const DaysSelector: React.FC<{
  field: any;
  selectedDays: number[];
  form: ReturnType<typeof useForm<FormValues>>;
}> = ({ field, selectedDays, form }) => {
  const allDaysSelected = selectedDays.length === DAYS_OF_WEEK.length;

  const handleSelectAll = (checked: boolean) => {
    const currentTimes = field.value?.times || {};

    if (checked) {
      // Select all days
      const allDayValues = DAYS_OF_WEEK.map((d) => d.value);
      const defaultTime = { time: "12:00", period: "AM" as const };

      // Get existing time or use default
      const firstExistingTime =
        selectedDays.length > 0 && currentTimes[selectedDays[0]]
          ? currentTimes[selectedDays[0]]
          : defaultTime;

      // Apply the same time to all days
      const newTimes: Record<number, { time: string; period: "AM" | "PM" }> = {};
      allDayValues.forEach((dayValue) => {
        newTimes[dayValue] = currentTimes[dayValue] || firstExistingTime;
      });

      field.onChange({
        selected_days: allDayValues,
        times: newTimes,
      });
    } else {
      // Deselect all days
      field.onChange({
        selected_days: [],
        times: {},
      });
    }

    form.trigger("days_details");
  };

  return (
    <div className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-start">
            {selectedDays.length === 0
              ? "Select weekdays"
              : selectedDays.length === DAYS_OF_WEEK.length
                ? "All days selected"
                : `${selectedDays.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-2">
            {/* Select All option */}
            <div className="flex items-center space-x-2 border-b pb-2">
              <Checkbox
                id="weekday-select-all"
                checked={allDaysSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label
                htmlFor="weekday-select-all"
                className="flex-1 cursor-pointer text-sm font-semibold leading-none"
              >
                Select All
              </Label>
            </div>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`weekday-${day.value}`}
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={(checked) => {
                    const currentSelected =
                      (field.value?.selected_days as number[]) || [];
                    const newSelected = checked
                      ? [...currentSelected, day.value]
                      : currentSelected.filter((d) => d !== day.value);

                    const currentTimes = field.value?.times || {};

                    if (!checked) {
                      const { [day.value]: _, ...restTimes } = currentTimes;
                      field.onChange({
                        selected_days: newSelected,
                        times: restTimes,
                      });
                    } else {
                      const firstSelectedDay =
                        currentSelected.length > 0 ? currentSelected[0] : null;
                      const timeToApply =
                        firstSelectedDay && currentTimes[firstSelectedDay]
                          ? currentTimes[firstSelectedDay]
                          : { time: "12:00", period: "AM" as const };

                      field.onChange({
                        selected_days: newSelected,
                        times: { ...currentTimes, [day.value]: timeToApply },
                      });
                    }

                    form.trigger("days_details");
                  }}
                />
                <Label
                  htmlFor={`weekday-${day.value}`}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {selectedDays.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedDays.map((dayValue) => {
            const day = DAYS_OF_WEEK.find((d) => d.value === dayValue);
            return day ? (
              <Badge
                key={day.value}
                variant="secondary"
                className="gap-1.5 pr-1"
              >
                {day.label}
                <button
                  type="button"
                  onClick={() => {
                    const currentSelected =
                      (field.value?.selected_days as number[]) || [];
                    const newSelected = currentSelected.filter(
                      (d) => d !== day.value,
                    );
                    const currentTimes = field.value?.times || {};
                    const { [day.value]: _, ...restTimes } = currentTimes;

                    field.onChange({
                      selected_days: newSelected,
                      times: restTimes,
                    });

                    form.trigger("days_details");
                  }}
                  className="-mr-1 ml-1 rounded-full p-0.5 hover:bg-muted/60"
                  aria-label={`Remove ${day.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {selectedDays.length > 0 && (
        <TimeSelector selectedDays={selectedDays} field={field} form={form} />
      )}
    </div>
  );
};

const TimeSelector: React.FC<{
  selectedDays: number[];
  field: any;
  form: ReturnType<typeof useForm<FormValues>>;
}> = ({ selectedDays, field, form }) => {
  const firstDay = selectedDays[0];
  const currentTimes = field.value?.times || {};
  const timeData = currentTimes[firstDay];

  let currentTime24 = "00:00";
  if (timeData) {
    if (typeof timeData === "string") {
      currentTime24 = timeData;
    } else if (timeData.time && timeData.period) {
      currentTime24 = convert12To24(timeData.time, timeData.period);
    }
  }

  const [currentHour, currentMinute] = currentTime24
    .split(":")
    .map((n) => parseInt(n, 10));
  const hour24 = isNaN(currentHour) ? 0 : currentHour;
  const minute = isNaN(currentMinute) ? 0 : currentMinute;

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    if (hour === 0) return { value: "0", label: "Midnight" };
    if (hour === 12) return { value: "12", label: "Noon" };
    return {
      value: String(hour),
      label: `${hour % 12 || 12}${hour >= 12 ? "pm" : "am"}`,
    };
  });

  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, "0"),
  }));

  return (
    <div className="space-y-3 border-t pt-2">
      <div className="space-y-1">
        <FormLabel className="text-sm">
          Set Time (applies to all selected days)
        </FormLabel>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={String(hour24)}
          onValueChange={(value) => {
            const newHour = parseInt(value, 10);
            const newTime24 = `${String(newHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            const converted = convert24To12(newTime24);

            const newTimes: Record<number, TimeData> = {};
            selectedDays.forEach((dayValue) => {
              newTimes[dayValue] = {
                time: converted.time,
                period: converted.period,
              };
            });

            field.onChange({
              selected_days: selectedDays,
              times: newTimes,
            });

            form.trigger("days_details");
          }}
        >
          <SelectTrigger className="h-9 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(minute)}
          onValueChange={(value) => {
            const newMinute = parseInt(value, 10);
            const newTime24 = `${String(hour24).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
            const converted = convert24To12(newTime24);

            const newTimes: Record<number, TimeData> = {};
            selectedDays.forEach((dayValue) => {
              newTimes[dayValue] = {
                time: converted.time,
                period: converted.period,
              };
            });

            field.onChange({
              selected_days: selectedDays,
              times: newTimes,
            });

            form.trigger("days_details");
          }}
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((min) => (
              <SelectItem key={min.value} value={min.value}>
                {min.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const RetrySettingsSection: React.FC<{
  form: ReturnType<typeof useForm<FormValues>>;
}> = ({ form }) => (
  <div className="space-y-4 pt-4">
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="max_retries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Max Retries{" "}
              <span className="text-xs text-muted-foreground">(max: 10)</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={10}
                value={field.value || ""}
                onBlur={() => {
                  field.onBlur();
                  form.trigger("max_retries");
                }}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  form.trigger("max_retries");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="retry_delay"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Retry Delay (minutes){" "}
              <span className="text-xs text-muted-foreground">(max: 60)</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={60}
                value={field.value || ""}
                onBlur={() => {
                  field.onBlur();
                  form.trigger("retry_delay");
                }}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  form.trigger("retry_delay");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

const SchedulerInputSection: React.FC<{
  form: ReturnType<typeof useForm<FormValues>>;
}> = ({ form }) => (
  <div className="space-y-2 pt-4">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Scheduler Input</FormLabel>
          <FormControl>
            <Input
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              name={field.name}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

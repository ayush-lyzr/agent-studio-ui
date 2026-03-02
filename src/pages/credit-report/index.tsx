import { useEffect, useMemo, useState } from "react";
import mixpanel from "mixpanel-browser";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  ListFilter,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { ArrowTopRightIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DateRange } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { isMixpanelActive } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { AxiosResponse } from "axios";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import {
  cn,
  convertToReadableNumber,
  getCurrentBillingCycle,
  getNextBillingDate,
} from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrganization } from "../organization/org.service";
import { Link } from "react-router-dom";
import { Path } from "@/lib/types";
import MarkdownRenderer from "@/components/custom/markdown";

interface CreditUsage {
  actions: number;
  created_at: string;
  log_id: string;
  agent_id: string;
  session_id: string;
  run_id: string;
  org_id: string;
  latency_ms: number;
  input_messages: { role: string; content: string }[];
  output_messages: {
    content: string;
    role: string;
    tool_calls: any;
    function_call: any;
    refusal: any;
  };
  call_type: string;
  language_model: string;
}

const columns: ColumnDef<CreditUsage>[] = [
  {
    accessorKey: "created_at",
    header: "Date",
    cell: (props) => {
      return (
        <p className="w-52">
          {new Date(props.row.original.created_at + "Z").toLocaleString(
            undefined,
            {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            },
          )}
        </p>
      );
    },
  },
  {
    accessorKey: "language_model",
    header: "Model",
    cell: (props) => (
      <div className="w-44">{props?.row?.original?.language_model}</div>
    ),
  },
  {
    accessorKey: "actions",
    header: "Credits Consumed",
    cell: (props) => (
      <div className="w-12">
        {Number(props?.row?.original?.actions).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "input_messages[0].content",
    header: "Input Message",
    cell: (props) => {
      const msgs = props?.row?.original?.input_messages;
      const msg = msgs?.[msgs?.length - 1]?.content;
      return (
        <Tooltip>
          <TooltipTrigger className="line-clamp-1 cursor-default">
            {msg?.slice(0, 100)}
          </TooltipTrigger>
          <TooltipContent className="px-4 py-2 shadow-md">
            <MarkdownRenderer
              className="max-h-44 w-96 overflow-y-scroll p-2 text-secondary"
              content={msg}
            />
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "output_messages.content",
    header: "Output Message",
    cell: (props) => (
      <Tooltip>
        <TooltipTrigger className="line-clamp-1 cursor-default">
          {props.row.original?.output_messages?.content?.slice(0, 100)}
        </TooltipTrigger>
        <TooltipContent className="px-4 py-2 shadow-md">
          <MarkdownRenderer
            className="max-h-44 w-96 overflow-y-scroll p-2 text-secondary"
            content={props.row.original?.output_messages?.content}
          />
        </TooltipContent>
      </Tooltip>
    ),
  },
];

const CardHeaderWithTooltip = ({
  title,
  tooltip,
}: {
  title: string;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger className="inline-flex items-baseline">
      <p className="mb-1 cursor-help text-sm text-muted-foreground underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
        {title}
      </p>
    </TooltipTrigger>
    <TooltipContent className="max-w-64">{tooltip}</TooltipContent>
  </Tooltip>
);

const CreditReport = () => {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [creditData, setCreditData] = useState<CreditUsage[]>([]);
  const [currentBillingCreditData, setCurrentBillingCreditData] = useState<
    CreditUsage[]
  >([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 31),
    to: new Date(2025, 0, 31),
  });
  const [currentDate, setCurrentDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });
  const [isFetchingReport, setIsFetchingReport] = useState(true);
  const apiKey = useStore((state) => state.api_key);
  const { usage_data, setUsageData, current_organization } =
    useManageAdminStore((state) => state);
  const { getUsage, isFetchingUsage } = useOrganization({
    token,
    current_organization,
  });

  const disabledDates = {
    after: new Date(),
  };

  const onPreviousBillingCycle = async () => {
    const fromDate = date?.from ?? new Date();
    const toDate = date?.to ?? new Date();
    const prevDate = {
      from: new Date(fromDate.setMonth(fromDate.getMonth() - 1)),
      to: new Date(toDate?.setMonth(toDate.getMonth() - 1)),
    };
    await generateReport({ date: prevDate });
    setDate(prevDate);
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  };

  const onNextBillingCycle = () => {
    const fromDate = date?.from ?? new Date();
    const toDate = date?.to ?? new Date();
    const nextDate = {
      from: new Date(fromDate?.setMonth(fromDate.getMonth() + 1)),
      to: new Date(toDate?.setMonth(toDate.getMonth() + 1)),
    };
    setDate(nextDate);
    generateReport({ date: nextDate });
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  };

  const handleReset = () => {
    setDate(
      getCurrentBillingCycle(
        usage_data?.created_at ?? new Date().toString(),
        // @ts-ignore
        usage_data?.cycle_at ?? "monthly",
      ),
    );
  };

  const getDateRangeText = (input_date?: DateRange) => {
    const dateRange = input_date?.from ? input_date : date;
    if (!dateRange?.from) return "Select dates";
    if (!dateRange.to)
      return `Start: ${format(dateRange.from, "MMM dd, yyyy")}`;
    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  const compareDates = (date1: Date, date2: Date) => {
    // Convert both dates to YYYY-MM-DD format to ignore time
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);

    if (d1 > d2) return 1; // date1 is later than date2
    if (d1 < d2) return -1; // date1 is earlier than date2
    return 0; // dates are equal
  };

  const { mutateAsync: fetchCreditReport } = useMutation({
    mutationKey: ["fetchCreditReport", date?.from, date?.to, apiKey],
    mutationFn: ({ date }: { date?: DateRange }) =>
      axios.post(
        `/ops/report`,
        {
          start_date: date?.from?.toISOString().split("T")[0],
          end_date: date?.to?.toISOString().split("T")[0],
        },
        { headers: { "x-api-key": apiKey } },
      ),
    onSuccess: () => {
      setIsFetchingReport(false);
    },
  });

  const { isPending: isDownloadingReport, mutateAsync: downloadCreditReport } =
    useMutation({
      mutationKey: ["downloadCreditReport", date?.from, date?.to, apiKey],
      mutationFn: () =>
        axios.post(
          `/ops/report_csv`,
          {
            start_date: date?.from?.toISOString().split("T")[0],
            end_date: date?.to?.toISOString().split("T")[0],
          },
          { headers: { "x-api-key": apiKey }, responseType: "blob" },
        ),
      onSuccess: (res: AxiosResponse) => {
        const startDate = date?.from?.toISOString().split("T")[0];
        const endDate = date?.to?.toISOString().split("T")[0];
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `credit-report-${startDate}-to-${endDate}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      },
    });

  const generateReport = async ({ date }: { date?: DateRange }) => {
    setCalendarVisible(false);
    setIsFetchingReport(true);
    const res = await fetchCreditReport({ date });
    setCreditData(res.data?.report);
    return res.data?.report;
  };

  const filteredData = creditData?.filter(
    (row) =>
      row?.language_model?.includes(searchQuery) ||
      row?.output_messages?.content?.includes(searchQuery),
  );

  const table = useReactTable({
    data: useMemo(
      () => filteredData,
      [date?.from, date?.to, searchQuery, filteredData?.length],
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
  });

  useEffect(() => {
    const fetchUsageStats = async () => {
      const res = await getUsage();
      setUsageData(res.data);
      const date = getCurrentBillingCycle(
        usage_data?.created_at ?? new Date().toString(),
        // @ts-ignore
        usage_data?.cycle_at ?? "monthly",
      );
      setCurrentDate(
        getCurrentBillingCycle(
          usage_data?.created_at ?? new Date().toString(),
          // @ts-ignore
          usage_data?.cycle_at ?? "monthly",
        ),
      );
      setDate(date);
      return date;
    };
    if (apiKey) {
      fetchUsageStats().then(async (date) => {
        const res = await generateReport({ date });
        setCurrentBillingCreditData(res);
      });
    }
  }, [apiKey]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full p-6"
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Credit Report</h1>
          <span className="inline-flex items-center space-x-1 text-sm text-muted-foreground">
            <p>Manage your credit usages here.</p>
            <Link
              to="https://www.youtube.com/watch?v=pxb1HkRXHq0"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Video-clicked", {
                    content_name: "Credit Report",
                  });
              }}
            >
              Video
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
          </span>
        </div>
      </div>
      <Separator className="mb-2 bg-secondary" />
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-baseline gap-2">
          <p className="font-semibold">Current Billing Cycle</p>
          <p className="text-xs text-muted-foreground">
            ({getDateRangeText(currentDate)})
          </p>
        </span>
        <div className="space-x-2">
          <Link
            to={`${Path.UPGRADE_PLAN}?section=topup`}
            className={buttonVariants()}
          >
            <Zap className="mr-2 size-4" />
            Top up
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div
          className={cn(
            "rounded-xl border border-input p-4",
            isFetchingUsage && "shimmer bg-secondary",
          )}
        >
          <p className="mb-1 text-sm text-muted-foreground">Credits Consumed</p>
          <p className="text-sm font-semibold">
            {currentBillingCreditData
              ?.reduce((prev, acc) => Number(prev) + Number(acc.actions), 0)
              .toFixed(2)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border border-input p-4",
            isFetchingUsage && "shimmer bg-secondary",
          )}
        >
          <CardHeaderWithTooltip
            title="Credits Remaining"
            tooltip="Includes both monthly recurring credits and non-expiring top-up credits."
          />
          <p className="text-sm font-semibold">
            {convertToReadableNumber(
              Number(usage_data?.paid_credits) +
                Number(usage_data?.recurring_credits),
            )}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border border-input p-4",
            isFetchingUsage && "shimmer bg-secondary",
          )}
        >
          <CardHeaderWithTooltip
            title="Top-up Credits Remaining"
            tooltip="Includes only top-up credits, which do not expire."
          />
          <p className="text-sm font-semibold">{usage_data?.paid_credits}</p>
        </div>
        <div
          className={cn(
            "rounded-xl border border-input p-4",
            isFetchingUsage && "shimmer bg-secondary",
          )}
        >
          <CardHeaderWithTooltip
            title="Credit Gets Refreshed On"
            tooltip="Your monthly credits will refresh on this date, no matter how many are left. Top-up credits won't expire."
          />

          <p className="text-sm font-semibold">
            {new Intl.DateTimeFormat("default", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(
              getNextBillingDate(
                new Date(usage_data?.created_at ?? new Date()),
                // @ts-ignore
                usage_data?.cycle_at ?? "monthly",
              ),
            )}
          </p>
        </div>
      </div>
      <Separator className="my-4 bg-secondary" />
      <div className="mb-2 flex w-full items-center justify-between gap-4">
        <span className="flex w-1/4 items-center rounded-md border border-input px-2">
          <Search className="size-4" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="max-w-xs border-none bg-transparent shadow-none"
          />
        </span>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCalendarVisible(true)}
          >
            <ListFilter className="mr-2 size-4" />
            Custom Filter
          </Button>
          <span className="flex items-center gap-1">
            <Button variant="link" size="icon" onClick={onPreviousBillingCycle}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 size-4" />
              {getDateRangeText()}
            </Button>
            <Button
              variant="link"
              size="icon"
              onClick={onNextBillingCycle}
              disabled={compareDates(new Date(), date?.to ?? new Date()) <= 0}
            >
              <ChevronRight className="size-4" />
            </Button>
          </span>
          <Button
            size="sm"
            loading={isDownloadingReport}
            onClick={() => downloadCreditReport()}
          >
            Export
            <Download className="ml-2 size-4" />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "mb-2 flex items-center rounded-md bg-secondary p-2 text-sm font-semibold",
          isFetchingReport && "shimmer w-full",
        )}
      >
        <InfoCircledIcon className="mr-2 size-4" />
        {creditData
          ?.reduce((prev, acc) => Number(prev) + Number(acc.actions), 0)
          .toFixed(2)}{" "}
        credits used ({getDateRangeText()})
      </div>
      <Table
        className="w-full border-collapse rounded-md border"
        containerClassname="h-[54vh] overflow-y-scroll"
      >
        <TableHeader className="sticky top-0 bg-secondary text-xs first:rounded-tl-md last:rounded-tr-md">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="font-semibold hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isFetchingReport && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-[46vh] text-center text-primary"
              >
                <div className="grid place-items-center">
                  <Loader2 className="size-5 animate-spin" />
                  Loading ...
                </div>
              </TableCell>
            </TableRow>
          )}
          {!isFetchingReport &&
            table.getRowModel().rows?.length > 0 &&
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="bg-background text-sm text-primary"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isFetchingReport && table.getRowModel().rows?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-[46vh] border bg-secondary text-primary"
              >
                <div className="grid place-items-center gap-4 p-4">
                  <img src="/images/empty.svg" width={100} />
                  <p>Nothing to display.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="mt-4 flex w-full items-center justify-between bg-background">
        <p className="text-sm text-muted-foreground">
          Showing 10 results per page. (
          {pagination.pageIndex * pagination.pageSize +
            (filteredData?.length > 0 ? 1 : 0)}{" "}
          -{" "}
          {Math.min(
            (pagination.pageIndex + 1) * pagination.pageSize,
            filteredData?.length,
          )}{" "}
          of {filteredData?.length} results)
        </p>
        <div className="flex items-center gap-4">
          <Button
            disabled={pagination.pageIndex === 0}
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: prev.pageIndex - 1,
              }))
            }
          >
            <ChevronsLeft className="mr-1 size-3" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: prev.pageIndex + 1,
              }))
            }
            disabled={
              pagination.pageIndex * pagination.pageSize >= creditData?.length
            }
          >
            Next
            <ChevronsRight className="ml-1 size-3" />
          </Button>
        </div>
      </div>
      <Dialog open={calendarVisible} onOpenChange={setCalendarVisible}>
        <DialogContent className="w-full sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Set date range</DialogTitle>
            <DialogDescription>{getDateRangeText()}</DialogDescription>
          </DialogHeader>
          <div className="grid w-full place-items-center gap-4">
            <Calendar
              mode="range"
              className="w-full"
              selected={date}
              onSelect={setDate}
              showOutsideDays={false}
              month={date?.from}
              numberOfMonths={2}
              disabled={disabledDates}
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button
                onClick={() => generateReport({ date })}
                disabled={isFetchingReport || !date?.from || !date?.to}
              >
                Apply filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CreditReport;

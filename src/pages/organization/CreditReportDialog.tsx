import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dispatch, SetStateAction, useState } from "react";
import useStore from "@/lib/store";
import axios from "axios";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface CreditReportDialogProps {
  children?: React.ReactNode;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
}

export function CreditReportDialog({
  children,
  open,
  onOpen,
}: CreditReportDialogProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const apiKey = useStore((state) => state.api_key);

  const disabledDates = {
    after: new Date(),
  };

  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    try {
      const startDate = date.from.toISOString().split("T")[0];
      const endDate = date.to.toISOString().split("T")[0];
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/v3/ops/report_csv`,
        {
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            "x-api-key": apiKey,
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `credit-report-${startDate}-to-${endDate}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDate({
      from: new Date(),
      to: new Date(),
    });
  };

  const getDateRangeText = () => {
    if (!date?.from) return "Select dates";
    if (!date.to) return `Start: ${format(date.from, "MMM dd, yyyy")}`;
    return `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Credit Usage Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            showOutsideDays
            disabled={disabledDates}
            className="w-full"
          />
          <p className="text-center text-sm text-muted-foreground">
            {getDateRangeText()}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={loading || !date?.from || !date?.to}
            >
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

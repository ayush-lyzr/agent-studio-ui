"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TraceDialogV2 from "./trace-dialog-v2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isMixpanelActive } from "@/lib/constants";
import mixpanel from "mixpanel-browser";

export type Trace = {
  trace_id: string;
  runs: string[];
  latency: number;
  cost: number;
  started_at: string;
  trace_agent_name: string;
};

export const traceColumns: ColumnDef<Trace>[] = [
  {
    header: "Trace ID",
    accessorKey: "trace_id",
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex cursor-pointer items-center hover:underline">
          <p
            onClick={() => {
              setOpen(true);
              if (isMixpanelActive && mixpanel.hasOwnProperty("cookie")) {
                mixpanel.track("Trace individual page clicked", {
                  trace: row.original,
                });
              }
            }}
          >
            {row.original.trace_id}
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-full max-w-7xl">
              <DialogHeader className="border-b pb-4 font-semibold">
                <DialogTitle>Trace ID : {row.original.trace_id}</DialogTitle>
              </DialogHeader>
              {/* <TraceDialog
                trace_id={row.original.trace_id}
                runs={row.original.runs || []}
                open={open}
                setOpen={setOpen}
              /> */}
              <TraceDialogV2
                trace_id={row.original.trace_id}
                runs={row.original.runs || []}
                open={open}
                setOpen={setOpen}
                agent_name={row.original.trace_agent_name}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
  {
    header: "Agent Name",
    accessorKey: "trace_agent_name",
    cell: ({ row }) => {
      return <p>{row.original.trace_agent_name}</p>;
    },
  },
  {
    header: "Latency (s)",
    accessorKey: "latency",

    cell: ({ row }) => {
      const { latency } = row.original;
      const latency_seconds = latency / 1000;
      return <p>{parseFloat(latency_seconds.toString()).toFixed(2)}s</p>;
    },
  },
  {
    header: "Credits consumed",
    accessorKey: "total_cost",
    cell: ({ row }) => {
      return <p>{row.original.cost.toFixed(2)}</p>;
    },
  },
  {
    header: "Created At",
    accessorKey: "created_at",
    cell: ({ row }) => {
      const date = new Date(row.original.started_at);
      return date.toLocaleString("default", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    },
  },
];

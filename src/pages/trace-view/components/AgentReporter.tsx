import {
  Clock,
  Coins,
  Cpu,
  Wrench,
  MessageSquareQuote,
  Newspaper,
  ArrowLeft,
  CalendarClock,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/custom/markdown";
import { formatDuration } from "./gantt-utils";
import type {
  TraceDetailedSummary,
  SpanTreeNode,
} from "../trace-view.service";
import { CREDITS_DIVISOR } from "@/lib/constants";

interface AgentReporterProps {
  summary: TraceDetailedSummary | undefined;
  spanTree: SpanTreeNode | undefined;
  startTime: string;
  onBack: () => void;
}

const AgentReporter = ({
  summary,
  spanTree,
  startTime,
  onBack,
}: AgentReporterProps) => {
  const input =
    spanTree?.tags?.user_message ||
    spanTree?.tags?.input ||
    spanTree?.tags?.query ||
    "No input available";

  const output =
    spanTree?.tags?.agent_response ||
    spanTree?.tags?.output ||
    spanTree?.tags?.response ||
    "No output available";

  const metrics = [
    {
      icon: Clock,
      label: "Duration",
      value: formatDuration(summary?.total_duration_ms || 0),
    },
    {
      icon: Cpu,
      label: "Input Tokens",
      value: `${(summary?.total_input_tokens || 0).toLocaleString()}`,
    },
    {
      icon: Cpu,
      label: "Output Tokens",
      value: `${(summary?.total_output_tokens || 0).toLocaleString()}`,
    },
    {
      icon: Coins,
      label: "Credits",
      value: `${((summary?.total_cost || 0) / CREDITS_DIVISOR).toFixed(4)}`,
    },
    ...(summary?.tool_call_count
      ? [
          {
            icon: Wrench,
            label: "Tools",
            value: `${summary.tool_call_count}`,
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-lg border border-border bg-background">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 h-8 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-medium">Back to Traces</span>
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          <span className="font-mono text-xs tabular-nums">
            {(() => {
              // Append 'Z' if timestamp doesn't have timezone indicator to treat as UTC
              const timestamp = startTime;
              const utcTimestamp =
                timestamp.endsWith("Z") ||
                timestamp.includes("+") ||
                timestamp.includes("-", 10)
                  ? timestamp
                  : timestamp + "Z";
              return new Date(utcTimestamp).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              });
            })()}
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="border-b border-border px-5 py-4">
        <div className="mb-3 flex items-center gap-3">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-success">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Complete
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Agent Report</span>
        </div>

        {/* Agent Name + Metrics Row */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Agent Name and Model */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {summary?.agent_name || "Agent"}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span className="text-xs">
                {summary?.llm_provider}/{summary?.llm_model || "N/A"}
              </span>
            </div>
          </div>

          {/* Right: Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-1.5">
                <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {metric.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid md:grid-cols-2">
        {/* Input Column */}
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Input</span>
            <span className="text-xs text-muted-foreground">User Query</span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-card p-4">
            <MarkdownRenderer
              content={input}
              className="text-sm leading-relaxed text-foreground"
            />
          </div>
        </div>

        {/* Output Column */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Output</span>
            <span className="text-xs text-muted-foreground">
              Agent Response
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-card p-4">
            <MarkdownRenderer
              content={output}
              className="text-sm leading-relaxed text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentReporter;

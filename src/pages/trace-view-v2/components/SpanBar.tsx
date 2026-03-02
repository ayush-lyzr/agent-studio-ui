import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDuration } from "./gantt-utils";
import { SpanTreeNode } from "../trace-view.service";
import { useTraceViewStore } from "../trace-view.store";

interface SpanBarProps {
  span: SpanTreeNode;
  parentSpan?: SpanTreeNode | null;
  globalStart: number;
  globalSpread: number;
}

const SpanBar: React.FC<SpanBarProps> = ({
  span,
  parentSpan = null,
  globalStart,
  globalSpread,
}) => {
  const setSelectedSpan = useTraceViewStore((state) => state.setSelectedSpan);
  const setSelectedSpanParent = useTraceViewStore(
    (state) => state.setSelectedSpanParent,
  );
  const setDetailsSheetOpen = useTraceViewStore(
    (state) => state.setDetailsSheetOpen,
  );

  const leftOffset = ((span.startTime - globalStart) * 100) / globalSpread;
  const width = (span.duration * 100) / globalSpread;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSpan(span);
    setSelectedSpanParent(parentSpan);
    setDetailsSheetOpen(true);
  };

  return (
    <div className="relative flex h-full items-center">
      {/* Background line */}
      {/* <div className="absolute w-full h-[2px] bg-border" /> */}

      {/* Span bar */}
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="absolute cursor-pointer rounded transition-all hover:shadow-lg"
            style={{
              left: `${leftOffset}%`,
              width: `${Math.max(0.5, width)}%`,
              height: "24px",
              backgroundColor: span.hasError
                ? "hsl(var(--destructive))"
                : "hsl(var(--gantt-chart))",
            }}
            onClick={handleClick}
          >
            {/* Span name and duration text */}
            {width > 0.5 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-white">
                <span className="whitespace-nowrap text-[10px] font-medium">
                  {formatDuration(span.duration)}
                </span>
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="left" align="start">
          <div className="space-y-2">
            <div>
              <div className="text-sm font-semibold">{span.span_name}</div>
              <div className="text-xs text-muted-foreground">
                {span.service_name}
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {formatDuration(span.duration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Time:</span>
                <span className="font-medium">
                  {formatDuration(span.startTime - globalStart)}
                </span>
              </div>
              {span.hasError && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-destructive">Error</span>
                </div>
              )}
            </div>
            {Object.keys(span.tags).length > 0 && (
              <div className="border-t pt-2">
                <div className="mb-1 text-xs font-semibold">Tags:</div>
                <div className="space-y-1">
                  {Object.entries(span.tags)
                    .slice(0, 5)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="max-w-[200px] truncate font-mono">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {span.events.length > 0 && (
              <div className="border-t pt-2">
                <div className="text-xs font-semibold">
                  Events: {span.events.length}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SpanBar;

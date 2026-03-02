import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { SpanTreeNode } from "../trace-view.service";
import { useTraceViewStore } from "../trace-view.store";
import TraceSpan from "./TraceSpan";
import {
  getMetadataFromSpanTree,
  getSpanPath,
  getInferenceSpans,
  isMarkerInInferenceSpan,
} from "./gantt-utils";

interface GanttChartProps {
  data: SpanTreeNode;
  spanId?: string;
  isExpandAll: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  data,
  spanId = "",
  isExpandAll,
}) => {
  const [activeSpanPath, setActiveSpanPath] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Store
  const selectedSpan = useTraceViewStore((state) => state.selectedSpan);

  const metadata = getMetadataFromSpanTree(data);
  const { globalStart, spread: globalSpread } = metadata;

  // Get all inference spans
  const inferenceSpans = useMemo(() => getInferenceSpans(data), [data]);

  useEffect(() => {
    setActiveSpanPath(getSpanPath(data, spanId));
  }, [spanId, data]);

  useEffect(() => {
    if (selectedSpan) {
      setActiveSpanPath(getSpanPath(data, selectedSpan.span_id));
    }
  }, [selectedSpan, data]);

  // Sync horizontal scroll between header and content
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Generate timeline markers with smart intervals
  const generateTimelineMarkers = () => {
    const markers: {
      position: number;
      label: string;
      isInference: boolean;
      isMajor: boolean;
    }[] = [];
    const numMarkers = 10;

    for (let i = 0; i <= numMarkers; i++) {
      const position = (i / numMarkers) * 100;
      const timeValue = (globalSpread * i) / numMarkers;

      let label: string;
      if (timeValue < 0.001) {
        label = `${(timeValue * 1000000).toFixed(0)}ns`;
      } else if (timeValue < 1) {
        label = `${(timeValue * 1000).toFixed(0)}µs`;
      } else if (timeValue < 1000) {
        label = `${timeValue.toFixed(0)}ms`;
      } else {
        label = `${(timeValue / 1000).toFixed(1)}s`;
      }

      const isInference = isMarkerInInferenceSpan(
        position,
        inferenceSpans,
        globalStart,
        globalSpread
      );

      // Major markers at 0%, 25%, 50%, 75%, 100%
      const isMajor = i % 2.5 === 0;

      markers.push({ position, label, isInference, isMajor });
    }

    return markers;
  };

  const timelineMarkers = generateTimelineMarkers();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
      </div>

      {/* Timeline header */}
      <div className="relative z-10 flex border-b border-border bg-muted/50 dark:bg-muted/20">
        {/* Span name column header */}
        <div className="flex w-[280px] shrink-0 items-center border-r border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground uppercase">
              Operations
            </span>
          </div>
        </div>

        {/* Timeline markers header */}
        <div
          ref={headerRef}
          className="relative flex h-11 flex-1 items-end overflow-hidden"
        >
          <div className="relative w-full h-full">
            {timelineMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute bottom-0 flex flex-col items-center"
                style={{
                  left: `${marker.position}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {/* Tick mark */}
                <div
                  className={`w-px ${marker.isMajor ? "h-3" : "h-2"} ${marker.isInference
                    ? "bg-primary/70"
                    : marker.isMajor
                      ? "bg-border"
                      : "bg-border/50"
                    }`}
                />
                {/* Time label */}
                <div
                  className={`absolute -top-4 whitespace-nowrap text-[10px] font-medium tracking-tight ${marker.isInference
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                    }`}
                >
                  {marker.label}
                </div>
              </div>
            ))}

            {/* Gradient overlay for timeline */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
          </div>
        </div>
      </div>

      {/* Scrollable spans container */}
      <div
        ref={scrollContainerRef}
        className="overflow-hidden"
        onScroll={handleScroll}
      >
        <div className="pb-4">
          <TraceSpan
            span={data}
            parentSpan={null}
            globalStart={globalStart}
            globalSpread={globalSpread}
            level={0}
            activeSpanPath={activeSpanPath}
            isExpandAll={isExpandAll}
          />
        </div>
      </div>

    </motion.div>
  );
};

export default GanttChart;
